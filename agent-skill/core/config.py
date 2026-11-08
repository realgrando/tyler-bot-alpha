"""
core/config.py — Constantes Globais e Configuração Dinâmica do Life OS v5.0
===========================================================================
Lê dinamicamente o arquivo config/user_config.json e resolve os caminhos do
Obsidian Vault, estado local, coordenadas meteorológicas e mapeamento de classes.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# Raiz da Skill do Agente
SKILL_ROOT: Path = Path(__file__).resolve().parent.parent
CONFIG_DIR: Path = SKILL_ROOT / "config"
CONFIG_FILE: Path = CONFIG_DIR / "user_config.json"
STATE_DIR: Path = SKILL_ROOT / "state"
RESOURCES_DIR: Path = SKILL_ROOT / "resources"
SOPS_DIR: Path = SKILL_ROOT / "sops"
SUBAGENTS_DIR: Path = SKILL_ROOT / "subagents"

HOME_DIR: Path = Path.home()
LOCAL_BIN_DIR: Path = HOME_DIR / ".local" / "bin"

# Lê configuração do usuário
_DEFAULT_CONFIG: Dict[str, Any] = {
    "onboarding_completed": False,
    "user_name": "Usuário",
    "user_nickname": "Amigo",
    "agent_name": "Jarvis",
    "agent_tone": "direct_pragmatic",
    "vault_path": "",
    "city": "São Paulo",
    "state": "SP",
    "country": "BR",
    "lat": -23.5505,
    "lon": -46.6333,
    "timezone": "America/Sao_Paulo",
    "features": {
        "anki": True,
        "google_cli": False,
        "git_pow": True,
        "weather_sync": True,
    },
}

def load_user_config() -> Dict[str, Any]:
    """Lê config/user_config.json com fallback para defaults seguros."""
    if CONFIG_FILE.exists():
        try:
            data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            cfg = dict(_DEFAULT_CONFIG)
            cfg.update(data)
            return cfg
        except Exception:
            pass
    return dict(_DEFAULT_CONFIG)

def save_user_config(cfg: Dict[str, Any]) -> None:
    """Grava mutações no arquivo config/user_config.json."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

USER_CONFIG = load_user_config()

# Resolução do Vault Root
_custom_vault = USER_CONFIG.get("vault_path")
if _custom_vault and Path(_custom_vault).exists():
    VAULT_ROOT: Path = Path(_custom_vault).resolve()
elif (SKILL_ROOT.parent / "vault-template").exists():
    VAULT_ROOT: Path = (SKILL_ROOT.parent / "vault-template").resolve()
elif (HOME_DIR / "vault").exists():
    VAULT_ROOT: Path = (HOME_DIR / "vault").resolve()
elif (HOME_DIR / "Documentos" / "Obsidian Vault").exists():
    VAULT_ROOT: Path = (HOME_DIR / "Documentos" / "Obsidian Vault").resolve()
else:
    VAULT_ROOT: Path = (SKILL_ROOT.parent / "vault-template").resolve()

CENTRAL_DIR: Path = VAULT_ROOT / "Central"
CLASSES_DIR: Path = CENTRAL_DIR / "Configs" / "Classes"
TEMPLATES_DIR: Path = CENTRAL_DIR / "Configs" / "Templates"
SCRIPTS_DIR: Path = CENTRAL_DIR / "Configs" / "Scripts"
KINETIC_ENGINE_SCRIPT: Path = SCRIPTS_DIR / "vault_kinetic_engine.py"

SQLITE_DB_PATH: Path = STATE_DIR / "memory.db"
TODAY_STREAM_PATH: Path = STATE_DIR / "today_stream.md"
HOT_PALACE_PATH: Path = STATE_DIR / "memory_hot_palace.md"
COLD_ARCHIVE_PATH: Path = STATE_DIR / "memory_cold_archive.md"

ANKI_DB_PATH: Path = HOME_DIR / ".local" / "share" / "Anki2" / "Usuário 1" / "collection.anki2"
CODE_WORKSPACE_DIR: Path = HOME_DIR / "Code"

# Parâmetros Meteorológicos
LATITUDE: float = float(USER_CONFIG.get("lat", -23.5505))
LONGITUDE: float = float(USER_CONFIG.get("lon", -46.6333))
TIMEZONE: str = str(USER_CONFIG.get("timezone", "America/Sao_Paulo"))
TIMEZONE_URL: str = TIMEZONE.replace("/", "%2F")

# Mapeamento de Classes para Pastas Físicas
CLASS_FOLDER_MAP: Dict[str, Path] = {
    "classBase": CENTRAL_DIR / "Configs" / "Classes",
    "classTracked": CENTRAL_DIR / "Configs" / "Classes",
    "classProject": CENTRAL_DIR / "Professional" / "Projects",
    "classVenture": CENTRAL_DIR / "Professional" / "Ventures",
    "classGoal": CENTRAL_DIR / "Personal" / "Targets",
    "classMetric": CENTRAL_DIR / "Personal" / "Targets",
    "classDaily": CENTRAL_DIR / "Personal" / "Journal",
    "classCycle": CENTRAL_DIR / "Personal" / "Cycles",
    "classZettel": CENTRAL_DIR / "Study" / "Knowledge",
    "classLiterature": CENTRAL_DIR / "Study" / "Literature",
    "classSubject": CENTRAL_DIR / "Study" / "Subjects",
    "classCourse": CENTRAL_DIR / "Study" / "Sources" / "Courses",
    "classBook": CENTRAL_DIR / "Study" / "Sources" / "Books",
    "classMovie": CENTRAL_DIR / "Study" / "Sources" / "Movies",
    "classPerson": CENTRAL_DIR / "Study" / "People",
    "classDoc": CENTRAL_DIR / "Professional" / "Docs",
    "classSwipe": CENTRAL_DIR / "Studio" / "Swipes",
    "classThought": CENTRAL_DIR / "Personal" / "Thoughts",
    "classProduction": CENTRAL_DIR / "Studio" / "Productions",
    "classHub": CENTRAL_DIR / "Hubs",
}

CLASS_TEMPLATE_MAP: Dict[str, str] = {
    "classProject": "Project.md",
    "classVenture": "Venture.md",
    "classGoal": "Goal.md",
    "classMetric": "Metric.md",
    "classDaily": "Daily.md",
    "classCycle": "Cycle.md",
    "classZettel": "Zettel.md",
    "classLiterature": "Literature.md",
    "classSubject": "Subject.md",
    "classCourse": "Course.md",
    "classBook": "Book.md",
    "classMovie": "Movie.md",
    "classPerson": "Person.md",
    "classDoc": "Doc.md",
    "classSwipe": "Swipe.md",
    "classThought": "Thought.md",
    "classProduction": "Production.md",
    "classHub": "Hub.md",
}

CLASS_NOTE_MARKER: Dict[str, str] = {
    "classVenture": "**Venture Note:**",
    "classProject": "**Project Note:**",
    "classDoc": "**Doc Note:**",
    "classSubject": "**Subject Note:**",
    "classBook": "**Book Note:**",
    "classCourse": "**Course Note:**",
    "classMovie": "**Movie Note:**",
    "classLiterature": "**Literature Note:**",
    "classZettel": "**Zettel Note:**",
    "classPerson": "**Person Note:**",
    "classProduction": "**Production Note:**",
    "classSwipe": "**Swipe Note:**",
    "classCycle": "**Cycle Note:**",
    "classGoal": "**Goal Note:**",
    "classMetric": "**Metric Note:**",
    "classThought": "**Thought Note:**",
}

MONTH_FOLDERS = [
    "01-January", "02-February", "03-March", "04-April",
    "05-May", "06-June", "07-July", "08-August",
    "09-September", "10-October", "11-November", "12-December",
]

def get_daily_path(dt: datetime | None = None) -> Path:
    """Calcula o caminho canônico da Daily Note dentro do Vault."""
    target = dt or datetime.now()
    year_str = target.strftime("%Y")
    month_idx = target.month - 1
    month_folder = MONTH_FOLDERS[month_idx]
    _, iso_week, _ = target.isocalendar()
    sprint_folder = f"Sprint-{iso_week:02d}"
    filename = target.strftime("%d-%m-%Y.md")
    return CENTRAL_DIR / "Personal" / "Journal" / year_str / month_folder / sprint_folder / filename


def get_season_south(dt: datetime | None = None) -> str:
    """Calcula a estação climática no Hemisfério Sul para a data fornecida."""
    target = dt or datetime.now()
    m, d = target.month, target.day
    if (m == 12 and d >= 21) or m in (1, 2) or (m == 3 and d < 20):
        return "summer"
    if (m == 3 and d >= 20) or m in (4, 5) or (m == 6 and d < 21):
        return "autumn"
    if (m == 6 and d >= 21) or m in (7, 8) or (m == 9 and d < 22):
        return "winter"
    return "spring"

MANDATORY_DAILY_FIELDS: Dict[str, List[str]] = {
    "bio_sleep_weight": ["bio_weight", "bio_last_meal_time"],
    "bio_training_health": ["bio_skin_barrier", "bio_gut_state"],
    "execution": ["exec_deep_work_h", "exec_screen_time_h"],
    "polymathy": ["poly_mode", "poly_depth", "poly_cross_pollination"],
    "cognition_temperance": ["cog_day_rating", "cog_hunger"],
    "habits_entropy": [
        "h_clean_diet", "h_nutrition_goal", "h_water_goal", "h_creatine",
        "h_sunlight_am", "h_clean_qg", "h_spiritual_anchor", "h_wind_down",
    ],
    "semantic_logs": ["ctx_poly_log"],
}

VALID_EVENT_CATEGORIES: List[str] = [
    "work", "study", "bio", "thought", "temperance", "studio", "system",
]
