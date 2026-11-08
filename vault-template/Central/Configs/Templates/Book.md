---
Class: <% 'classBook' %>
Parent: ""
Pinned: false
Status: <% 'in_progress' %>
inertia_ttl: 7
Author: "[[{{author}}]]"
Format: physical
Difficulty: 3
Current: 0
Target: {{totalPage}}
Unit: pages
Progress: 0
Rating: ""
Cover: "{{coverUrl}}"
Canvas: ""
Completed_At: ""
Created: 11-11-2025 10:26
Updated: 11-11-2025 10:26
Area: Study
tags:
  - study/book
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`
```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "progress" });
```


---


**Book Note:**


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "book" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
