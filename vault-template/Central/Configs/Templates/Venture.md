---
Class: <% 'classVenture' %>
Parent: "[[Work]]"
Pinned: false
Status: <% 'in_progress' %>
inertia_ttl: 7
Completed_At: ""
Priority: 3
Market: ""
Role: ""
URL: ""
NotebookLM: ""
Canvas: ""
Created: 04-11-2026 21:23
Updated: 04-11-2026 21:23
Area: Professional
tags:
  - pro/venture
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`


---


**Venture Note:**
<% tp.file.cursor(1) %>


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "venture" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
