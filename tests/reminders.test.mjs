import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planNotifications } from '../js/reminders.js';
import { HOUR, MIN, DAY } from '../js/logic.js';

const quit = new Date('2026-03-01T08:00:00');
const cfg = (over = {}) => ({
  appUrl: 'https://x.github.io/dejar-de-fumar/',
  settings: { dailyHour: 9, harmFrequency: 'sometimes' },
  profile: {
    name: 'Ana', quitAt: quit.toISOString(), cigsPerDay: 20, pricePerPack: 5, cigsPerPack: 20,
    motives: ['Mi familia'], triggers: ['cafe'], plans: { cafe: 'tomaré té' }, medication: 'none',
  },
  ...over,
});
const at = (iso) => new Date(iso).getTime();

test('primera ejecución: guarda estado y no avisa de hitos antiguos', () => {
  // 08:30: aún no toca el mensaje diario. El hito de 48 h fue hace 30 min (sí);
  // los de 20 min, 8 h, 12 h y 24 h son antiguos (no).
  const r = planNotifications(cfg(), {}, at('2026-03-03T08:30:00'));
  assert.deepEqual(r.notifications.map((n) => n.tag), ['hito-d2']);
  assert.equal(r.changed, true);
  const r2 = planNotifications(cfg(), {}, at('2026-03-03T10:30:00'));
  assert.equal(r2.notifications.filter((n) => n.kind === 'milestone').length, 0);
});

test('hito alcanzado entre ejecuciones', () => {
  const t = quit.getTime() + 8 * HOUR + 5 * MIN; // 16:05
  const r = planNotifications(cfg(), { lastRun: t - 15 * MIN, lastDaily: '2026-03-01', lastHarm: '2026-03-01' }, t);
  const m = r.notifications.filter((n) => n.kind === 'milestone');
  assert.equal(m.length, 1);
  assert.match(m[0].title, /monóxido/);
  assert.equal(m[0].url, 'https://x.github.io/dejar-de-fumar/#/cuerpo');
  // La siguiente ejecución no lo repite.
  const r2 = planNotifications(cfg(), r.state, t + 15 * MIN);
  assert.equal(r2.notifications.filter((n) => n.kind === 'milestone').length, 0);
});

test('si GitHub se salta ejecuciones, no se pierde el hito', () => {
  const t = quit.getTime() + 8 * HOUR + 50 * MIN;
  const r = planNotifications(cfg(), { lastRun: t - 2 * HOUR, lastDaily: '2026-03-01', lastHarm: '2026-03-01' }, t);
  assert.equal(r.notifications.filter((n) => n.kind === 'milestone').length, 1);
});

test('mensaje diario una vez al día a partir de la hora elegida', () => {
  const s0 = { lastRun: at('2026-03-04T08:40:00'), lastDaily: '2026-03-03', lastHarm: '2026-03-04' };
  assert.equal(planNotifications(cfg(), s0, at('2026-03-04T08:55:00')).notifications.length, 0);
  const r = planNotifications(cfg(), s0, at('2026-03-04T09:07:00'));
  const d = r.notifications.find((n) => n.kind === 'daily');
  assert.ok(d);
  assert.match(d.title, /Día 4 sin fumar/);
  assert.match(d.title, /€/);
  assert.equal(r.state.lastDaily, '2026-03-04');
  assert.equal(planNotifications(cfg(), r.state, at('2026-03-04T09:22:00')).notifications.length, 0);
});

test('medicación en el mensaje diario', () => {
  const c = cfg(); c.profile.medication = 'nrt';
  const r = planNotifications(c, { lastRun: at('2026-03-04T08:40:00') }, at('2026-03-04T09:07:00'));
  assert.match(r.notifications.find((n) => n.kind === 'daily').body, /medicación/);
});

test('perjuicios por la tarde en días alternos, configurable', () => {
  const base = { lastRun: at('2026-03-03T17:40:00'), lastDaily: '2026-03-03' };
  const even = planNotifications(cfg(), base, at('2026-03-03T18:07:00')); // día 2: toca
  const h = even.notifications.find((n) => n.kind === 'harm');
  assert.ok(h);
  assert.match(h.body, /✅/);
  const odd = planNotifications(cfg(), { ...base, lastDaily: '2026-03-04', lastRun: at('2026-03-04T17:40:00') }, at('2026-03-04T18:07:00'));
  assert.equal(odd.notifications.filter((n) => n.kind === 'harm').length, 0);
  const never = planNotifications(cfg({ settings: { dailyHour: 9, harmFrequency: 'never' } }), base, at('2026-03-03T18:07:00'));
  assert.equal(never.notifications.filter((n) => n.kind === 'harm').length, 0);
});

test('fase de preparación: cuenta atrás en el mensaje diario', () => {
  const c = cfg(); c.profile.quitAt = new Date('2026-03-10T00:00:00').toISOString();
  const r = planNotifications(c, { lastRun: at('2026-03-07T08:50:00') }, at('2026-03-07T09:10:00'));
  const d = r.notifications.find((n) => n.kind === 'daily');
  assert.match(d.title, /Faltan 3 días/);
  const r2 = planNotifications(c, { lastRun: at('2026-03-09T08:50:00') }, at('2026-03-09T09:10:00'));
  assert.match(r2.notifications.find((n) => n.kind === 'daily').title, /Mañana/);
});

test('sin envíos no se reescribe el estado', () => {
  const s = { lastRun: at('2026-03-05T10:00:00'), lastDaily: '2026-03-05', lastHarm: '2026-03-05' };
  const r = planNotifications(cfg(), s, at('2026-03-05T10:15:00'));
  assert.equal(r.changed, false);
  assert.equal(DAY > 0, true);
});
