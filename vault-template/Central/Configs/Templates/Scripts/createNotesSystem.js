module.exports = async function (tp) {
  const nowMs = Date.now();
  if (window.__CNS_RUNNING__ && (nowMs - (window.__CNS_LAST_RUN__ || 0) < 5000)) {
    console.warn("[CNS] Já está rodando. Abortando nova execução.");
    return;
  }
  window.__CNS_RUNNING__ = true;
  window.__CNS_LAST_RUN__ = nowMs;

  try {
    const vault = app.vault;
    const fm = app.fileManager;
    const m = window.moment;

    try {
      const fs = require("fs"), path = require("path");
      const basePath = (app.vault.adapter && typeof app.vault.adapter.getBasePath === "function") 
        ? app.vault.adapter.getBasePath() 
        : (app.vault.adapter?.basePath || app.vault.adapter?.path || "");
      if (basePath) {
        const mp = path.join(basePath, ".obsidian", "historical_ctime_map.json");
        if (fs.existsSync(mp)) {
          window.__HIST_CTIME_MAP__ = JSON.parse(fs.readFileSync(mp, "utf8"));
          for (const f of vault.getFiles()) {
            const entry = window.__HIST_CTIME_MAP__[f.path];
            if (entry && entry[0]) f.stat.ctime = entry[0];
            else if (f.stat.mtime && f.stat.mtime < f.stat.ctime) f.stat.ctime = f.stat.mtime;
          }
        }
      }
    } catch (e) {
      console.error("[CNS] Erro ao restaurar historical_ctime_map:", e);
    }

    const BASE_ROOT = "Central/Personal/Journal";
    const TEMPLATES = "Central/Configs/Templates";
    const BAD_ROOT_NAMES = ["Zettels", "Zettels (Pool)", "Zettel"];

    // 1. Limpeza de conflitos de sync
    try {
      const conflictFiles = vault.getFiles().filter(f => f.name.includes("sync-conflict"));
      if (conflictFiles.length > 0) {
        for (let file of conflictFiles) {
          try {
            await vault.trash(file, false); 
          } catch (e) {
            console.error(`[CNS] Erro ao excluir conflito ${file.name}:`, e);
          }
        }
      }
    } catch (e) {
      console.error("[CNS] Erro na rotina de limpeza de conflitos:", e);
    }

    async function ensureFolder(path) {
      if (vault.getAbstractFileByPath(path)) return;
      const parts = path.split("/");
      let acc = "";
      for (const seg of parts) {
        acc = acc ? `${acc}/${seg}` : seg;
        if (!vault.getAbstractFileByPath(acc)) {
          try {
            await vault.createFolder(acc);
          } catch (e) {
            console.warn(`[CNS] Pasta já existe ou erro ao criar: ${acc}`);
          }
        }
      }
    }

    async function ensureNote(targetPath, templateName, fallbackContent) {
      const targetFile = vault.getAbstractFileByPath(targetPath);
      if (targetFile) return targetFile; 

      const basename = targetPath.split("/").pop().replace(".md", "");
      const folderPath = targetPath.split("/").slice(0, -1).join("/");
      await ensureFolder(folderPath);

      const allFilesWithSameName = vault.getFiles().filter(f => f.name === basename + ".md");
      
      const lostFile = allFilesWithSameName.find(f => {
          const rootFolder = f.path.split("/")[0];
          return !f.path.includes("/") || BAD_ROOT_NAMES.includes(rootFolder);
      });

      if (lostFile) {
          await fm.renameFile(lostFile, targetPath);
          return lostFile;
      }

      const templateFile = vault.getAbstractFileByPath(`${TEMPLATES}/${templateName}`);
      let targetFolder = vault.getAbstractFileByPath(folderPath);

      let newFile;
      if (templateFile && tp && tp.file && typeof tp.file.create_new === "function") {
        try {
          if (!targetFolder) targetFolder = vault.getRoot();
          newFile = await tp.file.create_new(templateFile, basename, false, targetFolder);
        } catch (e) {
          console.warn(`[CNS] tp.file.create_new falhou para ${targetPath}, usando fallback direto:`, e);
          newFile = await vault.create(targetPath, fallbackContent);
        }
      } else {
        newFile = await vault.create(targetPath, fallbackContent);
      }
      return newFile;
    }

    // REGRA DA ÂNCORA DE SPRINT (SEGUNDA A DOMINGO - ISO WEEK)
    const now = m();
    const sprintAnchor = now.clone().startOf("isoWeek"); // Segunda-Feira 00:00:00
    const YEAR = sprintAnchor.format("YYYY");
    const MM = sprintAnchor.format("MM");
    const MONTH_NAME = sprintAnchor.clone().locale("en").format("MMMM");
    const MONTH_NAME_L = MONTH_NAME.toLowerCase();
    const sprintNum = String(sprintAnchor.isoWeek()).padStart(2, "0");

    const YEAR_DIR = `${BASE_ROOT}/${YEAR}`;
    const YEAR_MD = `${YEAR_DIR}/${YEAR}-Y.md`;

    const MONTH_DIR = `${YEAR_DIR}/${MM}-${MONTH_NAME}`;
    const MONTH_MD = `${MONTH_DIR}/${MONTH_NAME_L}-${MM}.md`;

    const SPRINT_DIR = `${MONTH_DIR}/Sprint-${sprintNum}`;
    const SPRINT_MD = `${SPRINT_DIR}/sprint-${sprintNum}.md`;

    const DAILY_BASENAME = now.format("DD-MM-YYYY");
    const DAILY_MD = `${SPRINT_DIR}/${DAILY_BASENAME}.md`;

    const nowFormatted = now.format("DD-MM-YYYY HH:mm");

    const FALLBACK = {
      annual: `---\nClass: classHub\ncollection: annual\nParent: "[[Life]]"\nPinned: false\nyear: ${YEAR}\nmonth_id: ""\nsprint_id: ""\nCreated: ${nowFormatted}\nUpdated: ${nowFormatted}\nArea: Personal\ntags:\n  - journal/annual\nAliases: []\n---\n📁 **Source:** \`=this.file.name\` | **Parent:** \`=this.Parent\`\n\n\n---\n\n\n**Thesis:**\n\n\n**Consolidation:**\n\n\n---\n\n\n\`\`\`dataviewjs\nawait dv.view("Central/Configs/Scripts/views_relacionais", { mode: "annual" });\n\`\`\`\n`,
      monthly: `---\nClass: classHub\ncollection: month\nParent: "[[${YEAR}-Y]]"\nPinned: false\nyear: ${YEAR}\nmonth_id: "${YEAR}-${MM}"\nsprint_id: ""\nCreated: ${nowFormatted}\nUpdated: ${nowFormatted}\nArea: Personal\ntags:\n  - journal/monthly\nAliases: []\n---\n📁 **Source:** \`=this.file.name\` | **Parent:** \`=this.Parent\`\n\n\n---\n\n\n**Thesis:**\n\n\n**Consolidation:**\n\n\n---\n\n\n\`\`\`dataviewjs\nawait dv.view("Central/Configs/Scripts/views_relacionais", { mode: "monthly" });\n\`\`\`\n`,
      sprint: `---\nClass: classHub\ncollection: sprint\nParent: "[[${MONTH_NAME_L}-${MM}]]"\nPinned: false\nyear: ${YEAR}\nmonth_id: "${YEAR}-${MM}"\nsprint_id: "Sprint-${sprintNum}"\nCreated: ${nowFormatted}\nUpdated: ${nowFormatted}\nArea: Personal\ntags:\n  - journal/sprint\nAliases:\n  - Sprint-${sprintNum}\n---\n\n📁 **Source:** \`=this.file.name\` | **Parent:** \`=this.Parent\`\n- [[${sprintAnchor.clone().format("DD-MM-YYYY")}]]\n- [[${sprintAnchor.clone().add(1, 'days').format("DD-MM-YYYY")}]]\n- [[${sprintAnchor.clone().add(2, 'days').format("DD-MM-YYYY")}]]\n- [[${sprintAnchor.clone().add(3, 'days').format("DD-MM-YYYY")}]]\n- [[${sprintAnchor.clone().add(4, 'days').format("DD-MM-YYYY")}]]\n- [[${sprintAnchor.clone().add(5, 'days').format("DD-MM-YYYY")}]]\n- [[${sprintAnchor.clone().add(6, 'days').format("DD-MM-YYYY")}]]\n\n---\n\n**Thesis:**\n\n\n**Consolidation:**\n\n\n---\n\n\`\`\`dataviewjs\nawait dv.view("Central/Configs/Scripts/views_relacionais", { mode: "sprint" });\n\`\`\`\n\n---\n🔗 Aliases: \`=this.Aliases\`\n🏷️ Tags: \`=this.tags\`\n🧭 Parent: \`=this.Parent\`\n⚙️ Created at: \`=this.Created\`\n🔄 Last Update: \`=this.Updated\`\n📁 Note Area: \`=this.Area\`\n`,
      daily: `---\nClass: classDaily\nParent: "[[sprint-${sprintNum}]]"\nPinned: false\ntags:\n  - daily\ndate: ${now.format("YYYY-MM-DD")}\nday_of_week: ${now.isoWeekday()}\nseason: spring\nday_type: normal\nCreated: ${nowFormatted}\nUpdated: ${nowFormatted}\nArea: Personal\nAliases: []\n---\n\`\`\`dataviewjs\nawait dv.view("Central/Configs/Scripts/hud_daily");\n\`\`\`\n\n---\n\n<u>Write away:</u> \n\n---\n\n**Resumo cronologico do dia (AI):**\n\n---\n\n🔗 Aliases: \`=this.Aliases\`\n🏷️ Tags: \`=this.tags\`\n🧭 Parent: \`=this.Parent\`\n⚙️ Created at: \`=this.Created\`\n🔄 Last Update: \`=this.Updated\`\n📁 Note Area: \`=this.Area\`\n`,
    };

    await ensureNote(YEAR_MD, "Annual.md", FALLBACK.annual);
    await ensureNote(MONTH_MD, "Monthly.md", FALLBACK.monthly);
    await ensureNote(SPRINT_MD, "Sprint.md", FALLBACK.sprint);
    const dailyFile = await ensureNote(DAILY_MD, "Daily.md", FALLBACK.daily);

    if (dailyFile) {
        if (!app.workspace.layoutReady) {
            await new Promise((resolve) => app.workspace.onLayoutReady(() => resolve()));
        }
        
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // 1. Verifica se a nota do dia já está aberta em alguma aba
        let existingLeaf = null;
        app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view?.file?.path === dailyFile.path) {
                existingLeaf = leaf;
            }
        });

        if (existingLeaf) {
            app.workspace.setActiveLeaf(existingLeaf, { focus: true });
        } else {
            // 2. Se não está aberta, procura uma folha vazia, reutiliza a ativa ou abre nova aba
            let targetLeaf = null;
            app.workspace.iterateAllLeaves((leaf) => {
                if (!targetLeaf && leaf.view?.getViewType?.() === "empty") {
                    targetLeaf = leaf;
                }
            });

            if (!targetLeaf) {
                targetLeaf = app.workspace.getLeaf(false) || app.workspace.getLeaf("tab") || app.workspace.getLeaf(true);
            }

            if (targetLeaf) {
                await targetLeaf.openFile(dailyFile, { active: true });
                app.workspace.setActiveLeaf(targetLeaf, { focus: true });
            }
        }
    }
    
  } catch (err) {
    console.error("❌ createNotesSystem erro geral:", err);
  } finally {
    window.__CNS_RUNNING__ = false;
  }
};
