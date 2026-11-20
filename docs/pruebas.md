# Pruebas

| Verificación ejecutada | Resultado |
|---|---|
| npm run lint | Correcta |
| npm run build | Correcta |
| npm test | Incluye escenarios, pausa, informes PDF y restauración SQLite, además de las cinco pruebas iniciales |
| npm run test:desktop | Arranque doble, persistencia, aislamiento, entrada simulada, tratamiento, BI, PDF, CSV y respaldo |
| Entrega Windows | El pipeline prueba la aplicación desempaquetada, el portátil y el instalador en un entorno desechable antes de publicar artefactos |
| npm audit --omit=dev | Cero vulnerabilidades reportadas en dependencias de ejecución |
| Navegador | Se creó una entrada, se completó el tratamiento, se abrió el panel, se verificaron cuatro KPI, tres gráficos y filtro de CO₂ |
| Vista de 390 px | Contenido dentro del viewport y tres gráficos presentes |

Las pruebas automatizadas cubren fórmula, cero, aumentos, comportamiento de HEPA, carbón y ventilación, validaciones HTTP, avance y detención, reinicio con SQLite en disco, deduplicación de alertas y descarga CSV. La comprobación básica de accesibilidad revisó etiquetas, encabezados y navegación disponibles en el árbol accesible.

La auditoría completa del 20 de noviembre de 2026 reportó seis avisos moderados en la cadena de empaquetado de Electron Builder. El ejecutable incluye las dependencias de ejecución; las herramientas de compilación se mantienen como dependencias de desarrollo.

