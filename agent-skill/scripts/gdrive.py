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
import io
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaFileUpload

SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive'
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
        service = build('drive', 'v3', credentials=creds)
        return service, None
    except Exception as e:
        return None, str(e)

def cmd_status(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        about = service.about().get(fields="user,storageQuota").execute()
        user_info = about.get("user", {})
        quota = about.get("storageQuota", {})
        print(json.dumps({
            "status": "connected",
            "displayName": user_info.get("displayName"),
            "emailAddress": user_info.get("emailAddress"),
            "storageUsage": quota.get("usage"),
            "storageLimit": quota.get("limit")
        }, indent=2, ensure_ascii=False))
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
        query = "trashed = false"
        if args.folder:
            query += f" and '{args.folder}' in parents"
        results = service.files().list(
            q=query,
            pageSize=args.limit,
            fields="files(id, name, mimeType, modifiedTime, webViewLink, size)",
            orderBy="modifiedTime desc"
        ).execute()

        files = results.get('files', [])
        print(json.dumps({
            "status": "success",
            "count": len(files),
            "files": files
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
    try:
        query = f"trashed = false and name contains '{args.query}'"
        results = service.files().list(
            q=query,
            pageSize=args.limit,
            fields="files(id, name, mimeType, modifiedTime, webViewLink, size)",
            orderBy="modifiedTime desc"
        ).execute()

        files = results.get('files', [])
        print(json.dumps({
            "status": "success",
            "query": args.query,
            "count": len(files),
            "files": files
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_download(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    try:
        file_meta = service.files().get(fileId=args.file_id, fields="name,mimeType").execute()
        mime = file_meta.get("mimeType", "")
        name = file_meta.get("name", "downloaded_file")
        out_path = args.out or os.path.join(os.getcwd(), name)

        if "application/vnd.google-apps.document" in mime:
            request = service.files().export_media(fileId=args.file_id, mimeType="text/markdown")
            if not out_path.endswith(".md"):
                out_path += ".md"
        elif "application/vnd.google-apps.spreadsheet" in mime:
            request = service.files().export_media(fileId=args.file_id, mimeType="text/csv")
            if not out_path.endswith(".csv"):
                out_path += ".csv"
        else:
            request = service.files().get_media(fileId=args.file_id)

        fh = io.FileIO(out_path, 'wb')
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()

        print(json.dumps({
            "status": "downloaded",
            "file_id": args.file_id,
            "name": name,
            "saved_to": out_path
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def cmd_upload(args):
    service, err = get_service()
    if err:
        print(json.dumps({"status": "error", "message": err}, indent=2, ensure_ascii=False))
        return 1
    if not os.path.exists(args.file):
        print(json.dumps({"status": "error", "message": f"Arquivo não encontrado: {args.file}"}, indent=2, ensure_ascii=False))
        return 1
    try:
        name = args.name or os.path.basename(args.file)
        file_metadata = {'name': name}
        if args.folder:
            file_metadata['parents'] = [args.folder]
        media = MediaFileUpload(args.file, resumable=True)
        uploaded = service.files().create(body=file_metadata, media_body=media, fields='id,name,webViewLink').execute()
        print(json.dumps({
            "status": "uploaded",
            "file_id": uploaded.get("id"),
            "name": uploaded.get("name"),
            "webViewLink": uploaded.get("webViewLink")
        }, indent=2, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, indent=2, ensure_ascii=False))
        return 1

def main():
    parser = argparse.ArgumentParser(description="Google Drive CLI for Tyler")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("status", help="Verifica status de autenticação")

    list_p = subparsers.add_parser("list", help="Lista arquivos do Drive")
    list_p.add_argument("--limit", type=int, default=15, help="Quantidade máxima de arquivos")
    list_p.add_argument("--folder", type=str, help="ID da pasta pai")

    search_p = subparsers.add_parser("search", help="Busca arquivos por nome")
    search_p.add_argument("query", type=str, help="Nome ou termo de busca")
    search_p.add_argument("--limit", type=int, default=15, help="Quantidade máxima")

    down_p = subparsers.add_parser("download", help="Baixa um arquivo pelo ID")
    down_p.add_argument("file_id", type=str, help="ID do arquivo no Google Drive")
    down_p.add_argument("--out", type=str, help="Caminho local de destino")

    up_p = subparsers.add_parser("upload", help="Faz upload de arquivo para o Drive")
    up_p.add_argument("file", type=str, help="Caminho do arquivo local")
    up_p.add_argument("--name", type=str, help="Nome do arquivo no Drive")
    up_p.add_argument("--folder", type=str, help="ID da pasta destino no Drive")

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
    elif args.command == "download":
        return cmd_download(args)
    elif args.command == "upload":
        return cmd_upload(args)

if __name__ == "__main__":
    sys.exit(main() or 0)
