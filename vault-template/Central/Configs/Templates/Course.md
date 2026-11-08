---
Class: <% 'classCourse' %>
Parent: ""
Pinned: false
Track: polymath
Status: <% 'in_progress' %>
inertia_ttl: 5
Author: ""
Platform: ""
NotebookLM: ""
Difficulty: 3
Current: 0
Target: 10
Unit: lessons
Progress: 0
Rating: ""
Canvas: ""
Anki_Deck: ""
Completed_At: ""
Created: 20-11-2025 15:44
Updated: 20-11-2025 15:44
Area: Study
tags:
  - study/course
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`
```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "progress" });
```


---


**Course Note:**


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "course" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
