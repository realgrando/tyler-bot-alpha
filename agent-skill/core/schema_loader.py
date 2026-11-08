"""
core/schema_loader.py — Leitor Dinâmico de Classes e Templates do Obsidian (Zero Hardcoding)
============================================================================================
Lê em tempo real os arquivos de definição do MetadataMenu em Central/Configs/Classes/*.md
(resolvendo a cadeia de herança extends: classBase e extends: classTracked) e os templates
em Central/Configs/Templates/*.md. Qualquer edição futura feita pelo Gu no Obsidian passa
a ser validada instantaneamente pelo tyler-core sem tocar no código Python.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .config import CLASSES_DIR, CLASS_TEMPLATE_MAP, TEMPLATES_DIR


@dataclass
class FieldSpec:
    """Especificação de um campo individual extraído de Central/Configs/Classes/*.md."""
    name: str
    field_type: str  # Select, Input, Number, Boolean, File, MultiFile, Date, DateTime, Time, Formula, Multi
    allowed_values: List[str] = field(default_factory=list)
    default_value: Optional[str] = None
    dv_query: Optional[str] = None
    min_val: Optional[float] = None
    max_val: Optional[float] = None


@dataclass
class ClassSpec:
    """Especificação completa de uma classe do Vault com herança resolvida."""
    name: str
    extends: Optional[str] = None
    raw_fields: Dict[str, FieldSpec] = field(default_factory=dict)
    resolved_fields: Dict[str, FieldSpec] = field(default_factory=dict)


def _strip_quotes(val: str) -> str:
    """Remove aspas simples ou duplas externas de um valor escalar YAML."""
    v = val.strip()
    if len(v) >= 2 and ((v[0] == "'" and v[-1] == "'") or (v[0] == '"' and v[-1] == '"')):
        return v[1:-1]
    return v


def parse_class_file(path: Path) -> ClassSpec:
    """
    Faz o parsing nativo de um arquivo MetadataMenu em Central/Configs/Classes/class*.md
    sem depender de bibliotecas externas pesadas.
    """
    class_name = path.stem
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    spec = ClassSpec(name=class_name)
    current_field: Optional[FieldSpec] = None
    in_values_list = False

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped == "---" or stripped.startswith("#"):
            continue

        # Top-level extends
        if line.startswith("extends:"):
            ext_val = _strip_quotes(line.split(":", 1)[1])
            spec.extends = None if ext_val in ("", "null", "None", "~") else ext_val
            in_values_list = False
            continue

        # Novo campo na lista fields:
        if line.startswith("- name:"):
            if current_field is not None:
                spec.raw_fields[current_field.name] = current_field
            fname = _strip_quotes(line.split(":", 1)[1])
            current_field = FieldSpec(name=fname, field_type="Input")
            in_values_list = False
            continue

        if current_field is None:
            continue

        # Detecta fim do bloco fields: quando encontra outra chave raiz sem indentação
        if not line.startswith(" ") and not line.startswith("-"):
            spec.raw_fields[current_field.name] = current_field
            current_field = None
            in_values_list = False
            continue

        # Propriedades internas do campo atual
        if re.match(r"^\s{2}type:\s*", line):
            current_field.field_type = _strip_quotes(line.split(":", 1)[1])
            in_values_list = False
        elif re.match(r"^\s{4}valuesList:\s*$", line):
            in_values_list = True
        elif in_values_list and re.match(r"^\s{6}['\"]?\d+['\"]?:\s*", line):
            val = _strip_quotes(line.split(":", 1)[1])
            if val not in current_field.allowed_values:
                current_field.allowed_values.append(val)
        elif re.match(r"^\s{4}defaultValue:\s*", line):
            current_field.default_value = _strip_quotes(line.split(":", 1)[1])
            in_values_list = False
        elif re.match(r"^\s{4}dvQueryString:\s*", line):
            current_field.dv_query = _strip_quotes(line.split(":", 1)[1])
            in_values_list = False
        elif re.match(r"^\s{4}min:\s*", line):
            try:
                current_field.min_val = float(_strip_quotes(line.split(":", 1)[1]))
            except ValueError:
                pass
            in_values_list = False
        elif re.match(r"^\s{4}max:\s*", line):
            try:
                current_field.max_val = float(_strip_quotes(line.split(":", 1)[1]))
            except ValueError:
                pass
            in_values_list = False
        elif re.match(r"^\s{2}(path|id):\s*", line):
            in_values_list = False

    if current_field is not None:
        spec.raw_fields[current_field.name] = current_field

    return spec


class SchemaRegistry:
    """Registro dinâmico de todas as classes e templates do Obsidian Vault."""

    def __init__(self, classes_dir: Path = CLASSES_DIR, templates_dir: Path = TEMPLATES_DIR) -> None:
        self.classes_dir = classes_dir
        self.templates_dir = templates_dir
        self.classes: Dict[str, ClassSpec] = {}
        self.reload()

    def reload(self) -> None:
        """Recarrega todos os arquivos class*.md do disco e resolve a árvore de herança."""
        self.classes.clear()
        if not self.classes_dir.exists():
            return

        for p in sorted(self.classes_dir.glob("class*.md")):
            spec = parse_class_file(p)
            self.classes[spec.name] = spec

        # Resolve herança (ex: classProject -> classTracked -> classBase)
        for cname in self.classes:
            self.classes[cname].resolved_fields = self._resolve_hierarchy(cname)

    def _resolve_hierarchy(self, class_name: str, visited: Optional[set[str]] = None) -> Dict[str, FieldSpec]:
        if visited is None:
            visited = set()
        if class_name in visited or class_name not in self.classes:
            return {}
        visited.add(class_name)

        spec = self.classes[class_name]
        merged: Dict[str, FieldSpec] = {}

        # Primeiro herda os campos do pai (ex: classBase / classTracked)
        if spec.extends:
            parent_fields = self._resolve_hierarchy(spec.extends, visited)
            merged.update(parent_fields)

        # Sobrescreve/especializa com os campos da própria classe
        merged.update(spec.raw_fields)
        return merged

    def get_class(self, class_name: str) -> Optional[ClassSpec]:
        """Retorna a especificação da classe (aceita 'classProject' ou 'Project')."""
        if class_name in self.classes:
            return self.classes[class_name]
        prefixed = f"class{class_name[0].upper()}{class_name[1:]}" if class_name else ""
        return self.classes.get(prefixed)

    def get_allowed_values(self, class_name: str, field_name: str) -> Optional[List[str]]:
        """Retorna a lista de enums aceitos para um campo Select de uma classe."""
        spec = self.get_class(class_name)
        if not spec:
            return None
        fspec = spec.resolved_fields.get(field_name)
        if not fspec or fspec.field_type != "Select":
            return None
        return fspec.allowed_values

    def validate_property(self, class_name: str, prop_name: str, prop_value: Any) -> Tuple[bool, str]:
        """
        Valida se uma propriedade e seu valor respeitam o schema dinâmico da classe.
        Retorna (is_valid, error_message).
        """
        spec = self.get_class(class_name)
        if not spec:
            return False, f"Classe '{class_name}' não existe em {self.classes_dir}. Classes válidas: {', '.join(sorted(self.classes.keys()))}"

        # Campos universais implícitos do frontmatter
        if prop_name in ("Class", "class", "collection", "year", "month_id", "sprint_id"):
            return True, ""

        fspec = spec.resolved_fields.get(prop_name)
        if not fspec:
            valid_props = ", ".join(sorted(spec.resolved_fields.keys()))
            return (
                False,
                f"Propriedade '{prop_name}' não faz parte do schema de '{spec.name}'. Propriedades válidas: {valid_props}",
            )

        # Permite limpar valor (vazio/null) exceto em campos críticos se validados à parte
        str_val = str(prop_value).strip() if prop_value is not None else ""
        if str_val == "":
            return True, ""

        if fspec.field_type == "Select" and fspec.allowed_values:
            if str_val not in fspec.allowed_values:
                return (
                    False,
                    f"Valor inválido '{str_val}' para '{prop_name}' em '{spec.name}'. "
                    f"Valores canônicos aceitos: {' | '.join(fspec.allowed_values)}",
                )

        if fspec.field_type == "Number":
            try:
                num_val = float(str_val)
                if fspec.min_val is not None and num_val < fspec.min_val:
                    return False, f"Valor {num_val} para '{prop_name}' é menor que o mínimo permitido ({fspec.min_val})."
                if fspec.max_val is not None and num_val > fspec.max_val:
                    return False, f"Valor {num_val} para '{prop_name}' excede o máximo permitido ({fspec.max_val})."
            except ValueError:
                return False, f"Campo '{prop_name}' em '{spec.name}' exige um número válido (recebido: '{str_val}')."

        return True, ""

    def load_template_text(self, class_name: str) -> Optional[str]:
        """Carrega o conteúdo bruto do template correspondente em Central/Configs/Templates/."""
        spec = self.get_class(class_name)
        cname = spec.name if spec else class_name
        t_filename = CLASS_TEMPLATE_MAP.get(cname)
        if not t_filename:
            return None
        t_path = self.templates_dir / t_filename
        if not t_path.exists():
            return None
        return t_path.read_text(encoding="utf-8")


# Singleton global carregado sob demanda
_REGISTRY: Optional[SchemaRegistry] = None


def get_schema_registry(force_reload: bool = False) -> SchemaRegistry:
    """Obtém a instância ativa do SchemaRegistry lendo os schemas reais do Vault."""
    global _REGISTRY
    if _REGISTRY is None or force_reload:
        _REGISTRY = SchemaRegistry()
    return _REGISTRY
