// Decide qué notificaciones push enviar en cada ejecución programada.
// Es código puro: lo usan el script de GitHub Actions y las pruebas.
import {
  HOUR, DAY, milestoneStatus, dayIndex, dailyMessage, showHarmToday, harmOfDay, moneySaved, formatMoney, elapsedMs,
} from './logic.js';

export const HARM_HOUR = 18; // los perjuicios llegan por la tarde, separados del mensaje diario

/** Fecha local AAAA-MM-DD (según la zona horaria del proceso). */
export function localDateKey(t) {
  const d = new Date(t);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * @param {object} cfg   configuración copiada desde la app (perfil, ajustes, URL)
 * @param {object} prev  estado guardado { lastRun, lastDaily, lastHarm }
 * @param {number} now   instante actual (ms)
 * @returns {{ notifications: object[], state: object, changed: boolean }}
 */
export function planNotifications(cfg, prev = {}, now = Date.now()) {
  const profile = cfg.profile;
  const settings = { dailyHour: 9, harmFrequency: 'sometimes', ...(cfg.settings || {}) };
  const appUrl = cfg.appUrl || './';
  const out = [];
  const state = { ...prev };
  const today = localDateKey(now);
  const hour = new Date(now).getHours();
  // Si no hay estado previo, solo miramos la última hora (no avisar de hitos antiguos).
  const windowStart = typeof prev.lastRun === 'number' ? prev.lastRun : now - HOUR;

  // 1) Hitos del cuerpo alcanzados desde la última ejecución.
  const fresh = milestoneStatus(profile.quitAt, now)
    .filter((m) => m.unlocked && m.unlockAt.getTime() > windowStart && m.unlockAt.getTime() <= now);
  if (fresh.length) {
    const m = fresh[fresh.length - 1]; // si se acumulan varios, el más reciente
    out.push({
      kind: 'milestone', tag: `hito-${m.id}`, title: `${m.icon} ${m.title}`, body: m.body, url: `${appUrl}#/cuerpo`,
    });
  }

  // 2) Mensaje diario, a partir de la hora elegida.
  const day = dayIndex(profile.quitAt, now);
  if (hour >= settings.dailyHour && prev.lastDaily !== today) {
    const msg = dailyMessage(profile, now);
    let title;
    if (elapsedMs(profile.quitAt, now) < 0) {
      const left = Math.ceil(-elapsedMs(profile.quitAt, now) / DAY);
      title = `🗓️ ${left === 1 ? 'Mañana' : `Faltan ${left} días para`} tu día D`;
    } else {
      title = `💬 Día ${day + 1} sin fumar · ${formatMoney(moneySaved(profile, now))} ahorrados`;
    }
    const med = profile.medication && profile.medication !== 'none' ? '\n💊 Recuerda tu medicación de hoy.' : '';
    out.push({ kind: 'daily', tag: 'mensaje-diario', title, body: msg.text + med, url: `${appUrl}#/` });
    state.lastDaily = today;
  }

  // 3) De vez en cuando, un perjuicio del tabaco (con su mensaje de eficacia).
  const harmDay = elapsedMs(profile.quitAt, now) < 0
    ? settings.harmFrequency !== 'never'
    : showHarmToday(day, settings.harmFrequency);
  if (harmDay && hour >= HARM_HOUR && prev.lastHarm !== today) {
    const freq = elapsedMs(profile.quitAt, now) < 0 ? 'often' : settings.harmFrequency;
    const h = harmOfDay(profile, now, freq);
    out.push({ kind: 'harm', tag: 'perjuicio', title: `⚠️ ${h.title}`, body: `${h.fact}\n✅ ${h.gain}`, url: `${appUrl}#/` });
    state.lastHarm = today;
  }

  const changed = out.length > 0 || typeof prev.lastRun !== 'number';
  if (changed) state.lastRun = now;
  return { notifications: out, state, changed };
}
