# Air Quality Intelligence Desktop

**Universidad Manuela Beltrán · Inteligencia de Negocios · Taller 6**

**Equipo:** Valery Michell Herrera y Daniel Felipe Rojas.

Aplicación para Windows que registra PM2.5, PM10, CO₂ y CO, simula tratamientos y conserva el historial en SQLite. Incluye escenarios reproducibles, control de pausa, comparación entre sesiones, dashboard BI, alertas, informes PDF y CSV y respaldos locales.

## Uso en Windows

Descarga `AirQualityIntelligence-Setup-2.2.0.exe` o `AirQualityIntelligence-Portable-2.2.0.exe` de los artefactos de una compilación verificada. El instalador crea un acceso en Inicio. La edición portátil guarda su perfil en `AirQualityData` junto al ejecutable. Ambos incluyen Electron y funcionan sin Node.js externo. [Instalación y desinstalación](docs/instalacion-windows.md) · [Manual de usuario](docs/manual-usuario.md)

## Desarrollo reproducible

Se requiere Node.js 24 con npm. Ejecuta desde la raíz del repositorio.

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:desktop
npm run package:win
```

En Windows, `npm run desktop` abre Electron desde el código. `npm run dev` conserva el flujo web con Vite en [127.0.0.1:3000](http://127.0.0.1:3000). `npm run seed` añade sesiones de muestra en una base web vacía. En escritorio, usa **Datos y ajustes → Recrear demostración** para generar el ejemplo.

Las salidas son simuladas. Las capturas manuales se identifican como datos sin verificar. Los umbrales representan reglas didácticas.

## Documentación

- [Arquitectura](docs/arquitectura.md) · [Base y migraciones](docs/base-de-datos.md) · [REST](docs/api.md)
- [Modelo](docs/modelo-purificacion.md) · [Análisis de resultados](docs/resultados-analisis.md) · [Pruebas](docs/pruebas.md)
- [Requisitos](docs/requisitos.md) · [Informe técnico](docs/informe-tecnico.md) · [Guion](docs/guion-video.md)
- [Contribuciones](docs/contribuciones.md) · [Cambios por versión](CHANGELOG.md)
