// Notificaciones locales (sin servidor).
// - Al abrir la app (o mientras está abierta) se avisa de cada hito nuevo.
// - En Android/Chrome con la app instalada se intenta además la
//   "sincronización periódica" para avisar en segundo plano.
// - La forma más fiable de recibir avisos programados en cualquier móvil es
//   exportar los hitos al calendario (.ics), ver logic.buildICS.
import { milestoneStatus } from './logic.js';

const SCHEDULE_CACHE = 'ddf-schedule';
const SCHEDULE_URL = './__schedule.json';

export const supported = () => 'Notification' in window && 'serviceWorker' in navigator;

export async function requestPermission() {
  if (!supported()) return 'unsupported';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

export const permission = () => (supported() ? Notification.permission : 'unsupported');

async function show(title, body, tag) {
  const reg = await navigator.serviceWorker.ready;
  return reg.showNotification(title, { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './#/cuerpo' } });
}

/**
 * Notifica los hitos desbloqueados que aún no se habían notificado.
 * Devuelve la lista de ids nuevos (para guardarlos en el estado).
 */
export async function notifyNewMilestones(state, now = Date.now()) {
  if (!state.profile) return [];
  const fresh = milestoneStatus(state.profile.quitAt, now).filter((m) => m.unlocked && !state.notified.includes(m.id));
  if (!fresh.length) return [];
  if (state.settings.notifications && permission() === 'granted') {
    // Si hay muchos de golpe (p. ej. al configurar con una fecha pasada), solo el último.
    const toShow = fresh.length > 2 ? fresh.slice(-1) : fresh;
    for (const m of toShow) {
      try { await show(`${m.icon} ${m.title}`, m.body, m.id); } catch { /* sin SW */ }
    }
  }
  return fresh.map((m) => m.id);
}

/** Guarda la agenda de hitos para que el service worker pueda avisar en segundo plano. */
export async function syncSchedule(state) {
  if (!('caches' in window) || !state.profile) return;
  try {
    const items = milestoneStatus(state.profile.quitAt).map((m) => ({ id: m.id, at: m.unlockAt.getTime(), title: `${m.icon} ${m.title}`, body: m.body }));
    const payload = { enabled: !!state.settings.notifications, notified: state.notified, items };
    const cache = await caches.open(SCHEDULE_CACHE);
    await cache.put(SCHEDULE_URL, new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } }));
  } catch { /* nada */ }
}

/** Lee los ids que el service worker haya notificado en segundo plano. */
export async function readBackgroundNotified() {
  if (!('caches' in window)) return [];
  try {
    const cache = await caches.open(SCHEDULE_CACHE);
    const res = await cache.match(SCHEDULE_URL);
    if (!res) return [];
    const data = await res.json();
    return data.notified || [];
  } catch { return []; }
}

export async function registerPeriodicSync() {
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!('periodicSync' in reg)) return false;
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (status.state !== 'granted') return false;
    await reg.periodicSync.register('ddf-milestones', { minInterval: 60 * 60 * 1000 });
    return true;
  } catch { return false; }
}
