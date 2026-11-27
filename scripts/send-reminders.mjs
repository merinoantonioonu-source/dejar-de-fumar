// Envía las notificaciones push programadas. Lo ejecuta GitHub Actions
// (.github/workflows/recordatorios.yml) cada 15 minutos.
//
// Entradas (variables de entorno):
//   PUSH_CONFIG  JSON copiado desde la app (Ajustes → Avisos con la app cerrada). Secreto.
//   STATE_FILE   ruta del JSON de estado { lastRun, lastDaily, lastHarm }.
//   TEST=true    envía solo una notificación de prueba.
import { readFile, writeFile } from 'node:fs/promises';
import webpush from 'web-push';

const raw = process.env.PUSH_CONFIG;
if (!raw) {
  console.log('No hay configuración (secreto PUSH_CONFIG vacío): nada que enviar.');
  process.exit(0);
}

let cfg;
try {
  cfg = JSON.parse(raw);
} catch {
  console.error('PUSH_CONFIG no es un JSON válido. Vuelve a copiarlo desde la app.');
  process.exit(1);
}
if (!cfg.subscription?.endpoint || !cfg.vapid?.publicKey || !cfg.vapid?.privateKey || !cfg.profile?.quitAt) {
  console.error('PUSH_CONFIG está incompleto. Vuelve a copiarlo desde la app.');
  process.exit(1);
}

// La hora local del usuario manda (mensaje diario a su hora).
process.env.TZ = cfg.timezone || 'Europe/Madrid';
const { planNotifications } = await import('../js/reminders.js');

webpush.setVapidDetails(cfg.vapid.subject || cfg.appUrl || 'https://github.com', cfg.vapid.publicKey, cfg.vapid.privateKey);

async function send(n) {
  const payload = JSON.stringify({ title: n.title, body: n.body, tag: n.tag, url: n.url });
  try {
    const res = await webpush.sendNotification(cfg.subscription, payload, { TTL: 6 * 3600, urgency: 'normal' });
    console.log(`Enviado (${res.statusCode}): ${n.kind}`);
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.error('La suscripción del móvil ya no es válida (se desinstaló la app o se revocó el permiso). Vuelve a activar los avisos en la app y actualiza el secreto PUSH_CONFIG.');
    } else {
      console.error(`Error al enviar (${err.statusCode ?? 'sin código'}): ${err.body || err.message}`);
    }
    throw err;
  }
}

if (process.env.TEST === 'true') {
  await send({ kind: 'test', tag: 'prueba', title: '🔔 Los avisos funcionan', body: 'Recibirás tus hitos, tu mensaje diario y algún recordatorio aunque no abras la app.', url: `${cfg.appUrl || './'}#/` });
  process.exit(0);
}

const stateFile = process.env.STATE_FILE || 'estado.json';
let prev = {};
try { prev = JSON.parse(await readFile(stateFile, 'utf8')); } catch { /* primera ejecución */ }

const { notifications, state, changed } = planNotifications(cfg, prev, Date.now());
if (!notifications.length) console.log('Nada que enviar ahora.');
for (const n of notifications) await send(n);
if (changed) {
  await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  console.log('Estado actualizado.');
}
