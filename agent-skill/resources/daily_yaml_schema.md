# SCHEMA OFICIAL DA DAILY NOTE (classDaily v5.0)

A Daily Note é o gravador de voo único do Life OS. Ela contém **85 campos padronizados** divididos em **7 eixos ortogonais**, garantindo telemetria completa, correlações estatísticas lag-1 e zero ambiguidade.

---

## 1. AMBIENTE & EXÓGENO (`env_`)
- `env_weather: Select` (`clear | cloudy | rainy | drizzle | stormy | foggy | snow`)
- `env_temp_min: Number` (Temperatura mínima em °C)
- `env_temp_max: Number` (Temperatura máxima em °C)
- `env_humidity_avg: Number` (Umidade relativa média em %)
- `env_pressure_delta: Number` (Variação de pressão barométrica em 24h em hPa — biomarcador exógeno de cefaleia e fadiga)
- `env_aqi_pollen: Number` (Qualidade do ar / índice de pólen)
- `env_daylight_h: Number` (Horas de luz solar no dia)
- `env_work_alone: Boolean` (Trabalhou isolado no dia?)
- `env_social_exposure: Number (1-5)` (Grau de interação social presencial)

---

## 2. BIOLOGIA, FISIOLOGIA & SONO (`bio_`)
- `bio_bed_time: Time` (Horário em que deitou, ex: "23:00")
- `bio_wake_time: Time` (Horário em que levantou, ex: "07:00")
- `bio_sleep_hours: Number` (Horas totais dormidas)
- `bio_sleep_quality: Number (1-5)` (Qualidade subjetiva do sono)
- `bio_sleep_inertia: Number (1-5)` (Inércia matinal / lentidão ao acordar)
- `bio_sleep_interruptions: Number` (Número de despertares noturnos)
- `bio_crash_time: Time` (Horário de fadiga central / queda de energia à tarde)
- `bio_last_meal_time: Time` (Horário da última refeição sólida)
- `bio_weight: Number` (Peso corporal em kg)
- `bio_training_type: Select` (`push | pull | legs | fullbody | cardio | rest | martial_arts | none`)
- `bio_training_load: Number (0-5)` (RPE / intensidade do esforço físico)
- `bio_skin_barrier: Number (1-5)` (Estado da pele / inflamação)
- `bio_gut_state: Number (1-5)` (Saúde digestiva)
- `bio_discomfort: Number (1-5)` (Nível de dores ou incômodos físicos)
- `bio_symptoms: Array` (Sintomas clínicos: `[headache, fatigue, joint_pain, ... ]`)
- `bio_caffeine_doses: Number` (Número de cafés consumidos)
- `bio_late_caffeine: Boolean` (Café consumido após as 14h?)
- `bio_alcohol: Number` (Doses de álcool)
- `bio_meds_taken: Array` (Medicamentos tomados)

---

## 3. EXECUÇÃO, ENGENHARIA & TRABALHO (`exec_`)
- `exec_deep_work_h: Number` (Horas líquidas de foco profundo)
- `exec_screen_time_h: Number` (Horas totais de tela)
- `exec_work_mode: Select` (`solo | pair | meeting | admin`)
- `exec_focus_areas: Array` (Projetos ordenados pelo peso do esforço: `[project-alpha, core-product, academy]`)
- `exec_cognitive_load: Number (1-5)` (Complexidade do desafio cognitivo)
- `exec_flow_state: Number (1-5)` (Intensidade do estado de fluxo imersivo)
- `exec_fragmentation: Number (1-5)` (Nível de interrupções e trocas de contexto)
- `exec_external_friction: Number (1-5)` (Atritos externos, bugs ou burocracias)
- `exec_procrastination: Number (1-5)` (Resistência inicial para entrar em ação)
- `exec_batching_kept: Boolean` (Agrupou tarefas semelhantes?)
- `exec_shipped: Boolean` (Entregou/subiu algo tangível em produção?)
- `exec_leverage: Number (1-5)` (Nível de alavancagem estratégica das tarefas concluídas)

---

## 4. SÍNTESE POLÍMATA & REPERTÓRIO (`poly_`)
- `poly_domains: Array` (Domínios explorados: `[Software, Filosofia, Design, Economia]`)
- `poly_modalities: Array` (Modalidades de estudo: `[code, reading, lecture, problem_solving]`)
- `poly_mode: Select` (`absorption | synthesis | application | reflection`)
- `poly_depth: Number (1-5)` (Profundidade conceitual alcançada)
- `poly_cross_pollination: Number (1-5)` (Conexões cruzadas entre domínios distintos)
- `poly_hyperfocus_pull: Number (0-5)` (Atração por temas paralelos fora do ciclo)
- `poly_shadow_friction: Array` (Fricções de estudo: `[abstraction_gap, complex_math]`)

---

## 5. PSICOLOGIA, TEMPERANÇA & AFETO (`cog_`)
- `cog_day_rating: Number (1-5)` (Nota geral subjetiva do dia)
- `cog_mood: Number (1-5)` (Humor basal)
- `cog_energy: Number (1-5)` (Energia vital percebida)
- `cog_drive: Number (1-5)` (Ímpeto / motivação intrínseca)
- `cog_drive_source: Select` (`mastery | purpose | duty | survival | external`)
- `cog_competence: Number (1-5)` (Sensação de eficácia no dia)
- `cog_confidence: Number (1-5)` (Confiança na trajetória de longo prazo)
- `cog_clarity: Number (1-5)` (Clareza mental e prioridades límpidas)
- `cog_ram_load: Number (1-5)` (Sobrecarga de memória de trabalho / pensamentos soltos)
- `cog_autonomy: Number (1-5)` (Sensação de governo sobre a própria rotina)
- `cog_temperance: Number (1-5)` (Autodomínio diante de impulsos)
- `cog_craving: Number (1-5)` (Pressão por dopamina rápida ou escapismo)
- `cog_anxiety: Number (1-5)` (Nível de ansiedade antecipatória)
- `cog_rumination: Number (1-5)` (Pensamentos repetitivos sobre o passado)
- `cog_validation_hunger: Number (1-5)` (Busca por aprovação externa)
- `cog_stress_source: Array` (Fontes de estresse: `[deadline, health, finances]`)
- `cog_social_battery: Number (1-5)` (Energia social disponível)
- `cog_hunger: Number (1-5)` (Apetite percebido)
- `cog_libido: Number (1-5)` (Nível basal de libido)

---

## 6. HÁBITOS & ENTROPIA COMPORTAMENTAL (`h_` / `bh_`)
- `h_clean_diet: Boolean` (Alimentação 100% limpa, sem ultraprocessados)
- `h_nutrition_goal: Boolean` (Bateu metas calóricas e proteicas)
- `h_water_goal: Boolean` (Consumiu a meta diária de água)
- `h_creatine: Boolean` (Suplementação matinal)
- `h_sunlight_am: Boolean` (Luz solar nos olhos nos primeiros 30 min pós-despertar)
- `h_clean_qg: Boolean` (Mesa de trabalho e ambiente limpos e organizados)
- `h_spiritual_anchor: Boolean` (Momento de oração, contemplação ou silêncio)
- `h_wind_down: Boolean` (Desaceleração noturna sem telas antes de deitar)
- `bh_cheap_dopamine: Number (1-5)` (Nível de exposição a feeds infinitos ou gatilhos)
- `bh_shiny_object: Boolean` (Cedeu à tentação de iniciar outro projeto no meio do sprint?)
- `bh_temperance_breach: Array` (Violações de temperança registradas)

---

## 7. CAMADA SEMÂNTICA & GRAFO (`ctx_`)
- `ctx_entities: Array` (Wikilinks de projetos, pessoas ou conceitos tocados no dia: `["[[Core Project v1]]", "[[Clean Architecture Book]]"]`)
- `ctx_bio_log: Text` (Micro-log textual de sono, corpo e energia)
- `ctx_exec_log: Text` (Micro-log factual de entregas de trabalho)
- `ctx_poly_log: Text` (Micro-log de estudos e descobertas intelectuais)
- `ctx_psy_log: Text` (Micro-log do estado psicológico e autodomínio)
