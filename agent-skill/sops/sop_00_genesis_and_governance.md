# SOP 00: PROTOCOLO GÊNESE & META-GOVERNANÇA VIVA

Este documento rege as duas capacidades fundamentais do Life OS:
1. **O Protocolo Gênese:** Ativado na primeiríssima interação com um novo usuário para auto-construir o Segundo Cérebro e personalizar o agente através de um diálogo humano turno a turno.
2. **A Meta-Governança Viva:** O motor de auto-evolução contínua que expande taxonomias, customiza classes e refina procedimentos operacionais durante o uso diário.

---

## 🚀 CAPACIDADE 1: PROTOCOLO GÊNESE (Interactive Turn-by-Turn Architect)

### ⛔ REGRA DE OURO INQUEBRÁVEL (PARE O TURNO)
O Protocolo Gênese **NUNCA DEVE SER EXECUTADO DE FORMA AUTÔNOMA OU EM UM ÚNICO TURNO**.
É TERMINANTEMENTE PROIBIDO:
- Simular as respostas do usuário.
- Preencher o perfil com dados inventados.
- Avançar mais de 1 etapa no mesmo turno.
- Marcar `onboarding_completed: true` sem a confirmação e resposta explícita do usuário a cada etapa.

**Modo Terminal Alternativo:**
Se o usuário preferir configurar tudo diretamente via linha de comando sem diálogo no chat, ele pode rodar a qualquer momento no terminal:
```bash
python3 -m core.cli init-user -i
```

---

### Fluxo de Conversação Turno a Turno (Chat IA):

#### Turno 1: Apresentação, Identidade & Clima
- **O que o Agente faz:**
  Apresenta-se calorosamente como o Co-Piloto Estratégico e Arquiteto do Life OS v5.0, explicando brevemente que fará 4 perguntas rápidas para configurar o ambiente.
  Em seguida, faz **APENAS as perguntas da Etapa 1**:
  1. *Qual o seu nome completo e como prefere que eu te chame no dia a dia?*
  2. *Como deseja nomear o seu co-piloto/agente pessoal? (Ex: Tyler, Jarvis, Atlas, Athena, etc.)*
  3. *Qual o tom de comunicação que você prefere?*
     - `direct_pragmatic` (Direto ao ponto, pragmático, zero enrolação — Recomendado)
     - `socratic_mentor` (Mentor reflexivo, estimula profundidade e síntese)
     - `technical_architect` (Engenheiro de software sênior, altamente técnico)
  4. *Qual a sua cidade, estado e país de residência? (Para sincronização meteorológica automática)*
- **Ação Obrigatória do Agente:**
  **PARE IMEDIATAMENTE A SUA RESPOSTA.** Não chame nenhuma ferramenta adicional de criação de notas ou conclusão. Aguarde a resposta digitada do usuário!

---

#### Turno 2: Arquitetura Profissional (`Central/Professional/`)
- **O que o Agente faz ao receber a resposta da Etapa 1:**
  1. Salva a identidade no sistema determinístico:
     ```bash
     python3 -m core.cli init-user --name "<Nome>" --nickname "<Apelido>" --agent-name "<Agente>" --tone "<Tom>" --city "<Cidade>" --state "<UF>" --country "<País>"
     ```
  2. Sincroniza o clima real imediatamente:
     ```bash
     python3 -m core.cli weather-sync
     ```
  3. Confirma os dados salvos com entusiasmo e faz as perguntas da **Etapa 2**:
     - *Em quais frentes profissionais, empresas, agências, produtos ou empreendimentos você atua hoje?*
     - *Quais são os 1 a 3 projetos ativos mais importantes em andamento neste momento?*
- **Ação Obrigatória do Agente:**
  **PARE O TURNO.** Aguarde a resposta digitada do usuário!

---

#### Turno 3: Árvore Intelectual & Academy (`Central/Study/`)
- **O que o Agente faz ao receber a resposta da Etapa 2:**
  1. Cria as notas reais de `classVenture` e `classProject` via Gatekeeper:
     ```bash
     python3 -m core.cli note create --class classVenture --title "<Nome da Venture>" --parent "Work" --props '{"Role":"Fundador","Priority":5,"Status":"in_progress"}'
     python3 -m core.cli note create --class classProject --title "<Nome do Projeto>" --parent "<Nome da Venture>" --props '{"Subtype":"product","Status":"in_progress","Priority":5}'
     ```
  2. Confirma as notas criadas e faz as perguntas da **Etapa 3**:
     - *Quais são as 3 a 5 grandes áreas do conhecimento que você estuda ativamente ou deseja dominar? (Ex: Engenharia de Software, Filosofia, Saúde/Fisiologia, Finanças, Cinema)*
     - *Quais são os livros, cursos ou fontes de estudo que você está consumindo no momento?*
- **Ação Obrigatória do Agente:**
  **PARE O TURNO.** Aguarde a resposta digitada do usuário!

---

#### Turno 4: Protocolo Biológico & Metas do Ano (`Central/Personal/`)
- **O que o Agente faz ao receber a resposta da Etapa 3:**
  1. Cria os `classSubject` raiz apontando para `[[Academy]]` e os `classBook` / `classCourse` vinculados aos assuntos:
     ```bash
     python3 -m core.cli note create --class classSubject --title "<Área>" --parent "Academy" --props '{"Status":"in_progress","Mastery":2,"Difficulty":3}'
     python3 -m core.cli note create --class classBook --title "<Nome do Livro>" --parent "<Área>" --props '{"Author":"<Autor>","Status":"in_progress","Target":300,"Current":0}'
     ```
  2. Confirma a criação e faz as perguntas finais da **Etapa 4**:
     - *Qual é a sua rotina ideal de sono (horário médio de dormir e acordar) e rotina de atividade física semanal?*
     - *Quais são as 2 a 3 metas mestras inegociáveis que você deseja conquistar até o final do ano/ciclo?*
- **Ação Obrigatória do Agente:**
  **PARE O TURNO.** Aguarde a resposta digitada do usuário!

---

#### Turno 5: Consolidação, Boot Inicial & Celebração
- **O que o Agente faz ao receber a resposta da Etapa 4:**
  1. Cria as metas anuais em `Central/Personal/Targets/`:
     ```bash
     python3 -m core.cli note create --class classGoal --title "<Nome da Meta>" --parent "Life" --props '{"Status":"in_progress","Priority":5,"Deadline":"31-12-2026","Target":100,"Current":0,"Progress":0}'
     ```
  2. Atualiza a nota de ciclo `Central/Personal/Cycles/Cycle 1.md` com o alvo de rotina e sono do usuário.
  3. Marca o onboarding como 100% concluído no sistema determinístico:
     ```bash
     python3 -m core.cli init-user --complete
     ```
  4. Executa o boot matinal inicial do sistema:
     ```bash
     python3 -m core.cli boot
     ```
  5. Apresenta o HUD de boas-vindas com o cofre pronto, telemetria ativa e convite para a primeira sessão de foco ou registro do dia!

---

## 🧬 CAPACIDADE 2: AUTO-EVOLUÇÃO CONTÍNUA (Meta-Governança Viva)

O Life OS foi desenhado para evoluir organicamente conforme o usuário cresce, sem intervenção em código Python.

### 1. Auto-Expansão de Taxonomia (Novos Assuntos e MOCs)
- **Novas Disciplinas:** Se o usuário começar a registrar notas sobre um campo inédito, o agente sugere e cria o novo `classSubject` no `Central/Study/Subjects/`.
- **Regra de Emergência de MOCs (Threshold 5+):** Quando um Sub-Subject acumular **5 ou mais Zettels atômicos** que orbitam um mesmo sub-tópico específico, o agente propõe proativamente:
  > *"Identifiquei 5 notas atômicas sobre [Tópico] em [[Sub-Subject]]. Proponho sintetizá-las em um novo MOC: `[[Tópico MOC]]`. Posso criar?"*
  Ao receber confirmação, o agente cria a nota `classZettel` com `Subtype: moc`, aponta seu `Parent` para o Sub-Subject, e atualiza o `Parent` dos 5 Zettels filhos para o novo MOC.

### 2. Auto-Customização de Classes e Telemetria
- Se o usuário desejar rastrear um novo hábito, biomarcador ou métrica na Daily Note (ou adicionar um campo em Projetos/Livros):
  1. O agente edita diretamente o arquivo de classe correspondente em `Central/Configs/Classes/class*.md` (adicionando a propriedade com seu respectivo tipo e valores válidos).
  2. Atualiza o template correspondente em `Central/Configs/Templates/*.md`.
  3. Como o `core/schema_loader.py` lê os arquivos Markdown em tempo real, a nova propriedade passa a ser validada instantaneamente pelo Gatekeeper, com **zero recompilação e zero hardcoding**.

### 3. Matriz de Impacto Cruzado para Mudanças Estruturais
Toda alteração deve respeitar a matriz de integridade:

| Se alterar... | Deve obrigatoriamente sincronizar... |
| :--- | :--- |
| **Classes / Enums** | `Central/Configs/Classes/*.md` ➔ `Central/Configs/Templates/*.md` ➔ `resources/vault_ontology_guide.md` |
| **Telemetria Daily**| `Central/Configs/Classes/classDaily.md` ➔ `Templates/Daily.md` ➔ `resources/daily_yaml_schema.md` ➔ `core/config.py (MANDATORY_FIELDS)` |
| **Rituais / Hábitos**| `resources/cognitive_profile.md` ➔ `sops/sop_01_daily_rituals.md` ➔ `Central/Personal/Cycles/Cycle 1.md` |
| **Automações CLI** | `agent-skill/core/cli.py` ➔ `agent-skill/SKILL.md` ➔ `sops/sop_03_vault_crud.md` |
