import PDFDocument from 'pdfkit';
import { keys, pollutants } from './monitoring.js';

const n = value => value === null ? 'N/D' : Number(value).toLocaleString('es-CO', { maximumFractionDigits: 2 });
export function writeReport(output, sessions) {
  const doc = new PDFDocument({ size: 'A4', margin: 54, info: { Title: 'Air Quality Intelligence - Informe' } });
  doc.pipe(output);
  doc.fillColor('#103c42').fontSize(23).text('Air Quality Intelligence');
  doc.moveDown(0.4).fontSize(14).text('Informe de tratamientos simulados');
  doc.moveDown().fillColor('#26474a').fontSize(10).text('Universidad Manuela Beltrán · Inteligencia de Negocios');
  doc.text('Entradas manuales sin verificar y salidas generadas por el simulador.');
  doc.moveDown().text('Resumen ejecutivo', { underline: true });
  doc.text(sessions.length + ' tratamientos incluidos. ' + sessions.filter(s => s.status === 'completed').length + ' completaron el tiempo previsto.');
  for (const key of keys) {
    const values = sessions.map(s => s.result.reductions[key]).filter(value => value !== null);
    doc.text(pollutants[key].label.replace('₂', '2') + ': reducción media ' +
      (values.length ? n(values.reduce((sum, value) => sum + value, 0) / values.length) + '%' : 'N/D'));
  }
  for (const s of sessions) {
    if (doc.y + 190 > doc.page.height - 54) doc.addPage();
    const when = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(s.started_at);
    doc.moveDown().fillColor('#103c42').fontSize(13).text('Sesión #' + s.id + ' · ' + s.technology + ' · ' + when);
    doc.fontSize(10).text('Origen: ' + (s.initial.source === 'manual' ? 'manual sin verificar' : 'simulado') +
      ' · ' + (s.initial.scenario ?? 'sin escenario') + ' · ' + s.final.minute + ' min · ' + s.result.outcome);
    for (const key of keys) {
      const pollutant = pollutants[key];
      const max = Math.max(s.initial[key], s.final[key], 0.001);
      doc.fillColor('#26474a').text(pollutant.label.replace('₂', '2') + ' (' + pollutant.unit + '): ' + n(s.initial[key]) + ' / ' +
        n(s.final[key]) + ' · reducción ' + (s.result.reductions[key] === null ? 'N/D' : n(s.result.reductions[key]) + '%'));
      const y = doc.y;
      doc.rect(54, y, 195 * s.initial[key] / max, 4).fill('#245767');
      doc.rect(54, y + 5, 195 * s.final[key] / max, 4).fill('#0c977a');
      doc.y = y + 12;
    }
    doc.fillColor('#26474a').text('Barras: entrada arriba, salida abajo. Escala independiente por contaminante.');
  }
  doc.end();
}
