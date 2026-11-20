# Air Quality Intelligence

**Universidad Manuela Beltrán · Inteligencia de Negocios · Taller 6**

**Integrantes:** Valery Michell Herrera y Daniel Felipe Rojas.

Aplicación en español para registrar PM2.5, PM10, CO₂ y CO, simular tratamientos de purificación y analizar sus resultados. Incluye historial en SQLite, cuatro indicadores principales, tres gráficos interactivos, filtros, alertas por reglas y descarga CSV.

## Instalación

Requisito: Node.js 24 y npm. Ejecuta desde la raíz.

```sh
npm ci
npm run seed
npm run dev
```

Abre [127.0.0.1:3000](http://127.0.0.1:3000). La semilla es opcional y crea cuatro sesiones en una base vacía. También puedes pulsar **Simular entrada** y luego **Iniciar simulación**.

| Comando | Función |
|---|---|
| `npm run dev` | Express con el middleware de desarrollo de Vite |
| `npm run build` | Compila React y los gráficos en `dist/` |
| `npm start` | Sirve la compilación y el API en el mismo puerto |
| `npm run seed` | Crea el escenario reproducible en una base vacía |
| `npm run lint` / `npm test` | Análisis estático y pruebas de fórmulas, API y persistencia |

Copia `.env.example` a `.env` para cambiar `PORT` (3000) o `DB_PATH` (`data/air.sqlite`). Los esquemas SQL se aplican al iniciar. Conserva el archivo SQLite para mantener el historial. Para comenzar una prueba limpia, asigna una ruta distinta a `DB_PATH`.

## Arquitectura y documentación

React, Vite y Recharts sirven el dashboard. Express expone el API REST y Node 24 proporciona SQLite mediante `node:sqlite`. El servidor escucha en la interfaz local. La interfaz usa CSS nativo y las pruebas usan el ejecutor integrado de Node.

- [Arquitectura](docs/arquitectura.md) y [requisitos](docs/requisitos.md)
- [Base de datos](docs/base-de-datos.md) y [API REST](docs/api.md)
- [Modelo y reglas](docs/modelo-purificacion.md) y [análisis reproducible](docs/resultados-analisis.md)
- [Pruebas](docs/pruebas.md), [informe técnico](docs/informe-tecnico.md) y [guion del video](docs/guion-video.md)
- [Historial de versiones](CHANGELOG.md) de la 0.1.0 a la 1.0.0

El tratamiento y su salida son simulados. La captura manual indica el origen de la entrada y puede contener datos sin verificar. Las tasas y los umbrales son didácticos. Los resultados no certifican seguridad del aire ni desempeño de equipos.

