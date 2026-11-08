---
Class: <% 'classProject' %>
Parent: ""
Subtype: product
Version: "v1.0"
Pinned: false
Status: <% 'in_progress' %>
inertia_ttl: 5
Priority: 3
Deadline: ""
Completed_At: ""
Repo: ""
URL: ""
Canvas: ""
NotebookLM: ""
Created: 30-09-2026 19:58
Updated: 30-09-2026 19:58
Area: Professional
tags:
  - pro/project
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`


---


**Project Note:**
<% tp.file.cursor(1) %>


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "project" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
