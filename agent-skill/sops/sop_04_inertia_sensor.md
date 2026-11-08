# SOP 04: SENSOR DE INÉRCIA & TERMODINÂMICA CINÉTICA

Governa a física de calor e atividade de todas as entidades rastreáveis (`classTracked`) do Segundo Cérebro.

---

## 🔥 1. AQUECIMENTO POR PROOF-OF-WORK (Bottom-Up Auto-Wake)
- Quando o usuário produz uma nova aula (`classLiterature`), edita um documento (`classDoc`) ou avança um projeto:
  1. A nota tocada atualiza seu `Updated` e `mtime`.
  2. Se estava em `Status: paused` ou `inbox`, é promovida imediatamente para `Status: in_progress`.
  3. O calor sobe a hierarquia de `Parent`:
     - O Projeto e a Venture pai mudam para `Status: in_progress`.
     - O Curso ou Livro pai tem seu `Current` incrementado em +1.
     - Se `Current >= Target`, a entidade é finalizada como `Status: done` e grava `Completed_At`.
  4. O evento é registrado na tabela `kinetic_events` do SQLite.

---

## ❄️ 2. RESFRIAMENTO POR INATIVIDADE (Auto-Pause)
- Cada entidade rastreável possui um tempo de vida útil de inércia (`inertia_ttl` em dias):
  - Projetos e Cursos ativos: geralmente 5 a 7 dias.
  - Áreas e Assuntos: geralmente 14 dias.
- Se nenhuma atividade fática ocorrer na entidade ou em suas notas filhas dentro da janela de TTL, o motor cinético (`vault_kinetic_engine.py --tick`) altera suavemente seu status para `Status: paused`.
- Isso evita que o painel do usuário fique poluído com projetos fantasmas que não estão recebendo tração real.
