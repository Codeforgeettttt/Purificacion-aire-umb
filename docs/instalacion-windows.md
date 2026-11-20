# Instalación en Windows x64

La compilación se realiza en Windows con Node.js 24. Ejecuta `npm ci` y `npm run package:win`. El workflow de Windows genera los mismos archivos en el artefacto `air-quality-windows-x64` al aprobar las pruebas.

## Instalador

Abre `AirQualityIntelligence-Setup-<versión>.exe`, elige la carpeta y abre la aplicación desde el menú Inicio. Para desinstalar, abre Aplicaciones instaladas en Windows y usa la opción Desinstalar. Los datos se conservan en el perfil del usuario.

## Portátil

Coloca `AirQualityIntelligence-Portable-<versión>.exe` en una carpeta con permiso de escritura. La aplicación mantiene la base en `AirQualityData` junto al ejecutable. Para trasladarla, cierra la aplicación antes de copiar esa carpeta.

Los ejecutables no requieren una instalación externa de Node.js. Las compilaciones académicas se distribuyen sin firma de código. Windows puede mostrar una advertencia de editor desconocido. Consulta el origen del archivo antes de abrirlo.
