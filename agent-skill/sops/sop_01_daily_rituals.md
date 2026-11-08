# SOP 01: RITUAIS DIÁRIOS (BOOT MATINAL, INGESTÃO E SHUTDOWN)

Protocolo determinístico para os 3 momentos operacionais do dia: o **Boot Matinal**, a **Ingestão Contínua** e o **Fechamento Noturno (Shutdown)**.

---

## 🌅 1. BOOT MATINAL (Primeira Interação do Dia)

### Gatilho
Quando o usuário disser *"Bom dia"*, *"Iniciando o dia"* ou ao abrir o chat pela manhã.

### Procedimento
1. **Disparo do Core Boot:**
   Execute silenciosamente no terminal:
   `python3 -m core.cli boot`
   *(Ou utilize o comando global instalado `life-os boot`).*
2. **Efeitos Determinísticos Executados:**
   - Garante que a Daily Note de hoje existe na pasta de Sprint correta.
   - Sincroniza os sensores meteorológicos Open-Meteo da localidade do usuário diretamente no frontmatter YAML e no SQLite.
   - Roda o tick do Motor Cinético (`vault_kinetic_engine.py`) para verificar o estado térmico do cofre.
   - Retorna as metas ativas do Ciclo Vigente (`Cycle 1.md`), eventos agendados e pendências de estudo/revisão.
3. **Briefing Matinal:**
   Apresente um resumo executivo:
   - Clima da cidade e horário do nascer do sol.
   - Foco #1 do dia em trabalho/projetos e compromissos.
   - Grade física do Ciclo e hábitos essenciais.

---

## ⚡ 2. INGESTÃO CONTÍNUA (Ao Longo do Dia)

### Gatilho
Sempre que o usuário relatar qualquer fato de rotina, treino, café, horas trabalhadas, ideias, leituras ou desabafos durante o dia.

### Procedimento
1. **Execução Imediata de Ingestão:**
   `python3 -m core.cli ingest --cat <work|study|bio|thought|temperance|studio|system> --summary "<resumo>" [--set key=val ...] [--wake "[[Entidade1]],[[Entidade2]]"]`
2. **Efeitos Determinísticos:**
   - Registra o evento transacionalmente na tabela `day_events` do SQLite (`memory.db`).
   - Adiciona imediatamente a linha correspondente no espelho legível `state/today_stream.md`.
   - Se `--set` for passado, atualiza cirurgicamente o YAML da Daily Note sem alterar o corpo da nota.
   - Se `--wake` for passado, propaga calor térmico Bottom-Up nas notas citadas.

---

## 🌙 3. FECHAMENTO NOTURNO (Shutdown)

### Gatilho
Quando o usuário disser *"Boa noite"*, *"Fechando o dia"* ou similar ao final do dia.

### Procedimento
1. **Execução do Core Shutdown:**
   `python3 -m core.cli shutdown`
2. **Auditoria de Pendências:**
   - O comando lista a `TIMELINE_DO_DIA` completa registrada no SQLite.
   - Lista os `CAMPOS_VAZIOS_OBRIGATORIOS` por eixo que ainda faltam na Daily Note de hoje.
3. **Interação com o Usuário:**
   - Apresente os eventos já computados e pergunte de forma concisa e direta apenas pelos campos faltantes.
4. **Fechamento e Consolidação:**
   - Aplique as respostas com `python3 -m core.cli ingest --set ...`.
   - Redija a narrativa do dia em primeira pessoa no corpo da Daily Note (`The Day`).
   - Atualize `state/memory_hot_palace.md` e conclua o dia com a lousa zerada!
