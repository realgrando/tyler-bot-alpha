# LIFE OS v5.0 — The Deterministic Second Brain & Agent Kernel

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Obsidian v1.5+](https://img.shields.io/badge/obsidian-v1.5+-purple.svg)](https://obsidian.md/)
[![SQLite WAL](https://img.shields.io/badge/sqlite-WAL%20mode-green.svg)](https://www.sqlite.org/wal.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Life OS v5.0** is an open-source, hybrid personal operating system. It fuses a **Markdown Cognitive Cortex** (human-readable in Obsidian & VS Code) with a **Deterministic Python & SQLite Spine** (`life-os` CLI) to eliminate LLM schema hallucinations, prevent context loss, and enforce mathematical Third Normal Form (3NF) relational integrity across your life, ventures, and polymathic studies.

---

## 💡 A IDEIA (THE CONCEPT)

Traditional AI second brains fail because LLMs hallucinate metadata enums, break YAML delimiters (`---`), lose conversational context, and let notes rot. 

**Life OS v5.0 solves this with a two-tier hybrid architecture:**
1. **Cognitive Cortex (Obsidian Markdown):** 20 strictly typed OOP classes (`Central/Configs/Classes/`), dynamic dataview dashboards, and canonical templates. Human-editable and visually stunning.
2. **Deterministic Spine (Python + SQLite WAL):** A sub-15ms CLI engine (`life-os`) that acts as a relational gatekeeper, syncs real-world barometric weather sensors, logs events to an immutable SQLite journal, and propagas heat upward via a Proof-of-Work (PoW) thermodynamic engine.

```text
┌────────────────────────────────────────────────────────┐
│                   HUMAN / AGENT CHAT                   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 LIFE OS KERNEL (v5.0)                  │
│   [Cortex in Markdown]       [Deterministic Spine]     │
│   • 20 OOP Classes (3NF)     • schema_loader.py (<10ms)│
│   • 22 Rich Templates        • vault_crud.py (Gate)    │
│   • SOPs & Cognitive Profile • integrations.py (Sensors)│
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐┌───────────────────────────┐
│     SQLITE WAL STATE      ││    OBSIDIAN VAULT 3NF     │
│  • memory.db (Events)     ││  • Central/Hubs (6 Roots) │
│  • today_stream.md        ││  • Central/Professional   │
│  • Hot Palace (<6 KB)     ││  • Central/Study (Zettel) │
└───────────────────────────┘└───────────────────────────┘
```

---

## 📁 A ESTRUTURA (STRUCTURE)

```text
.
├── install.sh                  # One-line installer (symlinks CLI & sets timers)
├── vault-template/             # Clean Obsidian Vault ready for use
│   ├── .obsidian/              # Community plugins (Dataview, Metadata Menu, etc.)
│   └── Central/
│       ├── Configs/Classes/    # 20 OOP metadata schema definitions
│       ├── Configs/Templates/  # 22 Canonical templates with relational footers
│       ├── Configs/Scripts/    # Dynamic Dataview HUDs & views_relacionais.js
│       ├── Hubs/               # 6 Sovereign root hubs (Life, Work, Academy...)
│       ├── Personal/           # Cycles, Journal (Dailies), Targets, Thoughts
│       ├── Professional/       # Ventures, Projects, Docs
│       └── Study/              # Subjects, Sources, Literature, Knowledge (MOCs)
└── agent-skill/                # The Agent Kernel & Python Spine
    ├── SKILL.md                # 4-stage turn contract for AI coding assistants
    ├── config/user_config.json # User settings, city coordinates, features
    ├── resources/              # Cognitive profile & daily telemetry schema
    ├── sops/                   # Standard Operating Procedures (SOP 00 to 06)
    └── core/                   # Deterministic Python SDK & CLI (`life-os`)
```

---

## 🚀 BOOT GÊNESE DIRETO PELO CLI (FIRST-TIME SETUP)

Configurar o seu Life OS leva menos de **2 minutos** diretamente no terminal, sem precisar de IA:

### 1. Clone o repositório e execute o instalador
```bash
git clone https://github.com/realgrando/tyler-bot-alpha.git life-os
cd life-os
chmod +x install.sh
./install.sh
```
*O instalador compila o core e cria o comando global `life-os` (e `tyler-core`) em `~/.local/bin/`.*

### 2. Execute o Boot Gênese Interativo no Terminal
Este comando roda o wizard interativo que coleta seus dados e personaliza seu ambiente:
```bash
life-os init-user -i
```
O assistente perguntará:
- **Seu Nome e Apelido:** Como o sistema e o agente devem te chamar.
- **Nome do Co-Piloto:** (Ex: `Tyler`, `Jarvis`, `Atlas`).
- **Tom de Comunicação:** (`direct_pragmatic` | `socratic_mentor` | `technical_architect`).
- **Sua Cidade e País:** Resolve latitude, longitude e fuso horário para os sensores meteorológicos.
- **Caminho do Vault:** Pressione `Enter` para usar o `./vault-template` padrão.

> ⚡ **Alternativa Não-Interativa (1-Liner):**
> ```bash
> life-os init-user --name "Seu Nome" --nickname "Apelido" --agent-name "Tyler" --tone direct_pragmatic --city "São Paulo" --state "SP" --complete
> ```

### 3. Execute o Primeiro Boot Matinal
```bash
life-os boot
```
Em menos de 2 segundos, o comando:
- Cria a **Daily Note** de hoje com os 85 campos de telemetria.
- Sincroniza o clima real da sua cidade via Open-Meteo (incluindo variação barométrica `env_pressure_delta`).
- Inicializa o **Ciclo Ativo** e roda o tick cinético no Vault.
- Exibe o HUD inicial pronto para ação.

### 4. Abra o Cofre no Obsidian
1. Abra o **Obsidian Desktop** ➔ *Open folder as vault*.
2. Selecione a pasta `vault-template/`.
3. Habilite os plugins comunitários recomendados (**Dataview** e **Metadata Menu**).
4. Seu painel relacional e HUD diário já estarão ativos e renderizando perfeitamente!

---

## ⚡ OPERAÇÃO DIÁRIA NO TERMINAL (`life-os`)

Você pode governar todo o seu sistema através da CLI:

```bash
# 1. Boot Matinal (Sincroniza clima, tick térmico e telemetria matinal)
life-os boot

# 2. Ingestão Contínua (Salva fatos no SQLite WAL, espelha no today_stream e atualiza a Daily)
life-os ingest --cat work --summary "Reunião de alinhamento e deploy do CRM" --wake "Core Project v1" --set "exec_deep_work_h=+2" "bio_caffeine_doses=+1"

# 3. Status Instantâneo (<15ms via SQLite local para hidratação de contexto)
life-os status

# 4. Sincronização Meteorológica Exógena (Pressão, temp, umidade, qualidade do ar)
life-os weather-sync

# 5. Gatekeeper 3NF de Notas (Validação estrita de classes e herança)
life-os note create --class classZettel --title "Separação de Conceitos" --parent "[[SOLID Principles MOC]]" --props '{"Subtype":"atomic"}'
life-os note update "Core Project v1" --props '{"Status":"in_progress"}'
life-os note progress "Clean Architecture Book" --add 20
life-os note validate "Main Venture" --fix

# 6. Fechamento Noturno (Auditoria de campos vazios, Anki e fechamento de ciclo)
life-os shutdown
```

---

## 🤖 INTEGRAÇÃO COM AGENTES DE IA (AI CO-PILOT)

Se você utiliza **Antigravity, Cursor, Claude Code, Cline** ou qualquer assistente inteligente:
1. Aponte a pasta `agent-skill/` nas configurações de skills/tools do seu assistente.
2. O assistente lerá [`agent-skill/SKILL.md`](agent-skill/SKILL.md) e seguirá o **Contrato Inquebrável de 4 Estágios do Turno**:
   - `core boot` silencioso ao iniciar o dia.
   - `core ingest` automático em cada fato conversacional.
   - `core note` para qualquer criação/edição no cofre (com validação dinâmica de enums).
   - `core shutdown` estruturado ao final da noite.

---

## 📜 LICENÇA

Distribuído sob a licença [MIT](LICENSE). Construído para engenheiros de alta agência, polímatas e mentes focadas em tração real.
