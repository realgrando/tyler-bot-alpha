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
import re
import sys
import json
import sqlite3
import datetime
from pathlib import Path

VAULT_DIR = _VAULT_DEFAULT
DB_PATH = str(_SKILL_ROOT / "state" / "vault_deep_graph.sqlite")

def parse_frontmatter(content):
    meta = {}
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_yaml = parts[1]
            body = parts[2]
            for line in raw_yaml.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k:
                        meta[k.lower()] = v
            return meta, body
    return meta, content

def extract_wikilinks(text):
    # Matches [[Target|Alias]] or [[Target]]
    pattern = r'\[\[(.*?)\]\]'
    raw_links = re.findall(pattern, text)
    clean_links = []
    for l in raw_links:
        target = l.split("|")[0].split("#")[0].strip()
        if target:
            clean_links.append(target)
    return clean_links

def extract_tags(meta, body):
    tags = set()
    # From meta
    for k in ["tags", "tag"]:
        if k in meta and meta[k]:
            val = meta[k]
            if val.startswith("[") and val.endswith("]"):
                val = val[1:-1]
            for t in val.split(","):
                t = t.strip().lstrip("#")
                if t: tags.add(t.lower())
    # Inline tags
    inline = re.findall(r'(?:^|\s)#([a-zA-Z0-9_\-\/]+)', body)
    for t in inline:
        tags.add(t.lower())
    return list(tags)

def extract_date(meta, filename, path, stat):
    # Try meta first
    for k in ["created", "date", "creation"]:
        if k in meta and meta[k]:
            v = meta[k]
            m = re.search(r'(\d{2})[-/](\d{2})[-/](\d{4})', v)
            if m:
                d, mo, y = m.groups()
                return f"{y}-{mo}-{d}", int(y)
            m_iso = re.search(r'(\d{4})[-/](\d{2})[-/](\d{2})', v)
            if m_iso:
                y, mo, d = m_iso.groups()
                return f"{y}-{mo}-{d}", int(y)

    # Try filename
    m = re.search(r'(\d{2})[-/](\d{2})[-/](\d{4})', filename)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{mo}-{d}", int(y)

    # Check path folders for year
    for yr in ["2026", "2025", "2024", "2023"]:
        if f"/{yr}/" in path or f"/{yr}-" in path or filename.startswith(f"{yr}"):
            # Fallback to mtime/ctime with that year
            dt = datetime.datetime.fromtimestamp(stat.st_mtime)
            return f"{yr}-{dt.strftime('%m-%d')}", int(yr)

    dt = datetime.datetime.fromtimestamp(stat.st_mtime)
    return dt.strftime("%Y-%m-%d"), dt.year

def categorize_path(path):
    p = path.lower()
    if "/central/profissional" in p:
        return "Profissional"
    elif "/central/study/technology" in p or "/central/study/college" in p:
        return "Estudos_Tech"
    elif "/central/study/idiomes" in p:
        return "Estudos_Idiomas"
    elif "/central/study" in p:
        return "Estudos_Humanidades"
    elif "/central/pessoal/journal" in p or "/central/pessoal/cycles" in p or "/central/pessoal/targets" in p:
        return "Pessoal_Rotina"
    elif "/central/pessoal/thoughts" in p:
        return "Pessoal_Thoughts"
    elif "/central/pessoal/studio" in p:
        return "Studio_Aesthetic"
    elif "/central/pessoal" in p:
        return "Pessoal_Geral"
    elif "/central/agents" in p:
        return "Agents_Engine"
    elif "/central/configs" in p:
        return "Configs_Templates"
    return "Outros"

def main():
    print(f"Iniciando indexação profunda do Vault: {VAULT_DIR}...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("DROP TABLE IF EXISTS notes")
    c.execute("DROP TABLE IF EXISTS links")
    c.execute("DROP TABLE IF EXISTS tags")

    c.execute("""
    CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE,
        filename TEXT,
        rel_path TEXT,
        folder TEXT,
        category TEXT,
        year INTEGER,
        created_date TEXT,
        word_count INTEGER,
        class_name TEXT,
        status TEXT,
        summary TEXT
    )
    """)

    c.execute("""
    CREATE TABLE links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER,
        source_name TEXT,
        target_name TEXT
    )
    """)

    c.execute("""
    CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER,
        tag TEXT
    )
    """)

    count = 0
    t0 = datetime.datetime.now()

    for root, dirs, files in os.walk(VAULT_DIR):
        if ".trash" in root or ".git" in root:
            continue
        for f in files:
            if not f.endswith(".md"):
                continue

            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, VAULT_DIR)
            folder = os.path.dirname(rel_path)

            try:
                stat = os.stat(full_path)
                with open(full_path, "r", encoding="utf-8", errors="ignore") as fp:
                    content = fp.read()

                meta, body = parse_frontmatter(content)
                created_date, year = extract_date(meta, f, full_path, stat)
                category = categorize_path(full_path)
                words = len(body.split())
                class_name = meta.get("class", "")
                status = meta.get("status", "")

                # Clean summary: first meaningful line
                summary = ""
                for line in body.splitlines():
                    cleaned = line.strip().lstrip("#").strip()
                    if cleaned and not cleaned.startswith("```") and not cleaned.startswith("---") and not cleaned.startswith("📁") and len(cleaned) > 20:
                        summary = cleaned[:250]
                        break

                c.execute("""
                INSERT INTO notes (path, filename, rel_path, folder, category, year, created_date, word_count, class_name, status, summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (full_path, f.replace(".md", ""), rel_path, folder, category, year, created_date, words, class_name, status, summary))
                
                note_id = c.lastrowid

                # Tags
                note_tags = extract_tags(meta, body)
                for t in note_tags:
                    c.execute("INSERT INTO tags (note_id, tag) VALUES (?, ?)", (note_id, t))

                # Links
                links = extract_wikilinks(content)
                for l in links:
                    c.execute("INSERT INTO links (source_id, source_name, target_name) VALUES (?, ?, ?)", (note_id, f.replace(".md", ""), l))

                count += 1
            except Exception as e:
                pass

    conn.commit()

    # Indexes
    c.execute("CREATE INDEX idx_notes_year ON notes(year)")
    c.execute("CREATE INDEX idx_notes_cat ON notes(category)")
    c.execute("CREATE INDEX idx_links_target ON links(target_name)")
    c.execute("CREATE INDEX idx_tags_tag ON tags(tag)")
    conn.commit()

    print(f"Sucesso! {count} notas indexadas em {(datetime.datetime.now() - t0).total_seconds():.2f}s no SQLite: {DB_PATH}")

    # Summary by Year
    c.execute("SELECT year, count(*), sum(word_count) FROM notes WHERE year >= 2022 GROUP BY year ORDER BY year")
    print("\nEvolução Temporal das Notas (Ano a Ano):")
    for row in c.fetchall():
        print(f"  - Ano {row[0]}: {row[1]} notas | {row[2]:,} palavras")

    # Summary by Category
    c.execute("SELECT category, count(*) FROM notes GROUP BY category ORDER BY count(*) DESC")
    print("\nDistribuição por Pilares Ativos:")
    for row in c.fetchall():
        print(f"  - {row[0]:22}: {row[1]} notas")

    conn.close()

if __name__ == "__main__":
    main()
