---
Class: <% 'classMovie' %>
Parent: "[[Cinema]]"
Pinned: false
Director: "[[{{director}}]]"
Status: <% 'done' %>
Release_Year: {{release_date}}
Rating: 5
Watched: <% tp.date.now("DD-MM-YYYY") %>
Genres: {{genres}}
Poster: "{{poster_path}}"
Main_Cast: {{main_actors}}
Overview: "{{overview}}"
Trailer: "{{youtube_url}}"
Created: 17-11-2025 09:36
Updated: 16-04-2026 11:47
Area: Study
tags:
  - study/movie
Aliases: []
---
📁 **Source:** `=this.file.name` | **Parent:** `=this.Parent`


---


**Movie Note:**


---


```dataviewjs
await dv.view("Central/Configs/Scripts/views_relacionais", { mode: "movie" });
```


---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
