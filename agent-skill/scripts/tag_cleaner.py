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
tag_cleaner.py - Ferramenta CLI Determinística de Saneamento de Tags do Obsidian Vault (Tyler v3.0)
Substitui tags legadas no corpo e no frontmatter YAML seguindo o Mapa Oficial de Migração.
"""

import argparse
import datetime
import json
import os
import re
import sys
from pathlib import Path

VAULT_ROOT = Path(_VAULT_DEFAULT)
TODAY_STREAM = Path(str(_SKILL_ROOT / "state" / "today_stream.md"))

EXCLUDE_DIRS = {".obsidian", ".git", ".trash", ".space", "Excalidraw"}
EXCLUDE_FILES = {
    "Agent - Tag Cleaner.md",
    "Agent - Vault Orchestrator.md",
    "sop_05_vault_hygiene.md",
    "vault_schema_map.md",
}

TAG_MAP = {
    "MACRO": {
        "pessoalnote": ["personal"],
        "personalpro": ["personal"],
        "pessoalarea": ["personal"],
        "faculdade": ["college", "software-engineer"],
        "activestudyarea": ["study"],
        "tasks": [],  # Remoção total
    },
    "PROJECTS": {
        "dropitarea": ["dropit"],
        "visionarea": ["visionboard"],
    },
    "TECH": {
        "programmingarea": ["programming"],
        "marketingarea": ["marketing"],
        "brandingarea": ["marketing"],
        "seoarea": ["marketing"],
        "trafegoarea": ["traffic"],
        "ads": ["traffic"],
        "cybersecarea": ["cybersecurity"],
        "editarea": ["audiovisual"],
        "photoarea": ["audiovisual"],
        "languagesarea": ["language"],
    },
    "BODY": {
        "martialarea": ["martial-arts"],
        "areasmma": ["martial-arts"],
        "seductionarea": ["seduction"],
        "persuasionarea": ["seduction"],
        "nutritionarea": ["nutrition"],
        "bodyarea": ["body"],
        "physioarea": ["body"],
        "psycharea": ["psychology"],
        "psicology": ["psychology"],
    },
    "PHILOSOPHY": {
        "religious": ["religion"],
        "catolicismo": ["catholicism"],
        "filosofia": ["philosophy"],
    },
}


def build_active_map(category: str) -> dict:
    if category == "ALL":
        merged = {}
        for cat_dict in TAG_MAP.values():
            merged.update(cat_dict)
        return merged
    return TAG_MAP.get(category, {})


def clean_content(content: str, mapping: dict) -> tuple[str, int]:
    total_changes = 0
    new_content = content

    for old_tag, new_tags in mapping.items():
        # 1. Substituição de #old_tag no texto ou inline (respeitando borda de palavra/tag)
        pattern_hash = re.compile(rf"(?<![\w/])#{re.escape(old_tag)}(?![\w-])", re.IGNORECASE)
        replacement_hash = " ".join(f"#{t}" for t in new_tags) if new_tags else ""
        new_content, count_hash = pattern_hash.subn(replacement_hash, new_content)
        total_changes += count_hash

        # 2. Substituição em itens de lista YAML: "  - old_tag" ou "  - #old_tag"
        pattern_yaml_list = re.compile(
            rf"^(\s*-\s+)#?{re.escape(old_tag)}\s*$", re.IGNORECASE | re.MULTILINE
        )
        if new_tags:
            def repl_yaml(match):
                indent = match.group(1)
                return "\n".join(f"{indent}{t}" for t in new_tags)
            new_content, count_yaml = pattern_yaml_list.subn(repl_yaml, new_content)
        else:
            # Remove a linha inteira se for remoção total (#tasks)
            pattern_yaml_remove = re.compile(
                rf"^\s*-\s+#?{re.escape(old_tag)}\s*\n?", re.IGNORECASE | re.MULTILINE
            )
            new_content, count_yaml = pattern_yaml_remove.subn("", new_content)
        total_changes += count_yaml

    return new_content, total_changes


def append_stream(summary: str):
    if not TODAY_STREAM.exists():
        return
    now_str = datetime.datetime.now().strftime("%H:%M")
    line = f"- [{now_str}] [HYGIENE/TAG-CLEANER] {summary}\n"
    with open(TODAY_STREAM, "a", encoding="utf-8") as f:
        f.write(line)


def main():
    parser = argparse.ArgumentParser(description="Tyler Tag Cleaner CLI")
    parser.add_argument(
        "--category",
        choices=["ALL", "MACRO", "PROJECTS", "TECH", "BODY", "PHILOSOPHY"],
        default="ALL",
        help="Categoria de tags para limpar (default: ALL)",
    )
    parser.add_argument(
        "--path",
        default=str(VAULT_ROOT),
        help="Subcaminho ou diretório alvo no Vault",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Apenas simula e exibe quais arquivos seriam modificados",
    )
    args = parser.parse_args()

    target_path = Path(args.path)
    if not target_path.exists():
        print(json.dumps({"status": "error", "message": f"Caminho não encontrado: {target_path}"}))
        sys.exit(1)

    mapping = build_active_map(args.category)
    modified_files = []
    total_replacements = 0

    md_files = [target_path] if target_path.is_file() else list(target_path.rglob("*.md"))

    for md_file in md_files:
        if any(part in EXCLUDE_DIRS for part in md_file.parts):
            continue
        if md_file.name in EXCLUDE_FILES:
            continue

        try:
            original = md_file.read_text(encoding="utf-8")
        except Exception:
            continue

        updated, changes = clean_content(original, mapping)
        if changes > 0 and updated != original:
            rel = str(md_file.relative_to(VAULT_ROOT)) if md_file.is_relative_to(VAULT_ROOT) else str(md_file)
            modified_files.append({"file": rel, "replacements": changes})
            total_replacements += changes
            if not args.dry_run:
                md_file.write_text(updated, encoding="utf-8")

    if not args.dry_run and modified_files:
        append_stream(
            f"Tag Cleaner ({args.category}) executado: {total_replacements} substituições em {len(modified_files)} notas."
        )

    result = {
        "status": "success",
        "mode": "dry-run" if args.dry_run else "applied",
        "category": args.category,
        "files_modified_count": len(modified_files),
        "total_replacements": total_replacements,
        "files": modified_files[:50],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
