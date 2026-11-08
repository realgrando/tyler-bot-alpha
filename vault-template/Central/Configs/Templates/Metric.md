---
Class: <% 'classMetric' %>
Parent: ""
Pinned: false
Metric_Type: lag
Cadence: annual
Pillar: Professional
Current: 0
Target: 100
Unit: ""
Progress: 0
Deadline: 31-12-<% tp.date.now("YYYY") %>
Status: <% 'in_progress' %>
inertia_ttl: 14
Completed_At: ""
Created: 09-11-2025 20:55
Updated: 09-11-2025 20:55
Area: Personal
tags:
  - metric
  - annual
  - lag
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent` | **Sensor:** `=this.Metric_Type` (`=this.Cadence`)


---


**Metric Note:**
<% tp.file.cursor(1) %>


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
