// El service worker muestra los avisos push que envía GitHub Actions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function loadSW() {
  const handlers = {};
  const shown = [];
  const self = {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    registration: { scope: 'https://x.github.io/dejar-de-fumar/', showNotification: async (title, opts) => { shown.push({ title, ...opts }); } },
    clients: {},
  };
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), { self, caches: {}, location: new URL(self.registration.scope), fetch, URL, Response });
  return { handlers, shown };
}

async function fire(handler, event) {
  let p;
  handler({ ...event, waitUntil: (x) => { p = x; } });
  await p;
}

test('push con JSON muestra la notificación', async () => {
  const { handlers, shown } = loadSW();
  await fire(handlers.push, { data: { json: () => ({ title: '🫁 Respiras mejor', body: 'Los bronquios se relajan', tag: 'hito-d3', url: 'https://x.github.io/dejar-de-fumar/#/cuerpo' }) } });
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, '🫁 Respiras mejor');
  assert.equal(shown[0].tag, 'hito-d3');
  assert.equal(shown[0].data.url, 'https://x.github.io/dejar-de-fumar/#/cuerpo');
});

test('push sin datos o con texto también muestra algo', async () => {
  const { handlers, shown } = loadSW();
  await fire(handlers.push, { data: null });
  await fire(handlers.push, { data: { json: () => { throw new Error('no json'); }, text: () => 'hola' } });
  assert.equal(shown.length, 2);
  assert.equal(shown[0].title, 'Sin humo');
  assert.equal(shown[1].body, 'hola');
});
