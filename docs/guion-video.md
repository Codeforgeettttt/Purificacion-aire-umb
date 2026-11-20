# Guion de demostración · 5 min 40 s

| Tiempo | Pantalla y narración |
|---|---|
| 0:00–0:35 | Presentar a Valery Michell Herrera y Daniel Felipe Rojas y el Taller 6. Explicar que el objetivo es medir cuánto cambia la concentración por contaminante. |
| 0:35–1:05 | Mostrar la arquitectura. React presenta datos, Express ejecuta las reglas y SQLite guarda entradas, sesiones y muestras. Aclarar que las salidas son simuladas. |
| 1:05–1:55 | Abrir la aplicación desde Windows y entrar en Mediciones. Cargar PM2.5 = 60, PM10 = 100, CO₂ = 1400 y CO = 10. Mostrar fecha, origen manual y nivel Alto. Pulsar Simular entrada para mostrar ambos orígenes. |
| 1:55–2:55 | Seleccionar la primera entrada, tecnología HEPA y 15 minutos. Iniciar y mostrar el contador y la gráfica. El tiempo acelerado deja ver el tratamiento completo. |
| 2:55–3:45 | Abrir Validación. Destacar aproximadamente 83,47 % de reducción de PM2.5 y CO final de 10 ppm. Explicar por qué continúa la alerta. |
| 3:45–4:55 | Abrir Panel BI, describir los cuatro KPI y cambiar el filtro de contaminante. Mostrar los tres gráficos y usar el filtro de tecnología. |
| 4:55–5:40 | Abrir Reportes, mostrar las alertas y descargar PDF o CSV. Señalar la opción de respaldo en Datos y ajustes. Cerrar con la distinción entre filtración de partículas y recambio de aire, y los límites de la simulación. |

Para mostrar varias tecnologías desde el inicio, ejecuta `npm run seed` con una base vacía antes de grabar.

