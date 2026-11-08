if (typeof dv === "undefined") {
    if (typeof module !== "undefined" && module.exports) module.exports = {};
    return;
}

// ============================================================
// 🌐 MOTOR CENTRAL DE VIEWS RELACIONAIS v5.0 (Period Footprint, Universal Skeleton, Zero Scroll)
// Invocado via: await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "..." })
// Modos: progress | sprint | monthly | annual | goal | work | venture | project | doc | subject | course | book | movie | person | cycle | academy | library | cinema | studio | production | swipe | life | thought
// ============================================================

const mode = input?.mode || "subject";
const current = dv.current();
const curPath = current.file.path;
const curName = current.file.name;

// ⚡ Carga única cacheada de dv.pages()
const allPages = dv.pages();

// 🛠️ FUNÇÕES AUXILIARES
const trunc = (s, n) => (s && s.length > n) ? s.substr(0, n).trim() + '..' : s;
const norm = (s) => (s ?? "").toString().toLowerCase().trim();
const getSt = (p) => norm(p.Status || p.status);
const htmlLink = (path, text) => `<a class="internal-link" data-href="${path}" href="${path}">${text}</a>`;

// 🛡️ HELPER SEGURO DE EXTRAÇÃO DE NOMES DE LINKS (Protege contra Dataview Link Objects e Arrays)
const cleanLink = (val) => {
    if (!val) return "";
    if (Array.isArray(val) || (typeof val === "object" && typeof val[Symbol.iterator] === "function" && !val.path)) {
        return Array.from(val).map(v => cleanLink(v)).filter(Boolean).join(", ");
    }
    if (typeof val === "object") {
        if (typeof val.fileName === "function") return String(val.fileName()).replace(/[\[\]]/g, "").trim();
        if (typeof val.fileName === "string") return String(val.fileName).replace(/[\[\]]/g, "").trim();
        if (val.path) return String(val.path.split("/").pop().replace(".md", "")).replace(/[\[\]]/g, "").trim();
        if (val.display) return String(val.display).replace(/[\[\]]/g, "").trim();
        if (typeof val.toString === "function" && val.toString !== Object.prototype.toString) {
            const s = val.toString();
            return s.replace(/[\[\]]/g, "").split("|").pop().trim();
        }
    }
    return String(val).replace(/[\[\]]/g, "").split("|")[0].trim();
};

// 🏷️ CAMUFLAGEM VISUAL DE STATUS (Display Mapping elegante para Views)
const formatStatus = (st) => {
    const s = norm(st);
    switch (s) {
        case "in_progress": return "Progress";
        case "done":
        case "completed": return "Done";
        case "planned":
        case "backlog": return "Planned";
        case "paused": return "Paused";
        case "canceled": return "Canceled";
        case "evergreen": return "Evergreen";
        case "budding": return "Budding";
        case "seed": return "Seed";
        default: return st ? st.charAt(0).toUpperCase() + st.slice(1).replace(/_/g, " ") : "-";
    }
};

const formatType = (cls) => {
    switch (cls) {
        case "classDoc": return "📄 Doc";
        case "classProject": return "🚀 Project";
        case "classZettel": return "💎 Zettel";
        case "classLiterature": return "📖 Lit";
        case "classThought": return "🧠 Thought";
        case "classMovie": return "🎬 Movie";
        case "classBook": return "📚 Book";
        case "classCourse": return "🎓 Course";
        case "classProduction": return "🎬 Prod";
        case "classSwipe": return "⚡ Swipe";
        case "classGoal": return "🎯 Goal";
        case "classMetric": return "📊 Metric";
        default: return cls ? `📦 ${cls.replace("class", "")}` : "📄 Doc";
    }
};

// 📊 HELPER VISUAL ASCII PADRONIZADO E COLORIDO (10 BLOCOS, LARGURA RIGOROSAMENTE FIXA)
const asciiBar = (curr, targ, size = 10) => {
    const c = Number(curr) || 0;
    const t = Number(targ) || 0;
    if (t <= 0) return "";
    const ratio = Math.min(1, Math.max(0, c / t));
    const filled = Math.round(ratio * size);
    const empty = size - filled;
    const pct = Math.round(ratio * 100);
    
    // Cores dinâmicas pela evolução
    let color = "#ef4444"; // 0-24% Red
    if (pct >= 80) color = "#10b981";      // 80-100% Green
    else if (pct >= 50) color = "#3b82f6"; // 50-79% Blue
    else if (pct >= 25) color = "#f59e0b"; // 25-49% Amber
    
    const filledStr = `<span style="color: ${color};">` + "█".repeat(filled) + `</span>`;
    const emptyStr = `<span style="opacity: 0.22;">` + "░".repeat(empty) + `</span>`;
    const pctPadded = String(pct).padStart(3, "\u00A0") + "%";
    const pctStr = `<span style="color: ${color}; font-weight: 500;">${pctPadded}</span>`;
    
    return `<span style="font-family: var(--font-monospace); letter-spacing: 0px; white-space: pre;">${filledStr}${emptyStr} ${pctStr}</span>`;
};

// Formatação compacta de números (ex: 3.2k, 12, 100k)
const compactVal = (n) => {
    const num = Number(n);
    if (isNaN(num)) return n;
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    return String(num);
};

// ⚡ HELPER DE PRIORIDADE (Badge Visual e Timestamp Numérico para Ordenação)
const formatPriority = (prio) => {
    const p = Number(prio);
    if (p === 5) return `<span style="color: #ef4444; font-weight: 600;">🔥 P5</span>`;
    if (p === 4) return `<span style="color: #f59e0b; font-weight: 500;">P4</span>`;
    if (p === 3) return `<span style="color: #3b82f6; opacity: 0.85;">P3</span>`;
    if (p === 2) return `<span style="opacity: 0.5;">P2</span>`;
    if (p === 1) return `<span style="opacity: 0.35;">P1</span>`;
    return `<span style="opacity: 0.25;">-</span>`;
};

const getDocTime = (p) => {
    if (!p) return 0;
    const m = parseMoment(p.Updated || p.Created, p.file?.mtime);
    return m ? (typeof m.valueOf === "function" ? m.valueOf() : Number(m)) : 0;
};

// Parser robusto de datas com fallback
const parseMoment = (val, fileFallback) => {
    if (!val) {
        if (!fileFallback) return null;
        const ts = fileFallback.ts || (typeof fileFallback.toMillis === 'function' ? fileFallback.toMillis() : fileFallback);
        const m = moment(ts);
        return m.isValid() ? m : null;
    }
    if (typeof val === 'object') {
        if (typeof val.toMillis === 'function') {
            const m = moment(val.toMillis());
            if (m.isValid()) return m;
        }
        if (val.ts) {
            const m = moment(val.ts);
            if (m.isValid()) return m;
        }
        if (moment.isMoment && moment.isMoment(val)) return val;
    }
    const s = String(val).replace(/["']/g, "").trim();
    if (!s || s === "Not Done" || s === "-" || s.toLowerCase() === "inbox") return null;
    const m = moment(s, ["DD-MM-YYYY HH:mm:ss", "DD-MM-YYYY HH:mm", "DD-MM-YYYY", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm", "YYYY-MM-DD"], true);
    if (m.isValid()) return m;
    const fallbackM = moment(s);
    if (fallbackM.isValid()) return fallbackM;
    if (fileFallback) {
        const ts = fileFallback.ts || (typeof fileFallback.toMillis === 'function' ? fileFallback.toMillis() : fileFallback);
        const fbM = moment(ts);
        return fbM.isValid() ? fbM : null;
    }
    return null;
};

// 🛡️ FILTRO: Verifica se a nota filha referencia esta nota pai via Parent ou campo específico
const matchesParent = (p, fieldName = "Parent") => {
    if (!p) return false;
    const val = p[fieldName] ?? p[fieldName.toLowerCase()] ?? p.file?.frontmatter?.[fieldName] ?? p.file?.frontmatter?.[fieldName.toLowerCase()];
    if (!val) return false;
    const sVal = cleanLink(val);
    return sVal.includes(curName) || (p.file && p.file.folder && p.file.folder.includes(curName));
};

const isNotConfigOrTemplate = (p) => {
    if (!p || !p.file) return false;
    const folder = p.file.folder || "";
    return !folder.includes("Configs") && !folder.includes("Templates") && !folder.includes("Archive");
};

// 🌳 HELPER RECURSIVO: Coleta recursivamente todos os nomes de Sub-Subjects descendentes
const getAllDescendantSubjectNames = (rootName) => {
    const descendants = new Set();
    const queue = [rootName];
    while (queue.length > 0) {
        const curr = queue.shift();
        const children = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classSubject" && cleanLink(p.Parent) === curr)
            .map(p => p.file.name);
        for (const child of children) {
            if (!descendants.has(child)) {
                descendants.add(child);
                queue.push(child);
            }
        }
    }
    return descendants;
};

// 🌳 HELPER RECURSIVO COMPLETO: Coleta Sub-Subjects, Fontes e MOCs/Zettels descendentes para contagem e exibição hierárquica profunda
const getAllDescendantStudyTreeNames = (rootName) => {
    const descendants = new Set([rootName]);
    const queue = [rootName];
    while (queue.length > 0) {
        const curr = queue.shift();
        const children = allPages
            .where(p => isNotConfigOrTemplate(p) && ["classSubject", "classCourse", "classBook", "classZettel"].includes(p.Class) && cleanLink(p.Parent) === curr)
            .map(p => p.file.name);
        for (const child of children) {
            if (!descendants.has(child)) {
                descendants.add(child);
                queue.push(child);
            }
        }
    }
    return descendants;
};

// 🎨 & 🎴 HELPER VISUAL DE BADGES (Canvas Excalidraw & Anki Spaced Repetition - Lazy Evaluation)
let _pendingAnkiParents = null;
const getPendingAnkiParents = () => {
    if (_pendingAnkiParents) return _pendingAnkiParents;
    _pendingAnkiParents = new Set();
    for (const p of allPages) {
        if (isNotConfigOrTemplate(p) && norm(p.Anki_Sync) === "pending") {
            const par = cleanLink(p.Parent);
            if (par) _pendingAnkiParents.add(par);
        }
    }
    return _pendingAnkiParents;
};

const getStudyBadges = (p) => {
    if (!p) return "";
    let b = "";
    if (p.Canvas && String(p.Canvas).trim() !== "") {
        b += ` <span title="Visual Canvas: ${cleanLink(p.Canvas)}" style="opacity: 0.9;">🎨</span>`;
    }
    if (p.NotebookLM && String(p.NotebookLM).trim() !== "") {
        const nUrl = String(p.NotebookLM).trim();
        b += ` <a href="${nUrl}" target="_blank" title="Abrir Caderno NotebookLM" style="text-decoration: none; opacity: 0.9;">📓</a>`;
    }
    const isPending = norm(p.Anki_Sync) === "pending" || (p.file?.name && getPendingAnkiParents().has(p.file.name));
    if (isPending) {
        b += ` <span title="Anki Sync Pending" style="color: #f59e0b; font-weight: bold;">🎴</span>`;
    }
    return b;
};

// 💼 & 💻 HELPER VISUAL DE BADGES PROFISSIONAIS (Repo, URL, Canvas, NotebookLM)
const getProBadges = (p) => {
    if (!p) return "";
    let b = "";
    if (p.Repo && String(p.Repo).trim() !== "") {
        const repoStr = String(p.Repo).trim();
        const isUrl = repoStr.startsWith("http");
        if (isUrl) {
            b += ` <a href="${repoStr}" target="_blank" title="Repositório: ${repoStr}" style="text-decoration: none; opacity: 0.9;">💻</a>`;
        } else {
            b += ` <span title="Repo Local: ${repoStr}" style="opacity: 0.9; cursor: default;">💻</span>`;
        }
    }
    if (p.URL && String(p.URL).trim() !== "") {
        const u = String(p.URL).trim();
        b += ` <a href="${u}" target="_blank" title="Abrir URL / Produção: ${u}" style="text-decoration: none; opacity: 0.9;">🌐</a>`;
    }
    if (p.Canvas && String(p.Canvas).trim() !== "") {
        b += ` <span title="Visual Canvas: ${cleanLink(p.Canvas)}" style="opacity: 0.9;">🎨</span>`;
    }
    if (p.NotebookLM && String(p.NotebookLM).trim() !== "") {
        const nUrl = String(p.NotebookLM).trim();
        b += ` <a href="${nUrl}" target="_blank" title="Abrir Caderno NotebookLM" style="text-decoration: none; opacity: 0.9;">📓</a>`;
    }
    return b;
};

// 📑 HELPER DE FORMATAÇÃO DE SUBTYPES DE DOCUMENTOS PROFISSIONAIS
const formatDocSubtype = (sub) => {
    const s = norm(sub);
    if (s === "spec") return "📐 Spec";
    if (s === "strategy") return "🏛️ Strategy";
    if (s === "process") return "⚙️ Process";
    if (s === "sop") return "⚙️ SOP";
    if (s === "guide") return "📖 Guide";
    if (s === "playbook") return "📘 Playbook";
    if (s === "client") return "🤝 Client";
    if (s === "partner") return "🤝 Partner";
    if (s === "meeting") return "🎙️ Meeting";
    if (s === "call") return "📞 Call";
    if (s === "reference") return "📑 Reference";
    if (s === "benchmark") return "📊 Benchmark";
    if (s === "swipe") return "⚡ Swipe";
    if (s === "idea") return "💡 Idea";
    if (s === "concept") return "💡 Concept";
    if (s === "draft") return "📝 Draft";
    return s ? `📄 ${s}` : "📄 Doc";
};

// 🎬 HELPER DE FORMATAÇÃO DE ESTÁGIO DE PRODUÇÃO AUDIOVISUAL
const formatStage = (stage) => {
    const s = norm(stage);
    switch (s) {
        case "recording": return "🎙️ Recording";
        case "editing": return "✂️ Editing";
        case "scripting":
        case "script": return "✍️ Scripting";
        case "ideation":
        case "idea": return "💡 Ideation";
        case "published":
        case "done": return "📦 Published";
        default: return s ? `🎬 ${s.charAt(0).toUpperCase() + s.slice(1)}` : "🎬 Scripting";
    }
};

// ⚡ HELPER DE FORMATAÇÃO DE CATEGORIA DE SWIPE
const formatSwipeCategory = (cat) => {
    const c = norm(cat);
    switch (c) {
        case "hook": return "⚡ Hook";
        case "storytelling":
        case "story": return "📖 Storytelling";
        case "aesthetic": return "🎨 Aesthetic";
        case "motivation": return "🔥 Motivation";
        case "mindset": return "🧠 Mindset";
        case "copywriting":
        case "copy": return "✍️ Copy";
        case "lifestyle": return "🌴 Lifestyle";
        case "cinematic":
        case "cinema": return "🎬 Cinematic";
        case "trip":
        case "trips": return "✈️ Trips";
        case "tech": return "💻 Tech";
        default: return c ? `⚡ ${c.charAt(0).toUpperCase() + c.slice(1)}` : "⚡ Swipe";
    }
};

// 🧠 HELPER DE FORMATAÇÃO DE CATEGORIA DE THOUGHT
const formatThoughtCategory = (cat) => {
    const c = norm(cat);
    switch (c) {
        case "mental": return "🧠 Mental";
        case "personal": return "🌱 Personal";
        case "relation":
        case "relationship": return "🤝 Relation";
        case "philosophy": return "🏛️ Philosophy";
        case "theology": return "⛪ Theology";
        default: return c ? `💡 ${c.charAt(0).toUpperCase() + c.slice(1)}` : "🧠 Mental";
    }
};

// 🔍 HELPER UNIVERSAL DE INFO/STATUS CONTEXTUAL (Para tabelas transversais de conexões)
const formatEntityContextInfo = (p) => {
    if (!p) return "-";
    if (p.Stage) return formatStage(p.Stage);
    if (p.Status) return formatStatus(getSt(p));
    if (p.Maturity) return formatStatus(p.Maturity);
    if (p.Category) return p.Class === "classSwipe" ? formatSwipeCategory(p.Category) : formatThoughtCategory(p.Category);
    if (p.Subtype) return formatDocSubtype(p.Subtype);
    if (p.Created) return `📅 ${String(p.Created).slice(0, 10)}`;
    return "-";
};

// 👤 RESOLVER SEGURO DE AUTOR / DIRETOR (Link para Person se existir, texto limpo elegante se não existir)
const resolvePersonLink = (val) => {
    if (!val) return "-";
    if (Array.isArray(val)) {
        const resolved = val.map(v => resolvePersonLink(v)).filter(r => r && r !== "-");
        return resolved.length > 0 ? resolved.join(", ") : "-";
    }
    const raw = cleanLink(val);
    if (!raw || raw === "-" || raw.toLowerCase() === "undefined" || raw.toLowerCase() === "null") return "-";
    
    // Se vier uma lista separada por vírgula que não seja um nome único
    if (raw.includes(",") && !raw.includes("Jr.") && !raw.includes("Filho")) {
        const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) {
            return parts.map(p => resolvePersonLink(p)).join(", ");
        }
    }
    
    // Procura por nota correspondente no vault (ex: em Central/Study/People/)
    try {
        const tgt = raw.toLowerCase();
        const personNote = allPages?.where ? allPages.where(p => isNotConfigOrTemplate(p) && p.Class === "classPerson" && (
            (p.file?.name && p.file.name.toLowerCase() === tgt) ||
            (p.Aliases && (
                typeof p.Aliases === "string" ? p.Aliases.toLowerCase() === tgt :
                Array.isArray(p.Aliases) ? p.Aliases.some(a => String(a).toLowerCase() === tgt) : false
            ))
        )) : null;
        
        const firstPerson = personNote?.first ? personNote.first() : (personNote && personNote[0]);
        if (firstPerson && firstPerson.file) {
            return htmlLink(firstPerson.file.path, firstPerson.file.name);
        }
    } catch(e) {}
    
    const dest = (typeof app !== "undefined" && app?.metadataCache?.getFirstLinkpathDest) ? app.metadataCache.getFirstLinkpathDest(raw, curPath) : null;
    if (dest) {
        return htmlLink(dest.path, raw);
    }
    
    // Se o autor/diretor não possui nota no Vault, exibe como texto limpo elegante (não fica link quebrado)
    return `<span style="opacity: 0.85; font-weight: 500;">${raw}</span>`;
};

// 📋 HELPERS DE RENDERIZAÇÃO DE METADADOS FLUIDOS (Anti-CodeBlock, 100% Responsivo)
const renderInfoRow = (label, valueHtml) => {
    if (!valueHtml || valueHtml === "-" || valueHtml === "—") return "";
    return `<div style="display: flex; align-items: baseline; font-size: 0.88em; line-height: 1.5; padding: 4px 0; border-bottom: 1px solid rgba(128, 128, 128, 0.08);"><span style="flex: 0 0 140px; width: 140px; opacity: 0.55; flex-shrink: 0; font-weight: 500;">${label}:</span><span style="flex: 1 1 auto; min-width: 0;">${valueHtml}</span></div>`;
};

const renderInfoBlock = (label, text) => {
    if (!text || text === "-" || text === "—") return "";
    return `<div style="font-size: 0.88em; line-height: 1.5; padding: 6px 0 2px 0;"><div style="opacity: 0.55; font-weight: 500; margin-bottom: 3px;">${label}:</div><div style="opacity: 0.85; line-height: 1.45;">${text}</div></div>`;
};

// Separador natural de colunas
const sep = `<span style="opacity: 0.35; padding: 0 6px; flex: 0 0 auto;">|</span>`;

// ⚡ ORDENAÇÃO INTELIGENTE UNIVERSAL (Ativas no Topo, Concluídas ao Fundo, Prioridade 5 Dominó Primeiro)
const sortActiveFirst = (list) => {
    const arr = list?.array ? list.array() : Array.from(list || []);
    const getStatusRank = (st) => {
        const s = norm(st);
        if (s === "in_progress") return 0;
        if (s === "planned" || s === "backlog" || s === "budding" || s === "seed") return 1;
        if (s === "paused") return 2;
        if (s === "done" || s === "completed" || s === "evergreen") return 3;
        if (s === "canceled") return 4;
        return 1;
    };
    return arr.sort((a, b) => {
        const rankA = getStatusRank(getSt(a));
        const rankB = getStatusRank(getSt(b));
        if (rankA !== rankB) return rankA - rankB; // Ativas no topo, Concluídas ao fundo
        
        const prioA = Number(a.Priority) || 3;
        const prioB = Number(b.Priority) || 3;
        if (prioA !== prioB) return prioB - prioA; // Dominó ⚡ (Priority 5) no topo
        
        const mA = parseMoment(a.Deadline);
        const mB = parseMoment(b.Deadline);
        if (mA && mB && mA.isValid() && mB.isValid()) {
            const diff = mA.valueOf() - mB.valueOf();
            if (diff !== 0) return diff;
        } else if (mA && mA.isValid()) {
            return -1;
        } else if (mB && mB.isValid()) {
            return 1;
        }
        
        return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
    });
};

// LINHAS FLUIDAS DE METAS (ZERO SCROLL, FONT SYSTEM, TRUNCAGEM ELEGANTE, ASCII PADRONIZADO 150PX)
const renderGoalsFluid = (goalsList, emptyMsg = "Nenhuma meta encontrada.") => {
    const list = goalsList?.array ? goalsList.array() : Array.from(goalsList || []);
    if (!list || list.length === 0) {
        return `<div style="padding: 4px 0; opacity: 0.7; font-style: italic;">${emptyMsg}</div>`;
    }
    return list.map(p => {
        const isDomino = Number(p.Priority) === 5;
        const icon = isDomino ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : `▪ `;
        const shortName = trunc(p.file.name, 30);
        const link = htmlLink(p.file.path, shortName);
        const targ = Number(p.Target) || 0;
        const isDone = getSt(p) === "done";
        const bar = isDone
            ? `<span style="font-family: var(--font-monospace); letter-spacing: 0px; white-space: pre;"><span style="color: #10b981;">██████████</span> <span style="color: #10b981; font-weight: 500;"> 100%</span></span>`
            : (targ > 0 ? asciiBar(p.Current, p.Target, 10) : `<span style="opacity: 0.35;">-</span>`);
        const st = isDone
            ? `<span style="color: #10b981; font-weight: 500;">Done</span>`
            : formatStatus(getSt(p) || "in_progress");
        const dead = p.Deadline ? `📅 ${p.Deadline}` : "📅 -";
        return `<div style="display: flex; align-items: center; width: 100%; box-sizing: border-box; overflow: hidden; white-space: nowrap; padding: 2px 0;">
<span style="flex: 1 1 auto; min-width: 0; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${(p.file.name || '').replace(/"/g, '&quot;')}">${icon}${link}</span>
${sep}
<span style="flex: 0 0 150px; width: 150px; white-space: nowrap; overflow: hidden; text-align: left;">${bar}</span>
${sep}
<span style="flex: 0 0 70px; width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; text-align: left;">${st}</span>
${sep}
<span style="flex: 0 0 95px; width: 95px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; text-align: left;">${dead}</span>
</div>`;
    }).join("");
};

// LINHAS FLUIDAS DE MÉTRICAS (ZERO LEAK: COLUNAS LARGAS O SUFICIENTE, NUNCA VAZAM, ASCII 150PX)
const renderMetricsFluid = (metricsList, emptyMsg = "Nenhuma métrica encontrada.") => {
    const list = metricsList?.array ? metricsList.array() : Array.from(metricsList || []);
    if (!list || list.length === 0) {
        return `<div style="padding: 4px 0; opacity: 0.7; font-style: italic;">${emptyMsg}</div>`;
    }
    return list.map(p => {
        const link = htmlLink(p.file.path, p.file.name);
        const targ = Number(p.Target) || 0;
        const isDone = getSt(p) === "done" || getSt(p) === "completed";
        const bar = isDone
            ? `<span style="font-family: var(--font-monospace); letter-spacing: 0px; white-space: pre;"><span style="color: #10b981;">██████████</span> <span style="color: #10b981; font-weight: 500;"> 100%</span></span>`
            : (targ > 0 ? asciiBar(p.Current, p.Target, 10) : `<span style="opacity: 0.35;">-</span>`);
        const ratio = targ > 0 ? `${compactVal(p.Current)}/${compactVal(p.Target)}` : "-";
        const st = isDone ? `<span style="color: #10b981; font-weight: 500;">Done</span>` : formatStatus(getSt(p) || "in_progress");
        const dead = p.Deadline ? `📅 ${p.Deadline}` : "📅 -";
        return `<div style="display: flex; align-items: center; width: 100%; box-sizing: border-box; overflow: hidden; white-space: nowrap; padding: 2px 0;">
<span style="flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📉 ${link}</span>
${sep}
<span style="flex: 0 0 150px; width: 150px; white-space: nowrap; overflow: hidden; text-align: left;">${bar}</span>
${sep}
<span style="flex: 0 0 85px; width: 85px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; font-family: var(--font-monospace); text-align: left;">${ratio}</span>
${sep}
<span style="flex: 0 0 70px; width: 70px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; text-align: left;">${st}</span>
${sep}
<span style="flex: 0 0 95px; width: 95px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; text-align: left;">${dead}</span>
</div>`;
    }).join("");
};

// LINHAS FLUIDAS GENÉRICAS (PADRÃO UNIVERSAL: RESPONSIVO, ZERO SCROLLBAR, COLUNAS ALINHADAS)
const renderGenericFluid = (headers, colWidths, rows, emptyMsg = "Nenhum registro encontrado.") => {
    const list = rows?.array ? rows.array() : Array.from(rows || []);
    if (!list || list.length === 0) {
        return `<div style="padding: 4px 0; opacity: 0.7; font-style: italic;">${emptyMsg}</div>`;
    }
    
    const getColStyle = (w) => {
        if (w === "auto" || w === "flex" || w === "1") {
            return `flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left;`;
        }
        return `flex: 0 0 ${w}; width: ${w}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left;`;
    };

    // Cabeçalho da visualização
    const headerRow = `<div style="display: flex; align-items: center; width: 100%; box-sizing: border-box; overflow: hidden; white-space: nowrap; opacity: 0.65; font-weight: 600; padding: 2px 0 6px 0; border-bottom: 1px solid var(--background-modifier-border);">` +
        headers.map((h, i) => {
            const isLast = i === headers.length - 1;
            return `<span style="${getColStyle(colWidths[i])}">${h}</span>` + (!isLast ? sep : "");
        }).join("") + `</div>`;

    // Linhas de dados
    const dataRows = list.map(r => {
        const cols = r?.array ? r.array() : Array.from(r || []);
        return `<div style="display: flex; align-items: center; width: 100%; box-sizing: border-box; overflow: hidden; white-space: nowrap; padding: 2px 0;">` +
            cols.map((c, i) => {
                const isLast = i === cols.length - 1;
                return `<span style="${getColStyle(colWidths[i])}">${c}</span>` + (!isLast ? sep : "");
            }).join("") + `</div>`;
    }).join("");

    return headerRow + `<div style="padding-top: 4px; width: 100%; box-sizing: border-box; overflow: hidden;">${dataRows}</div>`;
};

// 🖼️ CARDS & POSTERS VISUAL GRID (CINEMA & LIBRARY)
const renderCardsGrid = (itemsList, type = "movie", emptyMsg = "Nenhum item com imagem encontrado.") => {
    const list = itemsList?.array ? itemsList.array() : Array.from(itemsList || []);
    if (!list || list.length === 0) {
        return `<div style="padding: 8px 0; opacity: 0.7; font-style: italic;">${emptyMsg}</div>`;
    }

    const cards = list.map(item => {
        const title = item.file.name;
        const link = htmlLink(item.file.path, title);
        const imgUrl = item.Poster || item.Cover || item.poster || item.cover || "";
        const rNum = parseInt(item.Rating || item.rating) || 0;
        const rStars = rNum > 0 ? "★".repeat(Math.min(rNum, 5)) : "";
        
        let subLeft = "";
        let subRight = "";
        
        if (type === "movie") {
            subLeft = item.Release_Year || (item.Release ? String(item.Release).slice(0, 4) : "-");
            const dir = cleanLink(item.Director || item.director || "");
            subRight = dir ? trunc(dir, 14) : "";
        } else {
            const author = cleanLink(item.Author || item.author || "");
            subLeft = author ? trunc(author, 14) : "-";
            const targ = Number(item.Target || item.Pages || item.pages || 0);
            subRight = targ > 0 ? `${targ}p` : "";
        }

        const mediaCover = imgUrl
            ? `<div style="width: 100%; aspect-ratio: 2/3; overflow: hidden; position: relative; background: rgba(0,0,0,0.25);">
                <img src="${imgUrl}" alt="${(title || '').replace(/"/g, '&quot;')}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 6px 6px 0 0;" />
                ${rStars ? `<div style="position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.8); color: #f59e0b; padding: 1px 5px; border-radius: 4px; font-size: 0.72em; font-weight: bold; letter-spacing: 0.5px;">${rStars}</div>` : ""}
               </div>`
            : `<div style="width: 100%; aspect-ratio: 2/3; display: flex; align-items: center; justify-content: center; background: rgba(128,128,128,0.1); border-radius: 6px 6px 0 0; color: var(--text-muted); font-size: 2.2em;">
                ${type === "movie" ? "🎬" : "📚"}
               </div>`;

        return `<div style="border: 1px solid var(--background-modifier-border); border-radius: 6px; overflow: hidden; background: rgba(128,128,128,0.04); display: flex; flex-direction: column;">
            <a class="internal-link" data-href="${item.file.path}" href="${item.file.path}" style="text-decoration: none; display: block;">
                ${mediaCover}
            </a>
            <div style="padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; overflow: hidden;">
                <div style="font-weight: 600; font-size: 0.82em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${(title || '').replace(/"/g, '&quot;')}">
                    ${link}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72em; opacity: 0.75; white-space: nowrap; overflow: hidden;">
                    <span style="overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${subLeft}</span>
                    <span style="overflow: hidden; text-overflow: ellipsis; max-width: 38%; text-align: right;">${subRight}</span>
                </div>
            </div>
        </div>`;
    }).join("");

    return `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; padding: 6px 0; width: 100%; box-sizing: border-box;">
        ${cards}
    </div>`;
};

// MEMÓRIA GLOBAL DE ESTADO DOS ACCORDIONS (Persistência reativa entre re-renders)
if (!window.__VAULT_ACCORDION_STATE__) {
    window.__VAULT_ACCORDION_STATE__ = {};
}

// COMPONENTE ACCORDION <details> IDÊNTICO À DAILY NOTE (ZERO SCROLL, FONT SYSTEM)
const sanitizeHtml = (html) => (html || "").replace(/\r\n/g, "\n").split("\n").map(l => l.trim()).filter(Boolean).join(" ");

const renderAccordionSection = (title, contentHtml, defaultIsOpen = false, isFirst = false) => {
    const borderTop = isFirst ? "border-top: none !important;" : "border-top: 1px solid var(--background-modifier-border) !important;";
    const cleanContent = sanitizeHtml(contentHtml);
    
    // Identificador único estável da seção (imune a flutuações de contadores ex: (3) -> (4))
    const plainTitle = (title || "").replace(/<[^>]+>/g, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
    const stateKey = `${curPath}::${plainTitle}`;
    
    // Preserva a interação manual do usuário; se ainda não tocou, usa o default do script
    const isOpen = (window.__VAULT_ACCORDION_STATE__[stateKey] !== undefined)
        ? window.__VAULT_ACCORDION_STATE__[stateKey]
        : defaultIsOpen;

    return `<details data-accordion-key="${stateKey.replace(/"/g, '&quot;')}" style="cursor: pointer; margin: 0 !important; border: none !important; outline: none !important;" ${isOpen ? "open" : ""}><summary style="padding: 6px 12px; margin: 0 !important; ${borderTop} border-bottom: none !important; background-color: rgba(128, 128, 128, 0.08); font-weight: 500; font-size: 1em; outline: none; list-style-position: inside; opacity: 0.9;">${title}</summary><div style="padding: 8px 12px; line-height: 1.5em; border-bottom: none !important; width: 100%; box-sizing: border-box; overflow: hidden;">${cleanContent}</div></details>`;
};

// CONTAINER ENVOLVENTE
const wrapSections = (sections) => {
    if (!sections || sections.length === 0) return "";
    const html = sections.map((s, idx) => renderAccordionSection(s.title, s.content, s.isOpen, idx === 0)).join("");
    return `<div style="border: 1px solid var(--background-modifier-border); border-radius: 6px; overflow: hidden; margin: 12px 0; width: 100%; box-sizing: border-box;">${html}</div>`;
};

// 📦 MOTOR DE CAPTURA DO PERIOD FOOTPRINT (Rastro de Produção e Consumo no Período)
const getPeriodFootprint = (startDate, endDate) => {
    if (!startDate || !endDate || !startDate.isValid() || !endDate.isValid()) return [];
    
    const results = [];
    
    for (const p of allPages) {
        if (!p || !p.file) continue;
        const folder = p.file.folder || "";
        if (folder.includes("Configs") || folder.includes("Templates") || folder.includes("Archive")) continue;
        if (p.isTemplate === true || p.Type === "template" || p.Class === "classHub" || p.Class === "classDaily" || p.Class === "classMetric" || p.Class === "classCycle" || p.Class === "classCycles" || p.Class === "classVenture") continue;
        
        const cls = p.Class;
        let matched = false;
        let typeBadge = "";
        let infoStr = "";
        let sortWeight = 99;
        let eventDate = null;
        
        const cre = parseMoment(p.Created || p.created);
        const comp = parseMoment(p.Completed_At || p.completed_at);
        const upd = parseMoment(p.Updated || p.updated);
        const st = norm(p.Status || p.status);

        // 1. Obras, Cursos, Metas e Projetos Concluídos (Entregues no Período)
        if (["classBook", "classCourse", "classGoal", "classProject"].includes(cls) && (st === "done" || st === "completed")) {
            if (comp && comp.isBetween(startDate, endDate, null, "[]")) {
                matched = true; eventDate = comp;
            } else if (!comp && upd && upd.isBetween(startDate, endDate, null, "[]")) {
                matched = true; eventDate = upd;
            }
            
            if (matched) {
                const dateShort = eventDate.format("DD/MM");
                if (cls === "classGoal") {
                    const horiz = norm(p.Horizon || "sprint");
                    typeBadge = horiz === "annual" ? "🏛️ Year Goal" : (horiz === "monthly" ? "📅 Month Goal" : "⚡ Goal");
                    sortWeight = 0;
                } else if (cls === "classBook") {
                    typeBadge = "📚 Book"; sortWeight = 1;
                } else if (cls === "classCourse") {
                    typeBadge = "🎓 Course"; sortWeight = 1;
                } else if (cls === "classProject") {
                    typeBadge = "🚀 Project"; sortWeight = 1;
                }
                infoStr = `<span style="color:#10b981; font-weight:500;">Done 100%</span> • ${dateShort}`;
            }
        }
        
        // 2. Filmes Assistidos (Consumo Cultural Registrado no Período)
        if (!matched && cls === "classMovie") {
            const watched = parseMoment(p.Watched || p.watched || p.Completed_At);
            if (watched && watched.isBetween(startDate, endDate, null, "[]")) {
                matched = true;
                eventDate = watched;
                typeBadge = "🎬 Movie";
                sortWeight = 1;
                const r = p.Rating ? `★ ${p.Rating}/5` : "Watched";
                infoStr = `<span style="color:#f59e0b;">${r}</span> • ${watched.format("DD/MM")}`;
            }
        }
        
        // 3. Artefatos de Conhecimento, Produção e Novos Cadastros Criados no Período
        if (!matched && cre && cre.isBetween(startDate, endDate, null, "[]")) {
            const dateShort = cre.format("DD/MM");
            
            if (cls === "classZettel") {
                matched = true; eventDate = cre; typeBadge = "💎 Zettel"; sortWeight = 2;
                const mat = formatStatus(p.Maturity || "seed");
                infoStr = `${mat} • ${dateShort}`;
            } else if (cls === "classLiterature") {
                matched = true; eventDate = cre; typeBadge = "📖 Lit"; sortWeight = 2;
                const seq = p.Sequence ? `#${p.Sequence}` : "Lesson";
                infoStr = `${seq} • ${dateShort}`;
            } else if (cls === "classDoc") {
                matched = true; eventDate = cre; typeBadge = "📄 Doc"; sortWeight = 2;
                const dt = p.Subtype ? formatStatus(p.Subtype) : "Spec";
                infoStr = `${dt} • ${dateShort}`;
            } else if (cls === "classThought") {
                matched = true; eventDate = cre; typeBadge = "🧠 Thought"; sortWeight = 2;
                infoStr = `Personal • ${dateShort}`;
            } else if (cls === "classProduction") {
                matched = true; eventDate = cre; typeBadge = "🏭 Prod"; sortWeight = 2;
                infoStr = `Asset • ${dateShort}`;
            } else if (cls === "classSwipe") {
                matched = true; eventDate = cre; typeBadge = "🎨 Swipe"; sortWeight = 3;
                infoStr = `Inspiration • ${dateShort}`;
            } else if (cls === "classSubject") {
                matched = true; eventDate = cre; typeBadge = "📚 Subject"; sortWeight = 2;
                infoStr = `Study • ${dateShort}`;
            } else if (cls === "classPerson") {
                matched = true; eventDate = cre; typeBadge = "👤 Person"; sortWeight = 2;
                infoStr = `Influence • ${dateShort}`;
            } else if (cls === "classBook") {
                matched = true; eventDate = cre; typeBadge = "📚 Book"; sortWeight = 2;
                infoStr = `${formatStatus(st || "inbox")} • ${dateShort}`;
            } else if (cls === "classCourse") {
                matched = true; eventDate = cre; typeBadge = "🎓 Course"; sortWeight = 2;
                infoStr = `${formatStatus(st || "paused")} • ${dateShort}`;
            } else if (cls === "classProject") {
                matched = true; eventDate = cre; typeBadge = "🚀 Project"; sortWeight = 1;
                infoStr = `${formatStatus(st || "in_progress")} • ${dateShort}`;
            } else if (cls === "classGoal" && st !== "canceled") {
                matched = true; eventDate = cre; typeBadge = "⚡ Goal"; sortWeight = 1;
                infoStr = `${formatStatus(st || "in_progress")} • ${dateShort}`;
            }
        }
        
        if (matched) {
            let pRaw = cleanLink(p.Parent || "-");
            let pLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
            results.push({
                item: htmlLink(p.file.path, p.file.name),
                typeBadge,
                parentLink: pLink,
                infoStr,
                sortWeight,
                date: eventDate ? eventDate.valueOf() : 0
            });
        }
    }
    
    // Ordenação: primeiro peso (Obras/Projetos primeiro), depois data descrescente
    results.sort((a, b) => {
        if (a.sortWeight !== b.sortWeight) return a.sortWeight - b.sortWeight;
        return b.date - a.date;
    });
    
    return results;
};

// 📑 HELPER UNIVERSAL DE TABELAS DE CLASSDOC POR SUBTIPO (Elimina duplicação entre Venture e Project)
const buildDocSubtypeTable = (matchFn, allowedSubtypes, col1Title, emptyMsg, opts = {}) => {
    const {
        showParent = false,
        showPeople = false,
        showPriorityInsteadOfType = false,
        useCreatedFirst = false,
        dateColTitle = "Atualizado em",
        dateColWidth = "110px",
        typeColWidth = "120px",
        rankFn = null
    } = opts;

    const rawDocs = allPages.where(p => isNotConfigOrTemplate(p) && p.Class === "classDoc" && matchFn(p) && allowedSubtypes.includes(norm(p.Subtype)));
    const docs = Array.from(rawDocs || []).sort((a, b) => {
        if (rankFn) {
            const rA = rankFn(a.Subtype);
            const rB = rankFn(b.Subtype);
            if (rA !== rB) return rA - rB;
        }
        if (!useCreatedFirst) {
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
        }
        if (showPeople) {
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        }
        const tA = getDocTime(a);
        const tB = getDocTime(b);
        if (tA !== tB) return tB - tA;
        return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
    });

    const rows = docs.map(d => {
        const isP5 = Number(d.Priority) === 5;
        const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
        const link = p5Badge + htmlLink(d.file.path, d.file.name) + getProBadges(d);
        const col2 = showPriorityInsteadOfType ? formatPriority(d.Priority) : formatDocSubtype(d.Subtype);
        const dt = useCreatedFirst
            ? (d.Created ? String(d.Created).slice(0, 10) : (d.Updated ? String(d.Updated).slice(0, 10) : "-"))
            : (d.Updated ? String(d.Updated).slice(0, 10) : (d.Created ? String(d.Created).slice(0, 10) : "-"));

        if (showPeople && showParent) {
            const ppl = resolvePersonLink(d.People);
            const par = cleanLink(d.Parent || "-");
            const parLink = (par && par !== "-") ? htmlLink(par, par) : "-";
            return [link, col2, ppl, parLink, dt];
        }
        if (showParent) {
            const par = cleanLink(d.Parent || "-");
            const parLink = (par && par !== "-") ? htmlLink(par, par) : "-";
            return [link, col2, parLink, dt];
        }
        return [link, col2, dt];
    });

    let headers, widths;
    if (showPeople && showParent) {
        headers = [col1Title, "Tipo", "Contato / Pessoas", "Vínculo", dateColTitle];
        widths = ["auto", "100px", "140px", "140px", dateColWidth];
    } else if (showParent) {
        headers = [col1Title, showPriorityInsteadOfType ? "Prioridade" : "Tipo", "Vínculo", dateColTitle];
        widths = ["auto", showPriorityInsteadOfType ? "85px" : typeColWidth, "140px", dateColWidth];
    } else {
        headers = [col1Title, showPriorityInsteadOfType ? "Prioridade" : "Tipo", dateColTitle];
        widths = ["auto", showPriorityInsteadOfType ? "85px" : typeColWidth, dateColWidth];
    }

    return {
        count: docs.length,
        table: renderGenericFluid(headers, widths, rows, emptyMsg)
    };
};

// 🎬 HELPER UNIVERSAL DE PRODUÇÕES AUDIOVISUAIS POR ENTIDADE (Venture / Project)
const buildEntityProductionsTable = (matchFn, emptyMsg) => {
    const rawProds = allPages.where(p => isNotConfigOrTemplate(p) && p.Class === "classProduction" && matchFn(p));
    const prods = Array.from(rawProds || []).sort((a, b) => {
        const getStageRank = (st) => {
            const s = norm(st);
            if (s.includes("record")) return 0;
            if (s.includes("edit")) return 1;
            if (s.includes("script")) return 2;
            if (s.includes("idea")) return 3;
            return 4;
        };
        const rA = getStageRank(a.Stage);
        const rB = getStageRank(b.Stage);
        if (rA !== rB) return rA - rB;
        const pA = Number(a.Priority) || 3;
        const pB = Number(b.Priority) || 3;
        if (pA !== pB) return pB - pA;
        return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
    });

    const rows = prods.map(p => {
        const isP5 = Number(p.Priority) === 5;
        const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
        const link = p5Badge + htmlLink(p.file.path, p.file.name) + getProBadges(p);
        const stage = formatStage(p.Stage);
        const fmt = p.Format ? ` <span style="opacity: 0.65; font-size: 0.85em;">(${p.Format})</span>` : "";
        const dead = p.Deadline ? `📅 ${p.Deadline}` : "-";
        const prio = formatPriority(p.Priority);
        return [link, stage + fmt, `${prio} &nbsp;•&nbsp; ${dead}`, formatStatus(getSt(p))];
    });

    return {
        count: prods.length,
        table: renderGenericFluid(
            ["Produção / Roteiro", "Estágio & Formato", "Prioridade & Prazo", "Status"],
            ["auto", "160px", "160px", "90px"],
            rows,
            emptyMsg
        )
    };
};

// ============================================================
// ROTEAMENTO POR MODO (COM ACCORDIONS EM 100% DOS MODOS)
// ============================================================

let sections = [];
let headerHtml = "";

switch (mode) {

    // --------------------------------------------------------
    // 0. PROGRESS (Barra de Evolução do Target para Study / Books / Courses / Goals / Metrics)
    // --------------------------------------------------------
    case "progress": {
        const targ = Number(current.Target || 0) || 0;
        if (targ <= 0) return;
        
        let curr = Number(current.Current || 0) || 0;
        const isBook = current.Class === "classBook";
        const isCourse = current.Class === "classCourse";
        
        // Se for curso e o Current for 0, tenta derivar das notas de aula
        if (isCourse && curr === 0) {
            const lessons = allPages.where(p => isNotConfigOrTemplate(p) && p.Class === "classLiterature" && matchesParent(p, "Parent"));
            if (lessons.length > 0) curr = lessons.length;
        }

        const unit = current.Unit || (isBook ? "pág" : (isCourse ? "aulas" : ""));
        const bar = asciiBar(curr, targ, 10);
        const valStr = targ >= 1000 ? `${compactVal(curr)}/${compactVal(targ)}` : `${curr}/${targ}`;
        const content = `<div style="display: flex; align-items: center; padding: 6px 12px; background: rgba(128, 128, 128, 0.05); border: 1px solid var(--background-modifier-border); border-radius: 6px; font-size: 0.88em; margin: 4px 0 10px 0; width: 100%; box-sizing: border-box;">
            <span style="font-family: var(--font-monospace);">${bar}</span>
            <span style="opacity: 0.65; font-size: 0.9em; font-family: var(--font-monospace); margin-left: 8px;">(${valStr} ${unit})</span>
        </div>`;

        dv.el("div", sanitizeHtml(content));
        return;
    }

    // --------------------------------------------------------
    // 1. SPRINT
    // --------------------------------------------------------
    case "sprint": {
        // Cálculo Matemático Rigoroso da Janela Temporal da Sprint (Sem truncamento por dailies parciais)
        const sNum = parseInt(curName.replace(/\D/g, ""), 10) || moment().isoWeek();
        const yr = parseInt(current.year, 10) || parseInt((current.file?.folder || "").match(/20\d\d/)?.[0], 10) || 2026;
        const sStart = moment(`${yr}-01-04`, "YYYY-MM-DD").isoWeek(sNum).startOf('isoWeek');
        const sEnd = moment(sStart).endOf('isoWeek');

        const sprintTag = curName.toLowerCase().replace(/[^a-z0-9]/g, ""); // ex: "sprint45"

        // 1. Metas Ativas & Concluídas (Estritamente isoladas a esta Sprint)
        const rawGoals = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classGoal") return false;
                const horiz = norm(p.Horizon);
                if (horiz && !["sprint", "weekly"].includes(horiz)) return false;
                const matchesThisSprintExplicit = matchesParent(p, "Parent") || (Array.isArray(p.tags) ? p.tags.map(t => norm(t)) : [norm(p.tags)]).some(t => t.includes(sprintTag));
                if (matchesThisSprintExplicit) return true;
                
                if (["sprint", "weekly"].includes(horiz)) {
                    const dead = parseMoment(p.Deadline);
                    if (dead && dead.isBetween(sStart, sEnd, null, "[]")) return true;
                }
                return false;
            });
        const goals = sortActiveFirst(rawGoals);
        const goalHtml = renderGoalsFluid(goals, "Nenhuma Meta definida para esta Sprint.");

        // 2. Métricas Quantitativas da Sprint
        const sprintGoalNames = new Set(goals.map(g => cleanLink(g.file?.name)));
        const rawMetrics = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classMetric") return false;
                const dead = parseMoment(p.Deadline);
                const tags = Array.isArray(p.tags) ? p.tags.map(t => norm(t)) : [norm(p.tags)];
                const matchesThisSprintExplicit = matchesParent(p, "Parent") || tags.some(t => t.includes(sprintTag));
                if (matchesThisSprintExplicit) return true;
                
                if (dead && dead.isBetween(sStart, sEnd, null, "[]")) {
                    const pName = cleanLink(p.Parent);
                    if (sprintGoalNames.has(pName)) return true;
                    if (norm(p.Cadence) === "sprint" || norm(p.Cadence) === "weekly") return true;
                }
                return false;
            });
        const metrics = sortActiveFirst(rawMetrics);
        const metricHtml = renderMetricsFluid(metrics, "Nenhuma métrica atrelada a esta Sprint.");

        // 3. 📦 Period Footprint da Sprint
        const sprintFootprint = getPeriodFootprint(sStart, sEnd);
        const footprintRows = sprintFootprint.map(f => [f.item, f.typeBadge, f.parentLink, f.infoStr]);
        const footprintHtml = renderGenericFluid(
            ["Item", "Tipo", "Parent", "Resultado / Info"],
            ["auto", "90px", "130px", "150px"],
            footprintRows,
            "Nenhuma produção ou consumo registrado nesta Sprint."
        );

        // 4. Telemetria dos Dias (Dailies existentes desta Sprint)
        const dailies = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classDaily" && (matchesParent(p, "Parent") || p.file.folder === current.file.folder))
            .sort(p => p.file.name, "asc");
            
        const dailyArr = dailies?.array ? dailies.array() : Array.from(dailies || []);
        const dailyRows = dailyArr.map(p => {
            const dateLink = htmlLink(p.file.path, p.file.name);
            const rating = p.cog_day_rating != null ? `${p.cog_day_rating}/5` : "-";
            const sleep = p.bio_sleep_hours != null ? `${p.bio_sleep_hours}h` : "-";
            const deepWork = p.exec_deep_work_h != null ? `${p.exec_deep_work_h}h` : "-";
            const craving = p.cog_craving != null ? `${p.cog_craving}/5` : "-";
            const mood = p.cog_mood ? trunc(String(p.cog_mood), 16) : "-";
            return [dateLink, rating, sleep, deepWork, craving, mood];
        });
        const dailyTable = renderGenericFluid(
            ["Data", "Rating", "Sono", "Deep Work", "Craving", "Humor"],
            ["105px", "60px", "60px", "80px", "60px", "auto"],
            dailyRows,
            "Nenhuma Daily registrada nesta Sprint."
        );

        sections = [
            { title: `🎯 Metas Ativas & Concluídas (${goals.length})`, content: goalHtml, isOpen: true },
            { title: `📊 Métricas Quantitativas (${metrics.length})`, content: metricHtml, isOpen: false },
            { title: `📦 Period Footprint (${sprintFootprint.length})`, content: footprintHtml, isOpen: false },
            { title: `⚡ Telemetria dos Dias (${dailyArr.length})`, content: dailyTable, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 2. MONTHLY
    // --------------------------------------------------------
    case "monthly": {
        // Extração robusta do número do mês e do ano
        let mNum = parseInt(curName.replace(/\D/g, ""), 10);
        if (!mNum || mNum < 1 || mNum > 12) {
            if (current.month_id) {
                const mMatch = String(current.month_id).match(/-(\d{2})$/);
                if (mMatch) mNum = parseInt(mMatch[1], 10);
            }
        }
        if (!mNum || mNum < 1 || mNum > 12) {
            const parts = (current.file?.folder || current.file?.path || "").split("/");
            for (let part of parts) {
                let match = part.match(/^(\d{2})-/);
                if (match) { mNum = parseInt(match[1], 10); break; }
            }
        }
        if (!mNum || mNum < 1 || mNum > 12) {
            mNum = moment().month() + 1;
        }

        let yr = parseInt(current.year, 10);
        if (!yr && current.month_id) {
            const yMatch = String(current.month_id).match(/^20\d\d/);
            if (yMatch) yr = parseInt(yMatch[0], 10);
        }
        if (!yr) {
            const yMatch = (current.file?.folder || current.file?.path || "").match(/20\d\d/);
            if (yMatch) yr = parseInt(yMatch[0], 10);
        }
        if (!yr) yr = moment().year();

        const mStart = moment(`${yr}-${String(mNum).padStart(2, "0")}-01`, "YYYY-MM-DD").startOf('month');
        const mEnd = moment(mStart).endOf('month');

        // 1. Metas do Mês (Estritamente isoladas a este Mês)
        const rawGoals = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classGoal") return false;
                if (norm(p.Horizon) !== "monthly") return false;
                if (matchesParent(p, "Parent")) return true;
                const dead = parseMoment(p.Deadline);
                if (dead && dead.isBetween(mStart, mEnd, null, "[]")) return true;
                const cre = parseMoment(p.Created);
                if (!dead && cre && cre.isBetween(mStart, mEnd, null, "[]")) return true;
                return false;
            });
        const goals = sortActiveFirst(rawGoals);
        const goalHtml = renderGoalsFluid(goals, "Nenhuma meta mensal cadastrada.");

        // 2. Métricas Quantitativas do Mês
        const monthGoalNames = new Set(goals.map(g => cleanLink(g.file?.name)));
        const rawMetrics = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classMetric") return false;
                if (matchesParent(p, "Parent")) return true;
                const dead = parseMoment(p.Deadline);
                if (dead && dead.isBetween(mStart, mEnd, null, "[]")) {
                    const pName = cleanLink(p.Parent);
                    if (monthGoalNames.has(pName)) return true;
                    if (norm(p.Cadence) === "monthly") return true;
                }
                const cre = parseMoment(p.Created);
                if (!dead && cre && cre.isBetween(mStart, mEnd, null, "[]") && norm(p.Cadence) === "monthly") return true;
                return false;
            });
        const metrics = sortActiveFirst(rawMetrics);
        const metricHtml = renderMetricsFluid(metrics, "Nenhuma métrica ativa no mês.");

        // 3. 📦 Period Footprint do Mês
        const monthFootprint = getPeriodFootprint(mStart, mEnd);
        const footprintRows = monthFootprint.map(f => [f.item, f.typeBadge, f.parentLink, f.infoStr]);
        const footprintHtml = renderGenericFluid(
            ["Item", "Tipo", "Parent", "Resultado / Info"],
            ["auto", "90px", "130px", "150px"],
            footprintRows,
            "Nenhuma produção ou consumo registrado neste mês."
        );

        sections = [
            { title: `🎯 Metas Ativas & Concluídas (${goals.length})`, content: goalHtml, isOpen: true },
            { title: `📊 Métricas Quantitativas (${metrics.length})`, content: metricHtml, isOpen: false },
            { title: `📦 Period Footprint (${monthFootprint.length})`, content: footprintHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 3. ANNUAL
    // --------------------------------------------------------
    case "annual": {
        // Janela Temporal do Ano Inteiro
        let yr = parseInt(current.year, 10);
        if (!yr) {
            const yMatch = curName.match(/20\d\d/);
            if (yMatch) yr = parseInt(yMatch[0], 10);
        }
        if (!yr) {
            const yMatch = (current.file?.folder || current.file?.path || "").match(/20\d\d/);
            if (yMatch) yr = parseInt(yMatch[0], 10);
        }
        if (!yr) yr = moment().year();

        const yStart = moment(`${yr}-01-01`, "YYYY-MM-DD").startOf('year');
        const yEnd = moment(`${yr}-12-31`, "YYYY-MM-DD").endOf('year');

        // 1. Metas Anuais (Estritamente isoladas a este Ano)
        const rawGoals = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classGoal") return false;
                if (norm(p.Horizon) !== "annual") return false;
                if (matchesParent(p, "Parent")) return true;
                const dead = parseMoment(p.Deadline);
                if (dead && dead.year() === yr) return true;
                const cre = parseMoment(p.Created);
                if (!dead && cre && cre.year() === yr) return true;
                return false;
            });
        const goals = sortActiveFirst(rawGoals);
        const goalHtml = renderGoalsFluid(goals, "Nenhuma meta anual registrada.");

        // 2. Sensores & Métricas Anuais (Estritamente isoladas a este Ano)
        const annualGoalNames = new Set(goals.map(g => cleanLink(g.file?.name)));
        const rawMetrics = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classMetric") return false;
                if (matchesParent(p, "Parent")) return true;
                const dead = parseMoment(p.Deadline);
                if (dead && dead.year() === yr) {
                    const pName = cleanLink(p.Parent);
                    if (annualGoalNames.has(pName)) return true;
                    if (norm(p.Cadence) === "annual") return true;
                }
                const cre = parseMoment(p.Created);
                if (!dead && cre && cre.year() === yr && norm(p.Cadence) === "annual") return true;
                return false;
            });
        const metrics = sortActiveFirst(rawMetrics);
        const metricHtml = renderMetricsFluid(metrics, "Nenhuma métrica anual registrada.");

        // 3. 📦 Period Footprint do Ano (Substitui dropdown redundante)
        const yearFootprint = getPeriodFootprint(yStart, yEnd);
        const footprintRows = yearFootprint.map(f => [f.item, f.typeBadge, f.parentLink, f.infoStr]);
        const footprintHtml = renderGenericFluid(
            ["Item", "Tipo", "Parent", "Resultado / Info"],
            ["auto", "90px", "130px", "150px"],
            footprintRows,
            "Nenhuma produção ou consumo registrado neste ano."
        );

        sections = [
            { title: `🎯 Metas Anuais (${goals.length})`, content: goalHtml, isOpen: true },
            { title: `📊 Sensores & Métricas Anuais (${metrics.length})`, content: metricHtml, isOpen: true },
            { title: `📦 Colheita Anual (${yearFootprint.length})`, content: footprintHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 4. GOAL
    // --------------------------------------------------------
    case "goal": {
        const rawSubGoals = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classGoal" && matchesParent(p, "Parent"));
        const subGoals = sortActiveFirst(rawSubGoals);
        const subHtml = renderGoalsFluid(subGoals, "Nenhuma sub-meta vinculada.");

        const rawMetrics = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classMetric" && matchesParent(p, "Parent"));
        const metrics = sortActiveFirst(rawMetrics);
        const metricHtml = renderMetricsFluid(metrics, "Nenhuma métrica atrelada a esta meta.");

        // 3. 📦 Artefatos, Projetos & PoW Vinculados (Docs, Projetos, Zettels vinculados ou referenciados)
        const curName = current.file.name;
        const curPar = cleanLink(current.Parent || "-");

        // Coleta links diretos de entrada e saída da meta
        const linkedNames = new Set();
        if (current.file?.inlinks) {
            for (const l of current.file.inlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) linkedNames.add(n);
            }
        }
        if (current.file?.outlinks) {
            for (const l of current.file.outlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) linkedNames.add(n);
            }
        }

        const rawArtifacts = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p)) return false;
                if (["classGoal", "classMetric", "classDaily", "classHub"].includes(p.Class)) return false;
                if (matchesParent(p, "Parent") || matchesParent(p, "Source_Ref")) return true;
                if (linkedNames.has(p.file.name)) return true;
                return false;
            });

        const artifacts = Array.from(rawArtifacts || []).sort((a, b) => {
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            const tA = getDocTime(a);
            const tB = getDocTime(b);
            if (tA !== tB) return tB - tA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });

        const artRows = artifacts.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, trunc(p.file.name, 35)) + getProBadges(p);
            const typeBadge = formatType(p.Class || "classDoc");
            const parentLink = p.Parent ? htmlLink(cleanLink(p.Parent), trunc(cleanLink(p.Parent), 20)) : "-";
            const info = formatEntityContextInfo(p);
            return [link, typeBadge, parentLink, info];
        });
        const artHtml = renderGenericFluid(
            ["Artefato / Projeto / PoW", "Tipo", "Parent", "Status / Data"],
            ["auto", "110px", "130px", "120px"],
            artRows,
            "Nenhum artefato, projeto ou nota vinculado a esta meta."
        );

        sections = [
            { title: `🎯 Sub-Metas Vinculadas (${subGoals.length})`, content: subHtml, isOpen: true },
            { title: `📊 Métricas Atreladas (${metrics.length})`, content: metricHtml, isOpen: false },
            { title: `📦 Artefatos & PoW Vinculados (${artifacts.length})`, content: artHtml, isOpen: (subGoals.length === 0 && metrics.length === 0 && artifacts.length > 0) }
        ];
        break;
    }

    // --------------------------------------------------------
    // 5. WORK & VENTURES (VERTICAL PROFISSIONAL)
    // --------------------------------------------------------
    case "work": {
        // 1. 🏢 Active Ventures & North Star KPIs (Aberto por padrão)
        const rawActiveVentures = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classVenture" && getSt(p) === "in_progress");
        
        // Ordenação de Ventures: Prioridade Descendente (P5 no topo), depois Nome
        const activeVentures = Array.from(rawActiveVentures || []).sort((a, b) => {
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });
        
        const ventureRows = activeVentures.map(v => {
            const isP5 = Number(v.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(v.file.path, v.file.name) + getProBadges(v);
            const mktPrio = `${v.Market || "Global"} • ${formatPriority(v.Priority || 3)}`;
            const vName = v.file.name;
            
            // Busca a Meta Anual (North Star) atrelada a esta Venture
            const annualGoals = allPages.where(p => 
                isNotConfigOrTemplate(p) && 
                p.Class === "classGoal" && 
                norm(p.Horizon) === "annual" && 
                cleanLink(p.Parent) === vName
            );
            const annualGoal = annualGoals?.first ? annualGoals.first() : (annualGoals && annualGoals[0]);

            let bar = `<span style="opacity: 0.35;">-</span>`;
            let metricStr = "-";
            if (annualGoal) {
                const targ = Number(annualGoal.Target) || 0;
                const curr = Number(annualGoal.Current) || 0;
                const gLink = htmlLink(annualGoal.file.path, annualGoal.file.name);
                bar = targ > 0 ? asciiBar(curr, targ, 10) : formatStatus(getSt(annualGoal));
                metricStr = targ > 0 ? `${compactVal(curr)}/${compactVal(targ)} ${annualGoal.Unit || "USD"}` : gLink;
            }

            return [link, mktPrio, bar, metricStr];
        });
        const ventureTable = renderGenericFluid(
            ["Venture", "Mercado • Prio", "North Star Anual", "Progresso da Meta"],
            ["auto", "140px", "160px", "150px"],
            ventureRows,
            "Nenhuma Venture ativa no momento."
        );

        // Coleta nomes das Ventures ativas para filtragem de projetos
        const activeVentureNames = new Set(activeVentures.map(v => v.file.name));

        // 2. 🚀 Active Engineering & Product Pipeline (Aberto por padrão)
        const rawActiveProjects = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classProject" && getSt(p) === "in_progress" && (
                !p.Parent || activeVentureNames.has(cleanLink(p.Parent))
            ));
        
        // Ordenação de Projetos: Prioridade Descendente (P5 no topo), agrupado por Parent Venture, depois Nome
        const activeProjects = Array.from(rawActiveProjects || []).sort((a, b) => {
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            const parA = cleanLink(a.Parent || "");
            const parB = cleanLink(b.Parent || "");
            if (parA !== parB) return parA.localeCompare(parB);
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });
        
        const projRows = activeProjects.map(p => {
            const verStr = p.Version ? ` <span style="opacity: 0.65; font-size: 0.85em;">(${p.Version})</span>` : "";
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, p.file.name) + verStr + getProBadges(p);
            const parentLink = p.Parent ? htmlLink(cleanLink(p.Parent), cleanLink(p.Parent)) : "-";
            const sub = formatStatus(p.Subtype || "product");
            const dead = p.Deadline ? `📅 ${p.Deadline}` : "-";
            return [link, parentLink, sub, dead];
        });
        const projTable = renderGenericFluid(
            ["Projeto (Release)", "Parent Venture", "Subtipo", "Prazo / Release"],
            ["auto", "150px", "120px", "130px"],
            projRows,
            "Nenhum projeto em desenvolvimento ativo."
        );

        // 3. 🎯 Professional Focus (Sprint & Monthly Goals) (Aberto por padrão)
        const activeProjectNames = new Set(activeProjects.map(pr => pr.file.name));
        const rawProGoals = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classGoal") return false;
                if (getSt(p) !== "in_progress") return false;
                const pillar = norm(p.Pillar);
                const par = cleanLink(p.Parent);
                const isProParent = par === "Work" || activeVentureNames.has(par) || activeProjectNames.has(par);
                return pillar === "professional" || isProParent;
            });
        
        // Ordenação de Metas: Horizonte (Sprint -> Mensal -> Trimestral -> Anual), depois Prioridade (P5 no topo), depois Prazo
        const getGoalHorizonRank = (h) => {
            const s = norm(h);
            if (s === "sprint" || s === "weekly" || s === "week") return 0;
            if (s === "monthly" || s === "month") return 1;
            if (s === "quarterly" || s === "quarter") return 2;
            if (s === "annual" || s === "year") return 3;
            return 4;
        };

        const proGoals = Array.from(rawProGoals || []).sort((a, b) => {
            const hA = getGoalHorizonRank(a.Horizon);
            const hB = getGoalHorizonRank(b.Horizon);
            if (hA !== hB) return hA - hB;
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            const mA = parseMoment(a.Deadline);
            const mB = parseMoment(b.Deadline);
            if (mA && mB) return mA.valueOf() - mB.valueOf();
            if (mA && !mB) return -1;
            if (!mA && mB) return 1;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });
        
        const goalRows = proGoals.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, p.file.name);
            const horiz = formatStatus(p.Horizon || "sprint");
            const targetRef = cleanLink(p.Parent || "-");
            const targetLink = (targetRef && targetRef !== "-") ? htmlLink(targetRef, targetRef) : "-";
            const targ = Number(p.Target) || 0;
            const bar = targ > 0 ? asciiBar(p.Current, p.Target, 10) : formatStatus(getSt(p));
            const dead = p.Deadline ? `📅 ${p.Deadline}` : "-";
            return [link, horiz, targetLink, `${bar} ${dead}`];
        });
        const goalTable = renderGenericFluid(
            ["Meta Profissional", "Horizonte", "Alvo", "Status / Prazo"],
            ["auto", "95px", "150px", "160px"],
            goalRows,
            "Nenhuma meta profissional ativa nesta Sprint."
        );

        // 4. 📄 Recent Specs, Decisions & Playbooks (30d) (Fechado por padrão)
        const recentCutoffMs = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const rawRecentDocs = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classDoc") return false;
                const m = parseMoment(p.Updated || p.Created, p.file?.mtime);
                const t = m ? (typeof m.valueOf === "function" ? m.valueOf() : Number(m)) : 0;
                return t >= recentCutoffMs;
            });
        
        // Ordenação Categórica de Documentos: Specs -> Estratégias -> Processos/SOPs -> Reuniões -> Clientes -> Ideias -> Referências
        const getWorkDocRank = (sub) => {
            const s = norm(sub);
            if (s === "spec" || s === "architecture") return 0;
            if (s === "strategy" || s === "plan") return 1;
            if (s === "process" || s === "sop" || s === "playbook" || s === "guide" || s === "doc") return 2;
            if (s === "decision" || s === "meeting" || s === "call" || s === "log") return 3;
            if (s === "client" || s === "partner" || s === "vendor" || s === "stakeholder") return 4;
            if (s === "idea" || s === "concept" || s === "draft" || s === "creative") return 5;
            if (s === "reference" || s === "benchmark" || s === "swipe" || s === "source" || s === "ref") return 6;
            return 7;
        };

        const recentDocs = Array.from(rawRecentDocs || []).sort((a, b) => {
            const rA = getWorkDocRank(a.Subtype);
            const rB = getWorkDocRank(b.Subtype);
            if (rA !== rB) return rA - rB;
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            const tA = getDocTime(a);
            const tB = getDocTime(b);
            if (tA !== tB) return tB - tA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });
        
        const docRows = recentDocs.map(d => {
            const isP5 = Number(d.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(d.file.path, d.file.name) + getProBadges(d);
            const sub = formatDocSubtype(d.Subtype);
            const prio = formatPriority(d.Priority);
            const parentLink = d.Parent ? htmlLink(cleanLink(d.Parent), cleanLink(d.Parent)) : "-";
            const dt = d.Updated ? String(d.Updated).slice(0, 10) : (d.Created ? String(d.Created).slice(0, 10) : "-");
            return [link, sub, prio, parentLink, dt];
        });
        const docTable = renderGenericFluid(
            ["Documento", "Tipo", "Prioridade", "Venture / Projeto", "Atualizado em"],
            ["auto", "120px", "85px", "140px", "100px"],
            docRows,
            "Nenhum documento recente nos últimos 30 dias."
        );

        // 5. ⏸️ Incubator / Paused Ventures (Fechado por padrão)
        const rawPausedVentures = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classVenture" && ["paused", "inbox", "abandoned"].includes(getSt(p)));
        
        const getVentureStatusRank = (st) => {
            const s = norm(st);
            if (s === "paused") return 0;
            if (s === "inbox") return 1;
            if (s === "abandoned") return 2;
            return 3;
        };

        const pausedVentures = Array.from(rawPausedVentures || []).sort((a, b) => {
            const rA = getVentureStatusRank(getSt(a));
            const rB = getVentureStatusRank(getSt(b));
            if (rA !== rB) return rA - rB;
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });
        
        const pausedRows = pausedVentures.map(v => {
            const isP5 = Number(v.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(v.file.path, v.file.name);
            const mkt = v.Market || "Global";
            const st = formatStatus(getSt(v));
            const dt = v.Updated ? String(v.Updated).slice(0, 10) : "-";
            return [link, mkt, st, dt];
        });
        const pausedTable = renderGenericFluid(
            ["Venture Pausada", "Mercado", "Status", "Atualizado em"],
            ["auto", "130px", "110px", "110px"],
            pausedRows,
            "Nenhuma Venture em incubação ou pausa."
        );

        sections = [
            { title: `🏢 Active Ventures & North Star KPIs (${activeVentures.length})`, content: ventureTable, isOpen: true },
            { title: `🚀 Active Engineering & Product Pipeline (${activeProjects.length})`, content: projTable, isOpen: true },
            { title: `🎯 Professional Focus (Sprint & Monthly Goals) (${proGoals.length})`, content: goalTable, isOpen: true },
            { title: `📄 Recent Specs, Decisions & Playbooks (30d) (${recentDocs.length})`, content: docTable, isOpen: false },
            { title: `⏸️ Incubator / Paused Ventures (${pausedVentures.length})`, content: pausedTable, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 6. VENTURE
    // --------------------------------------------------------
    case "venture": {
        headerHtml = "";

        // 1. Projetos filhos da Venture
        const rawChildProjects = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classProject" && matchesParent(p, "Parent"));
        
        const childProjectPages = Array.from(rawChildProjects || []).sort((a, b) => {
            const getProjStatusRank = (st) => {
                const s = norm(st);
                if (s === "in_progress") return 0;
                if (s === "planned" || s === "backlog") return 1;
                if (s === "paused") return 2;
                if (s === "done" || s === "completed") return 3;
                if (s === "canceled") return 4;
                return 1;
            };
            const sA = getProjStatusRank(getSt(a));
            const sB = getProjStatusRank(getSt(b));
            if (sA !== sB) return sA - sB;
            const prioA = Number(a.Priority) || 3;
            const prioB = Number(b.Priority) || 3;
            if (prioA !== prioB) return prioB - prioA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });
        const childProjectNames = new Set(childProjectPages.map(p => p.file.name));

        // 2. Resolução Recursiva em Cascata de Entidades da Venture (Goals, Docs, Specs) via Parent (3NF)
        const curVName = current.file.name;
        const ventureEntities = new Set([curVName, ...childProjectNames]);
        let cascadeAdded = true;
        while (cascadeAdded) {
            cascadeAdded = false;
            for (let p of allPages) {
                if (!p || !p.file || isNotConfigOrTemplate(p) === false) continue;
                if (ventureEntities.has(p.file.name)) continue;
                const par = cleanLink(p.Parent ?? p.parent ?? p.file?.frontmatter?.Parent ?? p.file?.frontmatter?.parent);
                if (ventureEntities.has(par)) {
                    ventureEntities.add(p.file.name);
                    cascadeAdded = true;
                }
            }
        }

        const matchesVentureOrChild = (p) => {
            if (!p || !p.file) return false;
            const par = cleanLink(p.Parent ?? p.parent ?? p.file?.frontmatter?.Parent ?? p.file?.frontmatter?.parent);
            return ventureEntities.has(p.file.name) || ventureEntities.has(par);
        };

        // 1. 🚀 Pipeline de Projetos (Sem coluna morta de Progresso)
        const projRows = childProjectPages.map(p => {
            const verStr = p.Version ? ` <span style="opacity: 0.65; font-size: 0.85em;">(${p.Version})</span>` : "";
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, p.file.name) + verStr + getProBadges(p);
            const sub = formatStatus(p.Subtype || "product");
            const dead = p.Deadline ? `📅 ${p.Deadline}` : "-";
            return [link, sub, formatStatus(getSt(p)), dead];
        });
        const projTable = renderGenericFluid(
            ["Projeto / Produto", "Subtipo", "Status", "Prazo / Release"],
            ["auto", "120px", "95px", "130px"],
            projRows,
            "Nenhum projeto vinculado a esta Venture."
        );

        // 2. 🎯 Metas Ativas da Venture
        const rawActiveGoals = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classGoal" && matchesVentureOrChild(p) && norm(getSt(p)) !== "done" && norm(getSt(p)) !== "completed");
        const activeGoals = sortActiveFirst(rawActiveGoals);
        const goalHtml = renderGoalsFluid(activeGoals, "Nenhuma meta ativa atrelada a esta Venture ou seus projetos no momento.");

        // 3–8. Tabelas Categóricas de classDoc via Helper Universal
        const getProcessRank = (sub) => ({ process: 0, sop: 1, playbook: 2, guide: 3, doc: 4, document: 4 }[norm(sub)] ?? 5);
        const getStrategyRank = (sub) => ({ strategy: 0, plan: 0, spec: 1, architecture: 1 }[norm(sub)] ?? 2);
        const getRefRank = (sub) => ({ reference: 0, ref: 0, benchmark: 1, swipe: 2, source: 3 }[norm(sub)] ?? 4);
        const getPartnerRank = (sub) => ({ client: 0, partner: 1, vendor: 2, b2b: 2 }[norm(sub)] ?? 3);

        const processRes = buildDocSubtypeTable(matchesVentureOrChild, ["process", "sop", "guide", "playbook", "doc", "document"], "Processo / Documento", "Nenhum processo ou documento operacional registrado.", { showParent: true, rankFn: getProcessRank });
        const strategyRes = buildDocSubtypeTable(matchesVentureOrChild, ["strategy", "spec", "architecture", "plan"], "Estratégia / Especificação", "Nenhuma estratégia operacional ou especificação técnica registrada.", { showParent: true, rankFn: getStrategyRank });
        const ideaRes = buildDocSubtypeTable(matchesVentureOrChild, ["idea", "concept", "draft", "creative"], "Conceito Criativo / Ideia", "Nenhum conceito ou ideia registrada para esta Venture.", { showParent: true, showPriorityInsteadOfType: true, dateColWidth: "100px" });
        const refRes = buildDocSubtypeTable(matchesVentureOrChild, ["reference", "benchmark", "swipe", "source", "ref"], "Fonte / Referência", "Nenhuma fonte ou referência registrada.", { showParent: true, rankFn: getRefRank, dateColWidth: "100px" });
        const partnerRes = buildDocSubtypeTable(matchesVentureOrChild, ["client", "partner", "b2b", "vendor", "stakeholder"], "Parceiro / Cliente", "Nenhum cliente ou parceiro cadastrado.", { showParent: true, showPeople: true, rankFn: getPartnerRank, dateColWidth: "100px" });
        const meetingRes = buildDocSubtypeTable(matchesVentureOrChild, ["meeting", "call", "log", "decision"], "Registro / Ata", "Nenhuma ata de reunião ou log registrado.", { showParent: true, useCreatedFirst: true, dateColTitle: "Data da Call / Criação", dateColWidth: "130px" });

        // 9. 📦 Footprint de Entregas da Venture (Histórico de Metas e Projetos Concluídos)
        const rawVentureFootprint = allPages.where(p => {
            if (!isNotConfigOrTemplate(p)) return false;
            if (!matchesVentureOrChild(p)) return false;
            const st = norm(getSt(p));
            if (st !== "done" && st !== "completed") return false;
            return p.Class === "classGoal" || p.Class === "classProject";
        });

        const ventureFootprint = Array.from(rawVentureFootprint || []).sort((a, b) => {
            const tA = parseMoment(a.Completed_At || a.Updated, a.file?.mtime)?.valueOf() || 0;
            const tB = parseMoment(b.Completed_At || b.Updated, b.file?.mtime)?.valueOf() || 0;
            if (tA !== tB) return tB - tA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });

        const vFootprintRows = ventureFootprint.map(item => {
            const isP5 = Number(item.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(item.file.path, item.file.name) + getProBadges(item);
            let typeBadge = "🎯 Meta";
            if (item.Class === "classProject") {
                typeBadge = "🚀 Projeto";
            } else if (item.Class === "classGoal") {
                const horiz = norm(item.Horizon || "sprint");
                typeBadge = horiz === "annual" ? "🏛️ Year Goal" : (horiz === "monthly" ? "📅 Month Goal" : "⚡ Sprint Goal");
            }
            const par = cleanLink(item.Parent || "-");
            const parLink = (par && par !== "-") ? htmlLink(par, par) : "-";
            const dtM = parseMoment(item.Completed_At || item.Updated, item.file?.mtime);
            const dt = dtM ? dtM.format("DD-MM-YYYY") : "-";
            const outcome = `<span style="color: #10b981; font-weight: 500;">Concluído ✅</span>`;
            return [link, typeBadge, parLink, dt, outcome];
        });
        const vFootprintTable = renderGenericFluid(
            ["Entrega / Item Concluído", "Tipo", "Vínculo", "Data de Conclusão", "Resultado"],
            ["auto", "120px", "140px", "110px", "100px"],
            vFootprintRows,
            "Nenhuma entrega concluída registrada nesta Venture ainda."
        );

        // 10. 🎬 Produções Audiovisuais & Criativos da Venture
        const vProdRes = buildEntityProductionsTable(matchesVentureOrChild, "Nenhuma produção audiovisual ou criativo registrado para esta Venture.");

        // 11. 📋 Ficheiro
        const annualGoals = allPages.where(p => 
            isNotConfigOrTemplate(p) && 
            p.Class === "classGoal" && 
            norm(p.Horizon) === "annual" && 
            cleanLink(p.Parent ?? p.parent) === curVName
        );
        const annualGoal = annualGoals?.first ? annualGoals.first() : (annualGoals && annualGoals[0]);

        const mkt = current.Market || "Global";
        const role = current.Role || "-";
        const prio = current.Priority ? formatPriority(current.Priority) : "-";
        const st = formatStatus(getSt(current));
        const ttl = `${current.inertia_ttl || 7} dias`;
        const badges = getProBadges(current);
        const dates = `${current.Created ? String(current.Created).slice(0, 10) : "-"} • ${current.Updated ? String(current.Updated).slice(0, 10) : "-"}`;

        const vFicheiroRows = [
            renderInfoRow("Mercado de Atuação", mkt),
            renderInfoRow("Papel / Responsabilidade", role),
            renderInfoRow("Prioridade Estratégica", prio),
            renderInfoRow("Status da Operação", st),
            annualGoal ? renderInfoRow("Meta Anual (North Star)", htmlLink(annualGoal.file.path, annualGoal.file.name)) : "",
            renderInfoRow("Janela de Inércia (TTL)", ttl),
            badges ? renderInfoRow("Links & Acessos", badges) : "",
            renderInfoRow("Criação & Atualização", dates)
        ].filter(Boolean).join("");
        const vFicheiroHtml = `<div style="display: flex; flex-direction: column; width: 100%; box-sizing: border-box;">${vFicheiroRows}</div>`;

        sections = [
            { title: `🚀 Pipeline de Projetos (${childProjectPages.length})`, content: projTable, isOpen: childProjectPages.length > 0 },
            { title: `🎯 Metas Ativas da Venture (${activeGoals.length})`, content: goalHtml, isOpen: (childProjectPages.length === 0 && activeGoals.length > 0) },
            { title: `🎬 Produções & Criativos (${vProdRes.count})`, content: vProdRes.table, isOpen: false },
            { title: `📋 Documentos e Processos (${processRes.count})`, content: processRes.table, isOpen: (childProjectPages.length === 0 && activeGoals.length === 0 && processRes.count > 0) },
            { title: `🏛️ Operational Strategies (${strategyRes.count})`, content: strategyRes.table, isOpen: false },
            { title: `💡 Creative Concepts (${ideaRes.count})`, content: ideaRes.table, isOpen: false },
            { title: `📑 Sources and References (${refRes.count})`, content: refRes.table, isOpen: false },
            { title: `🤝 Partners (${partnerRes.count})`, content: partnerRes.table, isOpen: false },
            { title: `🎙️ Meetings (${meetingRes.count})`, content: meetingRes.table, isOpen: false },
            { title: `📦 Footprint de Entregas (${ventureFootprint.length})`, content: vFootprintTable, isOpen: false },
            { title: "📋 Ficheiro", content: vFicheiroHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 7. PROJECT
    // --------------------------------------------------------
    case "project": {
        const curPName = current.file.name;
        
        // Mapeia entidades vinculadas ao projeto (incluindo cascata via Parent)
        const projectEntities = new Set([curPName]);
        let projCascade = true;
        while (projCascade) {
            projCascade = false;
            for (const p of allPages) {
                if (!p || !p.file || projectEntities.has(p.file.name)) continue;
                const par = cleanLink(p.Parent ?? p.parent ?? p.file?.frontmatter?.Parent ?? p.file?.frontmatter?.parent);
                if (projectEntities.has(par)) {
                    projectEntities.add(p.file.name);
                    projCascade = true;
                }
            }
        }
        const matchesProjectOrChild = (p) => {
            if (!p || !p.file) return false;
            const par = cleanLink(p.Parent ?? p.parent ?? p.file?.frontmatter?.Parent ?? p.file?.frontmatter?.parent);
            return projectEntities.has(p.file.name) || projectEntities.has(par);
        };

        // 1. 🎯 Sprints & Metas Ativas do Projeto
        const rawActiveGoals = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classGoal" && matchesProjectOrChild(p) && norm(getSt(p)) !== "done" && norm(getSt(p)) !== "completed");
        const activeGoals = sortActiveFirst(rawActiveGoals);
        const goalHtml = renderGoalsFluid(activeGoals, "Nenhuma sprint ou meta ativa vinculada diretamente a este projeto.");

        // 2–7. Tabelas Categóricas de classDoc via Helper Universal
        const getProcessRank = (sub) => ({ process: 0, sop: 1, playbook: 2, guide: 3 }[norm(sub)] ?? 4);
        const getRefRank = (sub) => ({ reference: 0, ref: 0, benchmark: 1, swipe: 2, source: 3 }[norm(sub)] ?? 4);

        const specRes = buildDocSubtypeTable(matchesProjectOrChild, ["spec", "architecture"], "Especificação / Arquitetura", "Nenhuma especificação técnica vinculada a este projeto.", { typeColWidth: "130px", dateColWidth: "120px" });
        const processRes = buildDocSubtypeTable(matchesProjectOrChild, ["process", "sop", "playbook", "guide", "doc"], "Processo / Documento Operacional", "Nenhum processo ou SOP registrado para este projeto.", { rankFn: getProcessRank, typeColWidth: "130px", dateColWidth: "120px" });
        const strategyRes = buildDocSubtypeTable(matchesProjectOrChild, ["strategy", "plan"], "Estratégia / Planejamento", "Nenhuma estratégia operacional vinculada a este projeto.", { typeColWidth: "130px", dateColWidth: "120px" });
        const ideaRes = buildDocSubtypeTable(matchesProjectOrChild, ["idea", "concept", "draft", "creative"], "Conceito / Ideia", "Nenhum conceito ou ideia registrada para este projeto.", { showPriorityInsteadOfType: true, dateColWidth: "110px" });
        const refRes = buildDocSubtypeTable(matchesProjectOrChild, ["reference", "benchmark", "swipe", "source", "ref"], "Fonte / Referência", "Nenhuma fonte ou referência registrada.", { rankFn: getRefRank, typeColWidth: "120px", dateColWidth: "110px" });
        const logRes = buildDocSubtypeTable(matchesProjectOrChild, ["meeting", "call", "decision", "log"], "Registro / Ata / Decisão", "Nenhuma reunião, call ou log registrado para este projeto.", { useCreatedFirst: true, dateColTitle: "Data", typeColWidth: "120px", dateColWidth: "110px" });

        // 8. 📦 Footprint de Entregas do Projeto (Metas e Entregas Concluídas)
        const rawProjectFootprint = allPages.where(p => {
            if (!isNotConfigOrTemplate(p)) return false;
            if (!matchesProjectOrChild(p)) return false;
            const st = norm(getSt(p));
            if (st !== "done" && st !== "completed") return false;
            return p.Class === "classGoal";
        });
        const projectFootprint = Array.from(rawProjectFootprint || []).sort((a, b) => {
            const tA = parseMoment(a.Completed_At || a.Updated, a.file?.mtime)?.valueOf() || 0;
            const tB = parseMoment(b.Completed_At || b.Updated, b.file?.mtime)?.valueOf() || 0;
            if (tA !== tB) return tB - tA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });
        const pFootprintRows = projectFootprint.map(item => {
            const isP5 = Number(item.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(item.file.path, item.file.name) + getProBadges(item);
            const horiz = norm(item.Horizon || "sprint");
            const typeBadge = horiz === "annual" ? "🏛️ Year Goal" : (horiz === "monthly" ? "📅 Month Goal" : "⚡ Sprint Goal");
            const dtM = parseMoment(item.Completed_At || item.Updated, item.file?.mtime);
            const dt = dtM ? dtM.format("DD-MM-YYYY") : "-";
            const outcome = `<span style="color: #10b981; font-weight: 500;">Concluído ✅</span>`;
            return [link, typeBadge, dt, outcome];
        });
        const pFootprintTable = renderGenericFluid(
            ["Entrega / Marco Concluído", "Tipo", "Data de Conclusão", "Resultado"],
            ["auto", "120px", "130px", "110px"],
            pFootprintRows,
            "Nenhum marco concluído registrado neste projeto ainda."
        );

        // 9. 🎬 Produções Audiovisuais & Criativos do Projeto
        const pProdRes = buildEntityProductionsTable(matchesProjectOrChild, "Nenhuma produção audiovisual ou criativo registrado para este projeto.");

        // 10. 📋 Ficheiro & Dados do Projeto
        const ver = current.Version || "v1.0";
        const sub = current.Subtype || "product";
        const pRaw = cleanLink(current.Parent || "-");
        const parentLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
        const prio = current.Priority ? formatPriority(current.Priority) : "-";
        const st = formatStatus(getSt(current));
        const dead = current.Deadline ? `📅 ${current.Deadline}` : "-";
        const badges = getProBadges(current);
        const dates = `${current.Created ? String(current.Created).slice(0, 10) : "-"} • ${current.Updated ? String(current.Updated).slice(0, 10) : "-"}`;

        const pFicheiroRows = [
            renderInfoRow("Versão Atual", ver),
            renderInfoRow("Tipo de Projeto", formatStatus(sub)),
            renderInfoRow("Venture Mãe", parentLink),
            renderInfoRow("Prioridade", prio),
            renderInfoRow("Status de Execução", st),
            renderInfoRow("Prazo / Deadline", dead),
            badges ? renderInfoRow("Repositório & Links", badges) : "",
            renderInfoRow("Criação & Atualização", dates)
        ].filter(Boolean).join("");
        const pFicheiroHtml = `<div style="display: flex; flex-direction: column; width: 100%; box-sizing: border-box;">${pFicheiroRows}</div>`;

        sections = [
            { title: `🎯 Sprints & Metas Ativas (${activeGoals.length})`, content: goalHtml, isOpen: activeGoals.length > 0 },
            { title: `📐 Especificações & Arquitetura (${specRes.count})`, content: specRes.table, isOpen: (activeGoals.length === 0 && specRes.count > 0) },
            { title: `🎬 Produções & Criativos (${pProdRes.count})`, content: pProdRes.table, isOpen: false },
            { title: `⚙️ Processos & SOPs (${processRes.count})`, content: processRes.table, isOpen: false },
            { title: `🏛️ Estratégias & Planejamento (${strategyRes.count})`, content: strategyRes.table, isOpen: false },
            { title: `💡 Conceitos Criativos & Ideias (${ideaRes.count})`, content: ideaRes.table, isOpen: false },
            { title: `📑 Fontes & Referências (${refRes.count})`, content: refRes.table, isOpen: false },
            { title: `🎙️ Reuniões, Calls & Decisões (${logRes.count})`, content: logRes.table, isOpen: false },
            { title: `📦 Footprint de Entregas (${projectFootprint.length})`, content: pFootprintTable, isOpen: false },
            { title: "📋 Ficheiro & Dados do Projeto", content: pFicheiroHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 8. DOC (NOTA FOLHA PROFISSIONAL / PROCESSOS / SPECS)
    // --------------------------------------------------------
    case "doc": {
        const curName = current.file.name;
        const curPar = cleanLink(current.Parent || "-");

        // 1. 🔗 Onde é Utilizado / Conexões Ativas (Inlinks excluindo o próprio pai)
        const inlinkNames = new Set();
        if (current.file?.inlinks) {
            for (const l of current.file.inlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) inlinkNames.add(n);
            }
        }

        const rawInlinks = allPages
            .where(p => isNotConfigOrTemplate(p) && (inlinkNames.has(p.file.name) || matchesParent(p, "Source_Ref")));

        const inlinkPages = Array.from(rawInlinks || []).sort((a, b) => {
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            const tA = getDocTime(a);
            const tB = getDocTime(b);
            if (tA !== tB) return tB - tA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });

        const inlinkRows = inlinkPages.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, trunc(p.file.name, 35)) + getProBadges(p);
            const typeBadge = formatType(p.Class || "classDoc");
            const parentLink = p.Parent ? htmlLink(cleanLink(p.Parent), trunc(cleanLink(p.Parent), 20)) : "-";
            const info = formatEntityContextInfo(p);
            return [link, typeBadge, parentLink, info];
        });

        const inlinkHtml = renderGenericFluid(
            ["Nota / Menção", "Tipo", "Parent", "Status / Data"],
            ["auto", "110px", "130px", "120px"],
            inlinkRows,
            "Nenhuma menção externa ou uso registrado deste documento."
        );

        // 2. 📂 Sub-Documentos & Desdobramentos Filhos
        const rawChildren = allPages
            .where(p => isNotConfigOrTemplate(p) && cleanLink(p.Parent) === curName && p.file.name !== curName);

        const childDocs = Array.from(rawChildren || []).sort((a, b) => {
            const pA = Number(a.Priority) || 0;
            const pB = Number(b.Priority) || 0;
            if (pA !== pB) return pB - pA;
            return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
        });

        const childRows = childDocs.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, trunc(p.file.name, 35)) + getProBadges(p);
            const sub = formatDocSubtype(p.Subtype);
            const prio = formatPriority(p.Priority);
            const updated = p.Updated ? String(p.Updated).slice(0, 10) : "-";
            return [link, sub, prio, updated];
        });

        const childHtml = renderGenericFluid(
            ["Sub-Documento / Desdobramento", "Subtipo", "Prioridade", "Atualizado em"],
            ["auto", "120px", "90px", "110px"],
            childRows,
            "Nenhum sub-documento ou desdobramento vinculado."
        );

        // 3. 📋 Ficheiro & Metadados do Documento
        const sub = formatDocSubtype(current.Subtype);
        const pRaw = cleanLink(current.Parent || "-");
        const parentLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
        const ppl = resolvePersonLink(current.People);
        const badges = getProBadges(current);
        const prioBadge = formatPriority(current.Priority);
        const dates = `${current.Created ? String(current.Created).slice(0, 10) : "-"} • ${current.Updated ? String(current.Updated).slice(0, 10) : "-"}`;
        const urlLink = current.URL ? `<a href="${current.URL}" target="_blank" rel="noopener" style="color: var(--text-accent);">${trunc(current.URL, 40)}</a>` : "";
        const canvasLink = current.Canvas ? htmlLink(cleanLink(current.Canvas), cleanLink(current.Canvas)) : "";

        const ficheiroRows = [
            renderInfoRow("Classificação", sub),
            renderInfoRow("Venture / Projeto Pai", parentLink),
            renderInfoRow("Prioridade", prioBadge),
            ppl !== "-" ? renderInfoRow("Pessoas Envolvidas", ppl) : "",
            urlLink ? renderInfoRow("Link Externo", urlLink) : "",
            canvasLink ? renderInfoRow("Canvas Vinculado", canvasLink) : "",
            badges ? renderInfoRow("Links & Referências", badges) : "",
            renderInfoRow("Criação & Atualização", dates)
        ].filter(Boolean).join("");

        const ficheiroHtml = `<div style="display: flex; flex-direction: column;">${ficheiroRows}</div>`;

        sections = [
            { 
                title: `🔗 Conexões & Onde é Utilizado (${inlinkRows.length})`, 
                content: inlinkHtml, 
                isOpen: inlinkRows.length > 0 
            },
            { 
                title: `📂 Sub-Documentos & Desdobramentos (${childRows.length})`, 
                content: childHtml, 
                isOpen: childRows.length > 0 
            },
            { 
                title: "📋 Ficheiro & Metadados do Documento", 
                content: ficheiroHtml, 
                isOpen: false 
            }
        ];
        break;
    }

    // --------------------------------------------------------
    // 7. SUBJECT
    // --------------------------------------------------------
    case "subject": {
        const curSubjName = curName;
        const directSubSubjects = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classSubject" && cleanLink(p.Parent) === curSubjName)
            .array()
            .sort((a, b) => {
                const getSubjRank = (st) => {
                    const s = norm(st);
                    if (s === "in_progress") return 0;
                    if (s === "planned" || s === "backlog") return 1;
                    if (s === "paused") return 2;
                    return 3;
                };
                const rA = getSubjRank(getSt(a));
                const rB = getSubjRank(getSt(b));
                if (rA !== rB) return rA - rB;
                const mA = Number(a.Mastery) || 0;
                const mB = Number(b.Mastery) || 0;
                if (mB !== mA) return mB - mA;
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });
        const descendants = getAllDescendantSubjectNames(curSubjName);
        const targetSubjects = new Set([curSubjName, ...descendants]);
        const targetEntities = getAllDescendantStudyTreeNames(curSubjName);

        const matchesSubjectHierarchy = (p) => {
            if (!p) return false;
            const pPar = cleanLink(p.Parent);
            if (targetEntities.has(pPar)) return true;
            const pSrc = cleanLink(p.Source_Ref);
            if (pSrc && targetEntities.has(pSrc)) return true;
            return false;
        };

        headerHtml = "";

        // 0. 🏛️ Sub-Subjects (se existirem desdobramentos diretos)
        let subSubjectTable = "";
        if (directSubSubjects.length > 0) {
            const subSubjectRows = directSubSubjects.map(s => {
                const sName = s.file.name;
                const link = htmlLink(s.file.path, sName) + getStudyBadges(s);
                const sTree = new Set([sName, ...getAllDescendantSubjectNames(sName)]);
                const sStudyTree = getAllDescendantStudyTreeNames(sName);
                const zettelsCount = allPages.where(p => isNotConfigOrTemplate(p) && p.Class === "classZettel" && sStudyTree.has(cleanLink(p.Parent))).length;
                const sourcesCount = allPages.where(p => isNotConfigOrTemplate(p) && ["classCourse", "classBook"].includes(p.Class) && sTree.has(cleanLink(p.Parent))).length;
                const mVal = Math.min(5, Math.max(0, Number(s.Mastery) || 1));
                const mColor = mVal >= 4 ? "#10b981" : (mVal >= 3 ? "#3b82f6" : "#f59e0b");
                const mBar = `<span style="color: ${mColor}; font-family: var(--font-monospace);">${"█".repeat(mVal)}</span><span style="opacity: 0.22; font-family: var(--font-monospace);">${"░".repeat(5 - mVal)}</span> <span style="font-size: 0.85em; opacity: 0.85;">${mVal}/5</span>`;
                return [link, mBar, `${sourcesCount} fontes`, `${zettelsCount} zettels`, formatStatus(getSt(s))];
            });

            subSubjectTable = renderGenericFluid(
                ["Sub-Subject", "Mastery", "Fontes", "Acervo Zettel", "Status"],
                ["auto", "110px", "95px", "110px", "80px"],
                subSubjectRows,
                "Nenhum sub-subject vinculado."
            );
        }

        // 1. Sources (Books & Courses vinculados aos subjects desta árvore)
        const sources = sortActiveFirst(allPages
            .where(p => isNotConfigOrTemplate(p) && ["classCourse", "classBook"].includes(p.Class) && targetSubjects.has(cleanLink(p.Parent))));
        const sourceRows = sources.map(p => {
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            const isSub = cleanLink(p.Parent) !== curSubjName;
            const subTag = isSub ? ` <span style="opacity: 0.55; font-size: 0.8em;">[${cleanLink(p.Parent)}]</span>` : "";
            const type = p.Class === "classCourse" ? "🎓 Course" : "📚 Book";
            let targ = Number(p.Target) || 0;
            let curr = Number(p.Current) || 0;
            if (p.Class === "classCourse" && curr === 0) {
                const lCount = allPages.where(x => isNotConfigOrTemplate(x) && x.Class === "classLiterature" && cleanLink(x.Parent) === p.file.name).length;
                if (lCount > 0) curr = lCount;
            }
            const bar = targ > 0 ? asciiBar(curr, targ, 10) : formatStatus(getSt(p));
            return [type, link + subTag, bar, formatStatus(getSt(p))];
        });
        const sourceTable = renderGenericFluid(
            ["Tipo", "Fonte", "Progresso", "Status"],
            ["90px", "auto", "150px", "70px"],
            sourceRows,
            "Nenhuma fonte vinculada."
        );

        // 2. Knowledge (MOCs e Zettels Atômicos)
        const allKnowledges = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classZettel" && matchesSubjectHierarchy(p))
            .array();

        // 2A. 🗺️ Maps of Content (MOCs / Guias Centrais)
        const mocs = allKnowledges
            .filter(p => norm(p.Subtype) === "moc")
            .sort((a, b) => (b.file?.mtime?.valueOf() || 0) - (a.file?.mtime?.valueOf() || 0));

        const mocRows = mocs.map(p => {
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            const mat = formatStatus(p.Maturity || "budding");
            const tagsStr = (p.tags && Array.isArray(p.tags)) 
                ? p.tags.slice(0, 3).map(t => `#${t}`).join(" ") 
                : (p.tags ? `#${p.tags}` : "-");
            const upd = p.Updated ? String(p.Updated).slice(0, 10) : (p.Created ? String(p.Created).slice(0, 10) : "-");
            return [link, tagsStr, mat, upd];
        });

        const mocTable = renderGenericFluid(
            ["MOC / Guia Central", "Escopo / Tags", "Maturidade", "Atualizado"],
            ["auto", "180px", "110px", "95px"],
            mocRows,
            "Nenhum Mapa de Conteúdo (MOC) criado para este domínio."
        );

        // 2B. 💎 Princípios & Conceitos Atômicos
        const matRank = (m) => {
            const sm = norm(m);
            if (sm === "evergreen") return 0;
            if (sm === "budding") return 1;
            if (sm === "seed") return 2;
            return 3;
        };

        const atomics = allKnowledges
            .filter(p => norm(p.Subtype) !== "moc")
            .sort((a, b) => {
                const rA = matRank(a.Maturity);
                const rB = matRank(b.Maturity);
                if (rA !== rB) return rA - rB;
                return (b.file?.mtime?.valueOf() || 0) - (a.file?.mtime?.valueOf() || 0);
            });

        const atomicRows = atomics.map(p => {
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            const mat = formatStatus(p.Maturity || "seed");
            const src = cleanLink(p.Source_Ref || "-");
            const srcLink = (src && src !== "-") ? htmlLink(src, trunc(src, 25)) : "-";
            const upd = p.Updated ? String(p.Updated).slice(0, 10) : (p.Created ? String(p.Created).slice(0, 10) : "-");
            return [link, srcLink, mat, upd];
        });

        const atomicTable = renderGenericFluid(
            ["Conceito / Princípio Atômico", "Fonte de Origem", "Maturidade", "Atualizado"],
            ["auto", "180px", "110px", "95px"],
            atomicRows,
            "Nenhum conceito atômico registrado neste domínio."
        );

        // 2C. 📖 Anotações & Aulas de Literatura (Aulas, Capítulos e Textos)
        const lits = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classLiterature" && matchesSubjectHierarchy(p))
            .array()
            .sort((a, b) => {
                const seqA = Number(a.Sequence) || 0;
                const seqB = Number(b.Sequence) || 0;
                if (seqA !== seqB && seqA > 0 && seqB > 0) return seqA - seqB;
                return (b.file?.mtime?.valueOf() || 0) - (a.file?.mtime?.valueOf() || 0);
            });

        const litRows = lits.map(p => {
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            const pRaw = cleanLink(p.Parent || "-");
            const pLink = pRaw !== "-" ? htmlLink(pRaw, pRaw) : "-";
            const seq = p.Sequence ? `#${p.Sequence}` : "Lesson";
            const upd = p.Updated ? String(p.Updated).slice(0, 10) : (p.Created ? String(p.Created).slice(0, 10) : "-");
            return [seq, link, pLink, upd];
        });

        const litTable = renderGenericFluid(
            ["Sequência", "Anotação / Aula", "Obra / Curso", "Data"],
            ["80px", "auto", "160px", "95px"],
            litRows,
            "Nenhuma aula ou anotação de literatura encontrada."
        );

        // 2D. 👤 Pensadores, Autores & Referências (classPerson vinculados ao Subject/Sub-Subject)
        const persons = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classPerson" && targetSubjects.has(cleanLink(p.Parent)))
            .array()
            .sort((a, b) => String(a.file?.name || "").localeCompare(String(b.file?.name || "")));

        const personRows = persons.map(p => {
            const link = htmlLink(p.file.path, p.file.name);
            const role = p.Role || "-";
            const era = p.Era_Movement || "-";
            const worksCount = allPages.where(w => isNotConfigOrTemplate(w) && ["classBook", "classCourse", "classMovie"].includes(w.Class) && (cleanLink(w.Author) === p.file.name || cleanLink(w.Director) === p.file.name)).length;
            return [link, role, era, `${worksCount} obras`];
        });

        const personTable = renderGenericFluid(
            ["Pensador / Autor", "Papel / Especialidade", "Era / Movimento", "Acervo"],
            ["180px", "auto", "210px", "80px"],
            personRows,
            "Nenhum pensador ou autor vinculado a este domínio."
        );

        const knowledgeBlocks = [];
        if (mocs.length > 0) {
            knowledgeBlocks.push(`<div style="font-size: 0.9em; font-weight: 600; opacity: 0.85; margin: 4px 0 6px 0;">🗺️ Maps of Content (MOCs / Guias Centrais) (${mocs.length})</div>` + mocTable);
        }
        if (atomics.length > 0) {
            const margin = knowledgeBlocks.length > 0 ? "margin: 12px 0 6px 0;" : "margin: 4px 0 6px 0;";
            knowledgeBlocks.push(`<div style="font-size: 0.9em; font-weight: 600; opacity: 0.85; ${margin}">💎 Princípios & Conceitos Atômicos (${atomics.length})</div>` + atomicTable);
        }
        const knowledgeHtml = knowledgeBlocks.length > 0 ? knowledgeBlocks.join("") : "<p style='opacity: 0.6;'>Nenhum conceito permanente registrado neste domínio.</p>";

        // 3. 📦 Domain Footprint (Linha do Tempo de Absorção e Síntese)
        const domainItems = allPages
            .where(p => isNotConfigOrTemplate(p) && ["classBook", "classCourse", "classZettel", "classLiterature"].includes(p.Class) && matchesSubjectHierarchy(p) && p.file.path !== curPath)
            .sort(p => p.file.mtime, "desc");
        const dList = domainItems?.array ? domainItems.array() : Array.from(domainItems || []);
        const domainRows = dList.map(p => {
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            let badge = "📄 Item";
            let info = "-";
            if (p.Class === "classBook") {
                badge = "📚 Book";
                const targ = Number(p.Target) || 0;
                info = targ > 0 ? asciiBar(p.Current, p.Target, 10) : formatStatus(getSt(p));
            } else if (p.Class === "classCourse") {
                badge = "🎓 Course";
                let targ = Number(p.Target) || 0;
                let curr = Number(p.Current) || 0;
                if (curr === 0) {
                    const lCount = allPages.where(x => isNotConfigOrTemplate(x) && x.Class === "classLiterature" && cleanLink(x.Parent) === p.file.name).length;
                    if (lCount > 0) curr = lCount;
                }
                info = targ > 0 ? asciiBar(curr, targ, 10) : formatStatus(getSt(p));
            } else if (p.Class === "classZettel") {
                badge = "💎 Zettel";
                info = formatStatus(p.Maturity || "seed");
            } else if (p.Class === "classLiterature") {
                badge = "📖 Lit";
                info = p.Sequence ? `#${p.Sequence}` : "Lesson";
            }
            let pRaw = cleanLink(p.Parent || "-");
            let pLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
            return [link, badge, pLink, info];
        });
        const domainTable = renderGenericFluid(
            ["Item de Conhecimento", "Tipo", "Parent", "Resultado / Info"],
            ["auto", "90px", "130px", "150px"],
            domainRows,
            "Nenhum registro cronológico neste domínio."
        );

        // 4. Goals & Metrics (apenas se houver atreladas)
        // Busca metas diretas ou ligadas à árvore deste Subject
        const rawGoals = allPages.where(p => {
            if (!isNotConfigOrTemplate(p) || p.Class !== "classGoal") return false;
            if (matchesSubjectHierarchy(p)) return true;
            // Se a meta menciona o subject ou seus sub-subjects nos outlinks
            if (p.file?.outlinks) {
                for (const ol of p.file.outlinks) {
                    if (targetEntities.has(cleanLink(ol))) return true;
                }
            }
            return false;
        });
        const linkedGoals = sortActiveFirst(rawGoals);
        const goalIds = new Set(linkedGoals.map(g => g.file.name));

        // Busca Métricas vinculadas a este Subject ou às metas do Subject
        const rawMetrics = allPages.where(p => {
            if (!isNotConfigOrTemplate(p) || p.Class !== "classMetric") return false;
            const par = cleanLink(p.Parent);
            if (targetEntities.has(par) || goalIds.has(par)) return true;
            if (p.file?.outlinks) {
                for (const ol of p.file.outlinks) {
                    const olName = cleanLink(ol);
                    if (targetEntities.has(olName) || goalIds.has(olName)) return true;
                }
            }
            return false;
        });
        const linkedMetrics = sortActiveFirst(rawMetrics);

        const goalBlocks = [];
        if (linkedGoals.length > 0) {
            goalBlocks.push(renderGoalsFluid(linkedGoals, "Nenhuma meta encontrada."));
        }
        if (linkedMetrics.length > 0) {
            goalBlocks.push(renderMetricsFluid(linkedMetrics, "Nenhuma métrica encontrada."));
        }
        const goalHtml = goalBlocks.length > 0 ? goalBlocks.join("<div style='height: 8px;'></div>") : "<div style='padding: 4px 0; opacity: 0.7; font-style: italic;'>Nenhuma meta ou métrica atrelada a este estudo.</div>";

        sections = [];

        if (directSubSubjects.length > 0) {
            sections.push({
                title: `🏛️ Sub-Subjects (${directSubSubjects.length})`,
                content: subSubjectTable,
                isOpen: true
            });
        }

        sections.push({
            title: `📚 Sources (Books & Courses) (${sources.length})`,
            content: sourceTable,
            isOpen: directSubSubjects.length === 0
        });

        if (mocs.length > 0 || atomics.length > 0) {
            sections.push({
                title: `💎 Knowledge (MOCs: ${mocs.length} | Atômicos: ${atomics.length})`,
                content: knowledgeHtml,
                isOpen: false
            });
        }

        if (lits.length > 0) {
            sections.push({
                title: `📖 Literature (Aulas & Textos) (${lits.length})`,
                content: litTable,
                isOpen: false
            });
        }

        if (persons.length > 0) {
            sections.push({
                title: `👤 Pensadores & Referências (${persons.length})`,
                content: personTable,
                isOpen: false
            });
        }

        sections.push({
            title: `📦 Domain Footprint (${domainRows.length})`,
            content: domainTable,
            isOpen: false
        });

        if (linkedGoals.length > 0 || linkedMetrics.length > 0) {
            sections.push({ title: `🎯 Linked Goals & Metrics (${linkedGoals.length + linkedMetrics.length})`, content: goalHtml, isOpen: false });
        }
        break;
    }

    // --------------------------------------------------------
    // 8. COURSE
    // --------------------------------------------------------
    case "course": {
        const lessons = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classLiterature" && matchesParent(p, "Parent"))
            .sort(p => Number(p.Sequence) || 0, "asc");
        const lessonRows = lessons.map(p => {
            const seq = p.Sequence != null ? `Aula ${p.Sequence}` : "-";
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            return [seq, link, p.Created || "-"];
        });
        const lessonTable = renderGenericFluid(
            ["Sequência", "Aula / Capítulo", "Criada em"],
            ["80px", "auto", "110px"],
            lessonRows,
            "Nenhuma aula registrada ainda."
        );

        const zettels = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classZettel" && (
                matchesParent(p, "Parent") || 
                matchesParent(p, "Source_Ref") || 
                (p.file.outlinks && p.file.outlinks.some(l => cleanLink(l) === curName))
            ))
            .sort(p => p.file.mtime, "desc");
        const zettelRows = zettels.map(p => [formatStatus(p.Maturity || "seed"), htmlLink(p.file.path, p.file.name) + getStudyBadges(p), p.Updated || "-"]);
        const zettelTable = renderGenericFluid(
            ["Maturidade", "Conceito", "Atualizado"],
            ["100px", "auto", "110px"],
            zettelRows,
            "Nenhum Zettel extraído."
        );

        // Course Progress Banner agora é renderizado no topo via { mode: "progress" }
        sections = [
            { title: "📖 Literature (Lessons & Chapters)", content: lessonTable, isOpen: true },
            { title: "💎 Extracted Zettels", content: zettelTable, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 9. BOOK
    // --------------------------------------------------------
    case "book": {
        // 1. Capítulos / Fichamentos / Citações da Obra (classLiterature)
        const chapters = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classLiterature" && matchesParent(p, "Parent"))
            .sort(p => Number(p.Sequence) || 0, "asc");
        const chapterRows = chapters.map(p => {
            const seq = p.Sequence != null ? `Cap. ${p.Sequence}` : "-";
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            return [seq, link, p.Created || "-"];
        });
        const chapterTable = renderGenericFluid(
            ["Sequência", "Capítulo / Fichamento", "Criado em"],
            ["80px", "auto", "110px"],
            chapterRows,
            "Nenhum capítulo ou citação fichada ainda."
        );

        // 2. Conceitos & Zettels Extraídos (classZettel)
        const zettels = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classZettel" && (
                matchesParent(p, "Parent") || 
                matchesParent(p, "Source_Ref") || 
                (p.file.outlinks && p.file.outlinks.some(l => cleanLink(l) === curName))
            ))
            .sort(p => p.file.mtime, "desc");
        const zettelRows = zettels.map(p => [
            formatStatus(p.Maturity || "seed"), 
            htmlLink(p.file.path, p.file.name) + getStudyBadges(p), 
            p.Updated || p.Created || "-"
        ]);
        const zettelTable = renderGenericFluid(
            ["Maturidade", "Conceito Extraído", "Atualizado"],
            ["100px", "auto", "110px"],
            zettelRows,
            "Nenhum conceito ou Zettel extraído desta obra."
        );

        // 3. 📋 Ficheiro & Metadados da Obra (Dados do YAML)
        const authorLink = resolvePersonLink(current.Author || current.author);
        const pRaw = cleanLink(current.Parent || "-");
        const parentLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
        const format = current.Format || "physical";
        const targ = Number(current.Target || 0) || 0;
        const curr = Number(current.Current || 0) || 0;
        const bar = targ > 0 ? asciiBar(curr, targ, 10) : "-";
        const rNum = parseInt(current.Rating || current.rating) || 0;
        const rStars = rNum > 0 ? "⭐".repeat(Math.min(rNum, 5)) + ` <span style="opacity: 0.7; font-size: 0.85em;">(${rNum}/5)</span>` : "—";
        const st = formatStatus(getSt(current));
        const compDate = current.Completed_At ? String(current.Completed_At).slice(0, 10) : (current.Status === "done" && current.Updated ? String(current.Updated).slice(0, 10) : "-");
        const diff = current.Difficulty ? `${current.Difficulty}/5` : "-";
        
        // Resolução robusta de Capa (URL externa ou anexo local Obsidian)
        const rawCover = current.Cover || current.cover;
        let coverUrl = "";
        if (rawCover) {
            if (typeof rawCover === "object" && rawCover.path) {
                coverUrl = rawCover.path;
            } else {
                coverUrl = String(rawCover).replace(/[\[\]"']/g, "").trim();
            }
            if (coverUrl.startsWith("http://books.google.com/")) {
                coverUrl = coverUrl.replace("http://books.google.com/", "https://books.google.com/");
            } else if (coverUrl.startsWith("http://")) {
                coverUrl = coverUrl.replace("http://", "https://");
            }
        }
        if (coverUrl && !coverUrl.startsWith("http") && !coverUrl.startsWith("app://") && typeof app !== "undefined" && app?.metadataCache?.getFirstLinkpathDest && app?.vault?.getResourcePath) {
            try {
                const fileDest = app.metadataCache.getFirstLinkpathDest(coverUrl, curPath);
                if (fileDest) {
                    coverUrl = app.vault.getResourcePath(fileDest);
                }
            } catch(e) {}
        }

        const coverHtml = coverUrl 
            ? `<div style="flex-shrink: 0; width: 105px; max-width: 105px; aspect-ratio: 2/3; overflow: hidden; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); background: rgba(0,0,0,0.2);">
                <img src="${coverUrl}" alt="Capa" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(128,128,128,0.08);border:1px dashed var(--background-modifier-border);border-radius:6px;color:var(--text-muted);\\'><span style=\\'font-size:2em;\\'>📖</span><span style=\\'font-size:0.72em;opacity:0.7;margin-top:4px;\\'>Sem Capa</span></div>';" />
               </div>`
            : `<div style="flex-shrink: 0; width: 105px; max-width: 105px; aspect-ratio: 2/3; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(128,128,128,0.08); border: 1px dashed var(--background-modifier-border); border-radius: 6px; color: var(--text-muted);">
                <span style="font-size: 2.2em; line-height: 1;">📖</span>
                <span style="font-size: 0.72em; opacity: 0.7; margin-top: 4px;">Sem Capa</span>
               </div>`;

        const bookMetaRows = [
            renderInfoRow("Autor", authorLink),
            renderInfoRow("Disciplina / Domínio", parentLink),
            renderInfoRow("Status de Leitura", st),
            renderInfoRow("Formato", format),
            renderInfoRow("Progresso", targ > 0 ? `${bar} (${curr}/${targ} pág)` : (current.Progress ? `${current.Progress}%` : "-")),
            renderInfoRow("Avaliação", rStars),
            renderInfoRow("Dificuldade", diff),
            renderInfoRow("Criado / Concluído", `${current.Created ? String(current.Created).slice(0, 10) : "-"} ${compDate !== "-" ? `➔ <b>${compDate}</b>` : ""}`)
        ].filter(Boolean).join("");

        const bookInfoHtml = `<div style="display: flex; gap: 16px; align-items: flex-start; padding: 4px 0; width: 100%; box-sizing: border-box;">${coverHtml}<div style="flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column;">${bookMetaRows}</div></div>`;

        sections = [
            { title: `📖 Literature (Chapters & Fichamentos) (${chapterRows.length})`, content: chapterTable, isOpen: true },
            { title: `💎 Extracted Zettels & Insights (${zettelRows.length})`, content: zettelTable, isOpen: false },
            { title: "📋 Ficheiro & Dados da Obra", content: bookInfoHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 10. MOVIE (Obra Cinematográfica Individual)
    // --------------------------------------------------------
    case "movie": {
        // 1. Cenas, Anotações & Citações do Filme (classLiterature)
        const lits = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classLiterature" && matchesParent(p, "Parent"))
            .sort(p => Number(p.Sequence) || 0, "asc");
        const litRows = lits.map(p => {
            const seq = p.Sequence != null ? `Seq. ${p.Sequence}` : "-";
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            return [seq, link, p.Created || "-"];
        });
        const litTable = renderGenericFluid(
            ["Sequência", "Cena / Anotação de Filme", "Criado em"],
            ["80px", "auto", "110px"],
            litRows,
            "Nenhuma anotação de cena ou citação fichada ainda."
        );

        // 2. Conceitos & Zettels Extraídos (classZettel)
        const zettels = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classZettel" && (
                matchesParent(p, "Parent") || 
                matchesParent(p, "Source_Ref") || 
                (p.file.outlinks && p.file.outlinks.some(l => cleanLink(l) === curName))
            ))
            .sort(p => p.file.mtime, "desc");
        const zettelRows = zettels.map(p => [
            formatStatus(p.Maturity || "seed"), 
            htmlLink(p.file.path, p.file.name) + getStudyBadges(p), 
            p.Updated || p.Created || "-"
        ]);
        const zettelTable = renderGenericFluid(
            ["Maturidade", "Conceito / Modelo Extraído", "Atualizado"],
            ["100px", "auto", "110px"],
            zettelRows,
            "Nenhum conceito ou Zettel extraído desta obra."
        );

        // 3. 📋 Ficheiro do Filme (Ficha Técnica & Metadados do YAML)
        const dirLink = resolvePersonLink(current.Director || current.director);
        const year = current.Release_Year || (current.Release ? String(current.Release).slice(0, 4) : "-");
        const rNum = parseInt(current.Rating || current.rating) || 0;
        const rStars = rNum > 0 ? "⭐".repeat(Math.min(rNum, 5)) + ` <span style="opacity: 0.7; font-size: 0.85em;">(${rNum}/5)</span>` : "—";
        const genres = cleanLink(current.Genres || current.genres || "-");
        const cast = cleanLink(current.Main_Cast || current.Cast || current.cast || "-");
        const country = cleanLink(current.Prod_Country || current.Country || "-");
        const company = cleanLink(current.Prod_Company || current.Company || "-");
        const wDate = current.Watched ? String(current.Watched).slice(0, 10) : (current.Completed_At ? String(current.Completed_At).slice(0, 10) : "-");
        const overview = current.Overview || current.overview;
        const trailer = current.Trailer || current.trailer;
        // Resolução robusta de Poster (URL externa ou anexo local Obsidian)
        const rawPoster = current.Poster || current.poster;
        let posterUrl = "";
        if (rawPoster) {
            if (typeof rawPoster === "object" && rawPoster.path) {
                posterUrl = rawPoster.path;
            } else {
                posterUrl = String(rawPoster).replace(/[\[\]"']/g, "").trim();
            }
            if (posterUrl.startsWith("http://")) {
                posterUrl = posterUrl.replace("http://", "https://");
            }
        }
        if (posterUrl && !posterUrl.startsWith("http") && !posterUrl.startsWith("app://") && typeof app !== "undefined" && app?.metadataCache?.getFirstLinkpathDest && app?.vault?.getResourcePath) {
            try {
                const fileDest = app.metadataCache.getFirstLinkpathDest(posterUrl, curPath);
                if (fileDest) {
                    posterUrl = app.vault.getResourcePath(fileDest);
                }
            } catch(e) {}
        }

        const posterHtml = posterUrl 
            ? `<div style="flex-shrink: 0; width: 105px; max-width: 105px; aspect-ratio: 2/3; overflow: hidden; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); background: rgba(0,0,0,0.2);">
                <img src="${posterUrl}" alt="Poster" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(128,128,128,0.08);border:1px dashed var(--background-modifier-border);border-radius:6px;color:var(--text-muted);\\'><span style=\\'font-size:2em;\\'>🎬</span><span style=\\'font-size:0.72em;opacity:0.7;margin-top:4px;\\'>Sem Poster</span></div>';" />
               </div>`
            : `<div style="flex-shrink: 0; width: 105px; max-width: 105px; aspect-ratio: 2/3; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(128,128,128,0.08); border: 1px dashed var(--background-modifier-border); border-radius: 6px; color: var(--text-muted);">
                <span style="font-size: 2.2em; line-height: 1;">🎬</span>
                <span style="font-size: 0.72em; opacity: 0.7; margin-top: 4px;">Sem Poster</span>
               </div>`;

        const movieMetaRows = [
            renderInfoRow("Direção", dirLink),
            renderInfoRow("Ano de Lançamento", year),
            renderInfoRow("Avaliação", rStars),
            renderInfoRow("Gêneros", genres),
            renderInfoRow("Assistido em", wDate),
            renderInfoRow("Elenco Principal", cast !== "-" ? trunc(cast, 120) : "-"),
            renderInfoRow("Produção / País", [company, country].filter(x => x && x !== "-").join(" • ") || "-"),
            trailer ? renderInfoRow("Trailer", `<a class="external-link" href="${trailer}" target="_blank" style="color: var(--text-accent); text-decoration: none;">Assistir no YouTube ↗</a>`) : "",
            overview ? renderInfoBlock("Sinopse / Overview", overview) : ""
        ].filter(Boolean).join("");

        const movieInfoHtml = `<div style="display: flex; gap: 16px; align-items: flex-start; padding: 4px 0; width: 100%; box-sizing: border-box;">${posterHtml}<div style="flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column;">${movieMetaRows}</div></div>`;

        sections = [
            { title: `📖 Literature (Cenas & Anotações) (${litRows.length})`, content: litTable, isOpen: true },
            { title: `💎 Extracted Zettels & Conceitos (${zettelRows.length})`, content: zettelTable, isOpen: false },
            { title: "📋 Ficheiro & Dados do Filme", content: movieInfoHtml, isOpen: false }
        ];
        break;
    }

    case "person": {
        // Tabela Unificada de Obras & Menções
        const works = allPages
            .where(p => isNotConfigOrTemplate(p) && (matchesParent(p, "Author") || matchesParent(p, "Director") || matchesParent(p, "Creator") || matchesParent(p, "Parent") || matchesParent(p, "People") || matchesParent(p, "Source_Ref")))
            .sort(p => p.file.mtime, "desc");
            
        const workRows = works.map(p => {
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            let badge = "📄 Item";
            let info = "-";
            if (p.Class === "classBook") {
                badge = "📚 Book";
                info = p.Rating ? `★ ${p.Rating}/5` : formatStatus(getSt(p));
            } else if (p.Class === "classMovie") {
                badge = "🎬 Movie";
                info = p.Rating ? `★ ${p.Rating}/5` : "Watched";
            } else if (p.Class === "classCourse") {
                badge = "🎓 Course";
                info = formatStatus(getSt(p));
            } else if (p.Class === "classZettel") {
                badge = "💎 Zettel";
                info = formatStatus(p.Maturity || "seed");
            } else if (p.Class === "classThought") {
                badge = "🧠 Thought";
                info = "Personal";
            } else if (p.Class === "classLiterature") {
                badge = "📖 Lit";
                info = p.Sequence ? `#${p.Sequence}` : "Lesson";
            }
            let pRaw = cleanLink(p.Parent || "-");
            let pLink = pRaw !== "-" ? htmlLink(pRaw, pRaw) : "-";
            return [link, badge, pLink, info];
        });
        
        const workTable = renderGenericFluid(
            ["Obra / Menção", "Tipo", "Parent", "Status / Info"],
            ["auto", "90px", "130px", "120px"],
            workRows,
            "Nenhuma obra ou menção vinculada a esta pessoa."
        );

        sections = [
            { title: `🏛️ Works & Mentions (${workRows.length})`, content: workTable, isOpen: true }
        ];
        break;
    }

    // --------------------------------------------------------
    // 11. CYCLE (Protocolo Biológico, Treino & Nutrição)
    // --------------------------------------------------------
    case "cycle": {
        const isCycleActive = current.Current === true || current.current === true;
        
        // Extração ultra-defensiva de datas imune à normalização lowercase do Dataview
        const rawStart = current.Start ?? current.start ?? current.file?.frontmatter?.Start ?? current.file?.frontmatter?.start;
        const rawEnd = current.End ?? current.end ?? current.file?.frontmatter?.End ?? current.file?.frontmatter?.end;

        const parsedStart = parseMoment(rawStart);
        const cStart = (parsedStart && parsedStart.isValid() ? parsedStart : moment().startOf('year')).clone().startOf('day');
        
        let cEnd;
        if (isCycleActive) {
            // Ciclo ativo: teto temporal é rigorosamente o dia atual (fim de hoje)
            cEnd = moment().endOf('day');
        } else {
            // Ciclo encerrado: usa a data de término formal do ciclo
            const parsedEnd = parseMoment(rawEnd);
            cEnd = (parsedEnd && parsedEnd.isValid() ? parsedEnd : moment()).clone().endOf('day');
        }

        // 1. 🧬 Bio Matrix
        const cal = (current.Calories ?? current.calories) ? `🔥 <b>Calorias:</b> ${current.Calories ?? current.calories} kcal` : "";
        const mac = (current.Macros ?? current.macros) ? `🥩 <b>Macros:</b> ${current.Macros ?? current.macros}` : "";
        const wat = (current.Water ?? current.water) ? `💧 <b>Água:</b> ${current.Water ?? current.water}` : "";
        const slp = (current.Sleep_Window ?? current.sleep_window ?? current["Sleep Window"]) ? `🌙 <b>Sono:</b> ${current.Sleep_Window ?? current.sleep_window ?? current["Sleep Window"]}` : "";
        const targetsBar = [cal, mac, wat, slp].filter(Boolean).join(" &nbsp;•&nbsp; ");

        const daysMap = [
            { name: "Segunda", val: current.Monday ?? current.monday },
            { name: "Terça", val: current.Tuesday ?? current.tuesday },
            { name: "Quarta", val: current.Wednesday ?? current.wednesday },
            { name: "Quinta", val: current.Thursday ?? current.thursday },
            { name: "Sexta", val: current.Friday ?? current.friday },
            { name: "Sábado", val: current.Saturday ?? current.saturday },
            { name: "Domingo", val: current.Sunday ?? current.sunday }
        ];

        const weekRows = daysMap.map(d => [d.name, d.val || "Rest"]);
        const trainingTable = renderGenericFluid(
            ["Dia da Semana", "Treino Programado"],
            ["140px", "auto"],
            weekRows,
            "Nenhum treino programado."
        );

        const matrixHtml = `${targetsBar ? `<div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; font-size: 0.9em;">${targetsBar}</div>` : ""}${trainingTable}`;

        // 2. 🎯 Linked Health Goals & Metrics
        const linkedGoals = sortActiveFirst(allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classGoal" && (matchesParent(p, "Parent") || matchesParent(p, "Cycle") || norm(p.Pillar || p.pillar) === "health")));
        const goalHtml = renderGoalsFluid(linkedGoals, "Nenhuma meta de saúde atrelada diretamente a este ciclo.");

        // 3. 📦 Cycle Footprint (Produção e Consumo Intelectual durante o Ciclo)
        const cycleFootprint = getPeriodFootprint(cStart, cEnd);
        const footprintRows = cycleFootprint.map(f => [f.item, f.typeBadge, f.parentLink, f.infoStr]);
        const footprintHtml = renderGenericFluid(
            ["Item", "Tipo", "Parent", "Resultado / Info"],
            ["auto", "90px", "130px", "150px"],
            footprintRows,
            "Nenhuma produção ou consumo registrado durante este ciclo."
        );

        // 4. ⚡ Telemetria das Dailies do Ciclo
        const dailies = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p)) return false;
                const isDaily = p.Class === "classDaily" || p.class === "classDaily" || (p.file?.folder && p.file.folder.includes("Journal") && /^\d{2}-\d{2}-\d{4}$/.test(p.file.name));
                if (!isDaily) return false;
                const m = moment(p.file.name, "DD-MM-YYYY");
                return m.isValid() && m.isBetween(cStart, cEnd, null, "[]");
            });
            
        const dailyArr = (dailies?.array ? dailies.array() : Array.from(dailies || []))
            .sort((a, b) => {
                const mA = moment(a.file.name, "DD-MM-YYYY");
                const mB = moment(b.file.name, "DD-MM-YYYY");
                const tA = mA.isValid() ? mA.valueOf() : 0;
                const tB = mB.isValid() ? mB.valueOf() : 0;
                return tB - tA; // Ordem cronológica decrescente: Hoje no topo!
            });

        const dailyRows = dailyArr.map(p => {
            const dateLink = htmlLink(p.file.path, p.file.name);
            const rating = (p.cog_day_rating ?? p["cog_day_rating"]) != null ? `${p.cog_day_rating ?? p["cog_day_rating"]}/5` : "-";
            const sleep = (p.bio_sleep_hours ?? p["bio_sleep_hours"]) != null ? `${p.bio_sleep_hours ?? p["bio_sleep_hours"]}h` : "-";
            const deepWork = (p.exec_deep_work_h ?? p["exec_deep_work_h"]) != null ? `${p.exec_deep_work_h ?? p["exec_deep_work_h"]}h` : "-";
            const craving = (p.cog_craving ?? p["cog_craving"]) != null ? `${p.cog_craving ?? p["cog_craving"]}/5` : "-";
            const mood = (p.cog_mood ?? p["cog_mood"]) ? trunc(String(p.cog_mood ?? p["cog_mood"]), 16) : "-";
            return [dateLink, rating, sleep, deepWork, craving, mood];
        });
        const dailyTable = renderGenericFluid(
            ["Data", "Rating", "Sono", "Deep Work", "Craving", "Humor"],
            ["105px", "60px", "60px", "80px", "60px", "auto"],
            dailyRows,
            "Nenhuma daily registrada durante este ciclo."
        );

        // 5. 📋 Ficheiro Relacional do Ciclo
        const stStr = isCycleActive ? `<span style="color: #10b981; font-weight: bold;">⚡ VIGENTE (ATIVO)</span>` : "Histórico";
        const periodStr = `${rawStart || "-"} → ${isCycleActive ? "Ativo" : (rawEnd || "Encerrado")}`;
        const targetStr = current.Target ?? current.target ?? "-";
        const pRaw = cleanLink(current.Parent || current.parent || "Life");
        const parentLink = htmlLink(pRaw, pRaw);
        const dates = `${current.Created ? String(current.Created).slice(0, 10) : "-"} • ${current.Updated ? String(current.Updated).slice(0, 10) : "-"}`;

        const ficheiroRows = [
            renderInfoRow("Vigência do Ciclo", stStr),
            renderInfoRow("Período do Ciclo", periodStr),
            renderInfoRow("Alvos Gerais", targetStr),
            renderInfoRow("Vínculo Pai", parentLink),
            renderInfoRow("Criação & Atualização", dates)
        ].filter(Boolean).join("");

        const ficheiroHtml = `<div style="display: flex; flex-direction: column;">${ficheiroRows}</div>`;

        sections = [
            { title: "🧬 Bio Matrix", content: matrixHtml, isOpen: true },
            { title: `🎯 Linked Health Goals & Metrics (${linkedGoals.length})`, content: goalHtml, isOpen: linkedGoals.length > 0 },
            { title: `📦 Cycle Footprint (${cycleFootprint.length})`, content: footprintHtml, isOpen: false },
            { title: `⚡ Telemetria dos Dias (${dailyRows.length})`, content: dailyTable, isOpen: false },
            { title: "📋 Ficheiro Relacional", content: ficheiroHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 12. ACADEMY (Esteira Polímata de Aprendizagem & Zettelkasten)
    // --------------------------------------------------------
    case "academy": {
        // 1. 🔥 Frente Intelectual Ativa (Cursos & Livros em Progresso)
        const activeStudy = allPages
            .where(p => isNotConfigOrTemplate(p) && ["classCourse", "classBook"].includes(p.Class) && getSt(p) === "in_progress")
            .array();

        activeStudy.sort((a, b) => {
            const isAcadA = norm(a.Track) === "academic" ? 0 : 1;
            const isAcadB = norm(b.Track) === "academic" ? 0 : 1;
            if (isAcadA !== isAcadB) return isAcadA - isAcadB; // Blitz Acadêmica primeiro
            const prioA = Number(a.Priority) || 3;
            const prioB = Number(b.Priority) || 3;
            if (prioA !== prioB) return prioB - prioA;
            return (b.file?.mtime?.valueOf() || 0) - (a.file?.mtime?.valueOf() || 0);
        });

        const activeRows = activeStudy.map(p => {
            const isAcademic = norm(p.Track) === "academic";
            const typeBadge = p.Class === "classCourse" 
                ? (isAcademic ? "🎓 Curso ⚡" : "🎓 Curso") 
                : "📚 Livro";
            const link = htmlLink(p.file.path, p.file.name) + getStudyBadges(p);
            const pRaw = cleanLink(p.Parent || "-");
            const pLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
            const targ = Number(p.Target) || 0;
            let curr = Number(p.Current) || 0;
            if (p.Class === "classCourse" && curr === 0) {
                const lCount = allPages.where(x => isNotConfigOrTemplate(x) && x.Class === "classLiterature" && cleanLink(x.Parent) === p.file.name).length;
                if (lCount > 0) curr = lCount;
            }
            const bar = targ > 0 ? asciiBar(curr, targ, 10) : formatStatus(getSt(p));
            return [typeBadge, link, pLink, bar, formatStatus(getSt(p))];
        });

        const activeTable = renderGenericFluid(
            ["Tipo / Trilha", "Obra / Curso Ativo", "Parent / Subject", "Progresso", "Status"],
            ["115px", "auto", "140px", "150px", "80px"],
            activeRows,
            "Nenhum curso ou livro em progresso no momento."
        );

        // 2. 🏛️ Domínios do Conhecimento (Root Subjects: Parent = [[Academy]])
        const subjects = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classSubject" && cleanLink(p.Parent) === "Academy")
            .array()
            .sort((a, b) => {
                const mA = Number(a.Mastery) || 0;
                const mB = Number(b.Mastery) || 0;
                if (mB !== mA) return mB - mA;
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const subjectRows = subjects.map(s => {
            const sName = s.file.name;
            const link = htmlLink(s.file.path, sName) + getStudyBadges(s);
            const sTree = new Set([sName, ...getAllDescendantSubjectNames(sName)]);
            const sStudyTree = getAllDescendantStudyTreeNames(sName);
            const zettelsCount = allPages.where(p => isNotConfigOrTemplate(p) && p.Class === "classZettel" && sStudyTree.has(cleanLink(p.Parent))).length;
            const sourcesCount = allPages.where(p => isNotConfigOrTemplate(p) && ["classCourse", "classBook"].includes(p.Class) && sTree.has(cleanLink(p.Parent))).length;
            const subSubjectsCount = allPages.where(p => isNotConfigOrTemplate(p) && p.Class === "classSubject" && cleanLink(p.Parent) === sName).length;
            const mVal = Math.min(5, Math.max(0, Number(s.Mastery) || 1));
            const mColor = mVal >= 4 ? "#10b981" : (mVal >= 3 ? "#3b82f6" : "#f59e0b");
            const mBar = `<span style="color: ${mColor}; font-family: var(--font-monospace);">${"█".repeat(mVal)}</span><span style="opacity: 0.22; font-family: var(--font-monospace);">${"░".repeat(5 - mVal)}</span> <span style="font-size: 0.85em; opacity: 0.85;">${mVal}/5</span>`;
            const subTag = subSubjectsCount > 0 ? ` <span style="opacity: 0.6; font-size: 0.85em;">(${subSubjectsCount} sub)</span>` : "";
            return [link + subTag, mBar, `${sourcesCount} fontes`, `${zettelsCount} zettels`, formatStatus(getSt(s))];
        });

        const subjectTable = renderGenericFluid(
            ["Domínio Polímata", "Mastery", "Fontes", "Acervo Zettel", "Status"],
            ["auto", "110px", "100px", "110px", "80px"],
            subjectRows,
            "Nenhum domínio de estudo cadastrado."
        );

        // 3. 💎 Esteira Zettelkasten (Pipeline de Maturidade: MOCs Primeiro, Atômicos Depois)
        const checkIsMoc = (z) => {
            if (!z) return false;
            const st = norm(z.Subtype || z.subtype);
            if (st === "moc") return true;
            const tags = Array.isArray(z.tags) ? z.tags : (z.tags ? [z.tags] : []);
            return tags.some(t => norm(t).includes("moc"));
        };

        const zettels = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classZettel")
            .array()
            .sort((a, b) => {
                // 1. MOCs Primeiro (0), Atômicos Depois (1)
                const mocA = checkIsMoc(a) ? 0 : 1;
                const mocB = checkIsMoc(b) ? 0 : 1;
                if (mocA !== mocB) return mocA - mocB;

                // 2. Maturidade (Seed -> Budding -> Evergreen)
                const matRank = (m) => {
                    const sm = norm(m);
                    if (sm === "seed") return 0;
                    if (sm === "budding") return 1;
                    if (sm === "evergreen") return 2;
                    return 3;
                };
                const rA = matRank(a.Maturity);
                const rB = matRank(b.Maturity);
                if (rA !== rB) return rA - rB;

                // 3. Data de Atualização / Criação mais recente
                const tA = parseMoment(a.Updated || a.Created)?.valueOf() || a.file?.mtime?.valueOf() || 0;
                const tB = parseMoment(b.Updated || b.Created)?.valueOf() || b.file?.mtime?.valueOf() || 0;
                return tB - tA;
            });

        const zettelRows = zettels.map(z => {
            const isMoc = checkIsMoc(z);
            const typeBadge = isMoc ? "🗺️ MOC" : "💎 Atômico";
            const mat = norm(z.Maturity);
            let matLabel = "🌱 Seed";
            if (mat === "budding") matLabel = "🌿 Budding";
            else if (mat === "evergreen") matLabel = "🌲 Evergreen";
            
            const link = htmlLink(z.file.path, z.file.name) + getStudyBadges(z);
            const pRaw = cleanLink(z.Parent || "-");
            const pLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
            const upd = z.Updated ? String(z.Updated).slice(0, 10) : (z.Created ? String(z.Created).slice(0, 10) : "-");
            return [typeBadge, matLabel, link, pLink, upd];
        });

        const zettelTable = renderGenericFluid(
            ["Tipo", "Maturidade", "Conceito / MOC", "Parent / Origem", "Data"],
            ["85px", "110px", "auto", "160px", "95px"],
            zettelRows,
            "Nenhum conceito permanente registrado no acervo."
        );

        // 4. 📦 Colheita Intelectual Recente (Últimos 30 Dias)
        const nowM = moment();
        const start30 = (typeof nowM.subtract === "function")
            ? moment().subtract(30, "days").startOf("day")
            : moment(nowM.valueOf() - 30 * 24 * 3600 * 1000).startOf("day");
        const recentFootprint = getPeriodFootprint(start30, nowM)
            .filter(f => ["📚 Book", "🎓 Course", "💎 Zettel", "📖 Lit"].includes(f.typeBadge));
        const footprintRows = recentFootprint.map(f => [f.item, f.typeBadge, f.parentLink, f.infoStr]);
        const footprintTable = renderGenericFluid(
            ["Item de Conhecimento", "Tipo", "Parent", "Resultado / Info"],
            ["auto", "90px", "130px", "150px"],
            footprintRows,
            "Nenhuma produção ou colheita intelectual nos últimos 30 dias."
        );

        // 5. 📥 Incubadora & Cursos Pausados
        const incubatorCourses = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classCourse" && ["inbox", "paused", "planned", "backlog"].includes(getSt(p)))
            .array()
            .sort((a, b) => String(a.file?.name || "").localeCompare(String(b.file?.name || "")));

        const incubatorRows = incubatorCourses.map(c => {
            const link = htmlLink(c.file.path, c.file.name) + getStudyBadges(c);
            const inst = resolvePersonLink(c.Author || c.author || "-");
            const pRaw = cleanLink(c.Parent || "-");
            const pLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
            return [link, inst, formatStatus(getSt(c)), pLink];
        });

        const incubatorTable = renderGenericFluid(
            ["Curso / Formação", "Instrutor", "Status", "Parent / Subject"],
            ["auto", "150px", "90px", "140px"],
            incubatorRows,
            "Nenhum curso na incubadora ou pausado."
        );

        sections = [
            { title: `🔥 Frente Intelectual Ativa (${activeRows.length})`, content: activeTable, isOpen: true },
            { title: `🏛️ Domínios do Conhecimento (${subjectRows.length})`, content: subjectTable, isOpen: true },
            { title: `💎 Esteira Zettelkasten (${zettelRows.length})`, content: zettelTable, isOpen: false },
            { title: `📥 Incubadora de Cursos (${incubatorRows.length})`, content: incubatorTable, isOpen: false },
            { title: `📦 Colheita Intelectual (Últimos 30 dias) (${footprintRows.length})`, content: footprintTable, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 13. LIBRARY (Acervo de Livros, Leitura em Andamento & Panteão)
    // --------------------------------------------------------
    case "library": {
        const allBooks = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classBook")
            .array();

        // 1. 📖 Lendo Agora (in_progress)
        const readingNow = allBooks
            .filter(b => getSt(b) === "in_progress")
            .sort((a, b) => (b.file?.mtime?.valueOf() || 0) - (a.file?.mtime?.valueOf() || 0));

        const readingRows = readingNow.map(b => {
            const link = htmlLink(b.file.path, b.file.name) + getStudyBadges(b);
            const authorLink = resolvePersonLink(b.Author || b.author);
            const targ = Number(b.Target || 0) || 0;
            const curr = Number(b.Current || 0) || 0;
            const bar = targ > 0 ? asciiBar(curr, targ, 10) : formatStatus(getSt(b));
            const pages = targ > 0 ? `${curr}/${targ} pág` : "-";
            const pRaw = cleanLink(b.Parent || "-");
            const pLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
            return [link, authorLink, bar, pages, pLink];
        });

        const readingTable = renderGenericFluid(
            ["Livro", "Autor", "Progresso", "Páginas", "Parent / Subject"],
            ["auto", "150px", "150px", "100px", "140px"],
            readingRows,
            "Nenhum livro sendo lido no momento."
        );

        // 2. 📥 Fila de Leitura / Inbox & Pausados
        const queueBooks = allBooks
            .filter(b => ["inbox", "paused", "planned", "backlog"].includes(getSt(b)))
            .sort((a, b) => {
                const rA = getSt(a) === "inbox" ? 0 : 1;
                const rB = getSt(b) === "inbox" ? 0 : 1;
                if (rA !== rB) return rA - rB;
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const queueRows = queueBooks.map(b => {
            const link = htmlLink(b.file.path, b.file.name) + getStudyBadges(b);
            const authorLink = resolvePersonLink(b.Author || b.author);
            const format = b.Format || "physical";
            const pRaw = cleanLink(b.Parent || "-");
            const pLink = (pRaw && pRaw !== "-") ? htmlLink(pRaw, pRaw) : "-";
            return [link, authorLink, format, formatStatus(getSt(b)), pLink];
        });

        const queueTable = renderGenericFluid(
            ["Livro", "Autor", "Formato", "Status", "Parent / Subject"],
            ["auto", "150px", "90px", "80px", "140px"],
            queueRows,
            "Nenhum livro na fila ou pausado."
        );

        // 3. 🏆 Panteão / Obras Concluídas
        const completedBooks = allBooks
            .filter(b => ["done", "completed"].includes(getSt(b)))
            .sort((a, b) => {
                const rA = parseInt(b.Rating || b.rating) || 0;
                const rB = parseInt(a.Rating || a.rating) || 0;
                if (rA !== rB) return rA - rB; // Mais bem avaliados primeiro
                const dA = parseMoment(a.Completed_At || a.Updated);
                const dB = parseMoment(b.Completed_At || b.Updated);
                if (dA && dB && dA.isValid() && dB.isValid()) return dB.valueOf() - dA.valueOf();
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const pantheonRows = completedBooks.map(b => {
            const link = htmlLink(b.file.path, b.file.name) + getStudyBadges(b);
            const authorLink = resolvePersonLink(b.Author || b.author);
            const rNum = parseInt(b.Rating || b.rating) || 0;
            const rStars = rNum > 0 ? "⭐".repeat(Math.min(rNum, 5)) : "—";
            const targ = Number(b.Target || b.Pages || b.pages || 0) || 0;
            const comp = b.Completed_At ? String(b.Completed_At).slice(0, 10) : (b.Updated ? String(b.Updated).slice(0, 10) : "-");
            return [link, authorLink, rStars, targ > 0 ? `${targ} pág` : "-", comp];
        });

        const pantheonTable = renderGenericFluid(
            ["Livro", "Autor", "Avaliação", "Extensão", "Concluído"],
            ["auto", "150px", "100px", "90px", "95px"],
            pantheonRows,
            "Nenhum livro concluído registrado ainda."
        );

        // 4. 🖼️ Galeria Visual de Capas
        const completedWithCover = completedBooks.filter(b => b.Cover || b.cover);
        const bookCardsHtml = renderCardsGrid(completedWithCover, "book", "Nenhum livro com capa cadastrada.");

        sections = [
            { title: `📖 Lendo Agora (${readingRows.length})`, content: readingTable, isOpen: true },
            { title: `📥 Fila de Leitura / Inbox (${queueRows.length})`, content: queueTable, isOpen: false },
            { title: `🏆 Panteão de Obras Concluídas (${pantheonRows.length})`, content: pantheonTable, isOpen: false },
            { title: `🖼️ Galeria Visual de Capas (${completedWithCover.length})`, content: bookCardsHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 14. CINEMA (Obras Cinematográficas, Direção & Curadoria)
    // --------------------------------------------------------
    case "cinema": {
        const allMovies = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classMovie")
            .array();

        // 1. 🎬 Masterpieces & Obras Assistidas
        const watchedMovies = allMovies
            .filter(m => getSt(m) === "done" || getSt(m) === "completed" || m.Watched || (Number(m.Rating) > 0))
            .sort((a, b) => {
                const rA = parseInt(b.Rating || b.rating) || 0;
                const rB = parseInt(a.Rating || a.rating) || 0;
                if (rA !== rB) return rA - rB; // Maiores notas primeiro
                const wA = parseMoment(a.Watched || a.Completed_At || a.Updated);
                const wB = parseMoment(b.Watched || b.Completed_At || b.Updated);
                if (wA && wB && wA.isValid() && wB.isValid()) return wB.valueOf() - wA.valueOf();
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const watchedRows = watchedMovies.map(m => {
            const link = htmlLink(m.file.path, m.file.name) + getStudyBadges(m);
            const dirLink = resolvePersonLink(m.Director || m.director);
            const year = m.Release_Year || (m.Release ? String(m.Release).slice(0, 4) : "-");
            const rNum = parseInt(m.Rating || m.rating) || 0;
            const rStars = rNum > 0 ? "⭐".repeat(Math.min(rNum, 5)) : "—";
            const wDate = m.Watched ? String(m.Watched).slice(0, 10) : (m.Completed_At ? String(m.Completed_At).slice(0, 10) : "-");
            return [link, dirLink, year, rStars, wDate];
        });

        const watchedTable = renderGenericFluid(
            ["Filme", "Diretor", "Ano", "Avaliação", "Assistido em"],
            ["auto", "160px", "70px", "100px", "105px"],
            watchedRows,
            "Nenhum filme assistido registrado ainda."
        );

        // 2. 🍿 Watchlist & Curadoria (inbox / planned / backlog)
        const watchlistMovies = allMovies
            .filter(m => !watchedMovies.includes(m))
            .sort((a, b) => String(a.file?.name || "").localeCompare(String(b.file?.name || "")));

        const watchlistRows = watchlistMovies.map(m => {
            const link = htmlLink(m.file.path, m.file.name) + getStudyBadges(m);
            const dirLink = resolvePersonLink(m.Director || m.director);
            const year = m.Release_Year || (m.Release ? String(m.Release).slice(0, 4) : "-");
            const genres = cleanLink(m.Genres || m.genres || "-");
            return [link, dirLink, year, trunc(genres, 20), formatStatus(getSt(m) || "inbox")];
        });

        const watchlistTable = renderGenericFluid(
            ["Filme", "Diretor", "Ano", "Gênero", "Status"],
            ["auto", "160px", "70px", "130px", "80px"],
            watchlistRows,
            "Watchlist vazia no momento."
        );

        // 3. 🎥 Diretores & Autores Cinematográficos
        const directors = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classPerson") return false;
                const par = cleanLink(p.Parent);
                const role = norm(p.Role);
                return par === "Audiovisual" || par === "Cinema" || role.includes("diretor") || role.includes("cineasta");
            })
            .array()
            .sort((a, b) => String(a.file?.name || "").localeCompare(String(b.file?.name || "")));

        const directorRows = directors.map(p => {
            const link = htmlLink(p.file.path, p.file.name);
            const role = p.Role || "-";
            const era = p.Era_Movement || "-";
            const worksCount = allPages.where(w => isNotConfigOrTemplate(w) && w.Class === "classMovie" && cleanLink(w.Director) === p.file.name).length;
            return [link, role, era, `${worksCount} filmes`];
        });

        const directorTable = renderGenericFluid(
            ["Diretor / Cineasta", "Papel", "Movimento / Estilo", "Acervo"],
            ["180px", "auto", "210px", "80px"],
            directorRows,
            "Nenhum diretor vinculado."
        );

        // 4. 🖼️ Galeria Visual de Posters
        const movieCardsHtml = renderCardsGrid(watchedMovies, "movie", "Nenhum filme com poster.");

        sections = [
            { title: `🎬 Obras Assistidas & Panteão (${watchedRows.length})`, content: watchedTable, isOpen: true },
            { title: `🍿 Watchlist & Curadoria (${watchlistRows.length})`, content: watchlistTable, isOpen: false },
            { title: `🎥 Diretores & Autores Cinematográficos (${directorRows.length})`, content: directorTable, isOpen: false },
            { title: `🖼️ Galeria Visual de Posters (${watchedMovies.length})`, content: movieCardsHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 15. STUDIO (Central/Hubs/Studio.md)
    // --------------------------------------------------------
    case "studio": {
        const stageRank = { 
            recording: 1, 
            record: 1, 
            editing: 2, 
            edit: 2, 
            scripting: 3, 
            script: 3, 
            ideation: 4, 
            idea: 4 
        };

        const swipeCatRank = {
            hook: 1,
            storytelling: 2,
            story: 2,
            copywriting: 3,
            copy: 3,
            aesthetic: 4,
            cinematic: 5,
            cinema: 5,
            mindset: 6,
            motivation: 7,
            lifestyle: 8,
            trip: 9,
            trips: 9,
            tech: 10
        };

        // 1. 🎬 Active Production Pipeline (Ordenado por Funil: Recording -> Editing -> Scripting -> Ideation)
        const activeProds = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classProduction") return false;
                const st = getSt(p);
                return !["done", "completed", "canceled", "paused"].includes(st) && norm(p.Stage) !== "published";
            })
            .sort((a, b) => {
                // 1. FUNIL: Estágio da Produção
                const sA = stageRank[norm(a.Stage)] || 9;
                const sB = stageRank[norm(b.Stage)] || 9;
                if (sA !== sB) return sA - sB;

                // 2. Prioridade (🔥 P5 -> P1) dentro do estágio
                const prioA = Number(a.Priority) || 3;
                const prioB = Number(b.Priority) || 3;
                if (prioA !== prioB) return prioB - prioA;

                // 3. Prazo / Deadline mais urgente
                const dA = parseMoment(a.Deadline);
                const dB = parseMoment(b.Deadline);
                if (dA && dB && dA.isValid() && dB.isValid()) return dA.valueOf() - dB.valueOf();

                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const activeRows = activeProds.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, p.file.name) + getProBadges(p);
            const stageBadge = formatStage(p.Stage);
            const fmt = p.Format ? `<br><span style="opacity: 0.6; font-size: 0.85em;">${p.Format}</span>` : "";
            const parentRaw = cleanLink(p.Parent || "Studio");
            const parentLink = htmlLink(parentRaw, trunc(parentRaw, 18));
            const prioBadge = formatPriority(p.Priority);
            const deadStr = p.Deadline ? ` • 📅 ${String(p.Deadline).slice(0, 10)}` : "";
            return [link, stageBadge + fmt, parentLink, `${prioBadge}${deadStr}`];
        });

        const activeTable = renderGenericFluid(
            ["Produção / Roteiro", "Estágio & Formato", "Vínculo (Parent)", "Prioridade & Prazo"],
            ["auto", "150px", "130px", "140px"],
            activeRows,
            "Nenhuma produção ativa na esteira no momento."
        );

        // 2. ⚡ Swipe File & Creative Vault (Ordenado por Funil Criativo: Hook -> Storytelling -> Copy -> Aesthetic -> Cinematic -> Mindset -> Motivation)
        const swipes = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classSwipe")
            .sort((a, b) => {
                const rA = swipeCatRank[norm(a.Category)] || 99;
                const rB = swipeCatRank[norm(b.Category)] || 99;
                if (rA !== rB) return rA - rB;
                const tA = getDocTime(a);
                const tB = getDocTime(b);
                if (tA !== tB) return tB - tA;
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const swipeRows = swipes.map(s => {
            const link = htmlLink(s.file.path, trunc(s.file.name, 35));
            const catBadge = formatSwipeCategory(s.Category);
            const creator = s.Creator || "-";
            const plat = s.Platform ? ` <span style="opacity: 0.6; font-size: 0.85em;">(${s.Platform})</span>` : "";
            const parentRaw = cleanLink(s.Parent || "Studio");
            const parentLink = htmlLink(parentRaw, trunc(parentRaw, 16));
            const urlIcon = s.Source_URL ? ` <a href="${s.Source_URL}" target="_blank" rel="noopener" style="text-decoration: none;" title="Abrir Link Externo">🌐</a>` : "";
            return [link, catBadge, creator + plat, parentLink + urlIcon];
        });

        const swipeTable = renderGenericFluid(
            ["Referência / Swipe", "Categoria", "Criador & Plataforma", "Vínculo & Fonte"],
            ["auto", "130px", "150px", "140px"],
            swipeRows,
            "Nenhum swipe arquivado no cofre."
        );

        // 3. 📦 Published & Footprint Audiovisual
        const publishedProds = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classProduction") return false;
                return getSt(p) === "done" || getSt(p) === "completed" || norm(p.Stage) === "published";
            })
            .sort((a, b) => {
                const dA = parseMoment(a.Completed_At || a.Updated);
                const dB = parseMoment(b.Completed_At || b.Updated);
                if (dA && dB && dA.isValid() && dB.isValid()) return dB.valueOf() - dA.valueOf();
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const publishedRows = publishedProds.map(p => {
            const link = htmlLink(p.file.path, p.file.name);
            const fmt = p.Format || "Video";
            const parentRaw = cleanLink(p.Parent || "Studio");
            const parentLink = htmlLink(parentRaw, trunc(parentRaw, 20));
            const pubDate = p.Completed_At ? String(p.Completed_At).slice(0, 10) : (p.Updated ? String(p.Updated).slice(0, 10) : "-");
            const urlBadge = p.URL ? ` <a href="${p.URL}" target="_blank" rel="noopener" title="Assistir Vídeo">▶️</a>` : "";
            return [link + urlBadge, fmt, parentLink, `${pubDate} ✅`];
        });

        const publishedTable = renderGenericFluid(
            ["Produção Publicada", "Formato", "Vínculo", "Publicado em"],
            ["auto", "120px", "140px", "120px"],
            publishedRows,
            "Nenhuma produção publicada arquivada."
        );

        // 4. ⏸️ Incubator / Paused Productions
        const pausedProds = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p) || p.Class !== "classProduction") return false;
                return getSt(p) === "paused" || getSt(p) === "backlog";
            })
            .sort((a, b) => {
                const sA = stageRank[norm(a.Stage)] || 9;
                const sB = stageRank[norm(b.Stage)] || 9;
                if (sA !== sB) return sA - sB;
                const prioA = Number(a.Priority) || 3;
                const prioB = Number(b.Priority) || 3;
                if (prioA !== prioB) return prioB - prioA;
                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const pausedRows = pausedProds.map(p => {
            const link = htmlLink(p.file.path, p.file.name);
            const stageBadge = formatStage(p.Stage);
            const parentRaw = cleanLink(p.Parent || "Studio");
            const parentLink = htmlLink(parentRaw, trunc(parentRaw, 20));
            const stBadge = formatStatus(getSt(p));
            return [link, stageBadge, parentLink, stBadge];
        });

        const pausedTable = renderGenericFluid(
            ["Produção Pausada", "Estágio", "Vínculo", "Status"],
            ["auto", "130px", "140px", "110px"],
            pausedRows,
            "Nenhuma produção pausada na incubadora."
        );

        sections = [
            { title: `🎬 Active Production Pipeline (${activeRows.length})`, content: activeTable, isOpen: true },
            { title: `⚡ Swipe File & Creative Vault (${swipeRows.length})`, content: swipeTable, isOpen: true },
            { title: `📦 Published & Footprint Audiovisual (${publishedRows.length})`, content: publishedTable, isOpen: false },
            { title: `⏸️ Incubator / Paused Productions (${pausedRows.length})`, content: pausedTable, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 16. PRODUCTION (Central/Studio/Productions/)
    // --------------------------------------------------------
    case "production": {
        const curName = current.file.name;
        const curPar = cleanLink(current.Parent || "-");

        // 1. ⚡ Swipes, Assets & Conexões Vinculadas
        const inlinkNames = new Set();
        if (current.file?.inlinks) {
            for (const l of current.file.inlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) inlinkNames.add(n);
            }
        }
        if (current.file?.outlinks) {
            for (const l of current.file.outlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) inlinkNames.add(n);
            }
        }

        const linkedAssets = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p)) return false;
                if (cleanLink(p.Parent) === curName && p.file.name !== curName) return true;
                if (matchesParent(p, "Source_Ref")) return true;
                if (inlinkNames.has(p.file.name)) return true;
                return false;
            })
            .sort((a, b) => {
                const pA = Number(a.Priority) || 0;
                const pB = Number(b.Priority) || 0;
                if (pA !== pB) return pB - pA;
                return getDocTime(b) - getDocTime(a);
            });

        const assetRows = linkedAssets.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, trunc(p.file.name, 35)) + getProBadges(p);
            const typeBadge = formatType(p.Class || "classDoc");
            const parentRaw = cleanLink(p.Parent || "-");
            const parentLink = parentRaw !== "-" ? htmlLink(parentRaw, trunc(parentRaw, 20)) : "-";
            const info = formatEntityContextInfo(p);
            return [link, typeBadge, parentLink, info];
        });

        const assetHtml = renderGenericFluid(
            ["Artefato / Referência / PoW", "Tipo", "Origem / Vínculo", "Info / Status"],
            ["auto", "110px", "130px", "120px"],
            assetRows,
            "Nenhum swipe, asset ou nota vinculado a este roteiro."
        );

        // 2. 📋 Ficheiro Relacional da Produção
        const stageBadge = formatStage(current.Stage);
        const fmt = current.Format || "-";
        const prioBadge = formatPriority(current.Priority);
        const stBadge = formatStatus(getSt(current));
        const dead = current.Deadline ? `📅 ${String(current.Deadline).slice(0, 10)}` : "-";
        const pRaw = cleanLink(current.Parent || "Studio");
        const parentLink = htmlLink(pRaw, pRaw);
        const urlLink = current.URL ? `<a href="${current.URL}" target="_blank" rel="noopener" style="color: var(--text-accent);">${trunc(current.URL, 40)}</a>` : "";
        const canvasLink = current.Canvas ? htmlLink(cleanLink(current.Canvas), cleanLink(current.Canvas)) : "";
        const dates = `${current.Created ? String(current.Created).slice(0, 10) : "-"} • ${current.Updated ? String(current.Updated).slice(0, 10) : "-"}`;

        const ficheiroRows = [
            renderInfoRow("Estágio de Produção", stageBadge),
            renderInfoRow("Formato de Mídia", fmt),
            renderInfoRow("Prioridade", prioBadge),
            renderInfoRow("Status Operacional", stBadge),
            renderInfoRow("Prazo Previsto", dead),
            renderInfoRow("Venture / Canal Pai", parentLink),
            urlLink ? renderInfoRow("URL Publicada", urlLink) : "",
            canvasLink ? renderInfoRow("Storyboard / Canvas", canvasLink) : "",
            renderInfoRow("Criação & Atualização", dates)
        ].filter(Boolean).join("");

        const ficheiroHtml = `<div style="display: flex; flex-direction: column;">${ficheiroRows}</div>`;

        sections = [
            { title: `⚡ Swipes, Assets & Conexões (${assetRows.length})`, content: assetHtml, isOpen: assetRows.length > 0 },
            { title: "📋 Ficheiro Relacional", content: ficheiroHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 17. SWIPE (Central/Studio/Swipes/)
    // --------------------------------------------------------
    case "swipe": {
        const curName = current.file.name;
        const curPar = cleanLink(current.Parent || "-");

        // 1. 🔗 Conexões & Produções que Utilizam
        const inlinkNames = new Set();
        if (current.file?.inlinks) {
            for (const l of current.file.inlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) inlinkNames.add(n);
            }
        }

        const referencingPages = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p)) return false;
                if (cleanLink(p.Parent) === curName && p.file.name !== curName) return true;
                if (matchesParent(p, "Source_Ref")) return true;
                if (inlinkNames.has(p.file.name)) return true;
                return false;
            })
            .sort((a, b) => getDocTime(b) - getDocTime(a));

        const refRows = referencingPages.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, trunc(p.file.name, 35)) + getProBadges(p);
            const typeBadge = formatType(p.Class || "classDoc");
            const parentRaw = cleanLink(p.Parent || "-");
            const parentLink = parentRaw !== "-" ? htmlLink(parentRaw, trunc(parentRaw, 20)) : "-";
            const info = formatEntityContextInfo(p);
            return [link, typeBadge, parentLink, info];
        });

        const refHtml = renderGenericFluid(
            ["Produção / Projeto / Nota", "Tipo", "Parent", "Status / Info"],
            ["auto", "110px", "130px", "120px"],
            refRows,
            "Nenhuma produção ou nota referenciando este swipe no momento."
        );

        // 2. 📋 Ficheiro Relacional do Swipe
        const catBadge = formatSwipeCategory(current.Category);
        const creator = current.Creator || "-";
        const plat = current.Platform || "-";
        const urlLink = current.Source_URL ? `<a href="${current.Source_URL}" target="_blank" rel="noopener" style="color: var(--text-accent);">${trunc(current.Source_URL, 40)} 🌐</a>` : "-";
        const pRaw = cleanLink(current.Parent || "Studio");
        const parentLink = htmlLink(pRaw, pRaw);
        const dates = `${current.Created ? String(current.Created).slice(0, 10) : "-"} • ${current.Updated ? String(current.Updated).slice(0, 10) : "-"}`;

        const ficheiroRows = [
            renderInfoRow("Categoria", catBadge),
            renderInfoRow("Criador / Autor", creator),
            renderInfoRow("Plataforma de Origem", plat),
            renderInfoRow("Link Externo Original", urlLink),
            renderInfoRow("Vínculo Pai", parentLink),
            renderInfoRow("Criação & Atualização", dates)
        ].filter(Boolean).join("");

        const ficheiroHtml = `<div style="display: flex; flex-direction: column;">${ficheiroRows}</div>`;

        sections = [
            { title: `🔗 Conexões & Onde é Utilizado (${refRows.length})`, content: refHtml, isOpen: refRows.length > 0 },
            { title: "📋 Ficheiro Relacional", content: ficheiroHtml, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 18. LIFE (Central/Hubs/Life.md)
    // --------------------------------------------------------
    case "life": {
        // 1. ⚡ Active Bio-Cycle & Protocol
        const cyclePages = dv.pages('"Central/Personal/Cycles"');
        const activeCycleMatches = (cyclePages && cyclePages.length > 0)
            ? cyclePages.where(p => isNotConfigOrTemplate(p) && (p.Current === true || p.current === true || String(p.Current).toLowerCase() === "true" || String(p.current).toLowerCase() === "true"))
            : allPages.where(p => isNotConfigOrTemplate(p) && (p.Class === "classCycle" || p.Class === "classCycles") && (p.Current === true || p.current === true || String(p.Current).toLowerCase() === "true"));
        let activeCycle = activeCycleMatches?.array ? activeCycleMatches.array()[0] : (activeCycleMatches?.[0] || null);
        if (!activeCycle || !activeCycle.file) {
            const direct5 = dv.page("Central/Personal/Cycles/Cycle 5.md") || dv.page("Cycle 5");
            if (direct5 && direct5.file) activeCycle = direct5;
        }

        let bioCycleHtml = "";
        if (activeCycle) {
            const cLink = htmlLink(activeCycle.file.path, activeCycle.file.name);
            const cal = activeCycle.Calories ? `🔥 <b>Calorias:</b> ${activeCycle.Calories} kcal` : "";
            const mac = activeCycle.Macros ? `🥩 <b>Macros:</b> ${activeCycle.Macros}` : "";
            const wat = activeCycle.Water ? `💧 <b>Água:</b> ${activeCycle.Water}` : "";
            const slp = activeCycle.Sleep_Window ? `🌙 <b>Sono:</b> ${activeCycle.Sleep_Window}` : "";
            const targetsBar = [cal, mac, wat, slp].filter(Boolean).join(" &nbsp;•&nbsp; ");

            const todayDow = moment().isoWeekday(); // 1 = Monday ... 7 = Sunday
            const daysMap = [
                { num: 1, name: "Segunda", val: activeCycle.Monday },
                { num: 2, name: "Terça", val: activeCycle.Tuesday },
                { num: 3, name: "Quarta", val: activeCycle.Wednesday },
                { num: 4, name: "Quinta", val: activeCycle.Thursday },
                { num: 5, name: "Sexta", val: activeCycle.Friday },
                { num: 6, name: "Sábado", val: activeCycle.Saturday },
                { num: 7, name: "Domingo", val: activeCycle.Sunday }
            ];

            const weekRows = daysMap.map(d => {
                const isToday = d.num === todayDow;
                const dayLabel = isToday ? `<b style="color: var(--text-accent);">👉 ${d.name} (HOJE)</b>` : d.name;
                const workoutText = isToday ? `<b style="color: var(--text-accent);">${d.val || "Rest"}</b>` : (d.val || "Rest");
                return [dayLabel, workoutText];
            });

            const trainingTable = renderGenericFluid(
                ["Dia da Semana", "Treino Programado"],
                ["160px", "auto"],
                weekRows,
                "Nenhum treino programado."
            );

            bioCycleHtml = `<div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; font-size: 0.9em;"><b>Ciclo Vigente:</b> ${cLink}<br><span style="opacity: 0.85;">${targetsBar}</span></div>${trainingTable}`;
        } else {
            bioCycleHtml = `<div style="opacity: 0.7; padding: 8px 0;"><em>Nenhum ciclo biológico ativo definido no momento.</em></div>`;
        }

        // 2. 🧬 Biomarkers & Telemetry Pulse (7d vs 30d)
        const allDailies = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classDaily")
            .array()
            .map(p => {
                const m = moment(p.file.name, "DD-MM-YYYY");
                return { page: p, moment: m };
            })
            .filter(d => d.moment.isValid())
            .sort((a, b) => b.moment.valueOf() - a.moment.valueOf());

        const nowMoment = moment();
        const d7 = allDailies.filter(d => nowMoment.diff(d.moment, "days") <= 7);
        const d30 = allDailies.filter(d => nowMoment.diff(d.moment, "days") <= 30);

        const calcAvg = (arr, key) => {
            const vals = arr.map(d => Number(d.page[key])).filter(v => !isNaN(v) && v > 0);
            if (vals.length === 0) return "-";
            return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
        };
        const calcHabitRate = (arr, key) => {
            if (arr.length === 0) return "-";
            const doneCount = arr.filter(d => d.page[key] === true).length;
            return `${Math.round((doneCount / arr.length) * 100)}%`;
        };

        const latestWeightDaily = allDailies.find(d => Number(d.page.bio_weight) > 0);
        const latestWeight = latestWeightDaily ? `${latestWeightDaily.page.bio_weight} kg` : "-";

        const teleRows = [
            ["Duração do Sono", `${calcAvg(d7, "bio_sleep_hours")}h`, `${calcAvg(d30, "bio_sleep_hours")}h`],
            ["Qualidade do Sono", `${calcAvg(d7, "bio_sleep_quality")}/5`, `${calcAvg(d30, "bio_sleep_quality")}/5`],
            ["Deep Work Médio", `${calcAvg(d7, "exec_deep_work_h")}h/dia`, `${calcAvg(d30, "exec_deep_work_h")}h/dia`],
            ["Clareza Cognitiva", `${calcAvg(d7, "cog_clarity")}/5`, `${calcAvg(d30, "cog_clarity")}/5`],
            ["Energia & Disposição", `${calcAvg(d7, "cog_energy")}/5`, `${calcAvg(d30, "cog_energy")}/5`],
            ["Craving / Desejo Impulsivo", `${calcAvg(d7, "cog_craving")}/5`, `${calcAvg(d30, "cog_craving")}/5`],
            ["Dieta Limpa (Adesão)", calcHabitRate(d7, "h_clean_diet"), calcHabitRate(d30, "h_clean_diet")],
            ["Meta de Água (Adesão)", calcHabitRate(d7, "h_water_goal"), calcHabitRate(d30, "h_water_goal")],
            ["Creatina (Adesão)", calcHabitRate(d7, "h_creatine"), calcHabitRate(d30, "h_creatine")],
            ["Ordem do QG (Adesão)", calcHabitRate(d7, "h_clean_qg"), calcHabitRate(d30, "h_clean_qg")]
        ];

        const teleHeader = `<div style="margin-bottom: 8px; font-size: 0.9em; opacity: 0.8;">⚖️ <b>Último Peso Registrado:</b> <span style="color: var(--text-accent); font-weight: 600;">${latestWeight}</span></div>`;
        const teleTable = renderGenericFluid(
            ["Métrica Biológica / Hábito", "Média 7 Dias", "Média 30 Dias"],
            ["auto", "120px", "120px"],
            teleRows,
            "Sem dados de daily suficientes para telemetria."
        );
        const telemetryHtml = teleHeader + teleTable;

        // 3. 🎯 Personal & Global OKR Radar (Goals & Metrics)
        const horizonRank = { annual: 1, year: 1, monthly: 2, month: 2, sprint: 3 };
        const activeGoals = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classGoal" && getSt(p) === "in_progress")
            .sort((a, b) => {
                // 1. Horizonte de Anual para baixo: Annual -> Monthly -> Sprint
                const hA = horizonRank[norm(a.Horizon)] || 9;
                const hB = horizonRank[norm(b.Horizon)] || 9;
                if (hA !== hB) return hA - hB;

                // 2. Prioridade (🔥 P5 -> P1) dentro do horizonte
                const prioA = Number(a.Priority) || 3;
                const prioB = Number(b.Priority) || 3;
                if (prioA !== prioB) return prioB - prioA;

                // 3. Deadline mais urgente primeiro
                const dA = parseMoment(a.Deadline);
                const dB = parseMoment(b.Deadline);
                if (dA && dB && dA.isValid() && dB.isValid()) return dA.valueOf() - dB.valueOf();

                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const goalRows = activeGoals.map(g => {
            const isP5 = Number(g.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(g.file.path, g.file.name);
            const hRaw = norm(g.Horizon || "sprint");
            let horizonBadge = "⚡ Sprint";
            if (hRaw === "annual" || hRaw === "year") horizonBadge = "🏛️ Annual";
            else if (hRaw === "monthly" || hRaw === "month") horizonBadge = "📅 Monthly";
            const parentRaw = cleanLink(g.Parent || "-");
            const parentLink = parentRaw !== "-" ? htmlLink(parentRaw, trunc(parentRaw, 20)) : "-";
            const bar = (g.Target && Number(g.Target) > 0) ? asciiBar(g.Current, g.Target, 10) : "-";
            const deadStr = g.Deadline ? ` • 📅 ${String(g.Deadline).slice(0, 10)}` : "";
            return [link, horizonBadge, parentLink, `${bar}${deadStr}`];
        });

        const goalTable = renderGenericFluid(
            ["Meta Ativa", "Horizonte", "Alvo (Parent)", "Progresso & Prazo"],
            ["auto", "110px", "140px", "180px"],
            goalRows,
            "Nenhuma meta ativa no momento."
        );

        const cadenceRank = { annual: 1, year: 1, monthly: 2, month: 2, sprint: 3 };
        const activeMetrics = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classMetric" && getSt(p) === "in_progress")
            .sort((a, b) => {
                // 1. Cadência de Anual para baixo: Annual -> Monthly -> Sprint
                const cA = cadenceRank[norm(a.Cadence || a.Horizon)] || 9;
                const cB = cadenceRank[norm(b.Cadence || b.Horizon)] || 9;
                if (cA !== cB) return cA - cB;

                const dA = parseMoment(a.Deadline);
                const dB = parseMoment(b.Deadline);
                if (dA && dB && dA.isValid() && dB.isValid()) return dA.valueOf() - dB.valueOf();

                return String(a.file?.name || "").localeCompare(String(b.file?.name || ""));
            });

        const metricRows = activeMetrics.map(m => {
            const link = htmlLink(m.file.path, m.file.name);
            const cRaw = norm(m.Cadence || "annual");
            let cadBadge = "⚡ Sprint";
            if (cRaw === "annual" || cRaw === "year") cadBadge = "🏛️ Annual";
            else if (cRaw === "monthly" || cRaw === "month") cadBadge = "📅 Monthly";
            const bar = asciiBar(m.Current, m.Target, 10);
            const val = `${m.Current || 0} / ${m.Target || 0} ${m.Unit || ""}`;
            const dead = m.Deadline ? `📅 ${String(m.Deadline).slice(0, 10)}` : "-";
            return [link, cadBadge, bar, val, dead];
        });

        const metricTable = renderGenericFluid(
            ["Sensor / Métrica", "Cadência", "Progresso", "Valor Atual / Meta", "Prazo"],
            ["auto", "100px", "130px", "140px", "110px"],
            metricRows,
            "Nenhum sensor de métrica ativo."
        );

        const radarHtml = `<div style="font-size: 0.9em; font-weight: 600; opacity: 0.85; margin: 4px 0 6px 0;">🎯 Cascata de Metas Ativas (${goalRows.length})</div>${goalTable}<div style="margin: 16px 0 8px 0; font-size: 0.9em; font-weight: 600; opacity: 0.85;">📊 Sensores Quantitativos (${metricRows.length})</div>${metricTable}`;

        // 4. 🧠 Existential, Mental & Relational Thoughts
        const thoughts = allPages
            .where(p => isNotConfigOrTemplate(p) && p.Class === "classThought")
            .sort(p => getDocTime(p), "desc");

        const thoughtRows = thoughts.map(t => {
            const link = htmlLink(t.file.path, t.file.name);
            const catBadge = formatThoughtCategory(t.Category);
            const ppl = resolvePersonLink(t.People);
            const upDate = t.Updated ? String(t.Updated).slice(0, 10) : (t.Created ? String(t.Created).slice(0, 10) : "-");
            return [link, catBadge, ppl, upDate];
        });

        const thoughtTable = renderGenericFluid(
            ["Reflexão / Pensamento", "Categoria", "Pessoas Envolvidas", "Atualizado em"],
            ["auto", "120px", "140px", "110px"],
            thoughtRows,
            "Nenhuma reflexão arquivada."
        );

        // 5. 🔄 Cycles History & Protocol Archive
        const cycles = allPages
            .where(p => isNotConfigOrTemplate(p) && (p.Class === "classCycle" || p.Class === "classCycles"))
            .sort(p => parseMoment(p.Start || p.Created)?.valueOf() || 0, "desc");

        const cycleRows = cycles.map(c => {
            const link = htmlLink(c.file.path, c.file.name);
            const st = c.Current === true ? `<span style="color: #10b981; font-weight: bold;">⚡ VIGENTE (ATIVO)</span>` : "Histórico";
            const info = [c.Calories ? `${c.Calories} kcal` : "", c.Diet || ""].filter(Boolean).join(" • ") || "-";
            const startDate = c.Start ? String(c.Start).slice(0, 10) : (c.Created ? String(c.Created).slice(0, 10) : "-");
            return [link, st, info, startDate];
        });

        const cycleTable = renderGenericFluid(
            ["Ciclo", "Status / Vigência", "Alvos & Dieta", "Data de Início"],
            ["auto", "140px", "150px", "110px"],
            cycleRows,
            "Nenhum ciclo registrado."
        );

        sections = [
            { title: "⚡ Active Bio-Cycle & Protocol", content: bioCycleHtml, isOpen: true },
            { title: "🧬 Biomarkers & Telemetry Pulse (7d / 30d)", content: telemetryHtml, isOpen: true },
            { title: `🎯 Personal & Global OKR Radar (${goalRows.length})`, content: radarHtml, isOpen: true },
            { title: `🧠 Existential, Mental & Relational Thoughts (${thoughtRows.length})`, content: thoughtTable, isOpen: false },
            { title: `🔄 Cycles History (${cycleRows.length})`, content: cycleTable, isOpen: false }
        ];
        break;
    }

    // --------------------------------------------------------
    // 19. THOUGHT (Central/Personal/Thoughts/)
    // --------------------------------------------------------
    case "thought": {
        const curName = current.file.name;
        const curPar = cleanLink(current.Parent || "-");

        // 1. 🔗 Conexões, Pessoas & Dailies Relacionadas
        const inlinkNames = new Set();
        if (current.file?.inlinks) {
            for (const l of current.file.inlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) inlinkNames.add(n);
            }
        }
        if (current.file?.outlinks) {
            for (const l of current.file.outlinks) {
                const n = cleanLink(l);
                if (n && n !== curName && n !== curPar) inlinkNames.add(n);
            }
        }

        const referencingPages = allPages
            .where(p => {
                if (!isNotConfigOrTemplate(p)) return false;
                if (cleanLink(p.Parent) === curName && p.file.name !== curName) return true;
                if (matchesParent(p, "Source_Ref")) return true;
                if (inlinkNames.has(p.file.name)) return true;
                return false;
            })
            .sort((a, b) => getDocTime(b) - getDocTime(a));

        const refRows = referencingPages.map(p => {
            const isP5 = Number(p.Priority) === 5;
            const p5Badge = isP5 ? `<span style="color: #ef4444; font-weight: bold;" title="Prioridade P5">🔥 </span>` : "";
            const link = p5Badge + htmlLink(p.file.path, trunc(p.file.name, 35)) + getProBadges(p);
            const typeBadge = formatType(p.Class || "classDoc");
            const parentRaw = cleanLink(p.Parent || "-");
            const parentLink = parentRaw !== "-" ? htmlLink(parentRaw, trunc(parentRaw, 20)) : "-";
            const info = formatEntityContextInfo(p);
            return [link, typeBadge, parentLink, info];
        });

        const refHtml = renderGenericFluid(
            ["Nota / Conexão / Daily", "Tipo", "Parent", "Info / Data"],
            ["auto", "110px", "130px", "120px"],
            refRows,
            "Nenhuma nota ou daily vinculada a esta reflexão."
        );

        // 2. 📋 Ficheiro Relacional do Pensamento
        const catBadge = formatThoughtCategory(current.Category);
        const ppl = resolvePersonLink(current.People);
        const pRaw = cleanLink(current.Parent || "Life");
        const parentLink = htmlLink(pRaw, pRaw);
        const dates = `${current.Created ? String(current.Created).slice(0, 10) : "-"} • ${current.Updated ? String(current.Updated).slice(0, 10) : "-"}`;

        const ficheiroRows = [
            renderInfoRow("Categoria Filosófica", catBadge),
            ppl !== "-" ? renderInfoRow("Pessoas / Inspirações", ppl) : "",
            renderInfoRow("Vínculo Pai", parentLink),
            renderInfoRow("Criação & Atualização", dates)
        ].filter(Boolean).join("");

        const ficheiroHtml = `<div style="display: flex; flex-direction: column;">${ficheiroRows}</div>`;

        sections = [
            { title: `🔗 Conexões, Pessoas & Dailies Relacionadas (${refRows.length})`, content: refHtml, isOpen: refRows.length > 0 },
            { title: "📋 Ficheiro Relacional", content: ficheiroHtml, isOpen: false }
        ];
        break;
    }

    default:
        sections = [{ title: `Modo: ${mode}`, content: "Modo desconhecido.", isOpen: true }];
}

dv.el("div", (headerHtml || "") + wrapSections(sections));

// Tracker de Estado dos Accordions (Salva estado em toggle/click para re-render reativo)
const setupAccordionTracker = (el) => {
    if (!el || typeof el.addEventListener !== "function") return;
    if (el._relViewAccordionTracker) {
        el.removeEventListener("toggle", el._relViewAccordionTracker, true);
    }
    el._relViewAccordionTracker = (evt) => {
        const details = evt.target?.closest ? evt.target.closest("details") : (evt.target?.tagName === "DETAILS" ? evt.target : null);
        if (details) {
            const key = details.getAttribute("data-accordion-key");
            if (key) {
                if (!window.__VAULT_ACCORDION_STATE__) window.__VAULT_ACCORDION_STATE__ = {};
                window.__VAULT_ACCORDION_STATE__[key] = details.open;
            }
        }
    };
    el.addEventListener("toggle", el._relViewAccordionTracker, true);

    if (el._relViewAccordionClickHandler) {
        el.removeEventListener("click", el._relViewAccordionClickHandler, true);
    }
    el._relViewAccordionClickHandler = (evt) => {
        const summary = evt.target?.closest ? evt.target.closest("summary") : null;
        const details = summary?.parentElement;
        if (details && details.tagName === "DETAILS") {
            const key = details.getAttribute("data-accordion-key");
            if (key) {
                setTimeout(() => {
                    if (!window.__VAULT_ACCORDION_STATE__) window.__VAULT_ACCORDION_STATE__ = {};
                    window.__VAULT_ACCORDION_STATE__[key] = details.open;
                }, 40);
            }
        }
    };
    el.addEventListener("click", el._relViewAccordionClickHandler, true);
};

// Link Handler em Nova Aba (Força abertura de qualquer clique interno em nova aba)
const setupLinkHandler = (el) => {
    if (!el || typeof el.addEventListener !== "function") return;
    if (el._relViewTabLinkHandler) {
        el.removeEventListener("click", el._relViewTabLinkHandler, true);
    }
    el._relViewTabLinkHandler = (evt) => {
        const link = evt.target.closest("a.internal-link");
        if (link) {
            const href = link.getAttribute("data-href") || link.getAttribute("href");
            if (href) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                if (typeof app !== "undefined" && app?.workspace?.openLinkText) {
                    app.workspace.openLinkText(href, curPath, "tab");
                }
            }
        }
    };
    el.addEventListener("click", el._relViewTabLinkHandler, true);
};

setupLinkHandler(dv.container);
setupAccordionTracker(dv.container);
const leafEl = typeof dv.container?.closest === "function" ? dv.container.closest(".workspace-leaf") : null;
if (leafEl) {
    setupLinkHandler(leafEl);
    setupAccordionTracker(leafEl);
} else {
    setTimeout(() => {
        const delayedLeaf = typeof dv.container?.closest === "function" ? dv.container.closest(".workspace-leaf") : null;
        if (delayedLeaf) {
            setupLinkHandler(delayedLeaf);
            setupAccordionTracker(delayedLeaf);
        }
    }, 100);
}
