if (typeof dv === "undefined") {
    if (typeof module !== "undefined" && module.exports) module.exports = {};
    return;
}

// ============================================================
// 🖥️ HUD DAILY COCKPIT v4.5 (10-Block ASCII, Display Status, Zero Leak)
// Invocado via: dv.view("Central/Configs/Scripts/hud_daily")
// ============================================================

const charLimit = 30;

// 🛠️ FUNÇÕES AUXILIARES
const trunc = (s, n) => (s && s.length > n) ? s.substr(0, n).trim() + '..' : s;
const norm = (s) => (s ?? "").toString().toLowerCase().trim();
const getSt = (p) => norm(p.Status || p.status);
const htmlLink = (path, text) => `<a class="internal-link" data-href="${path}" href="${path}">${text}</a>`;

// 🛡️ HELPER SEGURO DE EXTRAÇÃO DE NOMES DE LINKS (Protege contra Dataview Link Objects e Arrays)
const cleanLink = (val) => {
    if (!val) return "";
    if (Array.isArray(val)) {
        return val.map(v => cleanLink(v)).filter(Boolean).join(", ");
    }
    if (typeof val === "object") {
        if (val.fileName) return String(val.fileName).replace(/[\[\]]/g, "").trim();
        if (val.path) return String(val.path.split("/").pop().replace(".md", "")).replace(/[\[\]]/g, "").trim();
        if (typeof val.toString === "function") return val.toString().replace(/[\[\]]/g, "").trim();
    }
    return String(val).replace(/[\[\]]/g, "").trim();
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

// ⚡ OTIMIZAÇÃO: Carga única cacheada de dv.pages() (O(1N))
const allPages = dv.pages();

let fileMoment = moment(dv.current().file.name, "DD-MM-YYYY");
if (!fileMoment.isValid()) fileMoment = moment();

// 📊 HELPER VISUAL ASCII PADRONIZADO (10 BLOCOS, LARGURA RIGOROSAMENTE FIXA)
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
    const headerRow = `<div style="display: flex; align-items: center; width: 100%; box-sizing: border-box; overflow: hidden; white-space: nowrap; opacity: 0.65; font-weight: 600; padding: 2px 0 6px 0; border-bottom: 1px solid var(--background-modifier-border);">` +
        headers.map((h, i) => {
            const isLast = i === headers.length - 1;
            return `<span style="${getColStyle(colWidths[i])}">${h}</span>` + (!isLast ? sep : "");
        }).join("") + `</div>`;
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

// 📦 MOTOR DE CAPTURA DO DAILY FOOTPRINT (Rastro de Produção e Consumo de Hoje)
const getDailyFootprint = (startDate, endDate) => {
    if (!startDate || !endDate || !startDate.isValid() || !endDate.isValid()) return [];
    const results = [];
    for (const p of allPages) {
        if (!p || !p.file) continue;
        const folder = p.file.folder || "";
        if (folder.includes("Configs") || folder.includes("Templates") || folder.includes("Archive")) continue;
        if (p.isTemplate === true || p.Type === "template" || p.Class === "classHub" || p.Class === "classDaily" || p.Class === "classMetric" || p.Class === "classCycle") continue;
        
        const cls = p.Class;
        let matched = false;
        let typeBadge = "";
        let infoStr = "";
        let sortWeight = 99;
        let eventDate = null;
        
        // 1. Obras & Cursos Concluídos (Apenas finalizados)
        if (cls === "classBook" || cls === "classCourse") {
            const st = norm(p.Status || p.status);
            if (st === "done" || st === "completed") {
                const comp = parseMoment(p.Completed_At || p.completed_at);
                const upd = parseMoment(p.Updated || p.updated);
                
                if (comp && comp.isBetween(startDate, endDate, null, "[]")) {
                    matched = true; eventDate = comp;
                } else if (!comp && upd && upd.isBetween(startDate, endDate, null, "[]")) {
                    matched = true; eventDate = upd;
                }
                
                if (matched) {
                    typeBadge = cls === "classBook" ? "📚 Book" : "🎓 Course";
                    sortWeight = 1;
                    infoStr = `<span style="color:#10b981; font-weight:500;">Done</span>`;
                }
            }
        } else if (cls === "classGoal") {
            const st = norm(p.Status || p.status);
            if (st === "done" || st === "completed") {
                const comp = parseMoment(p.Completed_At || p.completed_at);
                const upd = parseMoment(p.Updated || p.updated);
                
                if (comp && comp.isBetween(startDate, endDate, null, "[]")) {
                    matched = true; eventDate = comp;
                } else if (!comp && upd && upd.isBetween(startDate, endDate, null, "[]")) {
                    matched = true; eventDate = upd;
                }
                
                if (matched) {
                    const horiz = norm(p.Horizon || "sprint");
                    typeBadge = horiz === "annual" ? "🏛️ Year Goal" : (horiz === "monthly" ? "📅 Month Goal" : "⚡ Goal");
                    sortWeight = 0;
                    infoStr = `<span style="color:#10b981; font-weight:500;">Done 100%</span>`;
                }
            }
        } else if (cls === "classMovie") {
            const watched = parseMoment(p.Watched || p.watched || p.Completed_At);
            if (watched && watched.isBetween(startDate, endDate, null, "[]")) {
                matched = true;
                eventDate = watched;
                typeBadge = "🎬 Movie";
                sortWeight = 1;
                const r = p.Rating ? `★ ${p.Rating}/5` : "Watched";
                infoStr = `<span style="color:#f59e0b;">${r}</span>`;
            }
        } else if (cls === "classProject") {
            const st = norm(p.Status || p.status);
            if (st === "done" || st === "completed") {
                const comp = parseMoment(p.Completed_At || p.completed_at);
                const upd = parseMoment(p.Updated || p.updated);
                
                if (comp && comp.isBetween(startDate, endDate, null, "[]")) {
                    matched = true; eventDate = comp;
                } else if (!comp && upd && upd.isBetween(startDate, endDate, null, "[]")) {
                    matched = true; eventDate = upd;
                }
                
                if (matched) {
                    typeBadge = "🚀 Project";
                    sortWeight = 1;
                    infoStr = `<span style="color:#10b981; font-weight:500;">Done</span>`;
                }
            }
        } else if (["classZettel", "classLiterature", "classDoc", "classProduction", "classThought"].includes(cls)) {
            const cre = parseMoment(p.Created || p.created);
            if (cre && cre.isBetween(startDate, endDate, null, "[]")) {
                matched = true;
                eventDate = cre;
                sortWeight = 2;
                const dateShort = cre.format("HH:mm");
                if (cls === "classZettel") {
                    typeBadge = "💎 Zettel";
                    const mat = formatStatus(p.Maturity || "seed");
                    infoStr = `${mat} • ${dateShort}`;
                } else if (cls === "classLiterature") {
                    typeBadge = "📖 Lit";
                    const seq = p.Sequence ? `#${p.Sequence}` : "Lesson";
                    infoStr = `${seq} • ${dateShort}`;
                } else if (cls === "classDoc") {
                    typeBadge = "📄 Doc";
                    const dt = p.Type ? formatStatus(p.Type) : "Spec";
                    infoStr = `${dt} • ${dateShort}`;
                } else if (cls === "classThought") {
                    typeBadge = "🧠 Thought";
                    infoStr = `Personal • ${dateShort}`;
                } else if (cls === "classProduction") {
                    typeBadge = "🏭 Prod";
                    infoStr = `Asset • ${dateShort}`;
                }
            }
        }
        
        if (matched) {
            let pRaw = cleanLink(p.Parent || p.Source || "-");
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
    results.sort((a, b) => {
        if (a.sortWeight !== b.sortWeight) return a.sortWeight - b.sortWeight;
        return b.date - a.date;
    });
    return results;
};

// Separador natural de colunas
const sep = `<span style="opacity: 0.35; padding: 0 6px; flex: 0 0 auto;">|</span>`;

// 🛡️ FILTRO UNIVERSAL: Entidades Reais Ativas
const isRealActive = (p, targetClass) => {
    if (!p || !p.file) return false;
    const folder = p.file.folder || "";
    if (folder.includes("Configs") || folder.includes("Templates") || folder.includes("Archive")) return false;
    if (p.isTemplate === true || p.Type === "template" || p.Class === "classHub") return false;
    if (Array.isArray(targetClass)) {
        if (!targetClass.includes(p.Class)) return false;
    } else if (targetClass && p.Class !== targetClass) {
        return false;
    }
    return getSt(p) === "in_progress";
};

// 1. LEITURA & ESTUDOS (Limpeza de Topo: Zero barras ou badges, apenas links limpos)
const books = allPages
    .where(p => isRealActive(p, "classBook"))
    .sort(p => p.file.mtime, "desc");
const bookList = books?.array ? books.array() : Array.from(books || []);
const readingList = bookList.length > 0
    ? bookList.map(b => htmlLink(b.file.path, trunc(b.file.name, charLimit))).join(" - ") : null;

const studies = allPages
    .where(p => isRealActive(p, ["classSubject", "classCourse"]))
    .sort(p => p.file.mtime, "desc");
const studyArray = studies?.array ? studies.array() : Array.from(studies || []);

// 🍃 LEAF-FOCUS RULE: Se um Subject/Course é pai de outro que também está ativo na lista, oculta o pai!
const activeParentNames = new Set(
    studyArray
        .map(p => cleanLink(p.Parent))
        .filter(name => name && name !== "Academy" && name !== "Work" && name !== "Life")
);
const leafStudyArray = studyArray.filter(p => !activeParentNames.has(p.file.name));

const studyList = leafStudyArray.length > 0
    ? leafStudyArray.map(s => htmlLink(s.file.path, trunc(s.file.name, charLimit))).join(" - ") : null;

// 2. PROJETOS & VENTURES ATIVAS (PROFISSIONAL: Links limpos)
const pro = allPages
    .where(p => isRealActive(p, ["classVenture", "classProject"]))
    .sort(p => p.Priority, "desc");
const proArray = pro?.array ? pro.array() : Array.from(pro || []);
const proList = proArray.length > 0
    ? proArray.map(p => htmlLink(p.file.path, trunc(p.file.name, charLimit))).join(" | ") : null;

// 3. CICLO (TREINO & DIETA)
const todayName = fileMoment.locale('en').format('dddd');
const cyclePages = dv.pages('"Central/Personal/Cycles"');
const cycleMatches = (cyclePages && cyclePages.length > 0)
    ? cyclePages.where(p => p.Current === true || p.current === true || String(p.Current).toLowerCase() === "true" || String(p.current).toLowerCase() === "true")
    : allPages.where(p => (p.Class === "classCycles" || p.Class === "classCycle" || p["class"] === "classCycle") && (p.Current === true || p.current === true || String(p.Current).toLowerCase() === "true"));

let cycle = cycleMatches?.array ? cycleMatches.array()[0] : (cycleMatches?.values ? cycleMatches.values[0] : (cycleMatches?.first ? cycleMatches.first() : (cycleMatches?.[0] || null)));

// 🛡️ Fallback resiliente: se a busca dinâmica por frontmatter falhar, busca direta por Cycle 5
if (!cycle || !cycle.file) {
    const direct5 = dv.page("Central/Personal/Cycles/Cycle 5.md") || dv.page("Cycle 5");
    if (direct5 && direct5.file) {
        cycle = direct5;
    } else if (cyclePages && cyclePages.length > 0) {
        cycle = cyclePages.sort(p => p.file.name, "desc").first();
    }
}

// Resolução híbrida de propriedades (Dataview + Obsidian MetadataCache)
let cycleProps = cycle ? { ...cycle } : {};
if (typeof app !== "undefined" && app?.metadataCache && cycle?.file?.path) {
    const tfile = app.metadataCache.getFirstLinkpathDest(cycle.file.path, "");
    if (tfile) {
        const cache = app.metadataCache.getFileCache(tfile);
        if (cache?.frontmatter) {
            cycleProps = { ...cycleProps, ...cache.frontmatter };
        }
    }
}

let cycleLink = `[[${(cycle && cycle.file) ? cycle.file.name : "Cycle 5"}]]`;
let trainTxt = "Rest";
let nextTrainTxt = "Rest";
let dietTxt = "-";

if (cycle) {
    trainTxt = (cycleProps[todayName] || cycle[todayName] || "Rest").toString();
    
    const daysWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const todayIdx = daysWeek.indexOf(todayName);
    for (let i = 1; i <= 7; i++) {
        let nextDay = daysWeek[(todayIdx + i) % 7];
        let val = (cycleProps[nextDay] ?? cycle[nextDay] ?? "").toString();
        if (val && val.toLowerCase() !== "rest" && val.trim() !== "") {
            nextTrainTxt = val;
            break;
        }
    }
    const cal = cycleProps.Calories || cycle.Calories;
    const mac = cycleProps.Macros || cycle.Macros;
    const wat = cycleProps.Water || cycle.Water;
    dietTxt = `${cal ? '🔥'+cal : ''} | ${mac||''} - ${wat ? '💧'+wat : ''}`.trim();
    if (dietTxt === "|" || dietTxt === "| -" || dietTxt === "-") dietTxt = "-";
}

// 4. SOURCE & NAVEGAÇÃO HIERÁRQUICA
const currentFolder = dv.current().file.folder; 
const parts = currentFolder.split("/");
const depth = parts.length;

const sName = parts[depth - 1] || "Sprint"; 
const mName = parts[depth - 2] || "Month";
const yName = parts[depth - 3] || "Year";

const sPathV5 = `${currentFolder}/${yName}-${sName.toLowerCase()}`;
const sPath = dv.page(sPathV5) ? sPathV5 : `${currentFolder}/${sName.toLowerCase()}`;
const mPathV5 = `${parts.slice(0, -1).join("/")}/${yName}-${mName.toLowerCase().replace(/^\d+-/, "")}-${mName.split("-")[0]}`;
const mPath = dv.page(mPathV5) ? mPathV5 : `${parts.slice(0, -1).join("/")}/${mName.toLowerCase().replace(/^\d+-/, "")}-${mName.split("-")[0]}`;
const yPath = `${parts.slice(0, -2).join("/")}/${yName}-Y`;

const sLink = dv.page(sPath) ? dv.fileLink(sPath, false, sName) : (dv.current().Parent || sName);
const mLink = dv.page(mPath) ? dv.fileLink(mPath, false, mName) : mName;
const yLink = dv.page(yPath) ? dv.fileLink(yPath, false, yName) : yName;

// 🖥️ RENDERIZAÇÃO LINHAS 1 A 3 (TOPO LIMPO)
dv.span(`📁 [[Library]] | [[Cinema]] | [[Academy]] | [[Work]] | [[Studio]] | [[Life]] | ${cycleLink}<br>`);
dv.span(`**Source:** ${sLink} - ${mLink} - ${yLink}<br>`);

if (readingList) dv.span(`**Reading:** ${readingList}<br>`);
if (studyList) dv.span(`**Studying:** ${studyList}<br>`);
if (proList) dv.span(`**Projects:** ${proList}<br>`);

dv.span(`**Train:** ${trunc(trainTxt, 25)} > **Next:** ${trunc(nextTrainTxt, 25)}<br>`);
dv.span(`**Diet:** ${dietTxt}`);
dv.span("<br><br>");

// 5. METAS: SPRINT FOCUS & MONTHLY FOCUS (LINKS PUROS, ZERO PROP OU DEADLINE)
const renderGoalsFluidList = (goalsList) => {
    const list = goalsList?.array ? goalsList.array() : Array.from(goalsList || []);
    if (!list || list.length === 0) return null;
    return list.map(p => {
        const link = htmlLink(p.file.path, p.file.name);
        return `<div style="display: flex; align-items: center; width: 100%; box-sizing: border-box; overflow: hidden; white-space: nowrap; padding: 2px 0;">
<span style="flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">▪ ${link}</span>
</div>`;
    }).join("");
};

const sStart = fileMoment.clone().startOf('isoWeek');
const sEnd = fileMoment.clone().endOf('isoWeek');
const mStart = fileMoment.clone().startOf('month');
const mEnd = fileMoment.clone().endOf('month');
const sprintTag = (sName || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const sGoalsPages = allPages
    .where(p => {
        if (!isRealActive(p, "classGoal")) return false;
        if (!["sprint", "weekly"].includes(norm(p.Horizon || p.Type))) return false;
        const dead = parseMoment(p.Deadline);
        if (dead && dead.isBetween(sStart, sEnd, null, "[]")) return true;
        const tags = Array.isArray(p.tags) ? p.tags.map(t => norm(t)) : [norm(p.tags)];
        if (tags.some(t => t.includes(sprintTag))) return true;
        return false;
    })
    .sort(p => p.Priority, "desc");

const mGoalsPages = allPages
    .where(p => {
        if (!isRealActive(p, "classGoal")) return false;
        if (!["monthly", "month"].includes(norm(p.Horizon || p.Type))) return false;
        const dead = parseMoment(p.Deadline);
        if (dead && dead.isBetween(mStart, mEnd, null, "[]")) return true;
        return false;
    })
    .sort(p => p.Priority, "desc");

const sFallback = dv.page(sPath) ? htmlLink(sPath, "📝 Definir Foco da Sprint") : "Definir Foco";
const mFallback = dv.page(mPath) ? htmlLink(mPath, "🎯 Definir Foco Mensal") : "Definir Foco";

const sGoalsHtml = renderGoalsFluidList(sGoalsPages) || `<em>${sFallback}</em>`;
const mGoalsHtml = renderGoalsFluidList(mGoalsPages) || `<em>${mFallback}</em>`;

// 6. MÉTRICAS QUANTITATIVAS (Mostra todas as métricas do ano da nota, ordenadas por status)
const curYear = fileMoment.year();
const isRealMetric = (p) => {
    if (!p || !p.file) return false;
    const folder = p.file.folder || "";
    if (folder.includes("Configs") || folder.includes("Templates") || folder.includes("Archive")) return false;
    if (p.isTemplate === true || p.Type === "template" || p.Class !== "classMetric") return false;
    return true;
};

const rawMetrics = allPages
    .where(p => {
        if (!isRealMetric(p)) return false;
        const dead = parseMoment(p.Deadline);
        if (dead && dead.isValid()) {
            if (dead.year() !== curYear) return false;
        } else if (p.year && Number(p.year) !== curYear) {
            return false;
        }
        return true;
    });

const metricList = (rawMetrics?.array ? rawMetrics.array() : Array.from(rawMetrics || []))
    .sort((a, b) => {
        const getStatusRank = (st) => {
            const s = norm(st);
            if (s === "in_progress") return 0;
            if (s === "planned" || s === "backlog") return 1;
            if (s === "paused") return 2;
            if (s === "done" || s === "completed") return 3;
            if (s === "canceled") return 4;
            return 1;
        };
        const rankA = getStatusRank(getSt(a));
        const rankB = getStatusRank(getSt(b));
        if (rankA !== rankB) return rankA - rankB; // Ativas no topo, Concluídas ao fundo
        
        const prioA = Number(a.Priority) || 3;
        const prioB = Number(b.Priority) || 3;
        if (prioA !== prioB) return prioB - prioA; // Dominó ⚡ primeiro
        
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

let metricsContent = "";
if (metricList.length === 0) {
    metricsContent = "<em>Nenhuma métrica cadastrada.</em>";
} else {
    metricsContent = metricList.map(p => {
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
<span style="flex: 0 0 70px; width: 70px; white-space: nowrap; overflow: hidden; text-align: left; text-overflow: ellipsis; opacity: 0.85;">${st}</span>
${sep}
<span style="flex: 0 0 95px; width: 95px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.85; text-align: left;">${dead}</span>
</div>`;
    }).join("");
}

// MEMÓRIA GLOBAL DE ESTADO DOS ACCORDIONS (Persistência reativa entre re-renders)
if (!window.__VAULT_ACCORDION_STATE__) {
    window.__VAULT_ACCORDION_STATE__ = {};
}
const currentDailyPath = dv.current().file.path;

const renderDailyAccordion = (plainTitle, summaryLabelHtml, contentHtml, defaultOpen = false) => {
    const stateKey = `${currentDailyPath}::${plainTitle}`;
    const isOpen = (window.__VAULT_ACCORDION_STATE__[stateKey] !== undefined)
        ? window.__VAULT_ACCORDION_STATE__[stateKey]
        : defaultOpen;
    return `<details data-accordion-key="${stateKey.replace(/"/g, '&quot;')}" style="cursor: pointer; margin: 0 !important; border: none !important; outline: none !important;" ${isOpen ? "open" : ""}><summary style="padding: 6px 12px; margin: 0 !important; border-top: 1px solid var(--background-modifier-border) !important; border-bottom: none !important; background-color: rgba(128, 128, 128, 0.08); font-weight: 500; font-size: 1em; outline: none; list-style-position: inside; opacity: 0.9;">${summaryLabelHtml}</summary><div style="padding: 8px 12px; line-height: 1.5em; border-bottom: none !important; width: 100%; box-sizing: border-box; overflow: hidden;">${contentHtml}</div></details>`;
};

const metricsSummaryLabel = `📊 Métricas (${metricList.length})`;
const metricsDetails = renderDailyAccordion("Métricas", metricsSummaryLabel, metricsContent, false);

// 7. ABAS ABERTAS RECENTEMENTE
let recentPaths = [];
try {
    recentPaths = app.workspace.getLastOpenFiles();
} catch(e) {}

let validOpened = [];
if (recentPaths && recentPaths.length > 0) {
    for (let path of recentPaths) {
        if (path !== dv.current().file.path && path.endsWith('.md')) {
            let file = app.metadataCache.getFirstLinkpathDest(path, "");
            if (file) {
                const fFolder = file.path || "";
                if (!fFolder.includes("Configs") && !fFolder.includes("Templates") && !fFolder.includes("Archive")) {
                    validOpened.push(`<span>▪ ${htmlLink(file.path, file.name.replace(".md", ""))}</span>`);
                    if (validOpened.length >= 5) break;
                }
            }
        }
    }
}

let recentsHtml = "";
if (validOpened.length > 0) {
    recentsHtml = validOpened.join("<br>");
} else {
    recentsHtml = "<span><em>Nenhuma aba recente.</em></span>";
}

// 7. 📦 DAILY FOOTPRINT (RASTRO DE PRODUÇÃO E CONSUMO DE HOJE)
const startOfDay = fileMoment.clone().startOf('day');
const endOfDay = fileMoment.clone().endOf('day');
const dailyFootprint = getDailyFootprint(startOfDay, endOfDay);
const footprintRows = dailyFootprint.map(f => [f.item, f.typeBadge, f.parentLink, f.infoStr]);
const footprintHtml = renderGenericFluid(
    ["Item", "Tipo", "Parent", "Resultado / Info"],
    ["auto", "90px", "130px", "150px"],
    footprintRows,
    "Nenhuma produção ou consumo registrado hoje."
);
const footprintDetails = renderDailyAccordion("Daily Footprint", `📦 Daily Footprint (${dailyFootprint.length})`, footprintHtml, false);

// 7.1 ABAS ABERTAS RECENTEMENTE
const recentsDetails = renderDailyAccordion("Abertas Recentemente", "⚡ Abertas Recentemente", recentsHtml, false);

// 8. NOTAS FIXADAS (DINÂMICO VIA Pinned: true + FALLBACKS DO GU)
const pinnedSet = new Set();
const pinnedItems = [];

// 8.1 Busca dinâmica universal: qualquer nota real com Pinned: true no YAML
const dynamicPinned = allPages
    .where(p => {
        if (!p || !p.file) return false;
        const folder = p.file.folder || "";
        if (folder.includes("Configs") || folder.includes("Templates") || folder.includes("Archive")) return false;
        if (p.isTemplate === true || p.Type === "template") return false;
        return p.Pinned === true || p.pinned === true || p.isFixed === true || p.isfixed === true;
    });

for (let p of dynamicPinned) {
    if (!pinnedSet.has(p.file.name)) {
        pinnedSet.add(p.file.name);
        pinnedItems.push(`▪ ${htmlLink(p.file.path, p.file.name)}`);
    }
}

// 8.2 Fallbacks essenciais da rotina do Gu (mantém atalho do ciclo vigente garantido)
const activeCycleName = (cycle && cycle.file) ? cycle.file.name : "Cycle 5";
const activeCyclePath = (cycle && cycle.file) ? cycle.file.path : `Central/Personal/Cycles/${activeCycleName}.md`;
const pinnedConfigs = [
    { name: activeCycleName, target: activeCycleName, fallback: activeCyclePath },
    { name: "Axiomas de Foco", target: "Axiomas de Foco", fallback: "Central/Study/Knowledge/Axiomas de Foco.md" },
    { name: "Visionboard", target: "Visionboard.excalidraw", fallback: "Central/Studio/Swipes/Visionboard.excalidraw.md" }
];

for (let item of pinnedConfigs) {
    if (!pinnedSet.has(item.name)) {
        let file = (typeof app !== "undefined" && app?.metadataCache) 
            ? (app.metadataCache.getFirstLinkpathDest(item.target, "") || app.metadataCache.getFirstLinkpathDest(item.name, "")) 
            : null;
        let path = file ? file.path : item.fallback;
        pinnedItems.push(`▪ ${htmlLink(path, item.name)}`);
        pinnedSet.add(item.name);
    }
}

const pinnedHtml = pinnedItems.join("<br>");
const pinnedDetails = renderDailyAccordion("Notas Fixadas", "📌 Notas Fixadas", pinnedHtml, false);

// 9. TABELA FINAL EM HTML (ZERO SCROLLBAR)
// Ordem dos Dropdowns: 1. Footprint -> 2. Métricas -> 3. Fixados -> 4. Recentes
const tableContent = `<div style="border: 1px solid var(--background-modifier-border); border-radius: 6px; overflow: hidden; width: 100%; box-sizing: border-box;"><table style="width:100%; border-collapse: collapse; border: none !important; margin: 0 !important; table-layout: fixed;"><tr style="background-color: var(--background-secondary);"><th style="text-align:left; width:50%; padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border) !important;">Sprint Focus</th><th style="text-align:left; width:50%; padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border) !important;">Monthly Focus</th></tr><tr><td style="vertical-align:top; padding: 8px 12px; border-right: 1px solid var(--background-modifier-border) !important; border-bottom: none !important; overflow: hidden;">${sGoalsHtml}</td><td style="vertical-align:top; padding: 8px 12px; border-bottom: none !important; overflow: hidden;">${mGoalsHtml}</td></tr></table>${footprintDetails}${metricsDetails}${pinnedDetails}${recentsDetails}</div>`;

dv.el("div", tableContent);

// 10. TRACKER DE ACCORDIONS E LINK HANDLER EM NOVA ABA
const setupAccordionTracker = (el) => {
    if (!el || typeof el.addEventListener !== "function") return;
    if (el._dailyAccordionTracker) {
        el.removeEventListener("toggle", el._dailyAccordionTracker, true);
    }
    el._dailyAccordionTracker = (evt) => {
        const details = evt.target?.closest ? evt.target.closest("details") : (evt.target?.tagName === "DETAILS" ? evt.target : null);
        if (details) {
            const key = details.getAttribute("data-accordion-key");
            if (key) {
                if (!window.__VAULT_ACCORDION_STATE__) window.__VAULT_ACCORDION_STATE__ = {};
                window.__VAULT_ACCORDION_STATE__[key] = details.open;
            }
        }
    };
    el.addEventListener("toggle", el._dailyAccordionTracker, true);

    if (el._dailyAccordionClickHandler) {
        el.removeEventListener("click", el._dailyAccordionClickHandler, true);
    }
    el._dailyAccordionClickHandler = (evt) => {
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
    el.addEventListener("click", el._dailyAccordionClickHandler, true);
};

const setupLinkHandler = (el) => {
    if (!el) return;
    if (el._dailyTabLinkHandler) {
        el.removeEventListener("click", el._dailyTabLinkHandler, true);
    }
    el._dailyTabLinkHandler = (evt) => {
        const link = evt.target.closest("a.internal-link");
        if (link) {
            const href = link.getAttribute("data-href") || link.getAttribute("href");
            if (href) {
                evt.preventDefault();
                evt.stopImmediatePropagation();
                if (typeof app !== "undefined" && app?.workspace?.openLinkText) {
                    app.workspace.openLinkText(href, currentDailyPath, "tab");
                }
            }
        }
    };
    el.addEventListener("click", el._dailyTabLinkHandler, true);
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
