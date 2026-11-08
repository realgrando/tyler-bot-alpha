# SOP 00: PROTOCOLO GÊNESE & META-GOVERNANÇA VIVA

Este documento rege as duas capacidades mais poderosas do Life OS:
1. **O Protocolo Gênese:** Ativado na primeiríssima interação com um novo usuário para auto-construir o Segundo Cérebro e personalizar o agente.
2. **A Meta-Governança Viva:** O motor de auto-evolução contínua que expande taxonomias, customiza classes e refina procedimentos operacionais durante o uso diário.

---

## 🚀 CAPACIDADE 1: PROTOCOLO GÊNESE (First-Boot Interactive Architect)

### Gatilho de Ativação
Sempre que o agente iniciar um turno e detectar que `config/user_config.json` possui `"onboarding_completed": false`, o agente assume imediatamente o papel de **Arquiteto de Onboarding**. 

Em vez de responder com comandos técnicos, o agente saúda o usuário com calor e conduz um onboarding fluido em 4 passos:

### Passo 1: Identidade, Agente & Clima
- Pergunta:
  1. Como o usuário se chama e como prefere ser chamado (apelido ou pronome de tratamento).
  2. Como ele deseja nomear o seu agente pessoal (ex: Jarvis, Tyler, Atlas, Athena, etc.).
  3. Qual o tom de comunicação preferido (`direct_pragmatic` | `socratic_mentor` | `technical_architect`).
  4. Qual a sua cidade e estado/país.
- **Ação do Agente:**
  - O agente resolve a latitude, longitude e timezone da cidade informada.
  - Executa: `python3 -m core.cli init-user --name "<Nome>" --nickname "<Apelido>" --agent-name "<Agente>" --tone "<Tom>" --city "<Cidade>" --lat <Lat> --lon <Lon> --timezone "<Timezone>"`
  - Sincroniza o clima real imediatamente via `python3 -m core.cli weather-sync`.

### Passo 2: Arquitetura Profissional (`Central/Professional/`)
- Pergunta:
  1. Em quais frentes, empresas, agências, produtos ou empreendimentos o usuário atua hoje?
  2. Quais são os 1 a 3 projetos ativos mais importantes em andamento?
- **Ação do Agente:**
  - Usa o `core note create --class classVenture ...` para instanciar as Ventures reais do usuário.
  - Usa o `core note create --class classProject ...` para criar os Projetos filhos com `Parent: "[[Venture]]"`.
  - Remove com segurança a nota exemplo `Main Venture.md` e `Core Project v1.md`.

### Passo 3: Árvore Intelectual & Academy (`Central/Study/`)
- Pergunta:
  1. Quais são as 3 a 5 grandes áreas do conhecimento que o usuário estuda ou quer dominar (ex: Ciência da Computação, Filosofia, Finanças, Medicina, Idiomas)?
  2. Quais são os livros ou cursos que ele está consumindo ativamente hoje?
- **Ação do Agente:**
  - Cria os `classSubject` raiz apontando para `Parent: "[[Academy]]"`.
  - Cria os sub-assuntos necessários.
  - Cria os `classBook` e `classCourse` ativos vinculados ao assunto correspondente, com `Target` estimado e `Current: 0`.

### Passo 4: Protocolo Biológico & Metas (`Central/Personal/`)
- Pergunta:
  1. Qual a sua rotina de sono (janela ideal), treino físico (grade semanal) e hábitos essenciais?
  2. Quais são as 3 grandes metas inegociáveis para o ano vigente?
- **Ação do Agente:**
  - Atualiza o `Central/Personal/Cycles/Cycle 1.md` com a janela de sono, alvos e grade do usuário.
  - Cria as metas em `Central/Personal/Targets/` (`classGoal` com `Parent: "[[Life]]"`).
  - Preenche o `resources/cognitive_profile.md` com o perfil personalizado do usuário.
  - Marca `"onboarding_completed": true` no `config/user_config.json`.
  - Apresenta o HUD de boas-vindas com o cofre pronto para tração máxima!

---

## 🧬 CAPACIDADE 2: AUTO-EVOLUÇÃO CONTÍNUA (Meta-Governança Viva)

O Life OS foi desenhado para evoluir organicamente conforme o usuário cresce, sem intervenção em código Python.

### 1. Auto-Expansão de Taxonomia (Novos Assuntos e MOCs)
- **Novas Disciplinas:** Se o usuário começar a despejar anotações sobre um campo inédito, o agente sugere e cria imediatamente o novo `classSubject` no `Central/Study/Subjects/`.
- **Regra de Emergência de MOCs (Threshold 5+):** Quando um Sub-Subject acumular **5 ou mais Zettels atômicos** que orbitam um mesmo sub-tópico específico, o agente propõe proativamente:
  > *"Identifiquei 5 notas atômicas sobre [Tópico] em [[Sub-Subject]]. Proponho sintetizá-las em um novo MOC: `[[Tópico MOC]]`. Posso criar?"*
  Ao receber confirmação, o agente cria a nota `classZettel` com `Subtype: moc`, aponta seu `Parent` para o Sub-Subject, e atualiza o `Parent` dos 5 Zettels filhos para o novo MOC.

### 2. Auto-Customização de Classes e Telemetria
- Se o usuário desejar rastrear um novo hábito, biomarcador ou métrica na Daily Note (ou adicionar um campo em Projetos/Livros):
  1. O agente edita diretamente o arquivo de classe correspondente em `Central/Configs/Classes/class*.md` (adicionando a propriedade com seu respectivo tipo e valores válidos).
  2. Atualiza o template correspondente em `Central/Configs/Templates/*.md`.
  3. Como o `core/schema_loader.py` lê os arquivos Markdown em tempo real, a nova propriedade passa a ser validada instantaneamente pelo Gatekeeper, com **zero recompilação e zero hardcoding**.

### 3. Matriz de Impacto Cruzado para Novos Procedimentos (SOPs)
Toda mudança estrutural deve respeitar a matriz de integridade:

| Se alterar... | Deve obrigatoriamente sincronizar... |
| :--- | :--- |
| **Classes / Enums** | `Central/Configs/Classes/*.md` ➔ `Central/Configs/Templates/*.md` ➔ `resources/vault_ontology_guide.md` |
| **Telemetria Daily**| `Central/Configs/Classes/classDaily.md` ➔ `Templates/Daily.md` ➔ `resources/daily_yaml_schema.md` ➔ `core/config.py (MANDATORY_FIELDS)` |
| **Rituais / Hábitos**| `resources/cognitive_profile.md` ➔ `sops/sop_01_daily_rituals.md` ➔ `Central/Personal/Cycles/Cycle 1.md` |
| **Automações CLI** | `agent-skill/core/cli.py` ➔ `agent-skill/SKILL.md` ➔ `sops/sop_03_vault_crud.md` |
