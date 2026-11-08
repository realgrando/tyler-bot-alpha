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
from datetime import datetime, timezone
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/tasks'
]

CONFIG_DIR = os.path.expanduser('~/.config/google')
CREDS_PATH = os.path.join(CONFIG_DIR, 'credentials.json')
TOKEN_PATH = os.path.join(CONFIG_DIR, 'token.json')

def get_credentials():
    creds = None
    if os.path.exists(TOKEN_PATH):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        except Exception as e:
            print(f"[Aviso] Token inválido: {e}", file=sys.stderr)
            creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(TOKEN_PATH, 'w', encoding='utf-8') as token_file:
                    token_file.write(creds.to_json())
            except Exception as e:
                print(f"[Aviso] Falha ao renovar token: {e}", file=sys.stderr)
                creds = None

        if not creds:
            if not os.path.exists(CREDS_PATH):
                return None, f"Arquivo credentials.json não encontrado em: {CREDS_PATH}"
            flow = InstalledAppFlow.from_client_secrets_file(CREDS_PATH, SCOPES)
            creds = flow.run_local_server(port=0, prompt='consent', access_type='offline')
            with open(TOKEN_PATH, 'w', encoding='utf-8') as token_file:
                token_file.write(creds.to_json())

    return creds, None

def get_service():
    creds, err = get_credentials()
    if err:
        return None, err
    try:
        service = build('tasks', 'v1', credentials=creds)
        return service, None
    except Exception as e:
        return None, str(e)

def cmd_status(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        tasklists = service.tasklists().list(maxResults=5).execute().get('items', [])
        print(json.dumps({
            "status": "connected",
            "tasklistsCount": len(tasklists),
            "primaryList": tasklists[0].get('title') if tasklists else "None"
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_lists(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        results = service.tasklists().list().execute()
        items = results.get('items', [])
        print(json.dumps({"status": "success", "tasklists": items}, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_list(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        list_id = args.tasklist or '@default'
        results = service.tasks().list(
            tasklist=list_id,
            showCompleted=args.all,
            showHidden=args.all,
            maxResults=args.limit
        ).execute()
        items = results.get('items', [])
        formatted = []
        for t in items:
            formatted.append({
                "id": t.get('id'),
                "title": t.get('title'),
                "status": t.get('status'),
                "due": t.get('due'),
                "notes": t.get('notes', ''),
                "updated": t.get('updated')
            })
        print(json.dumps({"status": "success", "count": len(formatted), "tasks": formatted}, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_add(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        list_id = args.tasklist or '@default'
        body = {'title': args.title}
        if args.notes:
            body['notes'] = args.notes
        if args.due:
            # Format YYYY-MM-DD to RFC3339
            body['due'] = f"{args.due}T23:59:59Z"

        created = service.tasks().insert(tasklist=list_id, body=body).execute()
        print(json.dumps({
            "status": "created",
            "id": created.get('id'),
            "title": created.get('title'),
            "due": created.get('due'),
            "status": created.get('status')
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_complete(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        list_id = args.tasklist or '@default'
        task = service.tasks().get(tasklist=list_id, task=args.task_id).execute()
        task['status'] = 'completed'
        updated = service.tasks().update(tasklist=list_id, task=args.task_id, body=task).execute()
        print(json.dumps({
            "status": "completed",
            "id": updated.get('id'),
            "title": updated.get('title')
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def main():
    parser = argparse.ArgumentParser(description="Google Tasks CLI for Tyler")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("status", help="Verifica status de autenticação")
    subparsers.add_parser("lists", help="Lista as listas de tarefas")

    list_p = subparsers.add_parser("list", help="Lista tarefas")
    list_p.add_argument("--tasklist", type=str, help="ID da lista (default: @default)")
    list_p.add_argument("--limit", type=int, default=20, help="Quantidade máxima")
    list_p.add_argument("--all", action="store_true", help="Inclui tarefas já concluídas")

    add_p = subparsers.add_parser("add", help="Cria uma nova tarefa")
    add_p.add_argument("--title", required=True, type=str, help="Título da tarefa")
    add_p.add_argument("--notes", type=str, help="Notas / descrição")
    add_p.add_argument("--due", type=str, help="Data limite no formato YYYY-MM-DD")
    add_p.add_argument("--tasklist", type=str, help="ID da lista")

    comp_p = subparsers.add_parser("complete", help="Marca uma tarefa como concluída")
    comp_p.add_argument("task_id", type=str, help="ID da tarefa")
    comp_p.add_argument("--tasklist", type=str, help="ID da lista")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return 0

    if args.command == "status":
        return cmd_status(args)
    elif args.command == "lists":
        return cmd_lists(args)
    elif args.command == "list":
        return cmd_list(args)
    elif args.command == "add":
        return cmd_add(args)
    elif args.command == "complete":
        return cmd_complete(args)

if __name__ == "__main__":
    sys.exit(main() or 0)
