#!/usr/bin/env python3
"""
core/cli.py — Interface de Linha de Comando Determinística (~/.local/bin/tyler-core)
====================================================================================
Expondo os subcomandos oficiais do T.Y.L.E.R MARK II (Kernel v5.0):
  1. tyler-core boot [--quiet]
  2. tyler-core ingest --cat <cat> --summary "<texto>" [--set key=val ...] [--wake "[[Nota1]],[[Nota2]]"]
  3. tyler-core note <create|update|progress|validate> ...
  4. tyler-core status
  5. tyler-core shutdown
  6. tyler-core weather-sync
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# Garante import relativo e absoluto independente de como o script for invocado
SKILL_DIR = Path(__file__).resolve().parent.parent
if str(SKILL_DIR) not in sys.path:
    sys.path.insert(0, str(SKILL_DIR))

from core.config import VALID_EVENT_CATEGORIES, get_daily_path  # noqa: E402
from core.db import (  # noqa: E402
    get_day_events,
    get_kinetic_events_for_date,
    get_weather_log,
    init_db,
    record_day_event,
)
from core.integrations import (  # noqa: E402
    apply_daily_set_args,
    audit_daily_empty_fields,
    check_anki_status,
    ensure_daily_note,
    fetch_external_boot_context,
    get_active_cycle_info,
    sync_weather,
)
from core.kinetic_bridge import (  # noqa: E402
    build_vault_note_index,
    clean_wikilink,
    find_note_path,
    run_kinetic_engine_tick,
    wake_note_and_ancestors,
)
from core.vault_crud import (  # noqa: E402
    create_note,
    update_note,
    update_progress,
    validate_note_file,
)


def cmd_boot(args: argparse.Namespace) -> int:
    """Executa o boot completo da sessão/manhã e imprime o Pacote Único de Contexto."""
    t0 = time.perf_counter()
    init_db()
    daily_res = ensure_daily_note()
    weather_res = sync_weather(inject_daily=True)
    kinetic_res = run_kinetic_engine_tick(dry_run=False)

    if getattr(args, "quiet", False):
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
        print(
            f"[tyler-core boot --quiet] Daily={daily_res['path']} | "
            f"Weather={weather_res.get('telemetry', {}).get('env_weather')} | "
            f"Kinetic={kinetic_res.get('status')} ({elapsed_ms}ms)"
        )
        return 0

    cycle_info = get_active_cycle_info()
    events_today = get_day_events()
    anki_info = check_anki_status()
    ext_ctx = fetch_external_boot_context()
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    payload = {
        "command": "tyler-core boot",
        "elapsed_ms": elapsed_ms,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "daily_note": daily_res,
        "weather": weather_res.get("telemetry", {}),
        "active_cycle": cycle_info,
        "kinetic_engine": kinetic_res,
        "anki_status": {
            "cards_reviewed_today": anki_info["cards_reviewed_today"],
            "due_cards_total": anki_info["due_cards_total"],
            "streak_alert": anki_info["streak_alert"],
        },
        "day_events_count": len(events_today),
        "day_events": events_today,
        "git_commits_today": ext_ctx["git_commits_today"],
        "calendar_today": ext_ctx["calendar_today"],
        "tasks_pending": ext_ctx["tasks_pending"],
        "telemetry_predict": ext_ctx["telemetry_predict"],
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


def cmd_weather_sync(args: argparse.Namespace) -> int:
    """Sincroniza apenas o clima de Localidade do Usuário na Daily de hoje e no SQLite."""
    init_db()
    ensure_daily_note()
    res = sync_weather(inject_daily=True)
    print(json.dumps(res, indent=2, ensure_ascii=False))
    return 0 if res.get("status") == "ok" else 1


def cmd_status(args: argparse.Namespace) -> int:
    """Comando ultrarrápido (<30ms) para hidratação de meio de dia a partir do SQLite local."""
    t0 = time.perf_counter()
    init_db()
    today_iso = datetime.now().strftime("%Y-%m-%d")
    daily_path = get_daily_path()
    events_today = get_day_events(today_iso)
    weather_today = get_weather_log(today_iso)
    kinetic_today = get_kinetic_events_for_date(today_iso)
    cycle_info = get_active_cycle_info()
    audit_info = audit_daily_empty_fields() if daily_path.exists() else {}
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    payload = {
        "command": "tyler-core status",
        "elapsed_ms": elapsed_ms,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "daily_path": str(daily_path),
        "daily_exists": daily_path.exists(),
        "active_cycle": cycle_info,
        "weather_cached": weather_today,
        "day_events_count": len(events_today),
        "day_events": events_today,
        "kinetic_touched_today": kinetic_today,
        "daily_filled_fields": audit_info.get("filled_sample", {}),
        "daily_missing_count": audit_info.get("total_missing", 0),
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


def cmd_ingest(args: argparse.Namespace) -> int:
    """
    Registra um fato conversacional no SQLite (day_events), espelha no today_stream.md,
    aplica mutações --set na Daily de hoje e executa Auto-Wake (--wake) nas notas citadas.
    """
    init_db()
    set_pairs: List[str] = args.set or []
    daily_update_res: Dict[str, Any] = {}
    if set_pairs:
        daily_update_res = apply_daily_set_args(set_pairs)

    woken_all: List[str] = []
    if args.wake:
        idx = build_vault_note_index()
        raw_items: List[str] = []
        for w_arg in args.wake:
            raw_items.extend([x.strip() for x in w_arg.split(",") if x.strip()])
        for item in raw_items:
            npath = find_note_path(item, idx)
            if npath:
                w = wake_note_and_ancestors(npath, increment_parent_current=False, index=idx)
                for entity in w:
                    if entity not in woken_all:
                        woken_all.append(entity)
            else:
                woken_all.append(f"NOT_FOUND:{clean_wikilink(item)}")

    metrics_delta = daily_update_res.get("updated_fields", {})
    ev_id = record_day_event(
        category=args.cat,
        summary=args.summary,
        metrics_delta=metrics_delta,
        entities_woken=woken_all,
        mirror_stream=True,
    )

    out = {
        "status": "ingested",
        "event_id": ev_id,
        "category": args.cat,
        "summary": args.summary,
        "daily_fields_updated": metrics_delta,
        "entities_woken": woken_all,
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


def cmd_note(args: argparse.Namespace) -> int:
    """Subcomandos do Gatekeeper 3NF: create | update | progress | validate."""
    init_db()
    sub = args.note_action
    pow_mode = not getattr(args, "preserve_time", False)

    if sub == "create":
        props: Dict[str, Any] = {}
        if args.props:
            try:
                props = json.loads(args.props)
            except Exception as exc:
                print(json.dumps({"status": "error", "message": f"JSON inválido em --props: {exc}"}, ensure_ascii=False))
                return 1

        body_str = args.body or ""
        if args.body_file:
            bf = Path(args.body_file)
            if bf.exists():
                body_str = bf.read_text(encoding="utf-8")

        res = create_note(
            class_name=args.note_class,
            title=args.title,
            parent=args.parent,
            props=props,
            body_text=body_str,
            pow_mode=pow_mode,
        )
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0 if res.get("status") == "created" else 1

    if sub == "update":
        props = {}
        if args.props:
            try:
                props = json.loads(args.props)
            except Exception as exc:
                print(json.dumps({"status": "error", "message": f"JSON inválido em --props: {exc}"}, ensure_ascii=False))
                return 1

        append_str = args.append_body
        if getattr(args, "append_body_file", None):
            abf = Path(args.append_body_file)
            if abf.exists():
                append_str = abf.read_text(encoding="utf-8")

        res = update_note(
            note_ref=args.target,
            props=props,
            append_body=append_str,
            pow_mode=pow_mode,
        )
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0 if res.get("status") == "updated" else 1

    if sub == "progress":
        res = update_progress(
            note_ref=args.target,
            add_delta=args.add,
            set_value=args.set_val,
            pow_mode=pow_mode,
        )
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0 if res.get("status") in ("in_progress", "done") else 1

    if sub == "validate":
        res = validate_note_file(
            note_ref=args.target,
            fix_formatting=args.fix,
            preserve_time=not getattr(args, "pow", False),
        )
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0 if res.get("valid") else 1

    return 1


def cmd_shutdown(args: argparse.Namespace) -> int:
    """
    Máquina de estados determinística do Fechamento Noturno:
    1. Sincroniza o clima final (sync_weather).
    2. Audita os 85 campos da Daily de hoje e separa CAMPOS_VAZIOS_OBRIGATORIOS.
    3. Checa o status do Anki (ANKI_STATUS).
    4. Lista a TIMELINE_DO_DIA completa do SQLite e as notas KINETIC_TOUCHED hoje.
    """
    t0 = time.perf_counter()
    init_db()
    ensure_daily_note()
    weather_res = sync_weather(inject_daily=True)
    audit_res = audit_daily_empty_fields()
    anki_res = check_anki_status()
    timeline = get_day_events()
    kinetic_touched = get_kinetic_events_for_date()
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    payload = {
        "command": "tyler-core shutdown",
        "elapsed_ms": elapsed_ms,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "daily_path": audit_res["daily_path"],
        "WEATHER_FINAL": weather_res.get("telemetry", {}),
        "ANKI_STATUS": anki_res,
        "CAMPOS_VAZIOS_OBRIGATORIOS": audit_res["missing_by_group"],
        "TOTAL_CAMPOS_VAZIOS": audit_res["total_missing"],
        "CAMPOS_JA_PREENCHIDOS": audit_res["filled_sample"],
        "TIMELINE_DO_DIA": timeline,
        "KINETIC_TOUCHED": kinetic_touched,
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0




def cmd_init_user(args: argparse.Namespace) -> int:
    """Configura o perfil do usuário na primeira inicialização (Protocolo Gênese)."""
    from .config import load_user_config, save_user_config
    cfg = load_user_config()
    if args.name:
        cfg["user_name"] = args.name
    if args.nickname:
        cfg["user_nickname"] = args.nickname
    if args.agent_name:
        cfg["agent_name"] = args.agent_name
    if args.tone:
        cfg["agent_tone"] = args.tone
    if args.city:
        cfg["city"] = args.city
    if args.lat is not None:
        cfg["lat"] = args.lat
    if args.lon is not None:
        cfg["lon"] = args.lon
    if args.timezone:
        cfg["timezone"] = args.timezone
    if args.vault_path:
        cfg["vault_path"] = args.vault_path
    cfg["onboarding_completed"] = True
    save_user_config(cfg)
    print(json.dumps({"status": "user_initialized", "config": cfg}, indent=2, ensure_ascii=False))
    return 0

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="tyler-core",
        description="T.Y.L.E.R MARK II (Kernel v5.0) — Espinha Dorsal Determinística",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # 1. boot
    p_boot = sub.add_parser("boot", help="Inicializa a Daily de hoje, sincroniza clima, roda tick cinético e retorna contexto")
    p_boot.add_argument("--quiet", action="store_true", help="Execução silenciosa para systemd timer")

    # 2. ingest
    p_ing = sub.add_parser("ingest", help="Registra fato conversacional no SQLite, today_stream e YAML da Daily")
    p_ing.add_argument("--cat", required=True, choices=VALID_EVENT_CATEGORIES, help="Categoria do evento")
    p_ing.add_argument("--summary", required=True, help="Resumo factual do evento relatado pelo Gu")
    p_ing.add_argument("--set", nargs="*", help="Pares key=val ou key=+N para atualizar o YAML da Daily de hoje")
    p_ing.add_argument("--wake", action="append", help="Nota(s) para Auto-Wake (ex: '[[Core Project v1]],[[Main Venture]]')")

    # 3. note
    p_note = sub.add_parser("note", help="Gatekeeper 3NF de criação, edição, progresso e validação de notas")
    note_sub = p_note.add_subparsers(dest="note_action", required=True)

    # note create
    nc = note_sub.add_parser("create", help="Cria nova nota validando schema, 3NF e anti-setext")
    nc.add_argument("--class", dest="note_class", required=True, help="Nome da classe (ex: classZettel, classLiterature, classDoc)")
    nc.add_argument("--title", required=True, help="Título da nota")
    nc.add_argument("--parent", required=True, help="Parent 3NF (ex: '[[Software Engineering]]')")
    nc.add_argument("--props", type=str, help="JSON de propriedades extras (ex: '{\"Subtype\":\"atomic\"}')")
    nc.add_argument("--body", type=str, help="Texto do corpo da nota")
    nc.add_argument("--body-file", type=str, help="Caminho de arquivo contendo o corpo da nota")
    nc_clock = nc.add_mutually_exclusive_group()
    nc_clock.add_argument("--pow", action="store_true", default=True, help="Modo Proof-of-Work (aquece árvore pai)")
    nc_clock.add_argument("--preserve-time", action="store_true", help="Modo manutenção sem aquecer")

    # note update
    nu = note_sub.add_parser("update", help="Atualiza propriedades ou corpo de uma nota existente")
    nu.add_argument("target", help="Nome ou [[Wikilink]] ou caminho da nota")
    nu.add_argument("--props", type=str, help="JSON de propriedades a atualizar")
    nu.add_argument("--append-body", type=str, help="Texto a adicionar ao corpo da nota")
    nu.add_argument("--append-body-file", type=str, help="Arquivo com texto a adicionar ao corpo")
    nu_clock = nu.add_mutually_exclusive_group()
    nu_clock.add_argument("--pow", action="store_true", default=True, help="Modo Proof-of-Work (atualiza Updated/mtime e aquece)")
    nu_clock.add_argument("--preserve-time", action="store_true", help="Modo manutenção (preserva os.utime)")

    # note progress
    np = note_sub.add_parser("progress", help="Atualiza Current e Progress em Livros, Cursos, Metas ou Métricas")
    np.add_argument("target", help="Nome ou [[Wikilink]] da nota")
    np_grp = np.add_mutually_exclusive_group(required=True)
    np_grp.add_argument("--add", type=float, help="Valor a somar ao Current atual")
    np_grp.add_argument("--set", dest="set_val", type=float, help="Novo valor absoluto para Current")
    np_clock = np.add_mutually_exclusive_group()
    np_clock.add_argument("--pow", action="store_true", default=True, help="Modo Proof-of-Work")
    np_clock.add_argument("--preserve-time", action="store_true", help="Preserva os.utime")

    # note validate
    nv = note_sub.add_parser("validate", help="Valida frontmatter, enums, Parent 3NF e formatação Anti-Setext")
    nv.add_argument("target", help="Nome ou [[Wikilink]] ou caminho da nota")
    nv.add_argument("--fix", action="store_true", help="Corrige automaticamente delimitador YAML e Anti-Setext")
    nv_clock = nv.add_mutually_exclusive_group()
    nv_clock.add_argument("--preserve-time", action="store_true", default=True, help="Preserva os.utime ao corrigir")
    nv_clock.add_argument("--pow", action="store_true", help="Atualiza mtime ao corrigir")

    # 4. status
    sub.add_parser("status", help="Retorna estado instantâneo (<30ms) do dia no SQLite e Daily")

    # 5. shutdown
    sub.add_parser("shutdown", help="Máquina de estados do Fechamento Noturno (clima, Anki, campos vazios e timeline)")

    # 6. weather-sync
    sub.add_parser("weather-sync", help="Sincroniza os sensores meteorológicos env_* na Daily do dia")

    # 7. init-user
    p_init = sub.add_parser("init-user", help="Configura perfil de usuário no primeiro boot")
    p_init.add_argument("--name", help="Nome do usuário")
    p_init.add_argument("--nickname", help="Como o agente deve chamar o usuário")
    p_init.add_argument("--agent-name", help="Nome do agente (ex: Jarvis, Tyler, Atlas)")
    p_init.add_argument("--tone", choices=["direct_pragmatic", "socratic_mentor", "technical_architect"], help="Tom do agente")
    p_init.add_argument("--city", help="Cidade do usuário")
    p_init.add_argument("--lat", type=float, help="Latitude")
    p_init.add_argument("--lon", type=float, help="Longitude")
    p_init.add_argument("--timezone", help="Timezone IANA (ex: America/Sao_Paulo)")
    p_init.add_argument("--vault-path", help="Caminho absoluto do Vault")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "boot":
        return cmd_boot(args)
    if args.command == "ingest":
        return cmd_ingest(args)
    if args.command == "note":
        return cmd_note(args)
    if args.command == "status":
        return cmd_status(args)
    if args.command == "shutdown":
        return cmd_shutdown(args)
    if args.command == "weather-sync":
        return cmd_weather_sync(args)
    if args.command == "init-user":
        return cmd_init_user(args)
    return 1


if __name__ == "__main__":
    sys.exit(main())
