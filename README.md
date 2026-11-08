# LIFE OS v5.0 — The Deterministic Second Brain & Agent Kernel

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Obsidian v1.5+](https://img.shields.io/badge/obsidian-v1.5+-purple.svg)](https://obsidian.md/)
[![SQLite WAL](https://img.shields.io/badge/sqlite-WAL%20mode-green.svg)](https://www.sqlite.org/wal.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Life OS v5.0** is an open-source, hybrid personal operating system and agentic second brain. It bridges a **Markdown Cognitive Cortex** (human-friendly in Obsidian and VS Code) with a **Deterministic Python & SQLite WAL Spine** (`life-os` CLI) to eradicate LLM schema hallucinations, prevent context loss, and guarantee rigorous mathematical structure across all areas of life, work, and polymathic study.

---

## 🏛️ ARCHITECTURE OVERVIEW

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        USER CONVERSATIONAL LAYER                       │
│           (Natural fluid chat via CLI, VS Code or Agentic UI)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      HYBRID AGENT KERNEL (v5.0)                        │
│                                                                        │
│   [Cortex in Markdown]                   [Deterministic Python Spine]  │
│   ├── SKILL.md (Turn Contract)           ├── schema_loader.py (Dynamic)│
│   ├── resources/ (Ontology & Schema)     ├── vault_crud.py (3NF Gate)  │
│   ├── sops/ (SOP 00 to SOP 06)           ├── kinetic_bridge.py (PoW)   │
│   └── subagents/ (Librarian/Engineer)    ├── integrations.py (Weather) │
│                                          └── cli.py (~/.local/bin)     │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       SQLITE WAL STATE MACHINE       │  │    OBSIDIAN VAULT v5.0 (3NF) │
│                                      │  │                              │
│   - memory.db (day_events WAL)       │  │   Central/                   │
│   - today_stream.md (Live Mirror)    │  │   ├── Hubs/ (6 Sovereign)    │
│   - memory_hot_palace.md (<6 KB)     │  │   ├── Professional/          │
│   - kinetic_events (Thermal Log)     │  │   ├── Study/ (Zettelkasten)  │
│                                      │  │   └── Personal/ (Journal)    │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 🌟 CORE INNOVATIONS

### 1. Zero-Hardcoding Dynamic Schema Loader
Unlike brittle agent setups with hardcoded JSON schemas or prompt instructions, `schema_loader.py` dynamically parses the Vault's class definition files (`Central/Configs/Classes/*.md`) at runtime. It resolves 3-level OOP inheritance (`classBase` ➔ `classTracked` ➔ Concrete Classes) and validates enums, allowed value lists, and numeric bounds directly against the markdown metadata.

### 2. Third Normal Form (3NF) Relational Integrity
- **Zero Orphans:** Every note created (with the sole exception of the sovereign root `Life.md`) must possess a valid, existing `Parent: "[[Parent Note]]"`.
- **Zero Layer Jumping:** Strict hierarchy prevents conceptual clutter (e.g., Projects belong to Ventures; Literature Notes belong to Books or Courses; Atomic Zettels belong to MOCs or Sub-Subjects).

### 3. Thermodynamic Kinetic Engine (Proof-of-Work)
Notes are dynamic thermal entities. Producing real work (e.g., adding an atomic zettel or literature lecture):
- **Wakes Ancestors:** Propagates heat up the tree from leaf to parent, waking paused projects and ventures to `Status: in_progress`.
- **Auto-Increments & Completes:** Increments `Current` counters on parent courses/books and automatically marks them `Status: done` with `Completed_At` timestamps when `Current >= Target`.
- **Auto-Pauses Inactivity:** A kinetic background tick cools inactive notes whose `inertia_ttl` has expired.

### 4. 85-Field Daily Flight Recorder & Exogenous Sensors
The daily note (`classDaily`) tracks **85 orthogonal fields across 7 axes**:
- **Environment (`env_`):** Automated Open-Meteo sync fetching min/max temp, humidity, WMO weather code, daylight hours, air quality, and **24-hour barometric pressure delta** (`env_pressure_delta`), an exogenous predictor of cognitive fatigue and headaches.
- **Biology & Sleep (`bio_`):** Bed/wake times, total hours, quality, sleep inertia, training load, caffeine doses, and clinical symptoms.
- **Execution (`exec_`):** Net deep work hours, screen time, cognitive load, flow state, fragmentation, and shipped outputs.
- **Polymathy (`poly_`):** Cross-pollination depth, domains studied, and synthesis modalities.
- **Cognition & Temperance (`cog_`):** Baseline mood, energy, drive source, clarity, working memory load, and subjective day rating.
- **Habits (`h_` / `bh_`):** Clean nutrition, hydration, morning sunlight, tidy environment, and containment of cheap dopamine.
- **Semantic Layer (`ctx_`):** Qualitative narrative logs and entity links.

---

## 🚀 THE GENESIS PROTOCOL (FIRST-BOOT ARCHITECT)

When a new user clones this template and opens the agent, the file `config/user_config.json` contains `"onboarding_completed": false`. The agent immediately assumes the role of **Onboarding Architect** (`sop_00_genesis_and_governance.md`):

1. **Identity & Location:** Collects user name, preferred agent name (e.g., Jarvis, Tyler, Atlas), communication tone (`direct_pragmatic`, `socratic_mentor`, `technical_architect`), and city (resolving latitude/longitude and timezone automatically).
2. **Professional Topology:** Inquires about current ventures, clients, and active projects, generating customized `classVenture` and `classProject` notes in `Central/Professional/`.
3. **Intellectual Tree (Academy):** Asks for core study domains and in-progress books/courses, generating `classSubject` trees, MOCs, and sources in `Central/Study/`.
4. **Biological Protocol & Goals:** Collects training splits, sleep windows, and annual targets, populating `Central/Personal/Cycles/Cycle 1.md`, `Central/Personal/Targets/`, and `resources/cognitive_profile.md`, then marks `"onboarding_completed": true`.

---

## 📦 DIRECTORY LAYOUT

```text
.
├── README.md                            # Comprehensive documentation
├── install.sh                           # One-line automated installer
├── .gitignore                           # Ignores WAL caches, secrets, and temp files
├── vault-template/                      # The Blank Obsidian Vault v5.0
│   ├── .obsidian/                       # Essential plugin configs (Dataview, Metadata Menu, etc.)
│   └── Central/
│       ├── Configs/
│       │   ├── Classes/                 # 20 MetadataMenu OOP Class Specifications
│       │   ├── Templates/               # 22 Canonical Templates + createNotesSystem.js
│       │   └── Scripts/                 # views_relacionais.js, hud_daily.js, vault_kinetic_engine.py
│       ├── Hubs/                        # 6 Sovereign Hubs (Life, Work, Academy, Library, Cinema, Studio)
│       ├── Personal/                    # Cycles, Journal (Dailies), Targets, Thoughts
│       ├── Professional/                # Ventures, Projects, Docs
│       ├── Studio/                      # Productions, Swipes (Excalidraw Visionboard)
│       ├── Study/                       # Subjects, Sources (Books/Courses/Movies), Literature, Knowledge
│       └── Archive/                     # Archived items
└── agent-skill/                         # The Hybrid Agent Kernel
    ├── SKILL.md                         # Turn contract & router
    ├── config/user_config.json          # User settings & onboarding state
    ├── resources/                       # Cognitive profile, ontology guide, daily schema
    ├── sops/                            # Standard Operating Procedures (SOP 00 to SOP 06)
    ├── subagents/                       # Librarian, Code Engineer, Vault Miner
    ├── core/                            # Deterministic Python SDK
    └── state/                           # Hot memory palace & SQLite WAL database
```

---

## ⚡ QUICKSTART & INSTALLATION

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/life-os-template.git
cd life-os-template
```

### 2. Run the Installer
```bash
./install.sh
```
The installer:
- Verifies Python 3.10+
- Compiles the Python SDK with zero errors
- Symlinks the global CLI to `~/.local/bin/life-os`
- Configures background `systemd --user` timers for morning boot (`05:00`) and weather sync (`07:00, 14:00, 21:00`)

### 3. Open the Vault in Obsidian
- Open **Obsidian Desktop** ➔ *Open folder as vault* ➔ Select `vault-template/`.
- Trust author and enable community plugins (Dataview, Metadata Menu, Templater).

### 4. Start Your Agent
Connect your AI coding assistant (or agent CLI) to `agent-skill/` and say:
> *"Hello, let's set up my Life OS."*

The **Genesis Protocol** will conduct your first-boot interview and construct your personal knowledge empire!

---

## 🛠️ CLI COMMAND REFERENCE (`life-os`)

```bash
# 1. Morning Boot (Initializes daily note, syncs weather, runs kinetic tick)
life-os boot [--quiet]

# 2. Continuous Ingest (Persists events to SQLite WAL and mirrors to markdown)
life-os ingest --cat work --summary "Completed sprint review and deployment" --wake "Core Project v1" --set "exec_deep_work_h=+2"

# 3. Sub-millisecond Status (<15ms instant telemetry hydration)
life-os status

# 4. Weather Sync (Open-Meteo barometric and meteorological sync)
life-os weather-sync

# 5. 3NF Note Gatekeeper
life-os note create --class classZettel --title "Separation of Concerns" --parent "[[SOLID Principles MOC]]" --props '{"Subtype":"atomic"}'
life-os note update "Core Project v1" --props '{"Status":"in_progress"}'
life-os note progress "Clean Architecture Book" --add 25
life-os note validate "Main Venture" [--fix]

# 6. Nightly Shutdown (Audits missing daily fields, reviews Anki status & timeline)
life-os shutdown
```

---

## 📜 LICENSE

Released under the [MIT License](LICENSE). Built for high-agency engineers, polymaths, and independent creators.
