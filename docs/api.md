# API REST

Prefijo `/api`. Los POST aceptan JSON; los errores tienen forma `{"error":"mensaje"}`.

| Método y ruta | Resultado |
|---|---|
| GET /health | Comprueba conexión SQLite |
| GET /pollutants | Etiquetas, unidades y umbrales operativos |
| GET /measurements | Historial de entradas |
| GET /measurements/:id | Detalle de una entrada |
| POST /measurements | Crea una entrada manual con pm25, pm10, co2 y co |
| POST /measurements/simulate | Genera una entrada simulada |
| GET /technologies | Catálogo y escenario exterior predeterminado |
| GET /sessions | Historial con muestras y resultados |
| GET /sessions/:id | Estado, muestras y resultado de una sesión |
| POST /sessions | Crea una sesión |
| POST /sessions/:id/stop | Detiene la sesión o devuelve su estado final |
| GET /alerts | Actualiza y consulta alertas persistidas |
| GET /reports/treatments.csv | Exporta resultados finalizados |

Cuerpo de ejemplo para iniciar una sesión de 15 minutos con HEPA.

```json
{"measurementId":1,"technology":"hepa","duration":15}
```

Los identificadores deben ser enteros positivos. La creación devuelve 201, los campos inválidos devuelven 400, un recurso ausente devuelve 404 y un cuerpo demasiado grande devuelve 413. Para ventilación se acepta `exterior` con las cuatro concentraciones.

