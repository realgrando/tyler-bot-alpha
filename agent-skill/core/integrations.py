"""
core/integrations.py — Clima Open-Meteo (Localidade do Usuário), Anki SQLite, Git PoW & Daily Engine
=============================================================================================
Integrações nativas e determinísticas do T.Y.L.E.R MARK II (Kernel v5.0):
- sync_weather(): Consulta Open-Meteo para Localidade do Usuário (ontem + hoje), calcula
  env_weather (WMO), env_temp_min, env_temp_max, env_humidity_avg, env_pressure_delta,
  env_daylight_h e env_aqi_pollen, grava em weather_log (SQLite) e injeta na Daily.
- check_anki_status(): Copia o banco do Anki para /tmp/anki_ro.sqlite (ou usa anki-cli)
  e retorna revisões feitas hoje e cards pendentes por deck.
- Funções de gerenciamento cirúrgico da Daily Note (ensure_daily_note, apply_daily_set_args,
  audit_daily_empty_fields) e leitura do Ciclo Ativo (Cycle 5.md).
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sqlite3
import subprocess
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import urllib.request

from .config import (
    ANKI_DB_PATH,
    CENTRAL_DIR,
    CODE_WORKSPACE_DIR,
    LATITUDE,
    LONGITUDE,
    LOCAL_BIN_DIR,
    MANDATORY_DAILY_FIELDS,
    TEMPLATES_DIR,
    TIMEZONE_URL,
    USER_CONFIG,
    get_daily_path,
    get_season_south,
)
from .db import record_weather_log
from .kinetic_bridge import extract_yaml_scalar, set_yaml_scalar, split_frontmatter_and_body


# ---------------------------------------------------------------------------
# 1. TRADUÇÃO WMO WEATHER CODE -> STRING CANÔNICA
# ---------------------------------------------------------------------------
def translate_wmo_weather_code(wmo_code: int) -> str:
    """
    Traduz o weather_code WMO da Open-Meteo para a string canônica exigida pelo Kernel v5.0:
    clear | partly_cloudy | overcast | fog | drizzle | rain | heavy_rain | storm
    """
    if wmo_code in (0, 1):
        return "clear"
    if wmo_code == 2:
        return "partly_cloudy"
    if wmo_code == 3:
        return "overcast"
    if wmo_code in (45, 48):
        return "fog"
    if wmo_code in (51, 53, 55, 56, 57):
        return "drizzle"
    if wmo_code in (61, 63, 66, 80, 81):
        return "rain"
    if wmo_code in (65, 67, 82):
        return "heavy_rain"
    if wmo_code in (95, 96, 99):
        return "storm"
    # Neve ou granizo raro mapeado para heavy_rain/storm
    if wmo_code in (71, 73, 75, 77, 85, 86):
        return "heavy_rain"
    return "partly_cloudy"


# ---------------------------------------------------------------------------
# 2. SYNC METEOROLÓGICO AUTOMÁTICO (OPEN-METEO LOCAL)
# ---------------------------------------------------------------------------
def sync_weather(dt: Optional[datetime] = None, inject_daily: bool = True) -> Dict[str, Any]:
    """
    Consulta a API Open-Meteo para Localidade do Usuário (buscando ontem + hoje via past_days=1),
    calcula os 6 sensores meteorológicos + AQI, grava em weather_log no SQLite e injeta
    diretamente nos campos env_* da Daily de hoje sem alterar nenhum outro campo.
    """
    target_dt = dt or datetime.now()
    date_iso = target_dt.strftime("%Y-%m-%d")

    weather_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={LATITUDE}&longitude={LONGITUDE}"
        f"&daily=weather_code,temperature_2m_max,temperature_2m_min,"
        f"relative_humidity_2m_mean,surface_pressure_mean,daylight_duration"
        f"&past_days=1&forecast_days=1"
        f"&timezone={TIMEZONE_URL}"
    )
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={LATITUDE}&longitude={LONGITUDE}"
        f"&current=european_aqi&timezone={TIMEZONE_URL}"
    )

    try:
        req_w = urllib.request.Request(weather_url, headers={"User-Agent": "TylerCore/5.0"})
        with urllib.request.urlopen(req_w, timeout=6) as resp:
            w_data = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        return {"status": "error", "message": f"Falha ao consultar Open-Meteo: {exc}"}

    aqi_val: Optional[int] = None
    try:
        req_aq = urllib.request.Request(aq_url, headers={"User-Agent": "TylerCore/5.0"})
        with urllib.request.urlopen(req_aq, timeout=4) as resp:
            aq_data = json.loads(resp.read().decode("utf-8"))
            raw_aqi = aq_data.get("current", {}).get("european_aqi")
            if raw_aqi is not None:
                aqi_val = int(round(float(raw_aqi)))
    except Exception:
        pass

    daily = w_data.get("daily", {})
    dates = daily.get("time", [])
    # Com past_days=1 e forecast_days=1, o índice 0 é ontem e o índice -1 (1) é hoje
    today_idx = -1
    if date_iso in dates:
        today_idx = dates.index(date_iso)

    wcodes = daily.get("weather_code", [0])
    t_mins = daily.get("temperature_2m_min", [0.0])
    t_maxs = daily.get("temperature_2m_max", [0.0])
    humids = daily.get("relative_humidity_2m_mean", [0])
    pressures = daily.get("surface_pressure_mean", [0.0, 0.0])
    daylights = daily.get("daylight_duration", [48000.0])

    wcode_today = int(wcodes[today_idx]) if wcodes else 0
    env_weather = translate_wmo_weather_code(wcode_today)
    env_temp_min = round(float(t_mins[today_idx]), 1) if t_mins else 0.0
    env_temp_max = round(float(t_maxs[today_idx]), 1) if t_maxs else 0.0
    env_humidity_avg = int(round(float(humids[today_idx]))) if humids else 0

    # Delta barométrico: pressão média de hoje menos pressão média de ontem
    if len(pressures) >= 2 and pressures[today_idx] is not None and pressures[today_idx - 1] is not None:
        env_pressure_delta = round(float(pressures[today_idx]) - float(pressures[today_idx - 1]), 1)
    else:
        env_pressure_delta = 0.0

    daylight_sec = float(daylights[today_idx]) if daylights else 48000.0
    env_daylight_h = round(daylight_sec / 3600.0, 1)

    record_weather_log(
        date_str=date_iso,
        env_weather=env_weather,
        env_temp_min=env_temp_min,
        env_temp_max=env_temp_max,
        env_humidity_avg=env_humidity_avg,
        env_pressure_delta=env_pressure_delta,
        env_daylight_h=env_daylight_h,
        env_aqi_pollen=aqi_val,
    )

    telemetry: Dict[str, Any] = {
        "env_weather": env_weather,
        "env_temp_min": env_temp_min,
        "env_temp_max": env_temp_max,
        "env_humidity_avg": env_humidity_avg,
        "env_pressure_delta": env_pressure_delta,
        "env_daylight_h": env_daylight_h,
    }
    if aqi_val is not None:
        telemetry["env_aqi_pollen"] = aqi_val

    daily_path = get_daily_path(target_dt)
    injected = False
    if inject_daily and daily_path.exists():
        injected = inject_env_into_daily(daily_path, telemetry)

    return {
        "status": "ok",
        "date": date_iso,
        "daily_injected": injected,
        "daily_path": str(daily_path),
        "telemetry": telemetry,
    }


def inject_env_into_daily(daily_path: Path, env_data: Dict[str, Any]) -> bool:
    """Injeta exclusivamente os campos env_* no frontmatter da Daily preservando os demais campos."""
    if not daily_path.exists():
        return False
    text = daily_path.read_text(encoding="utf-8")
    fm, body = split_frontmatter_and_body(text)
    if not fm:
        return False

    for k, v in env_data.items():
        if v is not None:
            fm = set_yaml_scalar(fm, k, v)

    if not fm.endswith("\n"):
        fm += "\n"
    if not body.startswith("\n"):
        body = "\n\n" + body.lstrip("\n")
    daily_path.write_text(f"---\n{fm}---{body}", encoding="utf-8")
    return True


# ---------------------------------------------------------------------------
# 3. INSPEÇÃO DIRETA DO ANKI (SQLITE /TMP + ANKI-CLI)
# ---------------------------------------------------------------------------
def check_anki_status() -> Dict[str, Any]:
    """
    Inspeciona o status do Anki copiando o banco SQLite local para /tmp/anki_ro.sqlite
    (à prova de locks caso o Anki Desktop esteja aberto) e complementando com anki-cli today.
    Retorna quantos cards foram revisados hoje e quantos estão pendentes por deck.
    """
    result: Dict[str, Any] = {
        "cards_reviewed_today": 0,
        "due_cards_total": 0,
        "decks": [],
        "source": "none",
        "streak_alert": True,
    }

    if ANKI_DB_PATH.exists():
        tmp_db = Path("/tmp/anki_ro.sqlite")
        try:
            shutil.copy2(ANKI_DB_PATH, tmp_db)
            for ext in ("-wal", "-shm"):
                wal_src = Path(str(ANKI_DB_PATH) + ext)
                if wal_src.exists():
                    shutil.copy2(wal_src, Path(str(tmp_db) + ext))

            conn = sqlite3.connect(str(tmp_db))
            conn.create_collation("unicase", lambda a, b: (a.lower() > b.lower()) - (a.lower() < b.lower()))
            cur = conn.cursor()

            # 1. Revisões feitas hoje (desde 04:00 da manhã ou 00:00)
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_ms = int(today_start.timestamp() * 1000)
            cur.execute("SELECT COUNT(*) FROM revlog WHERE id >= ?", (today_ms,))
            rev_row = cur.fetchone()
            reviewed_today = int(rev_row[0]) if rev_row else 0

            # 2. Decks e contagem de cards (queue in (1,2,3) ou novos)
            cur.execute("SELECT id, name FROM decks")
            deck_map: Dict[int, str] = {}
            for d_id, d_name in cur.fetchall():
                deck_map[int(d_id)] = str(d_name).replace("\x1f", "::")

            cur.execute("SELECT did, queue, COUNT(*) FROM cards GROUP BY did, queue")
            deck_stats: Dict[int, Dict[str, int]] = {}
            for did, queue, cnt in cur.fetchall():
                st = deck_stats.setdefault(int(did), {"new": 0, "learning": 0, "review": 0, "total": 0})
                st["total"] += int(cnt)
                if int(queue) == 0:
                    st["new"] += int(cnt)
                elif int(queue) in (1, 3):
                    st["learning"] += int(cnt)
                elif int(queue) == 2:
                    st["review"] += int(cnt)

            conn.close()

            decks_list = []
            due_total = 0
            for did, dname in sorted(deck_map.items(), key=lambda x: x[1]):
                st = deck_stats.get(did, {"new": 0, "learning": 0, "review": 0, "total": 0})
                if st["total"] == 0 and dname == "Default":
                    continue
                due_total += st["learning"]
                decks_list.append(
                    {
                        "deck": dname,
                        "total": st["total"],
                        "new": st["new"],
                        "learning": st["learning"],
                        "review_pool": st["review"],
                    }
                )

            result["cards_reviewed_today"] = reviewed_today
            result["due_cards_total"] = due_total
            result["decks"] = decks_list
            result["source"] = "sqlite_ro_copy"
            result["streak_alert"] = reviewed_today == 0
            return result
        except Exception:
            pass

    # Fallback via anki-cli today
    anki_bin = LOCAL_BIN_DIR / "anki-cli"
    if anki_bin.exists():
        try:
            proc = subprocess.run([str(anki_bin), "today"], capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and proc.stdout:
                data = json.loads(proc.stdout)
                cnt = int(data.get("cards_reviewed_today", 0))
                result["cards_reviewed_today"] = cnt
                result["source"] = data.get("mode", "anki-cli")
                result["streak_alert"] = cnt == 0
        except Exception:
            pass

    return result


# ---------------------------------------------------------------------------
# 4. GESTÃO DA DAILY NOTE, CICLO ATIVO E AUDITORIA DE SHUTDOWN
# ---------------------------------------------------------------------------
def ensure_daily_note(dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Garante que a Daily Note de hoje (DD-MM-YYYY.md) existe na Sprint correta.
    Se não existir, instancia a partir de Central/Configs/Templates/Daily.md.
    """
    target_dt = dt or datetime.now()
    daily_path = get_daily_path(target_dt)
    if daily_path.exists():
        return {"created": False, "path": str(daily_path)}

    daily_path.parent.mkdir(parents=True, exist_ok=True)
    tpl_path = TEMPLATES_DIR / "Daily.md"
    iso_year, iso_week, iso_weekday = target_dt.isocalendar()
    sprint_link = f'"[[sprint-{iso_week:02d}]]"'
    now_fmt = target_dt.strftime("%d-%m-%Y %H:%M")
    date_iso = target_dt.strftime("%Y-%m-%d")
    season = get_season_south(target_dt)

    if tpl_path.exists():
        raw = tpl_path.read_text(encoding="utf-8")
        # Substitui o bloco Templater de Parent
        raw = re.sub(r'Parent:\s*"<%\*[\s\S]*?%>"', f"Parent: {sprint_link}", raw)
        raw = re.sub(r"<%\s*'classDaily'\s*%>", "classDaily", raw)
        raw = re.sub(r"<%\s*tp\.date\.now\(['\"]YYYY-MM-DD['\"]\)\s*%>", date_iso, raw)
        raw = re.sub(r"<%\s*tp\.date\.now\(['\"]E['\"]\)\s*%>", str(iso_weekday), raw)
        raw = re.sub(r"<%\s*tp\.date\.now\(['\"]DD-MM-YYYY HH:mm['\"]\)\s*%>", now_fmt, raw)
        raw = re.sub(r"season:\s*\w+", f"season: {season}", raw)
        daily_path.write_text(raw, encoding="utf-8")
    else:
        fallback = (
            f"---\nClass: classDaily\nParent: {sprint_link}\nPinned: false\n"
            f"date: {date_iso}\nday_of_week: {iso_weekday}\nseason: {season}\nday_type: normal\n"
            f"Created: {now_fmt}\nUpdated: {now_fmt}\nArea: Personal\ntags:\n  - daily\nAliases: []\n---\n"
        )
        daily_path.write_text(fallback, encoding="utf-8")

    return {"created": True, "path": str(daily_path)}


def apply_daily_set_args(set_pairs: List[str], dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Aplica mutações diretas no YAML da Daily de hoje a partir de pares 'key=val' ou 'key=+N'.
    Exemplo: ['bio_caffeine_doses=+1', 'exec_deep_work_h=+2', 'bio_training_type=upper']
    """
    ensure_daily_note(dt)
    daily_path = get_daily_path(dt)
    text = daily_path.read_text(encoding="utf-8")
    fm, body = split_frontmatter_and_body(text)
    if not fm:
        return {"status": "error", "message": "Frontmatter da Daily não encontrado."}

    applied: Dict[str, Any] = {}
    for item in set_pairs:
        if "=" not in item:
            continue
        k, raw_v = item.split("=", 1)
        k = k.strip()
        raw_v = raw_v.strip()

        # Suporte a incremento/decremento (+N ou -N)
        if raw_v.startswith("+") or (raw_v.startswith("-") and len(raw_v) > 1 and raw_v[1:].replace(".", "", 1).isdigit()):
            cur_str = extract_yaml_scalar(fm, k) or "0"
            try:
                cur_num = float(cur_str) if cur_str else 0.0
            except ValueError:
                cur_num = 0.0
            try:
                delta = float(raw_v)
                new_num = cur_num + delta
                final_val: Any = int(new_num) if new_num.is_integer() else round(new_num, 2)
            except ValueError:
                final_val = raw_v
        else:
            if raw_v.lower() in ("true", "false"):
                final_val = raw_v.lower() == "true"
            elif raw_v.startswith("[") and raw_v.endswith("]"):
                final_val = raw_v
            else:
                final_val = raw_v

        fm = set_yaml_scalar(fm, k, final_val)
        applied[k] = final_val

    now_fmt = datetime.now().strftime("%d-%m-%Y %H:%M")
    fm = set_yaml_scalar(fm, "Updated", now_fmt)
    if not fm.endswith("\n"):
        fm += "\n"
    if not body.startswith("\n"):
        body = "\n\n" + body.lstrip("\n")
    daily_path.write_text(f"---\n{fm}---{body}", encoding="utf-8")
    return {"status": "ok", "daily_path": str(daily_path), "updated_fields": applied}


def audit_daily_empty_fields(dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Varre o frontmatter da Daily de hoje e separa exatamente os campos preenchidos
    e os CAMPOS_VAZIOS_OBRIGATORIOS por eixo para o tyler-core shutdown.
    """
    ensure_daily_note(dt)
    daily_path = get_daily_path(dt)
    text = daily_path.read_text(encoding="utf-8")
    fm, _ = split_frontmatter_and_body(text)

    missing_by_group: Dict[str, List[str]] = {}
    filled_fields: Dict[str, Any] = {}
    total_missing = 0

    for group, fields in MANDATORY_DAILY_FIELDS.items():
        group_missing: List[str] = []
        for f in fields:
            val = extract_yaml_scalar(fm, f)
            if val is None or val == "" or val == "null" or val == '""':
                group_missing.append(f)
                total_missing += 1
            else:
                filled_fields[f] = val
        if group_missing:
            missing_by_group[group] = group_missing

    return {
        "daily_path": str(daily_path),
        "total_mandatory_checked": sum(len(v) for v in MANDATORY_DAILY_FIELDS.values()),
        "total_missing": total_missing,
        "missing_by_group": missing_by_group,
        "filled_sample": filled_fields,
    }


def get_active_cycle_info() -> Dict[str, Any]:
    """Localiza o ciclo com Current: true em Central/Personal/Cycles/ e retorna seus alvos do dia."""
    cycles_dir = CENTRAL_DIR / "Personal" / "Cycles"
    if not cycles_dir.exists():
        return {"name": "None"}

    days_en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    today_en = days_en[datetime.now().weekday()]

    for p in sorted(cycles_dir.glob("*.md")):
        try:
            txt = p.read_text(encoding="utf-8")
            fm, _ = split_frontmatter_and_body(txt)
            cur_flag = extract_yaml_scalar(fm, "Current")
            if cur_flag and cur_flag.lower() == "true":
                return {
                    "name": p.stem,
                    "path": str(p),
                    "start": extract_yaml_scalar(fm, "Start"),
                    "target": extract_yaml_scalar(fm, "Target"),
                    "today_day": today_en,
                    "today_training": extract_yaml_scalar(fm, today_en),
                    "calories": extract_yaml_scalar(fm, "Calories"),
                    "macros": extract_yaml_scalar(fm, "Macros"),
                    "water": extract_yaml_scalar(fm, "Water"),
                    "sleep_window": extract_yaml_scalar(fm, "Sleep_Window"),
                }
        except Exception:
            continue
    return {"name": "None"}


# ---------------------------------------------------------------------------
# 5. INTEGRAÇÕES EXTERNAS RÁPIDAS (GOOGLE CALENDAR, GTASKS, TYLER-DAILY, GIT)
# ---------------------------------------------------------------------------
def _run_fast_cli(cmd: List[str], timeout: float = 2.5) -> str:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return (proc.stdout or "").strip()
    except Exception:
        return ""


def fetch_external_boot_context() -> Dict[str, Any]:
    """
    Executa em paralelo (ThreadPoolExecutor) as consultas a tyler-daily, gcalendar, gtasks
    e Git PoW para manter o tempo de resposta do boot muito rápido.
    """
    results: Dict[str, Any] = {
        "telemetry_predict": None,
        "calendar_today": "",
        "tasks_pending": "",
        "git_commits_today": [],
    }

    features = USER_CONFIG.get("features", {})
    google_enabled = features.get("google_cli", False)
    git_pow_enabled = features.get("git_pow", True)
    onboarding_done = USER_CONFIG.get("onboarding_completed", False)

    if not onboarding_done:
        return results

    def _get_telemetry() -> Any:
        bin_p = LOCAL_BIN_DIR / "tyler-daily"
        if bin_p.exists():
            out = _run_fast_cli([str(bin_p), "--predict", "--json"], timeout=1.5)
            if out:
                try:
                    return json.loads(out)
                except Exception:
                    return out[:600]
        return None

    def _get_calendar() -> str:
        if not google_enabled:
            return ""
        bin_p = LOCAL_BIN_DIR / "gcalendar"
        if bin_p.exists():
            return _run_fast_cli([str(bin_p), "list", "--days", "1"], timeout=2.5)
        return ""

    def _get_tasks() -> str:
        if not google_enabled:
            return ""
        bin_p = LOCAL_BIN_DIR / "gtasks"
        if bin_p.exists():
            return _run_fast_cli([str(bin_p), "list"], timeout=2.5)
        return ""

    def _get_git_pow() -> List[str]:
        commits: List[str] = []
        if not git_pow_enabled or not CODE_WORKSPACE_DIR.exists():
            return commits
        today_iso = datetime.now().strftime("%Y-%m-%d")
        for repo in CODE_WORKSPACE_DIR.iterdir():
            if repo.is_dir() and (repo / ".git").exists():
                out = _run_fast_cli(
                    ["git", "-C", str(repo), "log", f"--since={today_iso} 00:00:00", "--oneline"],
                    timeout=1.0,
                )
                if out:
                    for line in out.splitlines():
                        commits.append(f"[{repo.name}] {line}")
        return commits

    with ThreadPoolExecutor(max_workers=4) as pool:
        f_tel = pool.submit(_get_telemetry)
        f_cal = pool.submit(_get_calendar)
        f_tsk = pool.submit(_get_tasks)
        f_git = pool.submit(_get_git_pow)

        results["telemetry_predict"] = f_tel.result()
        results["calendar_today"] = f_cal.result()
        results["tasks_pending"] = f_tsk.result()
        results["git_commits_today"] = f_git.result()

    return results
