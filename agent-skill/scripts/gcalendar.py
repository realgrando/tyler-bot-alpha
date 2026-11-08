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
from datetime import datetime, timedelta, timezone
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
                return None, f"Arquivo de credenciais não encontrado em: {CREDS_PATH}"
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
        service = build('calendar', 'v3', credentials=creds)
        return service, None
    except Exception as e:
        return None, str(e)

def cmd_auth(args):
    creds, err = get_credentials()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    print(json.dumps({"status": "authenticated", "token_path": TOKEN_PATH}, indent=2, ensure_ascii=False))
    return 0

def cmd_status(args):
    if not os.path.exists(CREDS_PATH):
        print(json.dumps({
            "status": "missing_credentials",
            "message": f"Coloque o arquivo credentials.json em {CREDS_PATH}",
            "creds_path": CREDS_PATH
        }, indent=2, ensure_ascii=False))
        return 1

    if not os.path.exists(TOKEN_PATH):
        print(json.dumps({
            "status": "pending_auth",
            "message": "credentials.json encontrado. Execute 'gcalendar.py auth' para fazer login.",
            "token_path": TOKEN_PATH
        }, indent=2, ensure_ascii=False))
        return 1

    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1

    try:
        cal = service.calendars().get(calendarId='primary').execute()
        print(json.dumps({
            "status": "connected",
            "summary": cal.get("summary"),
            "id": cal.get("id"),
            "timeZone": cal.get("timeZone")
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def get_user_calendars(service):
    try:
        res = service.calendarList().list().execute()
        return res.get('items', [])
    except Exception:
        return [{'id': 'primary', 'summary': 'Principal'}]

def cmd_list(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1

    # Define range
    now = datetime.now().astimezone()
    if args.start:
        start_dt = datetime.fromisoformat(args.start).astimezone()
    else:
        start_dt = now

    if args.end:
        end_dt = datetime.fromisoformat(args.end).astimezone()
    else:
        end_dt = start_dt + timedelta(days=args.days)

    try:
        calendars = get_user_calendars(service)
        formatted = []
        holidays_detected = []
        seen_keys = set()
        today_str = now.strftime('%Y-%m-%d')

        for cal in calendars:
            cid = cal.get('id')
            csummary = cal.get('summary', 'Principal')
            is_hol = 'holiday' in cid.lower() or 'feriado' in csummary.lower()

            try:
                events_result = service.events().list(
                    calendarId=cid,
                    timeMin=start_dt.isoformat(),
                    timeMax=end_dt.isoformat(),
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
            except Exception:
                continue

            for item in events_result.get('items', []):
                start = item.get('start', {}).get('dateTime', item.get('start', {}).get('date'))
                end = item.get('end', {}).get('dateTime', item.get('end', {}).get('date'))
                summary = item.get("summary", "(Sem título)")
                
                # Chave de desduplicação (resumo + data de início)
                dedup_key = (summary.strip().lower(), str(start)[:10])
                if dedup_key in seen_keys:
                    continue
                seen_keys.add(dedup_key)

                if is_hol and summary not in holidays_detected:
                    holidays_detected.append(summary)

                meet_link = item.get('hangoutLink') or (item.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri'))
                formatted.append({
                    "id": item.get("id"),
                    "calendar": csummary,
                    "is_holiday": is_hol,
                    "summary": summary,
                    "start": start,
                    "end": end,
                    "description": item.get("description", ""),
                    "location": item.get("location", ""),
                    "meetLink": meet_link,
                    "htmlLink": item.get("htmlLink")
                })

        # Ordenar por data de início
        formatted.sort(key=lambda x: str(x.get('start', '')))

        is_holiday_today = any(
            h.get('is_holiday') and str(h.get('start', ''))[:10] <= today_str <= str(h.get('end', ''))[:10]
            for h in formatted
        )

        print(json.dumps({
            "status": "success",
            "count": len(formatted),
            "holidays": holidays_detected,
            "is_holiday_today": is_holiday_today,
            "range": {"from": start_dt.isoformat(), "to": end_dt.isoformat()},
            "events": formatted
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_search(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1

    now = datetime.now().astimezone()
    start_dt = now - timedelta(days=args.past_days)
    end_dt = now + timedelta(days=args.future_days)

    try:
        events_result = service.events().list(
            calendarId='primary',
            q=args.query,
            timeMin=start_dt.isoformat(),
            timeMax=end_dt.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        items = events_result.get('items', [])
        formatted = []
        for item in items:
            start = item.get('start', {}).get('dateTime', item.get('start', {}).get('date'))
            end = item.get('end', {}).get('dateTime', item.get('end', {}).get('date'))
            meet_link = item.get('hangoutLink') or (item.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri'))
            formatted.append({
                "id": item.get("id"),
                "summary": item.get("summary", "(Sem título)"),
                "start": start,
                "end": end,
                "description": item.get("description", ""),
                "location": item.get("location", ""),
                "meetLink": meet_link,
                "htmlLink": item.get("htmlLink")
            })

        print(json.dumps({
            "status": "success",
            "query": args.query,
            "count": len(formatted),
            "events": formatted
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_add(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1

    # Date and time parsing
    start_str = f"{args.date}T{args.time}:00"
    try:
        # local tz
        local_tz = datetime.now().astimezone().tzinfo
        start_dt = datetime.strptime(start_str, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=local_tz)
        end_dt = start_dt + timedelta(minutes=args.duration)
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Erro de data/hora: {e}"}, indent=2, ensure_ascii=False))
        return 1

    event_body = {
        'summary': args.summary,
        'description': args.description or '',
        'start': {
            'dateTime': start_dt.isoformat(),
            'timeZone': str(local_tz),
        },
        'end': {
            'dateTime': end_dt.isoformat(),
            'timeZone': str(local_tz),
        },
    }

    if args.location:
        event_body['location'] = args.location

    if args.meet:
        event_body['conferenceData'] = {
            'createRequest': {
                'requestId': f"req-{int(datetime.now().timestamp())}",
                'conferenceSolutionKey': {'type': 'hangoutsMeet'}
            }
        }

    try:
        created = service.events().insert(
            calendarId='primary',
            body=event_body,
            conferenceDataVersion=1 if args.meet else 0
        ).execute()

        meet_link = created.get('hangoutLink') or (created.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri'))
        print(json.dumps({
            "status": "created",
            "id": created.get("id"),
            "summary": created.get("summary"),
            "start": created.get("start", {}).get("dateTime"),
            "end": created.get("end", {}).get("dateTime"),
            "meetLink": meet_link,
            "htmlLink": created.get("htmlLink")
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def main():
    parser = argparse.ArgumentParser(description="Google Calendar CLI for Tyler")
    subparsers = parser.add_subparsers(dest="command")

    # Auth
    subparsers.add_parser("auth", help="Inicia o fluxo OAuth no navegador")
    
    # Status
    subparsers.add_parser("status", help="Verifica o status de autenticação")

    # List
    list_p = subparsers.add_parser("list", help="Lista eventos da agenda")
    list_p.add_argument("--days", type=int, default=7, help="Dias à frente (default 7)")
    list_p.add_argument("--start", type=str, help="Data inicial ISO (ex: 2026-10-21)")
    list_p.add_argument("--end", type=str, help="Data final ISO")

    # Search
    search_p = subparsers.add_parser("search", help="Busca eventos por texto")
    search_p.add_argument("query", type=str, help="Termo de busca")
    search_p.add_argument("--past-days", type=int, default=7, help="Dias passados")
    search_p.add_argument("--future-days", type=int, default=30, help="Dias futuros")

    # Add
    add_p = subparsers.add_parser("add", help="Cria um novo evento na agenda")
    add_p.add_argument("--summary", required=True, type=str, help="Título do evento")
    add_p.add_argument("--date", required=True, type=str, help="Data no formato YYYY-MM-DD")
    add_p.add_argument("--time", required=True, type=str, help="Horário inicial no formato HH:MM")
    add_p.add_argument("--duration", type=int, default=60, help="Duração em minutos (default 60)")
    add_p.add_argument("--description", type=str, default="", help="Descrição do evento")
    add_p.add_argument("--location", type=str, default="", help="Local do evento")
    add_p.add_argument("--meet", action="store_true", help="Gera link do Google Meet")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return 0

    if args.command == "auth":
        return cmd_auth(args)
    elif args.command == "status":
        return cmd_status(args)
    elif args.command == "list":
        return cmd_list(args)
    elif args.command == "search":
        return cmd_search(args)
    elif args.command == "add":
        return cmd_add(args)

if __name__ == "__main__":
    sys.exit(main() or 0)
