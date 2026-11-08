# SOP 03: GATEKEEPER DE CRIAÇÃO & EDIÇÃO NO VAULT (3NF)

Regras inegociáveis para criação, atualização e validação de notas no Obsidian Vault v5.0.

---

## 🛡️ 1. AS 3 TRAVAS DO GATEKEEPER (`core note`)

Toda nota deve ser criada ou editada através do utilitário determinístico `core note` para assegurar:
1. **Validação 3NF:** O campo `Parent` deve apontar para uma nota existente no Vault (exceção única: `Life.md`).
2. **Validação Estrita de Enums:** Todas as propriedades são verificadas em tempo real contra as 20 classes em `Central/Configs/Classes/*.md`.
3. **Sanitização Anti-Setext:** O delimitador `---` e linhas isoladas são blindados para evitar quebra de renderização no Dataview.

---

## 📚 2. PROTOCOLO ACADÊMICO & ZETTELKASTEN (`Central/Study/`)

### 2.1. Fontes de Estudo (`Sources/Books/` e `Sources/Courses/`)
- `Parent:` Aponta sempre para o `[[Sub-Subject]]` correspondente em `Central/Study/Subjects/`.
- Registre `Target` (aulas ou páginas totais) e `Current: 0`.

### 2.2. Notas de Literatura (`Literature/`)
- `Parent:` Aponta **SEMPRE** para o `[[Course]]` ou `[[Book]]` mãe.
- O comando `core note create --class classLiterature --title "<Nome da Aula>" --parent "[[Nome do Livro ou Curso]]" --pow` calcula automaticamente `Sequence: N+1`, incrementa `Current` no pai e aquece a cadeia térmica.

### 2.3. Notas de Conhecimento (`Knowledge/` — MOCs e Zettels Atômicos)
- **MOCs (`Subtype: moc`):** Agrupam stacks conceituais. `Parent:` aponta para o `[[Sub-Subject]]`.
- **Zettels Atômicos (`Subtype: atomic`):** Sintetizam 1 ideia permanente com as próprias palavras.
  - `Parent:` Aponta para o `[[MOC]]` ou `[[Sub-Subject]]`. **Jamais aponte para um Livro ou Curso!**
  - `Source_Ref:` `["[[Livro ou Curso de Origem]]"]` para rastreabilidade de fonte.
  - **Pacto Inegociável de Maturidade (Decisão Compartilhada):** Agente e usuário definem **sempre em conjunto** a `Maturity` (`seed | budding | evergreen`). O agente sugere e explica a razão do estágio proposto, mas o usuário decide e o valor é enviado explicitamente em `--props '{"Maturity":"..."}'`, sobrepondo a contagem de palavras do CLI.

---

## 💼 3. PROTOCOLO PROFISSIONAL (`Central/Professional/`)
- **Hierarquia 3NF:** `[[Work]]` $\rightarrow$ `Ventures/` (`classVenture`) $\rightarrow$ `Projects/` (`classProject`) $\rightarrow$ `Docs/` (`classDoc`).
- **Subtypes Canônicos:**
  - `classProject`: `product | initiative | internal | client | drop | campaign`.
  - `classDoc`: `spec | strategy | process | sop | playbook | guide | client | partner | meeting | call | reference | benchmark | idea | concept`.
