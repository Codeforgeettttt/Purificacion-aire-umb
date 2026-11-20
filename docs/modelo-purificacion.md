# Modelo de purificación y reglas

Para cada contaminante, el modelo usa una cámara bien mezclada y un escenario exterior constante. Con renovación v y captura h, la tasa total es k = v + h. Para k mayor que cero, C(t) = Ceq + (C₀ − Ceq) exp(−kt), con Ceq = v·Cext/k. Con k igual a cero conserva C₀. El minutero avanza cada 500 ms de reloj. Las tasas son parámetros didácticos.

| Mecanismo | Parámetro |
|---|---|
| HEPA | h = 0,12 min⁻¹ para PM2.5 y PM10 |
| Ventilación | v = 0,08 min⁻¹ para las cuatro concentraciones |
| Carbón activado | Captura cero para las cuatro variables de este escenario |
| Combinación | Suma captura HEPA y renovación |

El carbón puede adsorber determinados gases cuando el medio es compatible. Para CO y CO₂, el modelo solo incorpora el intercambio con aire exterior. Por eso la ventilación puede disminuir o aumentar su concentración. [Guía de filtración de la EPA](https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home)

| Contaminante | Inicio de Moderado | Inicio de Alto |
|---|---:|---:|
| PM2.5 (µg/m³) | 15 | 35 |
| PM10 (µg/m³) | 45 | 100 |
| CO₂ (ppm) | 1000 | 1500 |
| CO (ppm) | 4 | 9 |

El nivel global es el más alto entre los cuatro. Se alerta al alcanzar un umbral de entrada o salida. La advertencia destacada de CO aparece al nivel Alto inicial o actual. Los umbrales se editan en `backend/src/monitoring.js`. Son reglas de taller para valores instantáneos. Los valores iniciales moderados de partículas coinciden numéricamente con las guías OMS de 24 horas, que requieren un promedio temporal. Los otros umbrales son decisiones didácticas. [Guía OMS 2021](https://www.who.int/publications/i/item/9789240034228) · [Períodos de promedio de la OMS](https://www.who.int/teams/environment-climate-change-and-health/air-quality-and-health/health-impacts/types-of-pollutants)

La reducción es (entrada − salida) / entrada × 100. Una entrada de cero produce valor nulo y se muestra como no calculable. Una cifra negativa indica aumento. La evaluación distingue entre sin cambio, incrementos, mejora parcial y mejora simulada según los cambios y el nivel final didáctico.

