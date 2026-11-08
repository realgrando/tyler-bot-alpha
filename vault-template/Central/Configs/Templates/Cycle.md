---
Class: <% 'classCycle' %>
Parent: "[[Life]]"
Pinned: false
Current: false
Start: <% tp.date.now("DD-MM-YYYY") %>
End: ""
Target: "1h de oração | 1h de estudos | 1h de exercícios"
Monday: "Push + Boxe"
Tuesday: "Pull"
Wednesday: "Legs"
Thursday: "Upper + Boxe"
Friday: "Lower"
Saturday: "Active Rest"
Sunday: "Rest"
Calories: 2600
Macros: "180g P | 300g C | 70g F"
Water: "3.5L"
Sleep_Window: "22:30 - 06:00"
Created: 30-09-2026 20:02
Updated: 30-09-2026 20:02
Area: Personal
tags:
  - personal/cycle
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "cycle" });
```


---


**Cycle Note:**


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
