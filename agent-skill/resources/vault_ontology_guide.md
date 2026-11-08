# GUIA MESTRE DA ONTOLOGIA DO VAULT (v5.0)

Este documento é a Fonte Única da Verdade (SSOT) sobre a topologia física, herança de classes OOP (`Central/Configs/Classes/*.md`), regras relacionais 3NF e mecânica do Motor Cinético do Obsidian Vault v5.0. Toda operação de criação, edição ou progresso deve passar pelo gatekeeper determinístico `core note`.

---

## 🏛️ 1. TOPOLOGIA DE PASTAS & 3NF RELACIONAL

O Vault é estruturado em **Hubs Soberanos** e pastas semânticas limpas:

```text
Central/
├── Configs/              # Classes MetadataMenu, Templates e Scripts
│   ├── Classes/          # 20 Classes OOP com herança
│   ├── Templates/        # 22 Templates canônicos
│   └── Scripts/          # views_relacionais.js, hud_daily.js, vault_kinetic_engine.py
├── Hubs/                 # Os 6 Hubs Soberanos (Life, Work, Academy, Library, Cinema, Studio)
├── Personal/             # Cycles, Journal (Dailies), Targets (Goals/Metrics), Thoughts
├── Professional/         # Ventures, Projects, Docs
├── Studio/               # Productions, Swipes
├── Study/                # Subjects, Sources (Books, Courses, Movies), Literature, Knowledge (MOCs/Zettels), People
└── Archive/              # Notas consolidadas ou desativadas
```

### 1.1. Regra Fundamental da Terceira Forma Normal (3NF)
- **Zero Órfãos:** Toda nota criada (com exceção única de `Life.md`, a raiz soberana do grafo) deve possuir uma propriedade `Parent: "[[Nome do Pai]]"`.
- **Integridade Referencial:** O `Parent` apontado deve existir fisicamente no Vault no momento da criação.
- **Zero Salto de Camada:**
  - `classProject` aponta para uma `classVenture`.
  - `classDoc` aponta para um `classProject` ou `classVenture`.
  - `classLiterature` aponta para um `classBook` ou `classCourse`.
  - `classZettel` (MOC) aponta para um `classSubject`.
  - `classZettel` (Atomic) aponta para um `classZettel` (MOC) ou `classSubject`. Jamais aponte um Zettel atômico para um livro ou curso!

---

## 🧬 2. AS 20 CLASSES OOP DO METADATAMENU

Todas as classes concretas derivam de `classBase` ou de `classTracked`:

1. `classBase` (Raiz Universal): `Class`, `Parent`, `Created`, `Updated`, `Area`, `tags`, `Aliases`, `Pinned`.
2. `classTracked` (Estende `classBase`): Adiciona campos do Motor Cinético:
   - `Status: in_progress | paused | waiting | done | canceled | inbox`
   - `inertia_ttl` (dias de tolerância sem atividade antes do Auto-Pause)
   - `Priority (1-5)`
   - `Deadline`
   - `Completed_At`
3. `classProject` (Estende `classTracked`): `Subtype: product | initiative | internal | client | drop | campaign`, `Version`, `Repo`, `URL`, `Canvas`, `NotebookLM`.
4. `classVenture` (Estende `classTracked`): `Subtype: b2b | b2c | agency | internal | creator`, `Repo`, `URL`, `Canvas`, `NotebookLM`.
5. `classGoal` (Estende `classTracked`): `Target`, `Current`, `Progress`.
6. `classMetric` (Estende `classTracked`): `Target`, `Current`, `Progress`, `Unit`.
7. `classCycle` (Estende `classBase`): `Current: true/false`, `Start`, `End`, `Target`.
8. `classDaily` (Estende `classBase`): Gravador de voo dos 85 campos telemetrizados.
9. `classSubject` (Estende `classTracked`): `Track: professional | intellectual | vital | creative`.
10. `classCourse` (Estende `classTracked`): `Instructor`, `Platform`, `Duration`, `Target` (aulas totais), `Current`, `Progress`.
11. `classBook` (Estende `classTracked`): `Author`, `ISBN`, `Cover`, `Target` (páginas totais), `Current`, `Progress`.
12. `classMovie` (Estende `classBase`): `Director`, `Year`, `Rating`, `Genres`, `Cover`.
13. `classPerson` (Estende `classBase`): `Role`, `Company`.
14. `classDoc` (Estende `classTracked`): `Subtype: spec | strategy | process | sop | playbook | guide | client | partner | meeting | call | reference | benchmark | idea | concept`.
15. `classSwipe` (Estende `classBase`): `Category: hook | offer | visual | copy | framework | story | landing_page | email | cta | aesthetic`, `Format`, `Platform`, `Creator`, `Source_URL`.
16. `classThought` (Estende `classBase`): `Category: mental | theology | philosophy | personal | relation`.
17. `classProduction` (Estende `classTracked`): `Format`, `Platform`, `Draft_URL`.
18. `classLiterature` (Estende `classBase`): `Sequence: N+1`, `Chapter`, `Author`.
19. `classZettel` (Estende `classBase`): `Subtype: atomic | moc`, `Maturity: seed | budding | evergreen`, `Source_Ref`, `Anki_Deck`, `Anki_Sync`.
20. `classHub` (Estende `classBase`): `collection: life | work | academy | library | cinema | studio`.

---

## ⚡ 3. TERMODINÂMICA & MOTOR CINÉTICO (Proof-of-Work)

O motor cinético (`vault_kinetic_engine.py`) governa a física térmica das notas:
- **Calor via PoW (Bottom-Up):** Quando o usuário produz uma nova aula (`classLiterature`) ou Zettel (`classZettel`), o calor sobe a cadeia pai:
  - Entidades ancestrais em `paused` ou `inbox` acordam automaticamente para `Status: in_progress`.
  - O `Current` do Curso ou Livro pai é incrementado automaticamente em +1.
  - Se `Current >= Target`, a entidade é promovida para `Status: done` com `Completed_At` registrado.
- **Inércia Térmica (Auto-Pause):** Se uma entidade em `in_progress` não recebe novas notas filhas ou atualizações dentro da sua janela `inertia_ttl` (dias), o motor a resfria suavemente para `Status: paused`.
