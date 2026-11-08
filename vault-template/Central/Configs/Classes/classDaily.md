---
fields:
- name: date
  type: Input
  options: {}
  path: ''
  id: 5fc732
- name: day_of_week
  type: Number
  options:
    min: 1
    max: 7
  path: ''
  id: 74a501
- name: season
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': summer
      '2': autumn
      '3': winter
      '4': spring
  path: ''
  id: 3f1b03
- name: day_type
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': normal
      '2': deep_work
      '3': sprint
      '4': off_rest
      '5': off_sick
      '6': off_inertia
  path: ''
  id: 1db494
- name: env_weather
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': sun
      '2': cloudy
      '3': rain
      '4': storm
      '5': fog
      '6': clear
      '7': partly_cloudy
      '8': overcast
      '9': drizzle
      '10': heavy_rain
  path: ''
  id: 146e42
- name: env_temp_min
  type: Number
  options:
    step: 0.1
  path: ''
  id: bcd828
- name: env_temp_max
  type: Number
  options:
    step: 0.1
  path: ''
  id: 43b213
- name: env_humidity_avg
  type: Number
  options:
    min: 0
    max: 100
  path: ''
  id: b58d9a
- name: env_pressure_delta
  type: Number
  options:
    step: 0.1
  path: ''
  id: 1bf5be
- name: env_aqi_pollen
  type: Number
  options: {}
  path: ''
  id: 3b15ee
- name: env_daylight_h
  type: Number
  options:
    step: 0.1
  path: ''
  id: '214957'
- name: env_work_alone
  type: Boolean
  options: {}
  path: ''
  id: c89106
- name: env_social_exposure
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 8e2e40
- name: bio_bed_time
  type: Time
  options:
    dateShiftInterval: 1 hour
    dateFormat: HH:mm
    defaultInsertAsLink: false
    linkPath: ''
  path: ''
  id: 1626dc
- name: bio_wake_time
  type: Time
  options:
    dateShiftInterval: 1 hour
    dateFormat: HH:mm
    defaultInsertAsLink: false
    linkPath: ''
  path: ''
  id: 2c3090
- name: bio_sleep_hours
  type: Number
  options:
    step: 0.1
  path: ''
  id: 9efcfd
- name: bio_sleep_quality
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 97c2f8
- name: bio_sleep_inertia
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: '794348'
- name: bio_sleep_interruptions
  type: Number
  options:
    min: 0
  path: ''
  id: ab12ac
- name: bio_crash_time
  type: Time
  options:
    dateShiftInterval: 1 hour
    dateFormat: HH:mm
    defaultInsertAsLink: false
    linkPath: ''
  path: ''
  id: 6a3f12
- name: bio_last_meal_time
  type: Time
  options:
    dateShiftInterval: 1 hour
    dateFormat: HH:mm
    defaultInsertAsLink: false
    linkPath: ''
  path: ''
  id: c90bb9
- name: bio_weight
  type: Number
  options:
    step: 0.1
  path: ''
  id: 7b194f
- name: bio_training_type
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': none
      '2': push
      '3': pull
      '4': legs
      '5': upper
      '6': lower
      '7': boxing
      '8': cardio
      '9': mobility
      '10': active_recovery
  path: ''
  id: 948f8c
- name: bio_training_load
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: b0c4dc
- name: bio_skin_barrier
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 1c350e
- name: bio_gut_state
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 4859c1
- name: bio_discomfort
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: fb79ed
- name: bio_symptoms
  type: Input
  options: {}
  path: ''
  id: b59acb
- name: bio_caffeine_doses
  type: Number
  options: {}
  path: ''
  id: 2a6178
- name: bio_late_caffeine
  type: Boolean
  options: {}
  path: ''
  id: 28e54a
- name: bio_alcohol
  type: Boolean
  options: {}
  path: ''
  id: 64cc1d
- name: bio_meds_taken
  type: Input
  options: {}
  path: ''
  id: 17cadb
- name: exec_deep_work_h
  type: Number
  options:
    step: 0.1
  path: ''
  id: 6f6e1e
- name: exec_screen_time_h
  type: Number
  options:
    step: 0.1
  path: ''
  id: fa27af
- name: exec_work_mode
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': maker
      '2': manager
      '3': hybrid
  path: ''
  id: 8d6e65
- name: exec_focus_areas
  type: Input
  options: {}
  path: ''
  id: 9e6c0e
- name: exec_cognitive_load
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 6de37b
- name: exec_flow_state
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 0cf74d
- name: exec_fragmentation
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 07cb11
- name: exec_external_friction
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 00de94
- name: exec_procrastination
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 2e4035
- name: exec_batching_kept
  type: Boolean
  options: {}
  path: ''
  id: a997ed
- name: exec_shipped
  type: Boolean
  options: {}
  path: ''
  id: 59f208
- name: exec_leverage
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: e71c42
- name: poly_domains
  type: Input
  options: {}
  path: ''
  id: 5eae88
- name: poly_modalities
  type: Input
  options: {}
  path: ''
  id: a3d3be
- name: poly_mode
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': explore
      '2': exploit
      '3': hybrid
  path: ''
  id: 90fee7
- name: poly_depth
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': none
      '2': consumption
      '3': practice
      '4': creation
  path: ''
  id: c74ea6
- name: poly_cross_pollination
  type: Boolean
  options: {}
  path: ''
  id: d30f16
- name: poly_hyperfocus_pull
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 154f5b
- name: poly_shadow_friction
  type: Input
  options: {}
  path: ''
  id: 259a9f
- name: cog_day_rating
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: bc450d
- name: cog_mood
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: f2cd93
- name: cog_energy
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 759ed4
- name: cog_drive
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 1981be
- name: cog_drive_source
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': mastery
      '2': reward
      '3': validation
      '4': duty
  path: ''
  id: 1504be
- name: cog_competence
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: a15811
- name: cog_confidence
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 9b1368
- name: cog_clarity
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: '063777'
- name: cog_ram_load
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 2b0e38
- name: cog_autonomy
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: f9e927
- name: cog_temperance
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 3db922
- name: cog_craving
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 7a9c1e
- name: cog_anxiety
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 82dfc8
- name: cog_rumination
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: c8bbad
- name: cog_validation_hunger
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 4d25d2
- name: cog_stress_source
  type: Input
  options: {}
  path: ''
  id: '361119'
- name: cog_social_battery
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 1db58e
- name: cog_hunger
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 5b8c32
- name: cog_libido
  type: Number
  options:
    min: 1
    max: 5
  path: ''
  id: 8b02b6
- name: h_clean_diet
  type: Boolean
  options: {}
  path: ''
  id: 629ad1
- name: h_nutrition_goal
  type: Boolean
  options: {}
  path: ''
  id: 062e8f
- name: h_water_goal
  type: Boolean
  options: {}
  path: ''
  id: 98696c
- name: h_creatine
  type: Boolean
  options: {}
  path: ''
  id: 735a5e
- name: h_sunlight_am
  type: Boolean
  options: {}
  path: ''
  id: 41a27e
- name: h_clean_qg
  type: Boolean
  options: {}
  path: ''
  id: 1ffdbe
- name: h_spiritual_anchor
  type: Boolean
  options: {}
  path: ''
  id: b97c21
- name: h_wind_down
  type: Boolean
  options: {}
  path: ''
  id: 4caca6
- name: bh_cheap_dopamine
  type: Number
  options:
    min: 0
    max: 5
  path: ''
  id: 9fb3ec
- name: bh_shiny_object
  type: Boolean
  options: {}
  path: ''
  id: 2e21db
- name: bh_temperance_breach
  type: Input
  options: {}
  path: ''
  id: 6740b2
- name: ctx_entities
  type: Input
  options: {}
  path: ''
  id: 5fcf6f
- name: ctx_bio_log
  type: Input
  options: {}
  path: ''
  id: '935547'
- name: ctx_exec_log
  type: Input
  options: {}
  path: ''
  id: 900a30
- name: ctx_poly_log
  type: Input
  options: {}
  path: ''
  id: 044a1a
- name: ctx_psy_log
  type: Input
  options: {}
  path: ''
  id: 865c2d
version: '2.53'
limit: 20
mapWithTag: false
icon: package
tagNames: null
filesPaths: null
bookmarksGroups: null
excludes: null
extends: classBase
savedViews: []
favoriteView: null
fieldsOrder:
- 5fc732
- 74a501
- 3f1b03
- 1db494
- 146e42
- bcd828
- 43b213
- b58d9a
- 1bf5be
- 3b15ee
- '214957'
- c89106
- 8e2e40
- 1626dc
- 2c3090
- 9efcfd
- 97c2f8
- '794348'
- ab12ac
- c90bb9
- 7b194f
- 948f8c
- b0c4dc
- 1c350e
- 4859c1
- fb79ed
- b59acb
- 2a6178
- 28e54a
- 64cc1d
- 17cadb
- 6f6e1e
- fa27af
- 8d6e65
- 9e6c0e
- 6de37b
- 0cf74d
- 07cb11
- 00de94
- 2e4035
- a997ed
- 59f208
- e71c42
- 5eae88
- a3d3be
- 90fee7
- c74ea6
- d30f16
- 154f5b
- 259a9f
- bc450d
- f2cd93
- 759ed4
- 1981be
- 1504be
- a15811
- 9b1368
- '063777'
- 2b0e38
- f9e927
- 3db922
- 7a9c1e
- 82dfc8
- c8bbad
- 4d25d2
- '361119'
- 1db58e
- 5b8c32
- 8b02b6
- 629ad1
- 062e8f
- 98696c
- 735a5e
- 41a27e
- 1ffdbe
- b97c21
- 4caca6
- 9fb3ec
- 2e21db
- 6740b2
- 5fcf6f
- '935547'
- 900a30
- 044a1a
- 865c2d
---
