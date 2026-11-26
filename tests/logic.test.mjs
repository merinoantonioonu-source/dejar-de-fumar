import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY, HOUR, MIN, cigarettesAvoided, moneySaved, lifeRegainedMinutes, milestoneStatus, nextMilestone,
  formatDuration, dailyMessage, showHarmToday, harmOfDay, fillTemplate, toSecondPerson, cravingsByDay,
  topTriggers, buildICS, dayIndex, yearlyCost,
} from '../js/logic.js';
import { BODY_MILESTONES, HARMS, DAILY_MESSAGES, SOURCES } from '../js/content.js';

const base = new Date('2026-01-10T10:00:00');
const profile = (over = {}) => ({
  name: 'Ana', cigsPerDay: 20, pricePerPack: 5, cigsPerPack: 20, quitAt: base.toISOString(),
  motives: ['Mi familia'], triggers: ['cafe'], plans: { cafe: 'tomaré té' }, supportPerson: 'Luis', ...over,
});

test('cigarrillos, dinero y vida', () => {
  const p = profile();
  const t = base.getTime() + 2 * DAY;
  assert.equal(cigarettesAvoided(p, t), 40);
  assert.equal(moneySaved(p, t), 10);
  assert.equal(lifeRegainedMinutes(p, t), 800);
  assert.equal(cigarettesAvoided(p, base.getTime() - DAY), 0);
  assert.equal(yearlyCost(p), 1825);
});

test('hitos del cuerpo ordenados y con fuente', () => {
  for (let i = 1; i < BODY_MILESTONES.length; i++) assert.ok(BODY_MILESTONES[i].at > BODY_MILESTONES[i - 1].at);
  for (const m of BODY_MILESTONES) for (const s of m.src) assert.ok(SOURCES[s], `fuente ${s}`);
  for (const h of HARMS) for (const s of h.src) assert.ok(SOURCES[s], `fuente ${s}`);
});

test('estado de hitos', () => {
  const t = base.getTime() + 9 * HOUR;
  const st = milestoneStatus(base, t);
  assert.equal(st.filter((m) => m.unlocked).length, 2); // 20 min y 8 h
  const n = nextMilestone(base, t);
  assert.equal(n.id, 'h12');
  assert.equal(n.remainingMs, 3 * HOUR);
  assert.ok(n.progress > 0.2 && n.progress < 0.3);
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), 'menos de 1 min');
  assert.equal(formatDuration(5 * MIN), '5 min');
  assert.equal(formatDuration(DAY + 3 * HOUR + 5 * MIN), '1 d 3 h');
  assert.equal(formatDuration(DAY + 5 * MIN), '1 d');
  assert.equal(formatDuration(DAY + 3 * HOUR + 5 * MIN, { parts: 3 }), '1 d 3 h 5 min');
  assert.equal(formatDuration(400 * DAY, { parts: 1 }), '1 año');
});

test('mensajes diarios por fase y personalizados', () => {
  const p = profile();
  assert.equal(dailyMessage(p, base).day, 0);
  assert.match(dailyMessage(p, base).text, /Ana/);
  assert.match(dailyMessage(profile({ name: '' }), base).text, /^Hoy empieza todo\. /);
  const d3 = dailyMessage(p, base.getTime() + 3 * DAY);
  assert.match(d3.text, /con el café/);
  assert.match(d3.text, /entonces tomaré té/);
  assert.ok(dailyMessage(p, base.getTime() - 2 * DAY).day < 0);
  const late = dailyMessage(p, base.getTime() + 200 * DAY);
  assert.ok(late.text.length > 10);
  for (let d = -10; d < 60; d++) assert.doesNotMatch(dailyMessage(p, base.getTime() + d * DAY).text, /\{\w+\}/);
  assert.equal(DAILY_MESSAGES.length, 31);
});

test('motivos en segunda persona', () => {
  assert.equal(toSecondPerson('Mi familia'), 'tu familia');
  assert.equal(toSecondPerson('Ver crecer a mis hijos/as'), 'ver crecer a tus hijos/as');
  assert.equal(fillTemplate('{apoyo}', {}), 'alguien de confianza');
});

test('frecuencia de perjuicios', () => {
  assert.equal(showHarmToday(3, 'never'), false);
  assert.equal(showHarmToday(3, 'often'), true);
  assert.equal(showHarmToday(2, 'sometimes'), true);
  assert.equal(showHarmToday(3, 'sometimes'), false);
  const a = harmOfDay(profile(), base.getTime(), 'often');
  const b = harmOfDay(profile(), base.getTime() + DAY, 'often');
  assert.notEqual(a.id, b.id);
  const money = HARMS.findIndex((h) => h.id === 'money');
  const m = harmOfDay(profile(), base.getTime() + money * DAY, 'often');
  assert.match(m.fact, /1825|1\.825/);
});

test('dayIndex por días naturales', () => {
  const late = new Date('2026-01-10T23:30:00');
  assert.equal(dayIndex(late, new Date('2026-01-11T00:10:00')), 1);
});

test('estadísticas de deseos', () => {
  const now = new Date('2026-01-20T12:00:00');
  const logs = [
    { type: 'craving', at: '2026-01-20T08:00:00', resisted: true, trigger: 'cafe' },
    { type: 'craving', at: '2026-01-19T08:00:00', resisted: false, trigger: 'cafe' },
    { type: 'lapse', at: '2026-01-19T09:00:00', trigger: 'alcohol' },
  ];
  const d = cravingsByDay(logs, now, 14);
  assert.equal(d.length, 14);
  assert.equal(d[13].count, 1);
  assert.equal(d[13].resisted, 1);
  assert.equal(d[12].count, 1);
  assert.equal(topTriggers(logs)[0].trigger.id, 'cafe');
});

test('calendario ICS', () => {
  const ics = buildICS(profile(), base.getTime() + 30 * MIN, { appUrl: 'https://example.org/app/' });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  const events = ics.match(/BEGIN:VEVENT/g).length;
  assert.equal(events, BODY_MILESTONES.length - 1 + 1); // menos el de 20 min ya alcanzado, más el diario
  assert.match(ics, /RRULE:FREQ=DAILY;COUNT=30/);
  for (const line of ics.split('\r\n')) assert.ok(Array.from(line).length <= 75, line);
});

test('sin "12 meses"', () => {
  assert.equal(formatDuration(10 * 365 * DAY - 2 * DAY), '9 años 11 meses');
});
