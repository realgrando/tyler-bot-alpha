"""
core/db.py — Gerenciador de Memória Transacional SQLite WAL (tyler_memory.db)
=============================================================================
Governa a persistência atômica de eventos episódicos do dia (day_events),
histórico biometeorológico (weather_log) e eventos termodinâmicos (kinetic_events),
além de manter o espelho legível em state/today_stream.md.
"""

from __future__ import annotations

import json
import re
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .config import SQLITE_DB_PATH, STATE_DIR, TODAY_STREAM_PATH, VALID_EVENT_CATEGORIES

DAYS_PT: Dict[int, str] = {
    0: "Segunda-feira",
    1: "Terça-feira",
    2: "Quarta-feira",
    3: "Quinta-feira",
    4: "Sexta-feira",
    5: "Sábado",
    6: "Domingo",
}


def get_connection(db_path: Path = SQLITE_DB_PATH) -> sqlite3.Connection:
    """Abre conexão SQLite configurada em modo WAL (Write-Ahead Logging) para concorrência segura."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db(db_path: Path = SQLITE_DB_PATH) -> None:
    """Cria as tabelas canônicas se não existirem e migra eventos existentes do today_stream.md."""
    conn = get_connection(db_path)
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS day_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                category TEXT NOT NULL,
                summary TEXT NOT NULL,
                metrics_delta_json TEXT DEFAULT '{}',
                entities_woken_json TEXT DEFAULT '[]'
            );
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_day_events_date ON day_events(date);
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS weather_log (
                date TEXT PRIMARY KEY,
                env_weather TEXT,
                env_temp_min REAL,
                env_temp_max REAL,
                env_humidity_avg INTEGER,
                env_pressure_delta REAL,
                env_daylight_h REAL,
                env_aqi_pollen INTEGER,
                last_sync TEXT
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS kinetic_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                note_name TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT DEFAULT ''
            );
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_kinetic_timestamp ON kinetic_events(timestamp);
            """
        )

        # Verifica se precisamos hidratar o banco com os registros já presentes em today_stream.md
        cur = conn.execute("SELECT COUNT(*) AS cnt FROM day_events;")
        row = cur.fetchone()
        if row and row["cnt"] == 0 and TODAY_STREAM_PATH.exists():
            _bootstrap_from_today_stream(conn, TODAY_STREAM_PATH)
    conn.close()


def _infer_category_from_tag(tag: str) -> str:
    """Mapeia tags antigas do today_stream.md para as 7 categorias canônicas."""
    t = tag.lower()
    if any(k in t for k in ["temperan", "fissura", "alerta", "queda", "sentinela", "pacto", "espiritual"]):
        return "temperance"
    if any(k in t for k in ["bio", "sono", "treino", "habito", "hábito", "farmaco", "fármaco", "nutri"]):
        return "bio"
    if any(k in t for k in ["estudo", "library", "cinema", "zettel", "academy", "ontology", "livro", "anki", "rd"]):
        return "study"
    if any(k in t for k in ["psique", "filosofia", "epifania", "desabafo", "sincro", "decreto"]):
        return "thought"
    if any(k in t for k in ["studio", "swipe", "criativo"]):
        return "studio"
    if any(k in t for k in ["venture", "parceria", "arquit", "engenharia", "work", "foco"]):
        return "work"
    return "system"


def _bootstrap_from_today_stream(conn: sqlite3.Connection, stream_path: Path) -> None:
    """Importa eventos históricos de state/today_stream.md na inicialização do banco."""
    try:
        text = stream_path.read_text(encoding="utf-8")
    except Exception:
        return

    current_date: Optional[str] = None
    header_re = re.compile(r"\*\*Eventos de Hoje \((\d{2})-(\d{2})-(\d{4})")
    event_re = re.compile(r"^-\s*\[(\d{2}:\d{2}(?::\d{2})?)\]\s*\[([^\]]+)\]\s*(.+)$")

    for line in text.splitlines():
        line_s = line.strip()
        m_hdr = header_re.search(line_s)
        if m_hdr:
            dd, mm, yyyy = m_hdr.group(1), m_hdr.group(2), m_hdr.group(3)
            current_date = f"{yyyy}-{mm}-{dd}"
            continue

        if current_date and line_s.startswith("- ["):
            m_ev = event_re.match(line_s)
            if m_ev:
                raw_time = m_ev.group(1)
                if len(raw_time) == 5:
                    raw_time += ":00"
                raw_tag = m_ev.group(2)
                summary = f"[{raw_tag}] {m_ev.group(3)}"
                cat = _infer_category_from_tag(raw_tag)
                conn.execute(
                    """
                    INSERT INTO day_events (date, time, category, summary, metrics_delta_json, entities_woken_json)
                    VALUES (?, ?, ?, ?, '{}', '[]')
                    """,
                    (current_date, raw_time, cat, summary),
                )


def record_day_event(
    category: str,
    summary: str,
    metrics_delta: Optional[Dict[str, Any]] = None,
    entities_woken: Optional[List[str]] = None,
    dt: Optional[datetime] = None,
    mirror_stream: bool = True,
) -> int:
    """
    Grava um evento episódico na tabela day_events e espelha imediatamente
    no state/today_stream.md para leitura humana no VS Code / Obsidian.
    """
    init_db()
    now = dt or datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    cat = category.lower().strip()
    if cat not in VALID_EVENT_CATEGORIES:
        cat = "system"

    metrics_json = json.dumps(metrics_delta or {}, ensure_ascii=False)
    woken_json = json.dumps(entities_woken or [], ensure_ascii=False)

    conn = get_connection()
    with conn:
        cur = conn.execute(
            """
            INSERT INTO day_events (date, time, category, summary, metrics_delta_json, entities_woken_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (date_str, time_str, cat, summary.strip(), metrics_json, woken_json),
        )
        event_id = int(cur.lastrowid or 0)
    conn.close()

    if mirror_stream:
        append_to_today_stream(now, cat, summary.strip(), metrics_delta, entities_woken)

    return event_id


def append_to_today_stream(
    dt: datetime,
    category: str,
    summary: str,
    metrics_delta: Optional[Dict[str, Any]] = None,
    entities_woken: Optional[List[str]] = None,
) -> None:
    """Mantém o arquivo state/today_stream.md sincronizado com o evento recém-inserido no SQLite."""
    dd_mm_yyyy = dt.strftime("%d-%m-%Y")
    day_name = DAYS_PT.get(dt.weekday(), "Dia")
    section_header = f"**Eventos de Hoje ({dd_mm_yyyy} - {day_name}):**"
    hh_mm = dt.strftime("%H:%M")

    extras: List[str] = []
    if metrics_delta:
        kv_str = ", ".join(f"{k}={v}" for k, v in metrics_delta.items())
        extras.append(f"metrics: {kv_str}")
    if entities_woken:
        w_str = ", ".join(entities_woken)
        extras.append(f"woken: {w_str}")

    suffix = f" ({' | '.join(extras)})" if extras else ""
    cat_tag = category.upper()
    if summary.startswith("["):
        entry_line = f"- [{hh_mm}] {summary}{suffix}"
    else:
        entry_line = f"- [{hh_mm}] [{cat_tag}] {summary}{suffix}"

    if not TODAY_STREAM_PATH.exists():
        now_fmt = dt.strftime("%d-%m-%Y %H:%M")
        base_content = (
            f"---\nCreated: {now_fmt}\nUpdated: {now_fmt}\nArea: Agents\n---\n\n"
            f"**GRAVADOR DE VOO DO DIA (EVENT BUS - TODAY STREAM)**\n\n"
            f"Espelho legível gerado automaticamente a partir do SQLite (`state/tyler_memory.db`).\n\n"
            f"---\n\n{section_header}\n{entry_line}\n"
        )
        TODAY_STREAM_PATH.write_text(base_content, encoding="utf-8")
        return

    content = TODAY_STREAM_PATH.read_text(encoding="utf-8")
    if section_header in content:
        if not content.endswith("\n"):
            content += "\n"
        content += f"{entry_line}\n"
    else:
        if not content.endswith("\n"):
            content += "\n"
        content += f"\n---\n\n{section_header}\n{entry_line}\n"

    TODAY_STREAM_PATH.write_text(content, encoding="utf-8")


def get_day_events(date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retorna todos os eventos do dia ordenados cronologicamente."""
    init_db()
    target_date = date_str or datetime.now().strftime("%Y-%m-%d")
    conn = get_connection()
    cur = conn.execute(
        """
        SELECT id, date, time, category, summary, metrics_delta_json, entities_woken_json
        FROM day_events
        WHERE date = ?
        ORDER BY time ASC, id ASC
        """,
        (target_date,),
    )
    rows = cur.fetchall()
    conn.close()

    results: List[Dict[str, Any]] = []
    for r in rows:
        try:
            m_delta = json.loads(r["metrics_delta_json"] or "{}")
        except Exception:
            m_delta = {}
        try:
            e_woken = json.loads(r["entities_woken_json"] or "[]")
        except Exception:
            e_woken = []
        results.append(
            {
                "id": r["id"],
                "date": r["date"],
                "time": r["time"],
                "category": r["category"],
                "summary": r["summary"],
                "metrics_delta": m_delta,
                "entities_woken": e_woken,
            }
        )
    return results


def record_weather_log(
    date_str: str,
    env_weather: str,
    env_temp_min: float,
    env_temp_max: float,
    env_humidity_avg: int,
    env_pressure_delta: float,
    env_daylight_h: float,
    env_aqi_pollen: Optional[int] = None,
) -> None:
    """Salva ou atualiza o registro meteorológico diário na tabela weather_log."""
    init_db()
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO weather_log (
                date, env_weather, env_temp_min, env_temp_max,
                env_humidity_avg, env_pressure_delta, env_daylight_h,
                env_aqi_pollen, last_sync
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                env_weather = excluded.env_weather,
                env_temp_min = excluded.env_temp_min,
                env_temp_max = excluded.env_temp_max,
                env_humidity_avg = excluded.env_humidity_avg,
                env_pressure_delta = excluded.env_pressure_delta,
                env_daylight_h = excluded.env_daylight_h,
                env_aqi_pollen = COALESCE(excluded.env_aqi_pollen, weather_log.env_aqi_pollen),
                last_sync = excluded.last_sync
            """,
            (
                date_str,
                env_weather,
                env_temp_min,
                env_temp_max,
                env_humidity_avg,
                env_pressure_delta,
                env_daylight_h,
                env_aqi_pollen,
                now_iso,
            ),
        )
    conn.close()


def get_weather_log(date_str: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retorna os dados climáticos salvos para a data solicitada."""
    init_db()
    target_date = date_str or datetime.now().strftime("%Y-%m-%d")
    conn = get_connection()
    cur = conn.execute("SELECT * FROM weather_log WHERE date = ?", (target_date,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def record_kinetic_event(note_name: str, action: str, details: str = "") -> int:
    """Registra uma transição termodinâmica (wake | pause | done | progress) em kinetic_events."""
    init_db()
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    with conn:
        cur = conn.execute(
            """
            INSERT INTO kinetic_events (timestamp, note_name, action, details)
            VALUES (?, ?, ?, ?)
            """,
            (ts, note_name, action, details),
        )
        kid = int(cur.lastrowid or 0)
    conn.close()
    return kid


def get_kinetic_events_for_date(date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lista todas as notas tocadas/aquecidas/pausadas na data especificada (YYYY-MM-DD)."""
    init_db()
    target_date = date_str or datetime.now().strftime("%Y-%m-%d")
    conn = get_connection()
    cur = conn.execute(
        """
        SELECT id, timestamp, note_name, action, details
        FROM kinetic_events
        WHERE timestamp LIKE ?
        ORDER BY timestamp ASC, id ASC
        """,
        (f"{target_date}%",),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows
