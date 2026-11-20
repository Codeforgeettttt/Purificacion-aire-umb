# Pruebas

| Verificación ejecutada | Resultado |
|---|---|
| npm run lint | Correcta |
| npm run build | Correcta |
| npm test | Cinco pruebas aprobadas |
| npm audit --omit=dev | Cero vulnerabilidades reportadas |
| Navegador | Se creó una entrada, se completó el tratamiento, se abrió el panel, se verificaron cuatro KPI, tres gráficos y filtro de CO₂ |
| Vista de 390 px | Contenido dentro del viewport y tres gráficos presentes |

Las pruebas automatizadas cubren fórmula, cero, aumentos, comportamiento de HEPA, carbón y ventilación, validaciones HTTP, avance y detención, reinicio con SQLite en disco, deduplicación de alertas y descarga CSV. La comprobación básica de accesibilidad revisó etiquetas, encabezados y navegación disponibles en el árbol accesible.

