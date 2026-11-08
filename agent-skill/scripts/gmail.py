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
import base64
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
        service = build('gmail', 'v1', credentials=creds)
        return service, None
    except Exception as e:
        return None, str(e)

def cmd_status(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        profile = service.users().getProfile(userId='me').execute()
        print(json.dumps({
            "status": "connected",
            "emailAddress": profile.get("emailAddress"),
            "messagesTotal": profile.get("messagesTotal"),
            "threadsTotal": profile.get("threadsTotal")
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def parse_header(headers, name):
    for h in headers:
        if h.get('name', '').lower() == name.lower():
            return h.get('value', '')
    return ''

def cmd_list(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        q = args.query if args.query else "is:unread"
        results = service.users().messages().list(userId='me', q=q, maxResults=args.limit).execute()
        messages = results.get('messages', [])

        items = []
        for m in messages:
            msg = service.users().messages().get(userId='me', id=m['id'], format='metadata', metadataHeaders=['From', 'Subject', 'Date']).execute()
            headers = msg.get('payload', {}).get('headers', [])
            items.append({
                "id": m['id'],
                "threadId": m.get('threadId'),
                "from": parse_header(headers, 'From'),
                "subject": parse_header(headers, 'Subject'),
                "date": parse_header(headers, 'Date'),
                "snippet": msg.get('snippet', '')
            })

        print(json.dumps({
            "status": "success",
            "query": q,
            "count": len(items),
            "messages": items
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_search(args):
    args.query = args.search_term
    return cmd_list(args)

def cmd_read(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        msg = service.users().messages().get(userId='me', id=args.message_id, format='full').execute()
        headers = msg.get('payload', {}).get('headers', [])

        def get_body(payload):
            body_data = ""
            if 'parts' in payload:
                for part in payload['parts']:
                    if part.get('mimeType') == 'text/plain':
                        data = part.get('body', {}).get('data', '')
                        if data:
                            body_data += base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
                    elif 'parts' in part:
                        body_data += get_body(part)
            else:
                data = payload.get('body', {}).get('data', '')
                if data:
                    body_data = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
            return body_data

        body = get_body(msg.get('payload', {}))
        print(json.dumps({
            "status": "success",
            "id": args.message_id,
            "from": parse_header(headers, 'From'),
            "subject": parse_header(headers, 'Subject'),
            "date": parse_header(headers, 'Date'),
            "snippet": msg.get('snippet', ''),
            "body": body
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def main():
    parser = argparse.ArgumentParser(description="Gmail CLI for Tyler")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("status", help="Verifica status de autenticação")

    list_p = subparsers.add_parser("list", help="Lista e-mails recentes")
    list_p.add_argument("--query", type=str, default="is:unread", help="Filtro de busca (default: is:unread)")
    list_p.add_argument("--limit", type=int, default=10, help="Quantidade máxima")

    search_p = subparsers.add_parser("search", help="Busca e-mails por termo")
    search_p.add_argument("search_term", type=str, help="Termo de busca (ex: project, client, from:...)")
    search_p.add_argument("--limit", type=int, default=10, help="Quantidade máxima")

    read_p = subparsers.add_parser("read", help="Lê o corpo completo de um e-mail")
    read_p.add_argument("message_id", type=str, help="ID da mensagem")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return 0

    if args.command == "status":
        return cmd_status(args)
    elif args.command == "list":
        return cmd_list(args)
    elif args.command == "search":
        return cmd_search(args)
    elif args.command == "read":
        return cmd_read(args)

if __name__ == "__main__":
    sys.exit(main() or 0)
