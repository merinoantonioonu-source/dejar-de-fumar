// Cálculos puros (sin DOM): se pueden probar con `node --test`.
import {
  BODY_MILESTONES, HARMS, TRIGGERS, DAILY_MESSAGES, MAINTENANCE_MESSAGES, PREP_MESSAGES,
} from './content.js';

export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
export const MINUTES_PER_CIGARETTE = 20; // Jackson et al. (UCL), 2025

const toMs = (d) => (d instanceof Date ? d.getTime() : new Date(d).getTime());

/** Milisegundos desde el último cigarrillo (negativo si la fecha es futura). */
export function elapsedMs(quitAt, now = Date.now()) {
  return toMs(now) - toMs(quitAt);
}

/** Día del proceso: 0 el día D, negativo antes. Se cuenta en días naturales locales. */
export function dayIndex(quitAt, now = Date.now()) {
  const a = new Date(toMs(quitAt)); a.setHours(0, 0, 0, 0);
  const b = new Date(toMs(now)); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / DAY);
}

export function pricePerCigarette(profile) {
  const pack = Number(profile.cigsPerPack) || 20;
  return (Number(profile.pricePerPack) || 0) / pack;
}

export function cigarettesAvoided(profile, now = Date.now()) {
  const ms = elapsedMs(profile.quitAt, now);
  if (ms <= 0) return 0;
  return Math.floor((ms / DAY) * (Number(profile.cigsPerDay) || 0));
}

export function moneySaved(profile, now = Date.now()) {
  const ms = elapsedMs(profile.quitAt, now);
  if (ms <= 0) return 0;
  return (ms / DAY) * (Number(profile.cigsPerDay) || 0) * pricePerCigarette(profile);
}

export function yearlyCost(profile) {
  return (Number(profile.cigsPerDay) || 0) * 365 * pricePerCigarette(profile);
}

/** Minutos de esperanza de vida recuperados (estimación media). */
export function lifeRegainedMinutes(profile, now = Date.now()) {
  return cigarettesAvoided(profile, now) * MINUTES_PER_CIGARETTE;
}

/** Estado de cada hito del cuerpo. */
export function milestoneStatus(quitAt, now = Date.now(), milestones = BODY_MILESTONES) {
  const ms = elapsedMs(quitAt, now);
  const start = toMs(quitAt);
  let prevAt = 0;
  return milestones.map((m) => {
    const atMs = m.at * MIN;
    const unlocked = ms >= atMs;
    const span = atMs - prevAt * MIN;
    const progress = unlocked ? 1 : Math.max(0, Math.min(1, (ms - prevAt * MIN) / span));
    prevAt = m.at;
    return { ...m, unlocked, unlockAt: new Date(start + atMs), remainingMs: Math.max(0, atMs - ms), progress };
  });
}

export function nextMilestone(quitAt, now = Date.now()) {
  return milestoneStatus(quitAt, now).find((m) => !m.unlocked) || null;
}

export function unlockedMilestones(quitAt, now = Date.now()) {
  return milestoneStatus(quitAt, now).filter((m) => m.unlocked);
}

/** Duración legible en español: "3 d 4 h", "2 h 15 min", "12 min". */
export function formatDuration(ms, { parts = 2 } = {}) {
  if (!(ms > 0)) ms = 0;
  const units = [
    ['año', 'años', 365 * DAY], ['mes', 'meses', 30 * DAY], ['d', 'd', DAY], ['h', 'h', HOUR], ['min', 'min', MIN],
  ];
  const out = [];
  let rest = ms;
  let slots = 0;
  for (const [one, many, size] of units) {
    let n = Math.floor(rest / size);
    if (one === 'mes') n = Math.min(n, 11); // meses de 30 d: evitar "9 años 12 meses"
    rest -= n * size;
    if (n > 0) out.push(`${n} ${n === 1 ? one : many}`);
    if (n > 0 || out.length) slots++;
    if (slots >= parts) break;
  }
  return out.length ? out.join(' ') : 'menos de 1 min';
}

/** Minutos de vida a texto ("3 d 4 h"). */
export function formatLife(minutes) {
  return formatDuration(minutes * MIN);
}

export function formatMoney(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: value < 100 ? 2 : 0 }).format(value || 0);
}

export function formatNumber(n) {
  return new Intl.NumberFormat('es-ES').format(n || 0);
}

function pickFrom(list, i) {
  return list[((i % list.length) + list.length) % list.length];
}

/** Sustituye {marcadores} con datos del perfil. */
export function fillTemplate(text, profile = {}) {
  const triggerIds = profile.triggers || [];
  const day = Math.abs(profile._day || 0);
  const trig = triggerIds.length ? TRIGGERS.find((t) => t.id === pickFrom(triggerIds, day)) : null;
  const plan = trig ? (profile.plans?.[trig.id] || '') : '';
  const motives = profile.motives?.length ? profile.motives : ['tu salud'];
  const values = {
    nombre: profile.name?.trim() || '',
    motivo: toSecondPerson(pickFrom(motives, day)),
    disparador: trig ? trig.label.toLowerCase() : 'difícil',
    plan: plan ? `entonces ${plan}` : 'abre el SOS y respira',
    apoyo: profile.supportPerson?.trim() || 'alguien de confianza',
    gastoAnual: formatMoney(yearlyCost(profile)),
    gasto10: formatMoney(yearlyCost(profile) * 10),
  };
  return text
    .replace(/\{(\w+)\}/g, (_, k) => (k in values ? values[k] : `{${k}}`))
    .replace(/,\s*([.!?])/g, '$1'); // "Hoy empieza todo, ." sin nombre
}

/** Los motivos se escriben en primera persona ("Mi familia"); la app habla de tú. */
export function toSecondPerson(text) {
  return String(text).toLowerCase()
    .replace(/\bmis\b/g, 'tus').replace(/\bmi\b/g, 'tu')
    .replace(/\bme\b/g, 'te').replace(/\byo\b/g, 'tú');
}

/** Mensaje del día según la fase. */
export function dailyMessage(profile, now = Date.now()) {
  const day = dayIndex(profile.quitAt, now);
  const p = { ...profile, _day: day };
  let text;
  if (day < 0) text = pickFrom(PREP_MESSAGES, PREP_MESSAGES.length + day);
  else if (day < DAILY_MESSAGES.length) text = DAILY_MESSAGES[day];
  else text = pickFrom(MAINTENANCE_MESSAGES, day);
  return { day, text: fillTemplate(text, p) };
}

/** ¿Toca mostrar un perjuicio hoy? frecuencia: 'often' | 'sometimes' | 'never'. */
export function showHarmToday(day, frequency = 'sometimes') {
  if (frequency === 'never') return false;
  if (frequency === 'often') return true;
  return ((day % 2) + 2) % 2 === 0; // días alternos
}

/** Perjuicio del día (rotación sin repetir hasta agotar la lista). */
export function harmFor(profile, index) {
  const h = pickFrom(HARMS, index);
  return { ...h, fact: fillTemplate(h.fact, profile), gain: fillTemplate(h.gain, profile) };
}

export function harmOfDay(profile, now = Date.now(), frequency = 'sometimes') {
  const day = dayIndex(profile.quitAt, now);
  return harmFor(profile, frequency === 'often' ? day : Math.floor(day / 2));
}

/** Deseos por día de los últimos `days` días. */
export function cravingsByDay(logs, now = Date.now(), days = 14) {
  const end = new Date(toMs(now)); end.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * DAY);
    out.push({ date: d, count: 0, resisted: 0 });
  }
  const first = out[0].date.getTime();
  for (const l of logs) {
    if (l.type !== 'craving') continue;
    const t = new Date(toMs(l.at)); t.setHours(0, 0, 0, 0);
    const idx = Math.round((t.getTime() - first) / DAY);
    if (idx >= 0 && idx < days) {
      out[idx].count++;
      if (l.resisted) out[idx].resisted++;
    }
  }
  return out;
}

export function topTriggers(logs, limit = 3) {
  const counts = {};
  for (const l of logs) if (l.trigger) counts[l.trigger] = (counts[l.trigger] || 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, n]) => ({ trigger: TRIGGERS.find((t) => t.id === id) || { id, label: id, icon: '•' }, count: n }));
}

/** Escapa texto para iCalendar. */
function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function icsDate(d) {
  return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Pliega líneas a 75 octetos aprox. (RFC 5545). */
function fold(line) {
  const chars = Array.from(line); // no partir emojis
  const out = [];
  for (let i = 0; i < chars.length; i += 60) out.push((i ? ' ' : '') + chars.slice(i, i + 60).join(''));
  return out.join('\r\n');
}

/**
 * Calendario .ics con los hitos futuros del cuerpo y un recordatorio diario.
 * Las alarmas del calendario del móvil son la forma fiable de recibir avisos
 * sin servidor.
 */
export function buildICS(profile, now = Date.now(), { appUrl = '', dailyHour = 9, dailyDays = 30 } = {}) {
  const stamp = icsDate(now);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//dejar-de-fumar//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Dejar de fumar'];
  for (const m of milestoneStatus(profile.quitAt, now)) {
    if (m.unlocked) continue;
    const start = m.unlockAt;
    const end = new Date(start.getTime() + 15 * MIN);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${m.id}-${toMs(profile.quitAt)}@dejar-de-fumar`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      fold(`SUMMARY:${icsEscape(`${m.icon} ${m.title}`)}`),
      fold(`DESCRIPTION:${icsEscape(`${m.body}${appUrl ? `\n\n${appUrl}` : ''}`)}`),
      'BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:${icsEscape(m.title)}`), 'TRIGGER:PT0M', 'END:VALARM',
      'END:VEVENT',
    );
  }
  // Recordatorio diario: abre la app para leer tu mensaje del día.
  const first = new Date(toMs(now));
  first.setHours(dailyHour, 0, 0, 0);
  if (first.getTime() < toMs(now)) first.setTime(first.getTime() + DAY);
  lines.push(
    'BEGIN:VEVENT',
    `UID:daily-${toMs(profile.quitAt)}@dejar-de-fumar`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(first)}`,
    `DTEND:${icsDate(first.getTime() + 5 * MIN)}`,
    `RRULE:FREQ=DAILY;COUNT=${dailyDays}`,
    fold(`SUMMARY:${icsEscape('🚭 Tu mensaje de hoy')}`),
    fold(`DESCRIPTION:${icsEscape(`Abre la app para ver cómo cambia tu cuerpo y tu mensaje del día.${appUrl ? `\n${appUrl}` : ''}`)}`),
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Tu mensaje de hoy', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return lines.join('\r\n') + '\r\n';
}

/**
 * Lo que se pierde al volver a fumar: se usa para el aviso tras una recaída
 * y, en el SOS, para "adelantar la película" antes de fumar.
 */
export function relapseCost(profile, count = 1, now = Date.now()) {
  const st = milestoneStatus(profile.quitAt, now);
  return {
    streakMs: Math.max(0, elapsedMs(profile.quitAt, now)),
    lostMilestones: st.filter((m) => m.unlocked),
    nextMilestone: st.find((m) => !m.unlocked) || null,
    avoided: cigarettesAvoided(profile, now),
    money: moneySaved(profile, now),
    lifeRegained: lifeRegainedMinutes(profile, now),
    smokedCost: count * pricePerCigarette(profile),
    lifeLost: count * MINUTES_PER_CIGARETTE,
  };
}

/** Racha más larga: los intentos anteriores (resets) y el actual. */
export function bestStreakMs(resets = [], quitAt, now = Date.now()) {
  const past = resets.map((r) => toMs(r.at) - toMs(r.previousQuitAt));
  return Math.max(0, elapsedMs(quitAt, now), ...past);
}

/** Qué estrategias del SOS se han usado y cuánto bajó el deseo de media con ellas. */
export function strategyStats(logs) {
  const acc = {};
  for (const l of logs) {
    if (l.type !== 'craving' || !l.strategies?.length || typeof l.intensityAfter !== 'number') continue;
    for (const id of l.strategies) {
      acc[id] ??= { id, count: 0, drop: 0, resisted: 0 };
      acc[id].count++;
      acc[id].drop += l.intensity - l.intensityAfter;
      if (l.resisted) acc[id].resisted++;
    }
  }
  return Object.values(acc)
    .map((a) => ({ id: a.id, count: a.count, resisted: a.resisted, avgDrop: a.drop / a.count }))
    .sort((a, b) => b.avgDrop - a.avgDrop || b.count - a.count);
}
