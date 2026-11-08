---
Class: <% 'classGoal' %>
Parent: ""
Pinned: false
Horizon: sprint
Pillar: Professional
Priority: 3
Difficulty: 3
Current: 0
Target: 1
Unit: entregas
Progress: 0
Deadline: <% tp.date.now("DD-MM-YYYY", 7) %>
Status: <% 'in_progress' %>
inertia_ttl: 3
Completed_At: ""
Created: 30-09-2026 19:58
Updated: 30-09-2026 19:58
Area: Personal
tags:
  - goal
  - sprint
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`


---


**Goal Note:**
<% tp.file.cursor(1) %>


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "goal" });
```


---


**Timeline:**
- [<% tp.date.now("DD-MM-YYYY") %>] Abertura e início da meta.


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
