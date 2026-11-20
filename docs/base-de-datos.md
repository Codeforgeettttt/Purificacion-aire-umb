# Base de datos

SQLite se inicializa con los scripts SQL de `backend/src/database`, en orden de dependencias. Los scripts usan creación idempotente y cargan el catálogo tecnológico.

| Tabla | Uso |
|---|---|
| measurements | Entrada, hora UTC, origen y concentraciones |
| technologies | Catálogo y mecanismos activos |
| sessions | Medición, tecnología, duración, inicio, estado y escenario exterior |
| samples | Concentraciones iniciales, intermedias y finales por sesión y minuto |
| alerts | Mensajes deduplicados por origen, sesión y contaminante |
| preferences | Tema y duración de tratamiento predeterminada |

Las claves foráneas se habilitan en cada conexión. Hay una clave compuesta para impedir dos muestras del mismo minuto y una clave de evento única para alertas. Las migraciones 004 y 005 añaden escenario, semilla y tiempos de pausa. La 006 añade preferencias. Un respaldo SQLite conserva todas las tablas; la restauración copia únicamente las tablas de un esquema compatible en una transacción. Los resultados finales se calculan desde la entrada y el último punto persistido, por lo que no duplican concentraciones en otra tabla.

Desde la raíz del proyecto, ejecuta `npm run seed`. El comando utiliza `DB_PATH` o `data/air.sqlite`. Si la base contiene entradas, conserva los datos existentes. Para generar otra demostración cambia `DB_PATH` y vuelve a ejecutar el comando.

