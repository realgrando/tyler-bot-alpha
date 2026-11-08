---
Class: classMovie
Parent: "[[Cinema]]"
Director: "[[Denis Villeneuve]]"
Release_Year: 2017
Rating: 5
Status: done
Watched: true
Genres:
  - Sci-Fi
  - Drama
Poster: ""
Pinned: false
Area: Study
Created: 08-11-2026 17:54
Updated: 08-11-2026 17:54
tags:
  - movie
  - cinema
Aliases: []
---

📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`

---

**Movie Note:**
Obra-prima audiovisual que explora identidade, memória e humanidade através de atmosfera hipnótica e rigor estético.

---

```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "movie" });
```

---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
