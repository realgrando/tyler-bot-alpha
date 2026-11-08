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
Telemetry Auditor (Tyler v3.0)
Motor determinístico em Python para agregação estatística (somas, médias, desvios,
frequências e anomalias) das 84 propriedades do Schema YAML v3.0 das Daily Notes.
"""

import argparse
import datetime
import json
import math
import os
import re
import sys
from collections import Counter
from pathlib import Path

JOURNAL_ROOT = Path(str(_Path(_VAULT_DEFAULT) / "Central/Personal/Journal"))
if not JOURNAL_ROOT.exists():
    JOURNAL_ROOT = Path(str(_Path(_VAULT_DEFAULT) / "Central/Personal/Journal"))


def parse_scalar(val_str: str):
    v = val_str.strip()
    if not v or v.lower() in ("null", "~", "none"):
        return None
    if v.lower() == "true":
        return True
    if v.lower() == "false":
        return False
    # Strip quotes
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    # Inline list: [a, b, c]
    if v.startswith("[") and v.endswith("]"):
        inner = v[1:-1].strip()
        if not inner:
            return []
        items = []
        for part in inner.split(","):
            p = part.strip().strip('"').strip("'")
            if p:
                items.append(p)
        return items
    # Numbers
    try:
        if "." in v:
            return float(v)
        return int(v)
    except ValueError:
        return v


def parse_yaml_frontmatter(filepath: Path) -> dict:
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {}
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    raw_yaml = parts[1]
    data = {}
    current_list_key = None

    for line in raw_yaml.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        # Check if list item
        m_list = re.match(r"^\s*-\s+(.*)$", line)
        if m_list and current_list_key:
            item_val = m_list.group(1).strip().strip('"').strip("'")
            if item_val:
                data[current_list_key].append(item_val)
            continue

        if ":" in line and not line.startswith(" ") and not line.startswith("\t"):
            k, v = line.split(":", 1)
            key = k.strip()
            # Remove inline comment if not inside quotes
            if "#" in v and not ('"' in v or "'" in v):
                v = v.split("#", 1)[0]
            val = v.strip()
            if val == "":
                # Could be start of multiline list or null
                data[key] = []
                current_list_key = key
            else:
                current_list_key = None
                data[key] = parse_scalar(val)

    # Convert empty lists that were actually empty scalars to None for non-array fields
    array_fields = {
        "bio_symptoms",
        "bio_meds_taken",
        "exec_focus_areas",
        "poly_domains",
        "poly_modalities",
        "poly_shadow_friction",
        "cog_stress_source",
        "bh_temperance_breach",
        "ctx_entities",
    }
    for k, v in list(data.items()):
        if isinstance(v, list) and len(v) == 0 and k not in array_fields:
            data[k] = None
    return data


def find_daily_files(start_date: datetime.date, end_date: datetime.date):
    results = []
    if not JOURNAL_ROOT.exists():
        return results

    for root, _, files in os.walk(JOURNAL_ROOT):
        for fname in files:
            m = re.match(r"^(\d{2})-(\d{2})-(\d{4})\.md$", fname)
            if not m:
                continue
            d_str, m_str, y_str = m.groups()
            try:
                fdate = datetime.date(int(y_str), int(m_str), int(d_str))
            except ValueError:
                continue
            if start_date <= fdate <= end_date:
                fpath = Path(root) / fname
                meta = parse_yaml_frontmatter(fpath)
                if meta.get("Class") == "classDaily" or "bio_sleep_hours" in meta or "cog_day_rating" in meta:
                    results.append((fdate, fpath, meta))

    results.sort(key=lambda x: x[0])
    return results


def is_populated(meta: dict) -> bool:
    """Verifica se a Daily Note possui telemetria humana/biológica preenchida (não apenas template vazio)."""
    check_keys = [
        "bio_sleep_hours",
        "bio_wake_time",
        "exec_deep_work_h",
        "cog_day_rating",
        "cog_mood",
        "cog_energy",
        "ctx_bio_log",
        "ctx_exec_log",
    ]
    return any(meta.get(k) not in (None, "", []) for k in check_keys)


def calc_num_stats(values: list) -> dict:
    nums = [float(v) for v in values if isinstance(v, (int, float)) and not isinstance(v, bool)]
    if not nums:
        return {"n": 0, "sum": None, "mean": None, "std": None, "min": None, "max": None}
    n = len(nums)
    s = round(sum(nums), 2)
    mean = round(s / n, 2)
    if n > 1:
        variance = sum((x - (s / n)) ** 2 for x in nums) / n
        std = round(math.sqrt(variance), 2)
    else:
        std = 0.0
    return {
        "n": n,
        "sum": s,
        "mean": mean,
        "std": std,
        "min": round(min(nums), 2),
        "max": round(max(nums), 2),
    }


def calc_time_stats(time_strings: list, wrap_midnight: bool = False) -> dict:
    """Calcula média e desvio padrão (em minutos) para horários HH:MM."""
    mins = []
    for t in time_strings:
        if not isinstance(t, str) or ":" not in t:
            continue
        m = re.match(r"^(\d{1,2}):(\d{2})$", t.strip())
        if not m:
            continue
        hh, mm = int(m.group(1)), int(m.group(2))
        total_m = hh * 60 + mm
        # Para horário de dormir (ex: 22:30 vs 00:30), normalizar horas < 12:00 somando 24h
        if wrap_midnight and hh < 12:
            total_m += 1440
        mins.append(total_m)

    if not mins:
        return {"n": 0, "mean_time": None, "std_min": None}
    n = len(mins)
    avg_m = sum(mins) / n
    std_m = round(math.sqrt(sum((x - avg_m) ** 2 for x in mins) / n), 1) if n > 1 else 0.0
    norm_avg = int(round(avg_m)) % 1440
    hh_out = norm_avg // 60
    mm_out = norm_avg % 60
    return {"n": n, "mean_time": f"{hh_out:02d}:{mm_out:02d}", "std_min": std_m}


def calc_bool_stats(values: list) -> dict:
    bools = [v for v in values if isinstance(v, bool)]
    if not bools:
        return {"n": 0, "true_count": 0, "rate_pct": None}
    t_count = sum(1 for v in bools if v is True)
    return {
        "n": len(bools),
        "true_count": t_count,
        "rate_pct": round((t_count / len(bools)) * 100, 1),
    }


def calc_freq(values: list) -> dict:
    counter = Counter()
    for v in values:
        if v is None or v == "":
            continue
        if isinstance(v, list):
            for item in v:
                if item is not None and str(item).strip() != "":
                    counter[str(item).strip()] += 1
        else:
            counter[str(v).strip()] += 1
    return dict(counter.most_common())


def audit_dailies(records: list) -> dict:
    populated = [(d, p, m) for (d, p, m) in records if is_populated(m)]
    target = populated if populated else records

    def col(key):
        return [m.get(key) for _, _, m in target]

    # Eixo 1: Execução
    eixo_exec = {
        "deep_work_h": calc_num_stats(col("exec_deep_work_h")),
        "screen_time_h": calc_num_stats(col("exec_screen_time_h")),
        "shipped": calc_bool_stats(col("exec_shipped")),
        "leverage": calc_num_stats(col("exec_leverage")),
        "batching_kept": calc_bool_stats(col("exec_batching_kept")),
        "cognitive_load": calc_num_stats(col("exec_cognitive_load")),
        "flow_state": calc_num_stats(col("exec_flow_state")),
        "fragmentation": calc_num_stats(col("exec_fragmentation")),
        "external_friction": calc_num_stats(col("exec_external_friction")),
        "procrastination": calc_num_stats(col("exec_procrastination")),
        "work_mode_freq": calc_freq(col("exec_work_mode")),
        "focus_areas_freq": calc_freq(col("exec_focus_areas")),
    }

    # Eixo 2: Biologia, Sono & Clima
    crash_events = [
        {"date": d.isoformat(), "crash_time": m.get("bio_crash_time")}
        for d, _, m in target
        if m.get("bio_crash_time") not in (None, "", "null")
    ]
    eixo_bio_env = {
        "sleep_hours": calc_num_stats(col("bio_sleep_hours")),
        "sleep_quality": calc_num_stats(col("bio_sleep_quality")),
        "sleep_inertia": calc_num_stats(col("bio_sleep_inertia")),
        "sleep_interruptions": calc_num_stats(col("bio_sleep_interruptions")),
        "bed_time": calc_time_stats(col("bio_bed_time"), wrap_midnight=True),
        "wake_time": calc_time_stats(col("bio_wake_time"), wrap_midnight=False),
        "last_meal_time": calc_time_stats(col("bio_last_meal_time"), wrap_midnight=True),
        "crash_time_stats": calc_time_stats(col("bio_crash_time"), wrap_midnight=False),
        "crash_events": crash_events,
        "weight": calc_num_stats(col("bio_weight")),
        "training_load": calc_num_stats(col("bio_training_load")),
        "training_type_freq": calc_freq(col("bio_training_type")),
        "skin_barrier": calc_num_stats(col("bio_skin_barrier")),
        "gut_state": calc_num_stats(col("bio_gut_state")),
        "discomfort": calc_num_stats(col("bio_discomfort")),
        "symptoms_freq": calc_freq(col("bio_symptoms")),
        "caffeine_doses": calc_num_stats(col("bio_caffeine_doses")),
        "late_caffeine": calc_bool_stats(col("bio_late_caffeine")),
        "alcohol": calc_bool_stats(col("bio_alcohol")),
        "meds_taken_freq": calc_freq(col("bio_meds_taken")),
        "env_temp_min": calc_num_stats(col("env_temp_min")),
        "env_temp_max": calc_num_stats(col("env_temp_max")),
        "env_humidity_avg": calc_num_stats(col("env_humidity_avg")),
        "env_pressure_delta": calc_num_stats(col("env_pressure_delta")),
        "env_aqi_pollen": calc_num_stats(col("env_aqi_pollen")),
        "env_daylight_h": calc_num_stats(col("env_daylight_h")),
        "env_work_alone": calc_bool_stats(col("env_work_alone")),
        "env_social_exposure": calc_num_stats(col("env_social_exposure")),
        "env_weather_freq": calc_freq(col("env_weather")),
    }

    # Eixo 3: Psique, Ego & Temperança
    habits_keys = [
        "h_clean_diet",
        "h_nutrition_goal",
        "h_water_goal",
        "h_creatine",
        "h_sunlight_am",
        "h_clean_qg",
        "h_spiritual_anchor",
        "h_wind_down",
    ]
    habits_summary = {hk: calc_bool_stats(col(hk)) for hk in habits_keys}

    eixo_psy_hab = {
        "day_rating": calc_num_stats(col("cog_day_rating")),
        "mood": calc_num_stats(col("cog_mood")),
        "energy": calc_num_stats(col("cog_energy")),
        "drive": calc_num_stats(col("cog_drive")),
        "drive_source_freq": calc_freq(col("cog_drive_source")),
        "competence": calc_num_stats(col("cog_competence")),
        "confidence": calc_num_stats(col("cog_confidence")),
        "clarity": calc_num_stats(col("cog_clarity")),
        "ram_load": calc_num_stats(col("cog_ram_load")),
        "autonomy": calc_num_stats(col("cog_autonomy")),
        "temperance": calc_num_stats(col("cog_temperance")),
        "craving": calc_num_stats(col("cog_craving")),
        "anxiety": calc_num_stats(col("cog_anxiety")),
        "rumination": calc_num_stats(col("cog_rumination")),
        "validation_hunger": calc_num_stats(col("cog_validation_hunger")),
        "stress_source_freq": calc_freq(col("cog_stress_source")),
        "social_battery": calc_num_stats(col("cog_social_battery")),
        "hunger": calc_num_stats(col("cog_hunger")),
        "libido": calc_num_stats(col("cog_libido")),
        "cheap_dopamine": calc_num_stats(col("bh_cheap_dopamine")),
        "shiny_object": calc_bool_stats(col("bh_shiny_object")),
        "temperance_breach_freq": calc_freq(col("bh_temperance_breach")),
        "habits": habits_summary,
    }

    # Eixo 4: Polimatia & Grafo
    eixo_poly = {
        "domains_freq": calc_freq(col("poly_domains")),
        "modalities_freq": calc_freq(col("poly_modalities")),
        "mode_freq": calc_freq(col("poly_mode")),
        "depth_freq": calc_freq(col("poly_depth")),
        "cross_pollination": calc_bool_stats(col("poly_cross_pollination")),
        "hyperfocus_pull": calc_num_stats(col("poly_hyperfocus_pull")),
        "shadow_friction_freq": calc_freq(col("poly_shadow_friction")),
        "entities_freq": calc_freq(col("ctx_entities")),
    }

    # Detector Determinístico de Anomalias
    anomalies = []
    for d, _, m in target:
        d_str = d.isoformat()
        sh = m.get("bio_sleep_hours")
        if isinstance(sh, (int, float)) and sh < 6.5:
            anomalies.append(f"[{d_str}] Déficit de sono ({sh}h < 6.5h)")
        ct = m.get("bio_crash_time")
        if ct not in (None, "", "null"):
            anomalies.append(f"[{d_str}] Crash biológico registrado às {ct}")
        proc = m.get("exec_procrastination")
        if isinstance(proc, (int, float)) and proc >= 3:
            anomalies.append(f"[{d_str}] Procrastinação elevada ({proc}/5)")
        anx = m.get("cog_anxiety")
        if isinstance(anx, (int, float)) and anx >= 3:
            anomalies.append(f"[{d_str}] Pico de ansiedade ({anx}/5)")
        crv = m.get("cog_craving")
        if isinstance(crv, (int, float)) and crv >= 3:
            anomalies.append(f"[{d_str}] Fissura / Craving elevado ({crv}/5)")
        cdop = m.get("bh_cheap_dopamine")
        if isinstance(cdop, (int, float)) and cdop >= 3:
            anomalies.append(f"[{d_str}] Vazamento de dopamina barata ({cdop}/5)")
        breaches = m.get("bh_temperance_breach")
        if isinstance(breaches, list) and len(breaches) > 0:
            anomalies.append(f"[{d_str}] Quebra de temperança: {', '.join(str(x) for x in breaches)}")
        skin = m.get("bio_skin_barrier")
        if isinstance(skin, (int, float)) and skin <= 2:
            anomalies.append(f"[{d_str}] Queda na barreira cutânea ({skin}/5)")

    logs_timeline = []
    for d, _, m in target:
        logs_timeline.append(
            {
                "date": d.isoformat(),
                "day_rating": m.get("cog_day_rating"),
                "bio_log": m.get("ctx_bio_log"),
                "exec_log": m.get("ctx_exec_log"),
                "poly_log": m.get("ctx_poly_log"),
                "psy_log": m.get("ctx_psy_log"),
            }
        )

    return {
        "period": {
            "files_matched": len(records),
            "days_populated": len(populated),
            "dates_analyzed": [d.isoformat() for d, _, _ in target],
        },
        "eixo_1_execucao": eixo_exec,
        "eixo_2_biologia_clima": eixo_bio_env,
        "eixo_3_psique_temperanca": eixo_psy_hab,
        "eixo_4_polimatia": eixo_poly,
        "anomalies": anomalies,
        "semantic_logs": logs_timeline,
    }


def fmt_stat(st: dict, unit: str = "", show_sum: bool = False) -> str:
    if not st or st.get("n", 0) == 0:
        return "null (0d)"
    parts = []
    if show_sum and st.get("sum") is not None:
        parts.append(f"Soma: {st['sum']}{unit}")
    parts.append(f"Média: {st['mean']}{unit} (±{st['std']} | min {st['min']}, max {st['max']} | n={st['n']}d)")
    return " | ".join(parts)


def fmt_bool(st: dict) -> str:
    if not st or st.get("n", 0) == 0:
        return "null (0d)"
    return f"{st['true_count']}/{st['n']} dias ({st['rate_pct']}%)"


def render_markdown(report: dict) -> str:
    p = report["period"]
    e1 = report["eixo_1_execucao"]
    e2 = report["eixo_2_biologia_clima"]
    e3 = report["eixo_3_psique_temperanca"]
    e4 = report["eixo_4_polimatia"]

    lines = [
        f"**VETOR DE TELEMETRIA DETERMINÍSTICO ({p['days_populated']} dias preenchidos / {p['files_matched']} arquivos)**",
        f"- **Datas Analisadas:** `{', '.join(p['dates_analyzed']) if p['dates_analyzed'] else 'Nenhuma'}`",
        "",
        "**1. EIXO EXECUÇÃO & ALAVANCAGEM (`exec_`)**",
        f"- **Deep Work (Forest):** {fmt_stat(e1['deep_work_h'], 'h', show_sum=True)}",
        f"- **Screen Time (Mobile):** {fmt_stat(e1['screen_time_h'], 'h', show_sum=True)}",
        f"- **Shipped (Entregas Reais):** {fmt_bool(e1['shipped'])} | **Alavancagem:** {fmt_stat(e1['leverage'], '/5')} | **Batching Matinal:** {fmt_bool(e1['batching_kept'])}",
        f"- **Flow State:** {fmt_stat(e1['flow_state'], '/5')} | **Carga Cognitiva:** {fmt_stat(e1['cognitive_load'], '/5')}",
        f"- **Fragmentação:** {fmt_stat(e1['fragmentation'], '/5')} | **Procrastinação:** {fmt_stat(e1['procrastination'], '/5')} | **Fricção Externa:** {fmt_stat(e1['external_friction'], '/5')}",
        f"- **Focos Dominantes (`exec_focus_areas`):** `{json.dumps(e1['focus_areas_freq'], ensure_ascii=False)}`",
        f"- **Modos de Trabalho (`exec_work_mode`):** `{json.dumps(e1['work_mode_freq'], ensure_ascii=False)}`",
        "",
        "**2. EIXO BIOLOGIA, SONO & CLIMA (`bio_` + `env_`)**",
        f"- **Horas de Sono:** {fmt_stat(e2['sleep_hours'], 'h')} | **Qualidade:** {fmt_stat(e2['sleep_quality'], '/5')} | **Inércia:** {fmt_stat(e2['sleep_inertia'], '/5')}",
        f"- **Horário de Dormir (`bio_bed_time`):** Média `{e2['bed_time']['mean_time']}` (±{e2['bed_time']['std_min']} min, n={e2['bed_time']['n']}d) | **Acordar (`bio_wake_time`):** Média `{e2['wake_time']['mean_time']}` (±{e2['wake_time']['std_min']} min, n={e2['wake_time']['n']}d)",
        f"- **Crash Biológico (`bio_crash_time`):** {len(e2['crash_events'])} ocorrências (Média: `{e2['crash_time_stats']['mean_time']}`) -> `{json.dumps(e2['crash_events'], ensure_ascii=False)}`",
        f"- **Treinos (`bio_training_type`):** `{json.dumps(e2['training_type_freq'], ensure_ascii=False)}` | **Carga Média:** {fmt_stat(e2['training_load'], '/5')}",
        f"- **Barreira Cutânea (`bio_skin_barrier`):** {fmt_stat(e2['skin_barrier'], '/5')} | **Intestino (`bio_gut_state`):** {fmt_stat(e2['gut_state'], '/5')} | **Desconforto:** {fmt_stat(e2['discomfort'], '/5')}",
        f"- **Cafeína:** {fmt_stat(e2['caffeine_doses'], ' doses', show_sum=True)} | **Late Caffeine:** {fmt_bool(e2['late_caffeine'])} | **Álcool:** {fmt_bool(e2['alcohol'])}",
        f"- **Sintomas:** `{json.dumps(e2['symptoms_freq'], ensure_ascii=False)}` | **Fármacos:** `{json.dumps(e2['meds_taken_freq'], ensure_ascii=False)}`",
        f"- **Clima (Local):** Mín {fmt_stat(e2['env_temp_min'], '°C')} | Máx {fmt_stat(e2['env_temp_max'], '°C')} | Umidade {fmt_stat(e2['env_humidity_avg'], '%')} | Δ Pressão {fmt_stat(e2['env_pressure_delta'], ' hPa')} | Condições: `{json.dumps(e2['env_weather_freq'], ensure_ascii=False)}`",
        "",
        "**3. EIXO PSIQUE, EGO & TEMPERANÇA (`cog_` + `h_/bh_`)**",
        f"- **Nota do Dia (`cog_day_rating`):** {fmt_stat(e3['day_rating'], '/5')} | **Humor:** {fmt_stat(e3['mood'], '/5')} | **Energia:** {fmt_stat(e3['energy'], '/5')} | **Drive:** {fmt_stat(e3['drive'], '/5')}",
        f"- **Competência:** {fmt_stat(e3['competence'], '/5')} | **Confiança:** {fmt_stat(e3['confidence'], '/5')} | **Clareza:** {fmt_stat(e3['clarity'], '/5')} | **Temperança:** {fmt_stat(e3['temperance'], '/5')} | **Fissura (Craving):** {fmt_stat(e3['craving'], '/5')}",
        f"- **Ansiedade:** {fmt_stat(e3['anxiety'], '/5')} | **Ruminação:** {fmt_stat(e3['rumination'], '/5')} | **Fome de Validação:** {fmt_stat(e3['validation_hunger'], '/5')} | **Dopamina Barata:** {fmt_stat(e3['cheap_dopamine'], '/5')}",
        f"- **Brechas de Temperança (`bh_temperance_breach`):** `{json.dumps(e3['temperance_breach_freq'], ensure_ascii=False)}` | **Fontes de Estresse:** `{json.dumps(e3['stress_source_freq'], ensure_ascii=False)}`",
        f"- **Hábitos Fundacionais:** Dieta Limpa {fmt_bool(e3['habits']['h_clean_diet'])} | Água {fmt_bool(e3['habits']['h_water_goal'])} | Creatina {fmt_bool(e3['habits']['h_creatine'])} | Sol AM {fmt_bool(e3['habits']['h_sunlight_am'])} | QG Limpo {fmt_bool(e3['habits']['h_clean_qg'])} | Âncora Espiritual {fmt_bool(e3['habits']['h_spiritual_anchor'])} | Wind Down {fmt_bool(e3['habits']['h_wind_down'])}",
        "",
        "**4. EIXO POLIMATIA & GRAFO (`poly_` + `ctx_`)**",
        f"- **Domínios (`poly_domains`):** `{json.dumps(e4['domains_freq'], ensure_ascii=False)}`",
        f"- **Profundidade (`poly_depth`):** `{json.dumps(e4['depth_freq'], ensure_ascii=False)}` | **Modo (`poly_mode`):** `{json.dumps(e4['mode_freq'], ensure_ascii=False)}`",
        f"- **Cross-Pollination:** {fmt_bool(e4['cross_pollination'])} | **Hyperfocus Pull:** {fmt_stat(e4['hyperfocus_pull'], '/5')}",
        f"- **Entidades no Grafo (`ctx_entities`):** `{json.dumps(e4['entities_freq'], ensure_ascii=False)}`",
        "",
        "**5. ANOMALIAS & OUTLIERS DETECTADOS**",
    ]
    if report["anomalies"]:
        for a in report["anomalies"]:
            lines.append(f"- {a}")
    else:
        lines.append("- Nenhuma anomalia crítica detectada no período.")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Tyler Deterministic Telemetry Auditor")
    parser.add_argument("--days", type=int, default=7, help="Número de dias para auditar (padrão: 7)")
    parser.add_argument("--month", type=str, default=None, help="Mês específico no formato YYYY-MM")
    parser.add_argument("--end-date", type=str, default=None, help="Data final YYYY-MM-DD (padrão: hoje)")
    parser.add_argument("--format", choices=["md", "json"], default="md", help="Formato de saída (md ou json)")
    args = parser.parse_args()

    if args.month:
        m = re.match(r"^(\d{4})-(\d{2})$", args.month.strip())
        if not m:
            print("Erro: --month deve estar no formato YYYY-MM", file=sys.stderr)
            sys.exit(1)
        year, month = int(m.group(1)), int(m.group(2))
        start_date = datetime.date(year, month, 1)
        if month == 12:
            end_date = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            end_date = datetime.date(year, month + 1, 1) - datetime.timedelta(days=1)
    else:
        if args.end_date:
            end_date = datetime.date.fromisoformat(args.end_date)
        else:
            end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=max(1, args.days) - 1)

    records = find_daily_files(start_date, end_date)
    report = audit_dailies(records)

    if args.format == "json":
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(render_markdown(report))


if __name__ == "__main__":
    main()
