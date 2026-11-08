---
Class: <% 'classSubject' %>
Parent: ""
Pinned: false
Status: <% 'in_progress' %>
inertia_ttl: 7
Completed_At: ""
Difficulty: 3
Mastery: 1
NotebookLM: ""
Anki_Deck: ""
Canvas: ""
Created: 19-11-2025 11:32
Updated: 19-11-2025 11:32
Area: Study
tags:
  - study/subject
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`


---


**Subject Note:**


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "subject" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
