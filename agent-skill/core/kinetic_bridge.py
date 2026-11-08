"""
core/kinetic_bridge.py — Propagação de Calor Bottom-Up (PoW) & Ponte Termodinâmica
==================================================================================
Implementa a física de transferência de calor no grafo do Obsidian Vault v5.0:
- Localização rápida de qualquer nota pelo nome ou [[Wikilink]].
- Propagação Bottom-Up (Auto-Wake) subindo a cadeia Parent (Literature -> Course/Book -> Sub-Subject;
  Zettel -> MOC -> Sub-Subject; Doc/Goal -> Project -> Venture).
- Promoção automática para Status: done quando Current >= Target (preenchendo Completed_At).
- Ponte direta com Central/Configs/Scripts/vault_kinetic_engine.py (--tick).
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .config import CENTRAL_DIR, KINETIC_ENGINE_SCRIPT
from .db import record_kinetic_event


def clean_wikilink(val: Any) -> str:
    """Extrai o nome limpo de uma nota a partir de '[[Nota|Alias]]' ou '\"[[Nota]]\"'."""
    if not val:
        return ""
    s = str(val).strip().strip('"').strip("'")
    m = re.search(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", s)
    if m:
        return m.group(1).strip()
    return s


def build_vault_note_index() -> Dict[str, Path]:
    """
    Constrói um índice rápido (case-insensitive e com suporte a Aliases) de todas as notas
    em Central/ (excluindo Configs/Templates e Archive).
    """
    index: Dict[str, Path] = {}
    if not CENTRAL_DIR.exists():
        return index

    for root, dirs, files in os.walk(CENTRAL_DIR):
        rel = os.path.relpath(root, CENTRAL_DIR)
        if rel.startswith("Configs/Templates") or rel.startswith("Configs/Classes"):
            continue
        for f in files:
            if not f.endswith(".md"):
                continue
            full_path = Path(root) / f
            stem = full_path.stem
            # Prioriza notas fora de Archive
            if "Archive" not in rel or stem.lower() not in index:
                index[stem] = full_path
                index[stem.lower()] = full_path
    return index


def find_note_path(note_ref: str, index: Optional[Dict[str, Path]] = None) -> Optional[Path]:
    """Localiza o caminho físico de uma nota por nome, [[Wikilink]], caminho relativo ou Alias."""
    clean = clean_wikilink(note_ref)
    if not clean:
        return None

    # Se já for um caminho direto
    direct = Path(clean)
    if direct.is_absolute() and direct.exists():
        return direct
    rel_cand = CENTRAL_DIR.parent / clean
    if rel_cand.exists():
        return rel_cand

    if clean.endswith(".md"):
        clean = clean[:-3]

    idx = index if index is not None else build_vault_note_index()
    if clean in idx:
        return idx[clean]
    if clean.lower() in idx:
        return idx[clean.lower()]

    # Fallback: busca em Aliases no frontmatter se não bateu pelo nome do arquivo
    target_lower = clean.lower()
    for path in set(idx.values()):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
            if target_lower in text.lower():
                fm, _ = split_frontmatter_and_body(text)
                aliases_raw = extract_yaml_scalar(fm, "Aliases")
                if aliases_raw and target_lower in aliases_raw.lower():
                    return path
        except Exception:
            continue
    return None


def split_frontmatter_and_body(content: str) -> Tuple[str, str]:
    """
    Separa com segurança o bloco YAML frontmatter (sem os delimitadores ---) e o corpo da nota.
    Corrige também delimitadores colados caso existam.
    """
    # Blindagem preventiva contra --- colado no fim de linha do YAML
    fixed = re.sub(r"([^\n])---\n", r"\1\n---\n", content, count=1)
    if not fixed.startswith("---\n") and not fixed.startswith("---\r\n"):
        return "", fixed

    lines = fixed.splitlines(keepends=True)
    fm_lines: List[str] = []
    body_start_idx = 0
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            body_start_idx = i + 1
            break
        fm_lines.append(lines[i])

    if body_start_idx == 0:
        return "", fixed

    fm_str = "".join(fm_lines)
    body_str = "".join(lines[body_start_idx:])
    return fm_str, body_str


def extract_yaml_scalar(fm_text: str, key: str) -> Optional[str]:
    """Extrai o valor escalar de uma chave do frontmatter YAML (estrito na mesma linha)."""
    pattern = re.compile(rf"^{re.escape(key)}:[ \t]*(.*)$", re.MULTILINE)
    m = pattern.search(fm_text)
    if not m:
        return None
    val = m.group(1).strip()
    if len(val) >= 2 and ((val[0] == '"' and val[-1] == '"') or (val[0] == "'" and val[-1] == "'")):
        return val[1:-1]
    return val


def set_yaml_scalar(fm_text: str, key: str, new_val: Any) -> str:
    """Atualiza ou insere uma chave escalar no texto do frontmatter YAML (estrito na mesma linha)."""
    if isinstance(new_val, bool):
        val_str = "true" if new_val else "false"
    elif isinstance(new_val, list):
        val_str = "[" + ", ".join(f'"{x}"' if isinstance(x, str) else str(x) for x in new_val) + "]"
    elif new_val is None:
        val_str = ""
    else:
        val_str = str(new_val)

    pattern = re.compile(rf"^({re.escape(key)}:[ \t]*).*$", re.MULTILINE)
    if pattern.search(fm_text):
        return pattern.sub(rf"\g<1>{val_str}", fm_text, count=1)
    else:
        if fm_text and not fm_text.endswith("\n"):
            fm_text += "\n"
        return fm_text + f"{key}: {val_str}\n"


def wake_note_and_ancestors(
    start_path: Path,
    increment_parent_current: bool = False,
    index: Optional[Dict[str, Path]] = None,
) -> List[str]:
    """
    Executa a propagação Bottom-Up de calor (Proof-of-Work Auto-Wake):
    - Atualiza Updated e mtime da nota inicial (e promove para in_progress se estava em paused/inbox).
    - Sobe a cadeia Parent até os Hubs:
      * Se start_path é classLiterature e increment_parent_current=True -> incrementa Current no Course/Book pai.
      * Muda ancestrais (Course, Book, Subject, MOC, Project, Venture, Goal) de paused/inbox para in_progress.
      * Se Current >= Target em qualquer ancestral com Target > 0, promove para Status: done e grava Completed_At.
    Retorna a lista de wikilinks das entidades aquecidas/atualizadas.
    """
    idx = index if index is not None else build_vault_note_index()
    now_dt = datetime.now()
    now_str = now_dt.strftime("%d-%m-%Y %H:%M")
    today_date_str = now_dt.strftime("%d-%m-%Y")

    woken_entities: List[str] = []
    visited: set[Path] = set()

    current_path: Optional[Path] = start_path
    depth = 0

    while current_path is not None and current_path.exists() and current_path not in visited and depth < 6:
        visited.add(current_path)
        text = current_path.read_text(encoding="utf-8")
        fm, body = split_frontmatter_and_body(text)
        if not fm:
            break

        note_class = extract_yaml_scalar(fm, "Class") or ""
        parent_raw = extract_yaml_scalar(fm, "Parent") or ""
        parent_name = clean_wikilink(parent_raw)

        # Hubs soberanos não têm Status térmico e encerram a subida
        if note_class == "classHub" or current_path.stem in ("Life", "Academy", "Library", "Cinema", "Work", "Studio"):
            break

        changed = False
        old_status = extract_yaml_scalar(fm, "Status")

        # Na nota inicial ou nos ancestrais rastreáveis:
        if depth == 0:
            fm = set_yaml_scalar(fm, "Updated", now_str)
            changed = True
            if old_status in ("paused", "inbox"):
                fm = set_yaml_scalar(fm, "Status", "in_progress")
                record_kinetic_event(
                    f"[[{current_path.stem}]]",
                    "wake",
                    f"Auto-Wake direto ({old_status} -> in_progress)",
                )
            else:
                record_kinetic_event(
                    f"[[{current_path.stem}]]",
                    "wake",
                    f"Calor renovado via Proof-of-Work (Status: {old_status or 'active'})",
                )
        else:
            # Ancestral (depth >= 1)
            if depth == 1 and increment_parent_current and note_class in ("classCourse", "classBook"):
                cur_val_str = extract_yaml_scalar(fm, "Current")
                targ_val_str = extract_yaml_scalar(fm, "Target")
                try:
                    cur_num = int(float(cur_val_str or "0")) + 1
                    fm = set_yaml_scalar(fm, "Current", cur_num)
                    if targ_val_str:
                        targ_num = int(float(targ_val_str))
                        if targ_num > 0:
                            prog = min(100, round((cur_num / targ_num) * 100))
                            fm = set_yaml_scalar(fm, "Progress", prog)
                            if cur_num >= targ_num:
                                fm = set_yaml_scalar(fm, "Status", "done")
                                fm = set_yaml_scalar(fm, "Completed_At", f'"{today_date_str}"')
                                record_kinetic_event(
                                    f"[[{current_path.stem}]]",
                                    "done",
                                    f"Meta atingida ({cur_num}/{targ_num}) via nova Literature filha",
                                )
                    changed = True
                except ValueError:
                    pass

            current_status_after = extract_yaml_scalar(fm, "Status")
            if current_status_after in ("paused", "inbox"):
                fm = set_yaml_scalar(fm, "Status", "in_progress")
                changed = True
                record_kinetic_event(
                    f"[[{current_path.stem}]]",
                    "wake",
                    f"Propagação Bottom-Up de calor a partir de [[{start_path.stem}]] ({current_status_after} -> in_progress)",
                )

            if changed or old_status == "in_progress":
                fm = set_yaml_scalar(fm, "Updated", now_str)
                changed = True

        if changed:
            if not fm.endswith("\n"):
                fm += "\n"
            if not body.startswith("\n"):
                body = "\n\n" + body.lstrip("\n")
            new_text = f"---\n{fm}---{body}"
            current_path.write_text(new_text, encoding="utf-8")
            woken_tag = f"[[{current_path.stem}]]"
            if woken_tag not in woken_entities:
                woken_entities.append(woken_tag)

        # Sobe para o próximo Parent
        if not parent_name or parent_name == current_path.stem:
            break
        current_path = find_note_path(parent_name, idx)
        depth += 1

    return woken_entities


def run_kinetic_engine_tick(dry_run: bool = False) -> Dict[str, Any]:
    """Executa o motor termodinâmico vault_kinetic_engine.py --tick e retorna o resultado."""
    if not KINETIC_ENGINE_SCRIPT.exists():
        return {"status": "error", "message": f"Script não encontrado: {KINETIC_ENGINE_SCRIPT}"}

    cmd = [sys.executable, str(KINETIC_ENGINE_SCRIPT), "--tick"]
    if dry_run:
        cmd.append("--dry-run")

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        output = (proc.stdout or "") + (proc.stderr or "")
        return {
            "status": "ok" if proc.returncode == 0 else "error",
            "returncode": proc.returncode,
            "output": output.strip(),
        }
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
