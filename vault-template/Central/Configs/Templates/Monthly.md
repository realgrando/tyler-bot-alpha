---
Class: <% 'classHub' %>
collection: month
Parent: "[[<% tp.date.now('YYYY') %>-Y]]"
Pinned: false
year: <% tp.date.now("YYYY") %>
month_id: "<% tp.date.now('YYYY-MM') %>"
sprint_id: ""
Created: 30-09-2026 19:21
Updated: 30-09-2026 19:21
Area: Personal
tags:
  - journal/monthly
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`
<%*
let mDate = moment();
let firstMonday = mDate.clone().startOf('month').startOf('isoWeek');
if (firstMonday.month() !== mDate.month() && firstMonday.clone().add(6, 'days').month() !== mDate.month()) {
  firstMonday.add(1, 'weeks');
}
let sprints = [];
let curr = firstMonday.clone();
while (curr.month() === mDate.month() || curr.clone().startOf('isoWeek').month() === mDate.month()) {
  let sNum = String(curr.isoWeek()).padStart(2, '0');
  sprints.push('- [[sprint-' + sNum + ']]');
  curr.add(1, 'weeks');
  if (curr.diff(firstMonday, 'weeks') > 5) break;
}
tR += sprints.join('\n');
%>


---


**Thesis:**


**Consolidation:**


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "monthly" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
