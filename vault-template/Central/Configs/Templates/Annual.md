---
Class: <% 'classHub' %>
collection: annual
Parent: "[[Life]]"
Pinned: false
year: <% tp.date.now("YYYY") %>
month_id: ""
sprint_id: ""
Created: 30-09-2026 19:58
Updated: 30-09-2026 19:58
Area: Personal
tags:
  - journal/annual
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`
- [[january-01]]
- [[february-02]]
- [[march-03]]
- [[april-04]]
- [[may-05]]
- [[june-06]]
- [[july-07]]
- [[august-08]]
- [[september-09]]
- [[october-10]]
- [[november-11]]
- [[december-12]]


---


**Thesis:**


**Consolidation:**


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "annual" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
