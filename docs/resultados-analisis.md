# Resultados reproducibles

Ejecuta `npm run seed` en una base vacía y abre el dashboard. Las cuatro sesiones duran 15 minutos. La entrada simulada es PM2.5 = 60 µg/m³, PM10 = 100 µg/m³, CO₂ = 1400 ppm y CO = 10 ppm. El aire exterior simulado se fija en 8 µg/m³, 18 µg/m³, 420 ppm y 0,5 ppm respectivamente.

| Tecnología | PM2.5 final (µg/m³) | PM10 final (µg/m³) | CO₂ final (ppm) | CO final (ppm) | Nivel |
|---|---:|---:|---:|---:|---|
| HEPA | 9,92 | 16,53 | 1400,00 | 10,00 | Alto |
| Ventilación | 23,66 | 42,70 | 715,17 | 3,36 | Moderado |
| Combinación | 6,03 | 11,82 | 715,17 | 3,36 | Bajo |
| Carbón activado | 60,00 | 100,00 | 1400,00 | 10,00 | Alto |

HEPA reduce las partículas 83,47 % y el CO permanece en el nivel Alto del taller. Con la combinación, PM2.5 baja 89,95 % y CO₂ baja 48,92 %. Esa reducción de CO₂ proviene del intercambio con el exterior elegido para el escenario. El resultado cambia con las condiciones exteriores y las tasas. Estas cifras fueron calculadas por el modelo y corresponden a datos simulados.

