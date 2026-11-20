# Air Quality Intelligence

**Universidad Manuela Beltrán**  
**Asignatura:** Inteligencia de Negocios · Taller 6  
**Integrantes:** Valery Michell Herrera y Daniel Felipe Rojas  
**Fecha:** 20 de noviembre de 2026

## Introducción y problema

Una medición de entrada permite detectar concentraciones elevadas, pero se requiere observar qué cambia durante un tratamiento y qué contaminantes permanecen elevados. La aplicación permite analizar ese problema con escenarios reproducibles y un tablero de inteligencia de negocios.

## Objetivos

Registrar y clasificar PM2.5, PM10, CO₂ y CO, simular tecnologías de purificación y evaluar la salida con concentraciones, indicadores de reducción y alertas.

## Arquitectura y tecnologías

React, Vite y Recharts implementan la interfaz. Express procesa solicitudes y validaciones. SQLite conserva mediciones, sesiones, muestras y alertas en un archivo. El desarrollo usa módulos JavaScript, ESLint y pruebas de Node. [Arquitectura](arquitectura.md) · [API](api.md)

## Desarrollo y base de datos

El módulo de monitoreo guarda origen, fecha y concentraciones. El simulador ejecuta un modelo de captura de partículas y renovación. La validación calcula cambios por contaminante y aplica las reglas de nivel final. Las relaciones de SQLite permiten recorrer la sesión desde la entrada hasta la última muestra. [Esquema](base-de-datos.md) · [Modelo](modelo-purificacion.md)

## Inteligencia de negocios

El tablero muestra PM2.5 y CO₂ antes y después, reducción y tiempo de proceso, junto con tres gráficos. Los filtros permiten comparar tecnología, intervalo, sesión y contaminante. Las alertas priorizan niveles altos y moderados y el CSV permite analizar datos fuera de la aplicación.

## Resultados y pruebas

En el caso reproducible de 15 minutos, HEPA reduce PM2.5 de 60 a 9,92 µg/m³ y mantiene CO en 10 ppm. La configuración combinada obtiene 6,03 µg/m³ de PM2.5 y 715,17 ppm de CO₂ bajo las condiciones exteriores del modelo. Pasaron cinco pruebas automatizadas y se probó el flujo del dashboard en navegador. [Resultados](resultados-analisis.md) · [Pruebas](pruebas.md)

## Limitaciones

Las concentraciones de salida proceden del simulador. Se asume mezcla homogénea, tasas constantes y aire exterior fijo. Los umbrales representan criterios operativos del taller. La aplicación funciona en entorno local y está pensada para demostración académica. Electron integra Express y SQLite en una aplicación Windows con almacenamiento fuera del paquete. Los reportes y respaldos se generan sin acceso a internet. Las sesiones conservan los tiempos de pausa y el tablero permite comparar escenarios con unidades independientes.

## Conclusiones

El análisis por contaminante permite detectar que un tratamiento eficaz para partículas puede dejar intactos gases como el CO. Incorporar condiciones exteriores y conservar las mediciones intermedias permite explicar el resultado y contrastar alternativas. El nivel final y la reducción aportan información complementaria.

## Referencias

- Organización Mundial de la Salud (2021). [WHO global air quality guidelines](https://www.who.int/publications/i/item/9789240034228).
- U.S. Environmental Protection Agency. [Guide to Air Cleaners in the Home](https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home).

