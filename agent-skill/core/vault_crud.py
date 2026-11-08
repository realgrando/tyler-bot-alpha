"""
core/vault_crud.py — Gatekeeper 3NF, Anti-Setext, Enums Dinâmicos e Relógio Duplo
=================================================================================
Governa todas as operações de criação, edição, progresso e validação de notas no
Obsidian Vault v5.0:
- Validação dinâmica de enums contra Central/Configs/Classes/*.md (via SchemaRegistry).
- Verificação estrita de existência física do Parent 3NF (exceção única: Life.md).
- Blindagem Anti-Setext (duas linhas em branco antes e depois de divisores --- no corpo)
  e proteção contra delimitador YAML colado (Aliases: []---).
- Suporte nativo aos modos --pow (Proof-of-Work com Auto-Wake Bottom-Up) e
  --preserve-time (manutenção silenciosa com os.utime intacto).
"""

from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .config import CLASS_FOLDER_MAP, CLASS_NOTE_MARKER
from .db import record_kinetic_event
from .kinetic_bridge import (
    build_vault_note_index,
    clean_wikilink,
    extract_yaml_scalar,
    find_note_path,
    set_yaml_scalar,
    split_frontmatter_and_body,
    wake_note_and_ancestors,
)
from .schema_loader import get_schema_registry


def format_wikilink(val: str) -> str:
    """Garante que uma referência de nota esteja no formato '\"[[Nome]]\"'."""
    clean = clean_wikilink(val)
    if not clean:
        return '""'
    return f'"[[{clean}]]"'


def sanitize_body_anti_setext(body: str) -> str:
    """
    Blindagem Anti-Setext:
    Garante que qualquer divisor horizontal '---' no corpo da nota (fora de blocos de código)
    tenha linhas em branco antes e depois, impedindo que o parser Markdown transforme o texto
    acima em cabeçalho H1 Setext.
    """
    lines = body.splitlines()
    out_lines: List[str] = []
    in_code_block = False

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            out_lines.append(line)
            continue

        if not in_code_block and stripped == "---":
            # Garante pelo menos 2 linhas vazias antes do divisor horizontal (exceto no início do body)
            while out_lines and out_lines[-1].strip() == "":
                out_lines.pop()
            if out_lines:
                out_lines.append("")
                out_lines.append("")
            out_lines.append("---")
            out_lines.append("")
            out_lines.append("")
        else:
            out_lines.append(line)

    # Normaliza excessos de quebras (>3 linhas vazias seguidas) mantendo espaçamento limpo
    res = "\n".join(out_lines)
    res = re.sub(r"\n{4,}", "\n\n\n", res)
    if not res.startswith("\n"):
        res = "\n" + res
    if not res.endswith("\n"):
        res += "\n"
    return res


def _clean_templater_expressions(raw_template: str, class_name: str, now_dt: datetime) -> str:
    """Converte expressões Templater (<% ... %>) em valores reais determinísticos."""
    text = raw_template
    # Substitui <% 'valor' %> por valor
    text = re.sub(r"<%=\s*['\"]([^'\"]+)['\"]\s*%>", r"\1", text)
    text = re.sub(r"<%\s*['\"]([^'\"]+)['\"]\s*%>", r"\1", text)
    # Remove cursores <% tp.file.cursor(...) %>
    text = re.sub(r"<%\s*tp\.file\.cursor\([^)]*\)\s*%>\n?", "", text)
    # Datas dinâmicas
    text = re.sub(r"<%\s*tp\.date\.now\(['\"]DD-MM-YYYY HH:mm['\"]\)\s*%>", now_dt.strftime("%d-%m-%Y %H:%M"), text)
    text = re.sub(r"<%\s*tp\.date\.now\(['\"]DD-MM-YYYY['\"](?:,\s*\d+)?\)\s*%>", now_dt.strftime("%d-%m-%Y"), text)
    text = re.sub(r"<%\s*tp\.date\.now\(['\"]YYYY-MM-DD['\"]\)\s*%>", now_dt.strftime("%Y-%m-%d"), text)
    text = re.sub(r"<%\s*tp\.date\.now\(['\"]YYYY['\"]\)\s*%>", now_dt.strftime("%Y"), text)
    # Placeholders {{...}} de Book/Movie
    text = re.sub(r"\{\{[^}]+\}\}", "", text)
    return text


def _compute_zettel_maturity(body_text: str) -> str:
    """Calcula a maturidade automática para classZettel: <500c=seed, 500-2500c=budding, >2500c=evergreen."""
    length = len(body_text.strip())
    if length > 2500:
        return "evergreen"
    if length >= 500:
        return "budding"
    return "seed"


def _compute_next_literature_sequence(parent_name: str) -> int:
    """Calcula Sequence: N+1 para novas notas classLiterature filhas do mesmo Curso ou Livro."""
    lit_dir = CLASS_FOLDER_MAP["classLiterature"]
    if not lit_dir.exists():
        return 1
    max_seq = 0
    clean_p = clean_wikilink(parent_name).lower()
    for p in lit_dir.glob("*.md"):
        try:
            txt = p.read_text(encoding="utf-8", errors="ignore")
            fm, _ = split_frontmatter_and_body(txt)
            par = clean_wikilink(extract_yaml_scalar(fm, "Parent") or "").lower()
            if par == clean_p:
                seq_str = extract_yaml_scalar(fm, "Sequence")
                if seq_str:
                    max_seq = max(max_seq, int(float(seq_str)))
        except Exception:
            continue
    return max_seq + 1


def _inject_body_under_marker(body_template: str, class_name: str, custom_body: str) -> str:
    """Injeta o conteúdo textual logo abaixo do marcador **<Type> Note:** preservando rodapé e views."""
    if not custom_body.strip():
        return sanitize_body_anti_setext(body_template)

    marker = CLASS_NOTE_MARKER.get(class_name)
    if marker and marker in body_template:
        parts = body_template.split(marker, 1)
        new_body = f"{parts[0]}{marker}\n{custom_body.strip()}\n{parts[1]}"
        return sanitize_body_anti_setext(new_body)

    # Fallback se não achar o marcador exato
    return sanitize_body_anti_setext(body_template + "\n" + custom_body.strip() + "\n")


def validate_note_file(note_ref: str, fix_formatting: bool = False, preserve_time: bool = True) -> Dict[str, Any]:
    """
    Audita integralmente uma nota existente no Vault:
    1. Verifica delimitador YAML --- separado por quebra de linha.
    2. Valida todas as propriedades Select/Number contra Central/Configs/Classes/<Class>.md.
    3. Verifica se o Parent 3NF existe fisicamente no Vault (exceto Life.md).
    4. Se fix_formatting=True, corrige delimitadores colados e aplica blindagem Anti-Setext.
    """
    idx = build_vault_note_index()
    path = find_note_path(note_ref, idx)
    if not path or not path.exists():
        return {"valid": False, "errors": [f"Nota '{note_ref}' não encontrada no Vault."]}

    st = os.stat(path)
    raw_text = path.read_text(encoding="utf-8")
    errors: List[str] = []
    warnings: List[str] = []

    if re.search(r"[^\n]---\n", raw_text):
        errors.append("Delimitador YAML '---' colado no final de uma linha (ex: Aliases: []---).")

    fm, body = split_frontmatter_and_body(raw_text)
    if not fm:
        return {"valid": False, "path": str(path), "errors": ["Frontmatter YAML ausente ou malformado."]}

    class_name = extract_yaml_scalar(fm, "Class") or extract_yaml_scalar(fm, "class") or ""
    if class_name == "daily":
        class_name = "classDaily"

    reg = get_schema_registry()
    spec = reg.get_class(class_name)
    if not spec:
        errors.append(f"Classe '{class_name}' inválida ou não reconhecida em Central/Configs/Classes/.")
    else:
        # Valida cada linha chave: valor escalar do frontmatter contra a classe
        for line in fm.splitlines():
            line_s = line.strip()
            if not line_s or line_s.startswith("#") or line_s.startswith("-"):
                continue
            if ":" in line:
                k, v = line.split(":", 1)
                k = k.strip()
                v_clean = v.strip().strip('"').strip("'")
                if v_clean in ("", "[]", "null"):
                    continue
                ok, err_msg = reg.validate_property(spec.name, k, v_clean)
                if not ok:
                    errors.append(err_msg)

    # Validação de Parent 3NF (exceção única: Life.md)
    if path.stem != "Life":
        parent_raw = extract_yaml_scalar(fm, "Parent")
        parent_clean = clean_wikilink(parent_raw)
        if not parent_clean:
            errors.append(f"Violação 3NF: Nota '{path.name}' não possui Parent definido.")
        else:
            parent_path = find_note_path(parent_clean, idx)
            if not parent_path:
                errors.append(f"Violação 3NF: Parent '[[{parent_clean}]]' de '{path.name}' não existe no Vault.")

    fixed_applied = False
    if fix_formatting:
        clean_body = sanitize_body_anti_setext(body)
        if not fm.endswith("\n"):
            fm += "\n"
        rebuilt = f"---\n{fm}---{clean_body}"
        if rebuilt != raw_text:
            path.write_text(rebuilt, encoding="utf-8")
            if preserve_time:
                os.utime(path, ns=(st.st_atime_ns, st.st_mtime_ns))
            fixed_applied = True

    return {
        "valid": len(errors) == 0,
        "path": str(path),
        "class": class_name,
        "errors": errors,
        "warnings": warnings,
        "formatting_fixed": fixed_applied,
    }


def create_note(
    class_name: str,
    title: str,
    parent: str,
    props: Optional[Dict[str, Any]] = None,
    body_text: str = "",
    pow_mode: bool = True,
) -> Dict[str, Any]:
    """
    Cria uma nova nota no Vault passando por todas as travas do Gatekeeper:
    - Valida Classe e Parent 3NF existente no Vault.
    - Valida todos os enums passados em props contra Central/Configs/Classes/.
    - Calcula Maturity automática para classZettel e Sequence N+1 para classLiterature.
    - Aplica blindagem Anti-Setext e propaga calor Bottom-Up se pow_mode=True.
    """
    reg = get_schema_registry()
    spec = reg.get_class(class_name)
    if not spec:
        return {"status": "error", "message": f"Classe '{class_name}' não existe em Central/Configs/Classes/."}

    cname = spec.name
    if cname not in CLASS_FOLDER_MAP:
        return {"status": "error", "message": f"Classe '{cname}' não possui pasta física mapeada."}

    idx = build_vault_note_index()
    clean_parent = clean_wikilink(parent)
    if title != "Life":
        if not clean_parent:
            return {"status": "error", "message": "Violação 3NF: Toda nota (exceto Life.md) exige um --parent válido."}
        parent_path = find_note_path(clean_parent, idx)
        if not parent_path:
            return {
                "status": "error",
                "message": f"Violação 3NF: A nota pai '[[{clean_parent}]]' não existe no Vault. Crie o pai primeiro ou verifique o nome exato.",
            }

    extra_props = dict(props or {})

    # Regras automáticas de domínio
    if cname == "classZettel" and ("Maturity" not in extra_props or not extra_props["Maturity"]):
        extra_props["Maturity"] = _compute_zettel_maturity(body_text)
    if cname == "classLiterature" and ("Sequence" not in extra_props or extra_props["Sequence"] is None):
        extra_props["Sequence"] = _compute_next_literature_sequence(clean_parent)

    # Validação de todas as propriedades extras contra o schema dinâmico
    for k, v in extra_props.items():
        if isinstance(v, (list, dict)):
            continue
        ok, err_msg = reg.validate_property(cname, k, v)
        if not ok:
            return {"status": "error", "message": err_msg}

    now_dt = datetime.now()
    now_fmt = now_dt.strftime("%d-%m-%Y %H:%M")

    raw_tpl = reg.load_template_text(cname)
    if not raw_tpl:
        return {"status": "error", "message": f"Template para '{cname}' não encontrado em Central/Configs/Templates/."}

    cleaned_tpl = _clean_templater_expressions(raw_tpl, cname, now_dt)
    fm, body_tpl = split_frontmatter_and_body(cleaned_tpl)

    fm = set_yaml_scalar(fm, "Class", cname)
    fm = set_yaml_scalar(fm, "Parent", format_wikilink(clean_parent))
    fm = set_yaml_scalar(fm, "Created", now_fmt)
    fm = set_yaml_scalar(fm, "Updated", now_fmt)

    for k, v in extra_props.items():
        if k in ("Parent", "Author", "Director") and isinstance(v, str) and v.strip():
            v = format_wikilink(v)
        fm = set_yaml_scalar(fm, k, v)

    final_body = _inject_body_under_marker(body_tpl, cname, body_text)
    if not fm.endswith("\n"):
        fm += "\n"
    final_content = f"---\n{fm}---{final_body}"

    target_dir = CLASS_FOLDER_MAP[cname]
    target_dir.mkdir(parents=True, exist_ok=True)
    safe_title = title[:-3] if title.endswith(".md") else title
    target_path = target_dir / f"{safe_title}.md"

    if target_path.exists():
        return {"status": "error", "message": f"A nota '{target_path}' já existe. Use 'tyler-core note update' para editá-la."}

    target_path.write_text(final_content, encoding="utf-8")

    woken: List[str] = []
    if pow_mode:
        idx[safe_title] = target_path
        idx[safe_title.lower()] = target_path
        is_new_lit = cname == "classLiterature"
        woken = wake_note_and_ancestors(target_path, increment_parent_current=is_new_lit, index=idx)

    return {
        "status": "created",
        "path": str(target_path),
        "title": safe_title,
        "class": cname,
        "parent": f"[[{clean_parent}]]",
        "props_applied": extra_props,
        "woken_entities": woken,
    }


def update_note(
    note_ref: str,
    props: Optional[Dict[str, Any]] = None,
    append_body: Optional[str] = None,
    pow_mode: bool = True,
) -> Dict[str, Any]:
    """
    Atualiza propriedades YAML e/ou adiciona conteúdo ao corpo de uma nota existente,
    validando enums dinamicamente, blindando Anti-Setext e aplicando --pow ou --preserve-time.
    """
    idx = build_vault_note_index()
    path = find_note_path(note_ref, idx)
    if not path or not path.exists():
        return {"status": "error", "message": f"Nota '{note_ref}' não encontrada no Vault."}

    st = os.stat(path)
    raw_text = path.read_text(encoding="utf-8")
    fm, body = split_frontmatter_and_body(raw_text)
    if not fm:
        return {"status": "error", "message": f"Frontmatter inválido em '{path.name}'."}

    cname = extract_yaml_scalar(fm, "Class") or extract_yaml_scalar(fm, "class") or ""
    if cname == "daily":
        cname = "classDaily"

    reg = get_schema_registry()
    extra_props = dict(props or {})

    # Se atualizar Parent, valida 3NF
    if "Parent" in extra_props and path.stem != "Life":
        p_clean = clean_wikilink(extra_props["Parent"])
        if not find_note_path(p_clean, idx):
            return {"status": "error", "message": f"Violação 3NF: Novo Parent '[[{p_clean}]]' não existe no Vault."}
        extra_props["Parent"] = format_wikilink(p_clean)

    for k, v in extra_props.items():
        if isinstance(v, (list, dict)):
            continue
        ok, err_msg = reg.validate_property(cname, k, v)
        if not ok:
            return {"status": "error", "message": err_msg}

    for k, v in extra_props.items():
        fm = set_yaml_scalar(fm, k, v)

    if append_body:
        # Insere antes do primeiro bloco dataviewjs de views_relacionais ou antes do rodapé
        dv_match = re.search(r"\n+---\n+\s*```dataviewjs\s*\n\s*await dv\.view\(\"Central/Configs/Scripts/views_relacionais\"", body)
        footer_match = re.search(r"\n+---\n+🔗 Aliases:", body)
        ins_pos = None
        if dv_match:
            ins_pos = dv_match.start()
        elif footer_match:
            ins_pos = footer_match.start()

        if ins_pos is not None:
            body = body[:ins_pos].rstrip() + "\n\n" + append_body.strip() + "\n" + body[ins_pos:]
        else:
            body = body.rstrip() + "\n\n" + append_body.strip() + "\n"

    # Recalcula Maturity se for Zettel e houve adição de texto sem Maturity explícita
    if cname == "classZettel" and append_body and "Maturity" not in extra_props:
        fm = set_yaml_scalar(fm, "Maturity", _compute_zettel_maturity(body))

    if pow_mode:
        now_fmt = datetime.now().strftime("%d-%m-%Y %H:%M")
        fm = set_yaml_scalar(fm, "Updated", now_fmt)

    clean_body = sanitize_body_anti_setext(body)
    if not fm.endswith("\n"):
        fm += "\n"
    new_content = f"---\n{fm}---{clean_body}"
    path.write_text(new_content, encoding="utf-8")

    woken: List[str] = []
    if pow_mode:
        woken = wake_note_and_ancestors(path, increment_parent_current=False, index=idx)
    else:
        os.utime(path, ns=(st.st_atime_ns, st.st_mtime_ns))

    return {
        "status": "updated",
        "path": str(path),
        "title": path.stem,
        "class": cname,
        "pow_mode": pow_mode,
        "props_updated": extra_props,
        "woken_entities": woken,
    }


def update_progress(
    note_ref: str,
    add_delta: Optional[float] = None,
    set_value: Optional[float] = None,
    pow_mode: bool = True,
) -> Dict[str, Any]:
    """
    Atualiza Current e Progress em Livros, Cursos, Metas ou Métricas.
    Se Current >= Target, promove automaticamente para Status: done e grava Completed_At.
    """
    idx = build_vault_note_index()
    path = find_note_path(note_ref, idx)
    if not path or not path.exists():
        return {"status": "error", "message": f"Nota '{note_ref}' não encontrada no Vault."}

    st = os.stat(path)
    raw_text = path.read_text(encoding="utf-8")
    fm, body = split_frontmatter_and_body(raw_text)
    if not fm:
        return {"status": "error", "message": f"Frontmatter ausente em '{path.name}'."}

    cur_raw = extract_yaml_scalar(fm, "Current") or "0"
    targ_raw = extract_yaml_scalar(fm, "Target") or "100"
    try:
        cur_val = float(cur_raw)
    except ValueError:
        cur_val = 0.0
    try:
        targ_val = float(targ_raw)
    except ValueError:
        targ_val = 100.0

    if set_value is not None:
        new_cur = float(set_value)
    elif add_delta is not None:
        new_cur = cur_val + float(add_delta)
    else:
        return {"status": "error", "message": "Informe --add <N> ou --set <N>."}

    # Formata inteiro se não tiver casas decimais
    new_cur_fmt: int | float = int(new_cur) if new_cur.is_integer() else round(new_cur, 2)
    prog_pct = min(100, round((new_cur / targ_val) * 100)) if targ_val > 0 else 0

    fm = set_yaml_scalar(fm, "Current", new_cur_fmt)
    fm = set_yaml_scalar(fm, "Progress", prog_pct)

    now_dt = datetime.now()
    today_str = now_dt.strftime("%d-%m-%Y")
    now_fmt = now_dt.strftime("%d-%m-%Y %H:%M")

    promoted_done = False
    if targ_val > 0 and new_cur >= targ_val:
        fm = set_yaml_scalar(fm, "Status", "done")
        fm = set_yaml_scalar(fm, "Completed_At", f'"{today_str}"')
        promoted_done = True
        record_kinetic_event(
            f"[[{path.stem}]]",
            "done",
            f"Concluído ({new_cur_fmt}/{int(targ_val) if targ_val.is_integer() else targ_val} -> 100%)",
        )
    else:
        old_st = extract_yaml_scalar(fm, "Status")
        if old_st in ("inbox", "paused"):
            fm = set_yaml_scalar(fm, "Status", "in_progress")
        record_kinetic_event(
            f"[[{path.stem}]]",
            "progress",
            f"Progresso atualizado: {cur_raw} -> {new_cur_fmt} ({prog_pct}%)",
        )

    if pow_mode:
        fm = set_yaml_scalar(fm, "Updated", now_fmt)

    if not fm.endswith("\n"):
        fm += "\n"
    path.write_text(f"---\n{fm}---{sanitize_body_anti_setext(body)}", encoding="utf-8")

    woken: List[str] = []
    if pow_mode:
        woken = wake_note_and_ancestors(path, increment_parent_current=False, index=idx)
    else:
        os.utime(path, ns=(st.st_atime_ns, st.st_mtime_ns))

    return {
        "status": "done" if promoted_done else "in_progress",
        "path": str(path),
        "title": path.stem,
        "current": new_cur_fmt,
        "target": int(targ_val) if targ_val.is_integer() else targ_val,
        "progress_pct": prog_pct,
        "promoted_to_done": promoted_done,
        "woken_entities": woken,
    }
