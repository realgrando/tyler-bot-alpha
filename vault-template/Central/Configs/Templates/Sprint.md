---
Class: <% 'classHub' %>
collection: sprint
Parent: "[[<% tp.date.now('MMMM-MM').toLowerCase() %>]]"
Pinned: false
year: <% tp.date.now("YYYY") %>
month_id: "<% tp.date.now('YYYY-MM') %>"
sprint_id: "Sprint-<% tp.date.now('WW') %>"
Created: 30-09-2026 19:58
Updated: 30-09-2026 19:58
Area: Personal
tags:
  - journal/sprint
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`
<%*
let start = moment().startOf('isoWeek');
let days = [];
for (let i = 0; i < 7; i++) {
  days.push('- [[' + start.clone().add(i, 'days').format('DD-MM-YYYY') + ']]');
}
tR += days.join('\n');
%>


---


**Thesis:**


**Consolidation:**


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "sprint" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
