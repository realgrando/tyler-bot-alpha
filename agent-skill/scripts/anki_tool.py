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
import os
import sys
import json
import argparse
import urllib.request
import sqlite3

ANKI_CONNECT_URL = "http://localhost:8765"
DB_PATH = os.path.expanduser("~/.local/share/Anki2/Usuário 1/collection.anki2")

def invoke_anki_connect(action, **params):
    payload = json.dumps({"action": action, "version": 6, "params": params}).encode("utf-8")
    req = urllib.request.Request(ANKI_CONNECT_URL, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("error"):
                return None, data["error"]
            return data.get("result"), None
    except Exception as e:
        return None, str(e)

def is_anki_connect_online():
    res, err = invoke_anki_connect("version")
    return err is None and res == 6

def cmd_status(args):
    online = is_anki_connect_online()
    db_exists = os.path.exists(DB_PATH)
    
    result = {
        "anki_connect_online": online,
        "database_exists": db_exists,
        "database_path": DB_PATH
    }

    if online:
        decks, _ = invoke_anki_connect("deckNames")
        result["status"] = "connected_api"
        result["decks_count"] = len(decks) if decks else 0
        result["mode"] = "Anki-Connect (Live REST API)"
    elif db_exists:
        result["status"] = "connected_sqlite"
        result["mode"] = "Offline SQLite Direct Read"
    else:
        result["status"] = "not_found"

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0

def cmd_decks(args):
    if is_anki_connect_online():
        deck_names, err = invoke_anki_connect("deckNames")
        if err:
            print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
            return 1
        stats, _ = invoke_anki_connect("getDeckStats", decks=deck_names)
        formatted = []
        for name in deck_names:
            st = None
            if stats:
                for d_id, data in stats.items():
                    if data.get("name") == name:
                        st = data
                        break
            formatted.append({
                "name": name,
                "total": st.get("total_in_deck", 0) if st else 0,
                "due_review": st.get("review_count", 0) if st else 0,
                "new": st.get("new_count", 0) if st else 0
            })
        print(json.dumps({"status": "success", "count": len(formatted), "decks": formatted}, indent=2, ensure_ascii=False))
        return 0
    else:
        # Fallback to sqlite
        if not os.path.exists(DB_PATH):
            print(json.dumps({"status": "error", "message": "Banco de dados não encontrado"}, indent=2, ensure_ascii=False))
            return 1
        try:
            conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
            conn.create_collation("unicase", lambda a, b: (a.lower() > b.lower()) - (a.lower() < b.lower()))
            cursor = conn.cursor()
            
            # Card count per deck
            cursor.execute("SELECT did, count(*) FROM cards GROUP BY did")
            counts = dict(cursor.fetchall())
            
            cursor.execute("SELECT id, name FROM decks")
            decks = []
            for d_id, name in cursor.fetchall():
                clean_name = name.replace("\x1f", "::")
                decks.append({
                    "name": clean_name,
                    "total": counts.get(d_id, 0)
                })
            conn.close()
            print(json.dumps({"status": "success_sqlite", "count": len(decks), "decks": decks}, indent=2, ensure_ascii=False))
            return 0
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
            return 1

def cmd_add(args):
    if not is_anki_connect_online():
        print(json.dumps({
            "status": "error",
            "message": "O aplicativo Anki precisa estar aberto com o Anki-Connect para criar cards com segurança."
        }, indent=2, ensure_ascii=False))
        return 1

    model_name = args.model or "Básico"
    # Check available models
    models, _ = invoke_anki_connect("modelNames")
    if models and model_name not in models:
        # try Basic
        if "Basic" in models:
            model_name = "Basic"
        elif "Básico" in models:
            model_name = "Básico"
        else:
            model_name = models[0]

    # Get model field names
    fields_list, _ = invoke_anki_connect("modelFieldNames", modelName=model_name)
    front_field = fields_list[0] if fields_list else "Frente"
    back_field = fields_list[1] if len(fields_list) > 1 else "Verso"

    tags = [t.strip() for t in args.tags.split(",")] if args.tags else []

    note = {
        "deckName": args.deck,
        "modelName": model_name,
        "fields": {
            front_field: args.front,
            back_field: args.back
        },
        "tags": tags
    }

    note_id, err = invoke_anki_connect("addNote", note=note)
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1

    print(json.dumps({
        "status": "created",
        "note_id": note_id,
        "deck": args.deck,
        "front": args.front,
        "back": args.back,
        "tags": tags
    }, indent=2, ensure_ascii=False))
    return 0

def cmd_sync(args):
    if not is_anki_connect_online():
        print(json.dumps({"status": "error", "message": "Anki não está em execução."}, indent=2, ensure_ascii=False))
        return 1
    res, err = invoke_anki_connect("sync")
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    print(json.dumps({"status": "synced", "message": "Sincronização com o AnkiWeb concluída com sucesso."}, indent=2, ensure_ascii=False))
    return 0

def cmd_today(args):
    if is_anki_connect_online():
        # Get review stats via API
        card_ids, err = invoke_anki_connect("findCards", query="rated:1")
        count = len(card_ids) if card_ids else 0
        print(json.dumps({
            "status": "success",
            "cards_reviewed_today": count,
            "mode": "api"
        }, indent=2, ensure_ascii=False))
        return 0
    else:
        # Fallback to local SQLite read
        if not os.path.exists(DB_PATH):
            print(json.dumps({"status": "error", "message": "Banco de dados não encontrado."}, indent=2, ensure_ascii=False))
            return 1
        try:
            import datetime
            conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
            cursor = conn.cursor()
            today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_start_ms = int(today_start.timestamp() * 1000)
            cursor.execute("SELECT count(*) FROM revlog WHERE id >= ?", (today_start_ms,))
            count = cursor.fetchone()[0]
            conn.close()
            print(json.dumps({
                "status": "success",
                "cards_reviewed_today": count,
                "mode": "sqlite"
            }, indent=2, ensure_ascii=False))
            return 0
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
            return 1

def main():
    parser = argparse.ArgumentParser(description="Anki CLI for Tyler")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("status", help="Verifica conexão com o Anki")
    subparsers.add_parser("decks", help="Lista todos os decks e estatísticas")
    subparsers.add_parser("sync", help="Sincroniza com o AnkiWeb")
    subparsers.add_parser("today", help="Retorna quantos cards foram revisados hoje")

    add_p = subparsers.add_parser("add", help="Adiciona um novo card ao Anki")
    add_p.add_argument("--deck", required=True, type=str, help="Nome do deck (ex: Idiomes::Italiano)")
    add_p.add_argument("--front", required=True, type=str, help="Frente do card")
    add_p.add_argument("--back", required=True, type=str, help="Verso do card")
    add_p.add_argument("--tags", type=str, default="", help="Tags separadas por vírgula")
    add_p.add_argument("--model", type=str, help="Nome do modelo (opcional)")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return 0

    if args.command == "status":
        return cmd_status(args)
    elif args.command == "decks":
        return cmd_decks(args)
    elif args.command == "add":
        return cmd_add(args)
    elif args.command == "sync":
        return cmd_sync(args)
    elif args.command == "today":
        return cmd_today(args)

if __name__ == "__main__":
    sys.exit(main() or 0)
