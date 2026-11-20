import { createApp } from '../backend/src/server.js';
import { registerMeasurement } from '../backend/src/monitoring.js';
import { readSessions, startSession } from '../backend/src/treatment.js';

const { locals: { db } } = await createApp();
try {
  if (db.prepare('SELECT COUNT(*) AS total FROM measurements').get().total) {
    console.log('La base contiene datos. Usa DB_PATH para preparar otra base de demostración.');
  } else {
    const entry = registerMeasurement(db, 'simulated', { pm25: 60, pm10: 100, co2: 1400, co: 10 });
    const now = Date.now();
    for (const technology of ['hepa', 'ventilation', 'combined', 'carbon']) {
      const session = startSession(db, { measurementId: entry.id, duration: 15, technology }, now - 8000);
      readSessions(db, now, session.id);
    }
    console.log('Se creó una entrada simulada y cuatro tratamientos de 15 minutos.');
  }
} finally {
  db.close();
}
