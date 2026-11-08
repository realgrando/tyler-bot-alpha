#!/usr/bin/env python3
import json as _json
from pathlib import Path as _Path
_SKILL_ROOT = _Path(__file__).resolve().parent.parent
_CFG_FILE = _SKILL_ROOT / "config" / "user_config.json"
_VAULT_DEFAULT = str((_SKILL_ROOT.parent / "vault-template").resolve())
if _CFG_FILE.exists():
    try:
        _ucfg = _json.loads(_CFG_FILE.read_text(encoding="utf-8"))
        if _ucfg.get("vault_path"):
            _VAULT_DEFAULT = _ucfg["vault_path"]
    except Exception:
        pass
"""
Tyler Daily Telemetry & Predictive Insights (v3.0)
Motor enxuto, determinístico e ultrarrápido focado exclusivamente nas Daily Notes.
Lê o YAML frontmatter (schema v3.0 com suporte a histórico legado unificado),
calcula médias móveis (7d / 30d), anomalias de desvio padrão (z-score),
e correlações preditivas de causa e efeito (Lag 1: Ontem -> Hoje).
Gera relatórios executivos direto no CLI do terminal e payload estruturado JSON.
"""

import os
import sys
import re
import json
import math
import sqlite3
import argparse
import datetime
from pathlib import Path
from collections import defaultdict
import numpy as np

JOURNAL_DIR = str(_Path(_VAULT_DEFAULT) / "Central/Personal/Journal")
if not os.path.exists(JOURNAL_DIR):
    JOURNAL_DIR = str(_Path(_VAULT_DEFAULT) / "Central/Personal/Journal")
DB_PATH = str(_SKILL_ROOT / "state" / "vault_deep_graph.sqlite")
STATE_DIR = str(_SKILL_ROOT / "state")
CACHE_FILE = os.path.join(STATE_DIR, "daily_telemetry_cache.json")

# -----------------------------------------------------------------------------
# Dicionário Canônico de Propriedades da Daily (v3.0)
# -----------------------------------------------------------------------------
DAILY_PROPERTIES = {
    # Biologia & Sono
    "bio_sleep_hours": {"label": "Sono (Horas)", "domain": "bio", "unit": "h", "polarity": "target", "target": (7.0, 8.5)},
    "bio_sleep_quality": {"label": "Qualidade do Sono", "domain": "bio", "unit": "/5", "polarity": "positive"},
    "bio_sleep_inertia": {"label": "Inércia ao Acordar", "domain": "bio", "unit": "/5", "polarity": "negative"},
    "bio_sleep_interruptions": {"label": "Microdespertares", "domain": "bio", "unit": "x", "polarity": "negative"},
    "bio_discomfort": {"label": "Desconforto Físico / Dor", "domain": "bio", "unit": "/5", "polarity": "negative"},
    "bio_caffeine_doses": {"label": "Doses de Cafeína", "domain": "bio", "unit": "un", "polarity": "neutral"},
    "bio_late_caffeine": {"label": "Cafeína Tardia (>15h)", "domain": "bio", "unit": "bool", "polarity": "negative"},
    "bio_training_load": {"label": "Carga do Treino", "domain": "bio", "unit": "/5", "polarity": "positive"},
    "bio_weight": {"label": "Peso Corporal", "domain": "bio", "unit": "kg", "polarity": "neutral"},

    # Execução & Engenharia
    "exec_deep_work_h": {"label": "Deep Work Focado", "domain": "exec", "unit": "h", "polarity": "positive"},
    "exec_screen_time_h": {"label": "Tempo de Tela", "domain": "exec", "unit": "h", "polarity": "negative"},
    "exec_cognitive_load": {"label": "Carga Cognitiva", "domain": "exec", "unit": "/5", "polarity": "negative"},
    "exec_flow_state": {"label": "Estado de Flow", "domain": "exec", "unit": "/5", "polarity": "positive"},
    "exec_friction": {"label": "Atrito de Execução", "domain": "exec", "unit": "/5", "polarity": "negative"},
    "exec_primary_focus": {"label": "Foco Primário", "domain": "exec", "unit": "bool", "polarity": "positive"},
    "exec_leverage": {"label": "Alavancagem / Eficácia", "domain": "exec", "unit": "/5", "polarity": "positive"},

    # Cognição & Psique
    "cog_mood": {"label": "Humor Geral", "domain": "cog", "unit": "/5", "polarity": "positive"},
    "cog_clarity": {"label": "Clareza Mental", "domain": "cog", "unit": "/5", "polarity": "positive"},
    "cog_focus_sustain": {"label": "Sustentação do Foco", "domain": "cog", "unit": "/5", "polarity": "positive"},
    "cog_energy_morning": {"label": "Energia Matinal", "domain": "cog", "unit": "/5", "polarity": "positive"},
    "cog_energy_afternoon": {"label": "Energia da Tarde", "domain": "cog", "unit": "/5", "polarity": "positive"},
    "cog_energy_evening": {"label": "Energia Noturna", "domain": "cog", "unit": "/5", "polarity": "positive"},
    "cog_anxiety": {"label": "Ansiedade / Ruído", "domain": "cog", "unit": "/5", "polarity": "negative"},
    "cog_craving": {"label": "Fissura / Craving", "domain": "cog", "unit": "/5", "polarity": "negative"},
    "cog_dopamine_craving": {"label": "Fissura por Dopamina", "domain": "cog", "unit": "/5", "polarity": "negative"},
    "cog_stoic_calm": {"label": "Paz Estóica", "domain": "cog", "unit": "/5", "polarity": "positive"},

    # Ambiente
    "env_social_exposure": {"label": "Exposição Social / Ruído", "domain": "env", "unit": "/5", "polarity": "negative"},
    "env_work_alone": {"label": "Trabalho Isolado no QG", "domain": "env", "unit": "bool", "polarity": "positive"},

    # Hábitos & Conduta
    "h_workout": {"label": "Treino Cumprido", "domain": "h", "unit": "bool", "polarity": "positive"},
    "h_mobility": {"label": "Mobilidade / Alongamento", "domain": "h", "unit": "bool", "polarity": "positive"},
    "h_sunlight": {"label": "Luz Solar Matinal", "domain": "h", "unit": "bool", "polarity": "positive"},
    "h_cold_shower": {"label": "Banho Frio", "domain": "h", "unit": "bool", "polarity": "positive"},
    "h_meditation": {"label": "Meditação", "domain": "h", "unit": "bool", "polarity": "positive"},
    "h_supplements": {"label": "Suplementação Paga", "domain": "h", "unit": "bool", "polarity": "positive"},

    # Temperança (bh_ = Bad Habit / Temperance)
    "bh_porn": {"label": "Gatilho/Pornografia", "domain": "bh", "unit": "bool", "polarity": "negative"},
    "bh_mast": {"label": "Masturbação", "domain": "bh", "unit": "bool", "polarity": "negative"},
    "bh_cheap_dopamine": {"label": "Dopamina Barata", "domain": "bh", "unit": "/5", "polarity": "negative"},
    "bh_procrastination": {"label": "Procrastinação", "domain": "bh", "unit": "/5", "polarity": "negative"},
}

# Ponte inteligente com chaves legadas do Vault para enriquecer a base histórica
LEGACY_BRIDGE = {
    "Sleep_Hours": "bio_sleep_hours",
    "Sleep_Quality": "bio_sleep_quality",
    "Mood": "cog_mood",
    "Energy_Level": "cog_energy_morning",
    "H_Workout": "h_workout",
    "H_Mobility": "h_mobility",
    "H_Cold_Shower": "h_cold_shower",
    "H_Reading": "h_reading",
    "BH_Porn": "bh_porn",
    "BH_Mast": "bh_mast",
    "Deep_Work": "exec_deep_work_h",
    "Screen_Time": "exec_screen_time_h",
}

# -----------------------------------------------------------------------------
# Parser e Normalizador de Tipos
# -----------------------------------------------------------------------------
def parse_scalar(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, bool):
        return 1.0 if val else 0.0

    s = str(val).strip()
    if not s or s.lower() in ("null", "~", "none", ""):
        return None
    if s.lower() in ("true", "sim", "yes", "pago", "ok", "[x]"):
        return 1.0
    if s.lower() in ("false", "não", "nao", "no", "[ ]"):
        return 0.0

    # Decodificar emojis (estrelas ou gotas)
    if any(ord(c) > 1000 for c in s):
        stars = sum(1 for c in s if c in "⭐🌟★")
        if stars > 0:
            return float(min(stars, 5))
        drops = sum(1 for c in s if c in "🩸💧🔥⚡")
        if drops > 0:
            return float(min(drops, 5))

    # Frações (ex: 4/5)
    m_frac = re.match(r"^(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)$", s)
    if m_frac:
        num, den = float(m_frac.group(1)), float(m_frac.group(2))
        return (num / den * 5.0) if den == 10 else num

    # Horário (ex: "07:30" -> 7.5)
    m_time = re.match(r"^(\d{1,2}):(\d{2})$", s)
    if m_time:
        h, m = int(m_time.group(1)), int(m_time.group(2))
        return round(h + m / 60.0, 2)

    # Duração (ex: "1h 30m" -> 1.5)
    m_dur = re.match(r"^(?:(\d+(?:\.\d+)?)\s*h(?:oras?)?)?\s*(?:(\d+)\s*m(?:in)?)?$", s, re.IGNORECASE)
    if m_dur and (m_dur.group(1) or m_dur.group(2)):
        h = float(m_dur.group(1)) if m_dur.group(1) else 0.0
        m = float(m_dur.group(2)) if m_dur.group(2) else 0.0
        return round(h + m / 60.0, 2)

    # Número simples
    try:
        clean = re.sub(r"[^\d\.\-]", "", s)
        if clean:
            return float(clean)
    except ValueError:
        pass

    return None


def extract_frontmatter(file_path: Path):
    try:
        text = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {}
    if not text.startswith("---"):
        return {}
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}
    raw_yaml = parts[1]
    props = {}
    for line in raw_yaml.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            k, v = line.split(":", 1)
            props[k.strip()] = v.strip().strip('"').strip("'")
    return props


# -----------------------------------------------------------------------------
# Ingestão das Dailies (Memória & SQLite)
# -----------------------------------------------------------------------------
def load_all_dailies():
    """
    Carrega todas as Dailies do Journal, unificando v3 e legado via LEGACY_BRIDGE.
    Retorna:
      data_by_date: { 'YYYY-MM-DD': { 'prop_key': float_value, ... } }
      sorted_dates: lista ordenada de strings 'YYYY-MM-DD'
    """
    data_by_date = defaultdict(dict)
    journal_path = Path(JOURNAL_DIR)
    if not journal_path.exists():
        return {}, []

    # Se o banco SQLite estiver disponível e populado, lê dele primeiro
    use_sqlite = False
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("""
                SELECT ref_date, prop_key, val_num 
                FROM fact_properties 
                WHERE class = 'classDaily' AND val_num IS NOT NULL AND ref_date IS NOT NULL
                ORDER BY ref_date ASC
            """)
            rows = cur.fetchall()
            conn.close()
            if rows:
                for r_date, p_key, val_num in rows:
                    if not re.match(r"^\d{4}-\d{2}-\d{2}$", r_date):
                        continue
                    # Normaliza via ponte canônica se for legado
                    target_key = LEGACY_BRIDGE.get(p_key, p_key)
                    if target_key in DAILY_PROPERTIES:
                        data_by_date[r_date][target_key] = val_num
                use_sqlite = True
        except Exception:
            use_sqlite = False

    # Se não usou sqlite ou faltam datas recentes, varre o filesystem diretamente
    if not use_sqlite or len(data_by_date) < 5:
        data_by_date.clear()
        for f in journal_path.glob("**/*.md"):
            m = re.search(r"(\d{4}-\d{2}-\d{2})", f.stem)
            if not m:
                continue
            r_date = m.group(1)
            raw_props = extract_frontmatter(f)
            for k, raw_v in raw_props.items():
                target_key = LEGACY_BRIDGE.get(k, k)
                if target_key in DAILY_PROPERTIES:
                    v_num = parse_scalar(raw_v)
                    if v_num is not None:
                        data_by_date[r_date][target_key] = v_num

    sorted_dates = sorted(data_by_date.keys())
    return data_by_date, sorted_dates


# -----------------------------------------------------------------------------
# Motor Estatístico: Médias, Anomalias e Predições (Lag 1)
# -----------------------------------------------------------------------------
def analyze_telemetry():
    data_by_date, sorted_dates = load_all_dailies()
    if not sorted_dates:
        return {"error": "Nenhuma daily note encontrada."}

    today_str = datetime.date.today().isoformat()
    yesterday_str = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

    # Última data registrada e penúltima
    last_registered_date = sorted_dates[-1]
    prev_date = sorted_dates[-2] if len(sorted_dates) > 1 else None

    # Séries temporais por propriedade
    series_by_prop = defaultdict(list)  # [(date, val)]
    for d in sorted_dates:
        for k, v in data_by_date[d].items():
            series_by_prop[k].append((d, v))

    # 1. Estatísticas por Propriedade (7d, 30d, média, desvio)
    stats_by_prop = {}
    anomalies = []

    last_7_dates = set(sorted_dates[-7:])
    last_30_dates = set(sorted_dates[-30:])

    for prop, records in series_by_prop.items():
        vals = [v for _, v in records]
        if not vals:
            continue
        vals_7d = [v for d, v in records if d in last_7_dates]
        vals_30d = [v for d, v in records if d in last_30_dates]

        avg_total = float(np.mean(vals))
        std_total = float(np.std(vals)) if len(vals) > 1 else 0.0
        avg_7d = float(np.mean(vals_7d)) if vals_7d else avg_total
        avg_30d = float(np.mean(vals_30d)) if vals_30d else avg_total

        meta = DAILY_PROPERTIES.get(prop, {"label": prop, "domain": "general", "unit": "", "polarity": "neutral"})

        val_today = data_by_date.get(today_str, {}).get(prop)
        val_yesterday = data_by_date.get(yesterday_str, {}).get(prop)
        val_latest = data_by_date.get(last_registered_date, {}).get(prop)

        # Cálculo do Z-score do último registro
        z_score = 0.0
        if std_total > 0.01 and val_latest is not None:
            z_score = round((val_latest - avg_total) / std_total, 2)
            if abs(z_score) >= 1.5:
                direction = "acima" if z_score > 0 else "abaixo"
                polarity = meta.get("polarity", "neutral")
                severity = "alerta" if ((polarity == "negative" and z_score > 0) or (polarity == "positive" and z_score < 0)) else "destaque"
                anomalies.append({
                    "prop": prop,
                    "label": meta["label"],
                    "value": val_latest,
                    "unit": meta["unit"],
                    "avg_30d": round(avg_30d, 2),
                    "z_score": z_score,
                    "direction": direction,
                    "severity": severity,
                    "date": last_registered_date
                })

        stats_by_prop[prop] = {
            "label": meta["label"],
            "domain": meta["domain"],
            "unit": meta["unit"],
            "polarity": meta.get("polarity", "neutral"),
            "val_today": val_today,
            "val_yesterday": val_yesterday,
            "val_latest": val_latest,
            "avg_7d": round(avg_7d, 2),
            "avg_30d": round(avg_30d, 2),
            "std": round(std_total, 2),
            "min": round(float(np.min(vals)), 2),
            "max": round(float(np.max(vals)), 2),
            "count": len(vals),
            "z_score": z_score,
        }

    # 2. Correlações & Predições de Causa e Efeito (Lag 1: T-1 -> T0)
    # Cruza cada par de propriedades onde X ocorre no dia t-1 e Y ocorre no dia t
    lag1_correlations = []
    prop_list = list(DAILY_PROPERTIES.keys())

    date_idx_map = {d: i for i, d in enumerate(sorted_dates)}
    for i_x in range(len(prop_list)):
        px = prop_list[i_x]
        if px not in series_by_prop:
            continue
        for i_y in range(len(prop_list)):
            py = prop_list[i_y]
            if py not in series_by_prop:
                continue

            pairs_x = []
            pairs_y = []
            for d_idx in range(1, len(sorted_dates)):
                d_prev = sorted_dates[d_idx - 1]
                d_curr = sorted_dates[d_idx]
                val_prev = data_by_date[d_prev].get(px)
                val_curr = data_by_date[d_curr].get(py)
                if val_prev is not None and val_curr is not None:
                    pairs_x.append(val_prev)
                    pairs_y.append(val_curr)

            if len(pairs_x) >= 6:
                std_x = np.std(pairs_x)
                std_y = np.std(pairs_y)
                if std_x > 0.001 and std_y > 0.001:
                    r = float(np.corrcoef(pairs_x, pairs_y)[0, 1])
                    if not math.isnan(r) and abs(r) >= 0.30:
                        lbl_x = DAILY_PROPERTIES[px]["label"]
                        lbl_y = DAILY_PROPERTIES[py]["label"]
                        
                        if r > 0:
                            insight = f"Quando '{lbl_x}' aumenta ontem, '{lbl_y}' tende a aumentar hoje (+{r:.2f})."
                        else:
                            insight = f"Quando '{lbl_x}' aumenta ontem, '{lbl_y}' tende a cair hoje ({r:.2f})."

                        lag1_correlations.append({
                            "prop_x": px,
                            "label_x": lbl_x,
                            "prop_y": py,
                            "label_y": lbl_y,
                            "r": round(r, 2),
                            "abs_r": abs(round(r, 2)),
                            "samples": len(pairs_x),
                            "insight": insight
                        })

    lag1_correlations.sort(key=lambda x: x["abs_r"], reverse=True)

    # 3. Predição Específica para Hoje (com base nos dados de Ontem)
    today_predictions = []
    yesterday_data = data_by_date.get(yesterday_str, {})
    if not yesterday_data and prev_date:
        yesterday_data = data_by_date.get(prev_date, {})

    for corr in lag1_correlations[:10]:
        px = corr["prop_x"]
        py = corr["prop_y"]
        r = corr["r"]
        val_yest = yesterday_data.get(px)
        if val_yest is not None and px in stats_by_prop:
            avg_x = stats_by_prop[px]["avg_30d"]
            std_x = stats_by_prop[px]["std"]
            delta = val_yest - avg_x
            if abs(delta) >= (0.5 * std_x if std_x > 0 else 0.5):
                lbl_x = corr["label_x"]
                lbl_y = corr["label_y"]
                pol_y = DAILY_PROPERTIES[py]["polarity"]
                
                # Impacto previsto em Y
                direction_y = "aumento" if (delta * r > 0) else "redução"
                is_favorable = (pol_y == "positive" and direction_y == "aumento") or (pol_y == "negative" and direction_y == "redução")
                
                today_predictions.append({
                    "cause": f"Ontem: {lbl_x} = {val_yest} (vs média {avg_x})",
                    "effect": f"Efeito esperado em {lbl_y}: probabilidade de {direction_y}.",
                    "correlation_r": r,
                    "is_favorable": is_favorable,
                    "target_prop": py
                })

    # Parecer Executivo do Tyler em Linguagem Natural
    diagnostics = []
    
    # Avaliação do sono recente
    sleep_h = stats_by_prop.get("bio_sleep_hours", {}).get("val_latest")
    sleep_q = stats_by_prop.get("bio_sleep_quality", {}).get("val_latest")
    if sleep_h is not None:
        if sleep_h >= 7.0 and (sleep_q or 3) >= 3:
            diagnostics.append(f"Base biológica sólida: sono de {sleep_h}h com qualidade {sleep_q or '-'}/5 sustenta boa cognição.")
        elif sleep_h < 6.5:
            diagnostics.append(f"Atenção biológica: sono restrito ({sleep_h}h). Risco de fadiga à tarde e fissura por dopamina.")

    # Avaliação de telas e fricção
    screen_h = stats_by_prop.get("exec_screen_time_h", {}).get("val_latest")
    if screen_h is not None and screen_h > 4.5:
        diagnostics.append(f"Exposição a telas elevada ({screen_h}h) gera dispersão na clareza mental do dia seguinte.")

    # Alavanca preditiva número 1
    if today_predictions:
        top_pred = today_predictions[0]
        diagnostics.append(f"Vetor do dia: {top_pred['effect']}")

    executive_insight = " ".join(diagnostics) if diagnostics else "Sistema operando em equilíbrio dentro das margens históricas."

    return {
        "today": today_str,
        "yesterday": yesterday_str,
        "last_registered_date": last_registered_date,
        "total_days": len(sorted_dates),
        "stats": stats_by_prop,
        "anomalies": anomalies,
        "lag1_correlations": lag1_correlations[:12],
        "today_predictions": today_predictions[:6],
        "executive_insight": executive_insight
    }


# -----------------------------------------------------------------------------
# Formatador do Relatório de Terminal (CLI)
# -----------------------------------------------------------------------------
class TermColor:
    CYAN = "\033[36m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    RED = "\033[31m"
    MAGENTA = "\033[35m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def print_cli_report(res: dict, detailed: bool = False):
    c = TermColor
    print()
    print(f"{c.CYAN}{c.BOLD}======================================================================{c.RESET}")
    print(f"{c.CYAN}{c.BOLD} TYLER // TELEMETRIA & PREDIÇÕES DA DAILY (CLI){c.RESET}")
    print(f"{c.DIM} Base: {res['total_days']} Dailies registradas | Último log: {res['last_registered_date']}{c.RESET}")
    print(f"{c.CYAN}======================================================================{c.RESET}")
    print()

    # 1. Parecer do Tyler
    print(f"{c.BOLD}[ PARECER TÁTICO DO TYLER ]{c.RESET}")
    print(f"{c.GREEN}{res['executive_insight']}{c.RESET}")
    print()

    # 2. Predições para o Dia (Causa & Efeito Ontem -> Hoje)
    if res.get("today_predictions"):
        print(f"{c.BOLD}[ PREDIÇÕES TÁTICAS PARA HOJE (Impacto de Ontem) ]{c.RESET}")
        for pred in res["today_predictions"]:
            badge = f"{c.GREEN}[PROMISSOR]{c.RESET}" if pred["is_favorable"] else f"{c.YELLOW}[ATENÇÃO]{c.RESET}"
            print(f" • {badge} {pred['cause']}")
            print(f"   {c.DIM}└──>{c.RESET} {pred['effect']} (r = {pred['correlation_r']:+.2f})")
        print()

    # 3. Anomalias do Último Registro (Z-Score)
    if res.get("anomalies"):
        print(f"{c.BOLD}[ ANOMALIAS E DESVIOS SIGNIFICATIVOS (|Z| >= 1.5) ]{c.RESET}")
        for an in res["anomalies"]:
            badge = f"{c.RED}[CRÍTICO]{c.RESET}" if an["severity"] == "alerta" else f"{c.CYAN}[DESTAQUE]{c.RESET}"
            print(f" • {badge} {an['label']}: {c.BOLD}{an['value']}{an['unit']}{c.RESET} (Média: {an['avg_30d']}{an['unit']} | Z: {an['z_score']:+.1f})")
        print()

    # 4. Tabela de Métricas Vitais
    print(f"{c.BOLD}[ SNAPSHOT DE TELEMETRIA DAS DAILIES ]{c.RESET}")
    print(f"{c.DIM}{'Métrica':<26} {'Ontem':<8} {'Hoje':<8} {'Média 7d':<10} {'Média 30d':<10} {'Status'}{c.RESET}")
    print(f"{c.DIM}{'-'*70}{c.RESET}")

    key_metrics = [
        "bio_sleep_hours", "bio_sleep_quality", "bio_training_load",
        "exec_deep_work_h", "exec_screen_time_h", "exec_flow_state",
        "cog_energy_morning", "cog_clarity", "cog_mood", "cog_dopamine_craving",
        "h_workout", "h_mobility"
    ]

    for km in key_metrics:
        s = res["stats"].get(km)
        if not s:
            continue
        v_yest = f"{s['val_yesterday']}{s['unit']}" if s['val_yesterday'] is not None else "-"
        v_today = f"{s['val_today']}{s['unit']}" if s['val_today'] is not None else "-"
        avg_7 = f"{s['avg_7d']}{s['unit']}"
        avg_30 = f"{s['avg_30d']}{s['unit']}"
        
        # Status
        pol = s["polarity"]
        val_ref = s['val_today'] if s['val_today'] is not None else s['val_yesterday']
        status_sym = f"{c.GREEN}● No Alvo{c.RESET}"
        if val_ref is not None:
            if pol == "positive" and val_ref < s["avg_30d"]:
                status_sym = f"{c.YELLOW}▼ Abaixo{c.RESET}"
            elif pol == "negative" and val_ref > s["avg_30d"]:
                status_sym = f"{c.RED}▲ Elevado{c.RESET}"
            elif pol == "positive" and val_ref >= s["avg_30d"]:
                status_sym = f"{c.GREEN}▲ Acima{c.RESET}"

        print(f"{s['label']:<26} {v_yest:<8} {v_today:<8} {avg_7:<10} {avg_30:<10} {status_sym}")

    print()

    # 5. Top Forças de Causa e Efeito (Lag 1 Histórico)
    if res.get("lag1_correlations"):
        print(f"{c.BOLD}[ TOP RELAÇÕES DE CAUSA E EFEITO (Lag 1: Ontem -> Hoje) ]{c.RESET}")
        for corr in res["lag1_correlations"][:5]:
            sign = "+" if corr["r"] > 0 else "-"
            print(f" • [{sign}{abs(corr['r']):.2f}] {corr['insight']}")
        print()

    print(f"{c.CYAN}======================================================================{c.RESET}")
    print()


# -----------------------------------------------------------------------------
# Ponto de Entrada (CLI)
# -----------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Tyler Daily Telemetry & Predictive Insights")
    parser.add_argument("--json", action="store_true", help="Retorna saída estruturada em JSON")
    parser.add_argument("--predict", action="store_true", help="Foca nas predições e causa/efeito de hoje")
    parser.add_argument("--summary", action="store_true", help="Retorna apenas o parecer executivo em texto")

    args = parser.parse_args()

    res = analyze_telemetry()
    if "error" in res:
        print(f"Erro: {res['error']}", file=sys.stderr)
        sys.exit(1)

    # Salva cache leve para consumo de agentes
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return

    if args.summary:
        print(res["executive_insight"])
        return

    if args.predict:
        c = TermColor
        print(f"\n{c.BOLD}[ PREDIÇÕES TÁTICAS PARA HOJE (Ontem -> Hoje) ]{c.RESET}")
        print(f"{c.GREEN}{res['executive_insight']}{c.RESET}\n")
        for pred in res.get("today_predictions", []):
            badge = f"{c.GREEN}[PROMISSOR]{c.RESET}" if pred["is_favorable"] else f"{c.YELLOW}[ATENÇÃO]{c.RESET}"
            print(f" • {badge} {pred['cause']}")
            print(f"   {c.DIM}└──>{c.RESET} {pred['effect']} (r = {pred['correlation_r']:+.2f})")
        print()
        return

    print_cli_report(res)


if __name__ == "__main__":
    main()
