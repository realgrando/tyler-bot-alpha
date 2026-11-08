---
Class: <% 'classDaily' %>
Parent: "<%* 
  let mDate = moment(tp.file.title, 'DD-MM-YYYY');
  if (!mDate.isValid()) mDate = moment();
  let sNum = String(mDate.clone().startOf('isoWeek').isoWeek()).padStart(2, '0');
  tR += '[[' + 'sprint-' + sNum + ']]';
%>"
Pinned: false
date: <% tp.date.now("YYYY-MM-DD") %>
day_of_week: <% tp.date.now("E") %>
season: spring
day_type: normal

# 1. AMBIENTE & EXÓGENO (env_)
env_weather:
env_temp_min:
env_temp_max:
env_humidity_avg:
env_pressure_delta:
env_aqi_pollen:
env_daylight_h:
env_work_alone:
env_social_exposure:

# 2. BIOLOGIA, FISIOLOGIA & SONO (bio_)
bio_bed_time:
bio_wake_time:
bio_sleep_hours:
bio_sleep_quality:
bio_sleep_inertia:
bio_sleep_interruptions:
bio_crash_time:
bio_last_meal_time:
bio_weight:
bio_training_type:
bio_training_load:
bio_skin_barrier:
bio_gut_state:
bio_discomfort:
bio_symptoms: []
bio_caffeine_doses:
bio_late_caffeine:
bio_alcohol:
bio_meds_taken: []

# 3. EXECUÇÃO, ENGENHARIA & TRABALHO (exec_)
exec_deep_work_h:
exec_screen_time_h:
exec_work_mode:
exec_focus_areas: []
exec_cognitive_load:
exec_flow_state:
exec_fragmentation:
exec_external_friction:
exec_procrastination:
exec_batching_kept:
exec_shipped:
exec_leverage:

# 4. SÍNTESE POLÍMATA & REPERTÓRIO (poly_)
poly_domains: []
poly_modalities: []
poly_mode:
poly_depth:
poly_cross_pollination:
poly_hyperfocus_pull:
poly_shadow_friction: []

# 5. PSICOLOGIA, TEMPERANÇA & AFETO (cog_)
cog_day_rating:
cog_mood:
cog_energy:
cog_drive:
cog_drive_source:
cog_competence:
cog_confidence:
cog_clarity:
cog_ram_load:
cog_autonomy:
cog_temperance:
cog_craving:
cog_anxiety:
cog_rumination:
cog_validation_hunger:
cog_stress_source: []
cog_social_battery:
cog_hunger:
cog_libido:

# 6. HÁBITOS & ENTROPIA COMPORTAMENTAL (h_ / bh_)
h_clean_diet:
h_nutrition_goal:
h_water_goal:
h_creatine:
h_sunlight_am:
h_clean_qg:
h_spiritual_anchor:
h_wind_down:
bh_cheap_dopamine:
bh_shiny_object:
bh_temperance_breach: []

# 7. CAMADA SEMÂNTICA & GRAFO (ctx_)
ctx_entities: []
ctx_bio_log: ""
ctx_exec_log: ""
ctx_poly_log: ""
ctx_psy_log: ""

# METADADOS DE CONTROLE (classBase)
Created: <% tp.date.now("DD-MM-YYYY HH:mm") %>
Updated: <% tp.date.now("DD-MM-YYYY HH:mm") %>
Area: Personal
tags:
  - daily
Aliases: []
---
```dataviewjs
await dv.view("Central/Configs/Scripts/hud_daily");
```


---

<u>Write away:</u> 

---

**Resumo cronologico do dia (AI):**

---
🔗 Aliases: `=this.Aliases`
🏷️ Tags: `=this.tags`
🧭 Parent: `=this.Parent`
⚙️ Created at: `=this.Created`
🔄 Last Update: `=this.Updated`
📁 Note Area: `=this.Area`
