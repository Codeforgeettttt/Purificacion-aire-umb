# Air Quality Intelligence Desktop

**Taller 6 · Purificación de Aire**  
Universidad Manuela Beltrán (UMB) · Inteligencia de Negocios

Aplicación de escritorio para registrar la calidad del aire, simular su purificación y evaluar los resultados. El proyecto desarrolla el reto del Taller 6: identificar contaminantes, controlar un tratamiento simulado y comparar la calidad del aire antes y después con indicadores de inteligencia de negocios.

## Descargar para Windows x64

| Distribución | Uso |
| --- | --- |
| [Descargar instalador NSIS (.exe)](https://github.com/Codeforgeettttt/Purificacion-aire-umb/releases/download/v2.2.0/AirQualityIntelligence-Setup-2.2.0.exe) | Instala la aplicación y crea un acceso en el menú Inicio. |
| [Descargar versión portátil (.exe)](https://github.com/Codeforgeettttt/Purificacion-aire-umb/releases/download/v2.2.0/AirQualityIntelligence-Portable-2.2.0.exe) | Ejecuta el programa desde una carpeta con permiso de escritura. Los datos se guardan en `AirQualityData` junto al ejecutable. |

La v2.2.0 incluye Electron y SQLite. Sus funciones principales operan sin internet y no requieren instalar Node.js. Los ejecutables se distribuyen sin firma digital. [Release v2.2.0 y notas de la versión](https://github.com/Codeforgeettttt/Purificacion-aire-umb/releases/tag/v2.2.0) · [Guía de instalación y desinstalación](docs/instalacion-windows.md)

## Alcance del Taller 6

| Módulo | Implementación |
| --- | --- |
| Monitoreo | Registra PM2.5, PM10, CO₂ y CO con fecha y origen. Admite captura manual y escenarios simulados reproducibles. |
| Purificación | Simula HEPA, carbón activado, ventilación o una combinación. Permite configurar el tiempo, pausar, reanudar y detener el proceso. |
| Validación | Compara concentraciones iniciales y finales, calcula la reducción por contaminante e identifica valores que permanecen elevados. |
| Inteligencia de negocios | Presenta indicadores de PM2.5, CO₂, reducción y duración. Incluye gráficas de comparación, evolución y distribución, con filtros. |
| Alertas y reportes | Aplica reglas por contaminante, exporta informes en PDF y CSV y permite respaldar o restaurar el historial en SQLite. |

Las salidas corresponden a una simulación. Las capturas manuales se identifican como datos sin verificar y los umbrales se usan con fines didácticos. [Modelo de purificación](docs/modelo-purificacion.md) · [Análisis de resultados](docs/resultados-analisis.md)

## Demostración

1. Abre **Datos y ajustes → Recrear demostración** para cargar el escenario de ejemplo, o registra una entrada en **Mediciones**.
2. Abre **Tratamientos**, elige una tecnología y una duración, e inicia la simulación.
3. Consulta **Validación** y **Panel BI** para comparar resultados. En **Alertas y reportes** puedes descargar un informe en PDF o CSV.

[Manual de usuario](docs/manual-usuario.md) · [Guion de la demostración](docs/guion-video.md)

## Desarrollo y pruebas

El proyecto integra React, Vite y Recharts para la interfaz, Express para la API local, SQLite para la persistencia y Electron para la distribución de escritorio. Para trabajar con el código fuente se requiere Node.js 24.

```sh
npm ci
npm run desktop
```

En Windows, `npm run desktop` compila y abre la aplicación. Para trabajar en modo web, ejecuta `npm run dev` y abre [localhost:3000](http://127.0.0.1:3000). Usa `npm run lint`, `npm test` y `npm run build` para verificar el código. Después de compilar, `npm run test:desktop` valida el flujo de Electron en Windows y `npm run package:win` genera los dos ejecutables.

[Arquitectura](docs/arquitectura.md) · [API](docs/api.md) · [Base de datos](docs/base-de-datos.md) · [Pruebas](docs/pruebas.md) · [Informe técnico](docs/informe-tecnico.md) · [Historial de cambios](CHANGELOG.md)

## Equipo y colaboradores

- **Valery Michell Herrera** — integrante del equipo. [GitHub](https://github.com/Codeforgeettttt)
- **Daniel Felipe Rojas** — integrante del equipo. [GitHub](https://github.com/CodeForJellyfish)
- **Julián** — colaborador del proyecto.

[Registro de contribuciones](docs/contribuciones.md)
