# SOP 05: TELEMETRIA PESSOAL & BI CLI-FIRST

Sistema de inteligência analítica que cruza variáveis ambientais, sono, hábitos e produtividade.

---

## 📊 1. OS 7 EIXOS DA TELEMETRIA
1. **Ambiente (`env_`):** Temperatura, umidade, horas de luz solar e pressão barométrica (delta 24h).
2. **Biologia (`bio_`):** Sono (duração, qualidade e inércia), treino físico, alimentação e cafeína.
3. **Execução (`exec_`):** Horas de foco profundo (`exec_deep_work_h`), tempo de tela e nível de alavancagem.
4. **Polimatia (`poly_`):** Áreas estudadas, profundidade e síntese cruzada.
5. **Psicologia (`cog_`):** Humor, clareza, autodomínio e nota subjetiva do dia.
6. **Hábitos (`h_` / `bh_`):** Adesão a hábitos estruturados e contenção de entropia comportamental.
7. **Semântica (`ctx_`):** Linha do tempo de entidades e sínteses qualitativas em micro-logs.

---

## 🔮 2. CORRELAÇÕES LAG-1 & MODELO PREDITIVO
- O motor de telemetria analisa dados históricos cruzando o dia anterior ($t-1$) com o dia atual ($t$):
  - *Exemplo de insight:* Como o tempo de tela excessivo ou refeições tardias ontem afetam a qualidade do sono e a inércia matinal hoje.
- O relatório matinal utiliza essas correlações para sugerir pequenos ajustes profiláticos na rotina do dia.
