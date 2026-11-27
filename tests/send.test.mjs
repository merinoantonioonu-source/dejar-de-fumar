// Prueba de extremo a extremo del envío: claves generadas igual que en el
// navegador (WebCrypto), un "servicio push" falso en HTTPS local y descifrado
// del mensaje recibido con la clave de la suscripción.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import crypto from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ece from 'http_ece';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

async function browserLikeVapid() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = b64url(await crypto.subtle.exportKey('raw', pair.publicKey));
  const { d } = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return { publicKey, privateKey: d };
}

function selfSignedCert(dir) {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes', '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem'), '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });
  return { key: readFileSync(join(dir, 'k.pem')), cert: readFileSync(join(dir, 'c.pem')) };
}

function run(env) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ['scripts/send-reminders.mjs'], { env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0', HTTPS_PROXY: '', https_proxy: '', ...env } });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => resolve({ code, out }));
  });
}

test('el script cifra y envía notificaciones push válidas', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ddf-'));
  const received = [];
  let status = 201;
  const server = https.createServer(selfSignedCert(dir), (req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { received.push({ headers: req.headers, body: Buffer.concat(chunks) }); res.writeHead(status); res.end(); });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  // Suscripción simulada del navegador.
  const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
  const auth = crypto.randomBytes(16);
  const vapid = await browserLikeVapid();
  const cfg = {
    v: 1, appUrl: 'https://x.github.io/dejar-de-fumar/', timezone: 'Europe/Madrid', vapid: { ...vapid, subject: 'https://x.github.io/dejar-de-fumar/' },
    subscription: { endpoint: `https://127.0.0.1:${port}/push/abc`, keys: { p256dh: b64url(ua.getPublicKey()), auth: b64url(auth) } },
    settings: { dailyHour: 0, harmFrequency: 'often' },
    profile: { name: 'Ana', quitAt: new Date(Date.now() - 3 * 86400e3).toISOString(), cigsPerDay: 20, pricePerPack: 5, cigsPerPack: 20, motives: ['Mi salud'], triggers: [], plans: {}, medication: 'none' },
  };
  const decrypt = (body) => JSON.parse(ece.decrypt(body, { version: 'aes128gcm', privateKey: ua, authSecret: auth }).toString());

  try {
    // 1) Prueba manual.
    const t = await run({ PUSH_CONFIG: JSON.stringify(cfg), TEST: 'true' });
    assert.equal(t.code, 0, t.out);
    assert.equal(received.length, 1);
    assert.match(received[0].headers.authorization, /^vapid t=.+, k=/);
    assert.equal(received[0].headers['content-encoding'], 'aes128gcm');
    assert.match(decrypt(received[0].body).title, /Los avisos funcionan/);

    // 2) Ejecución programada: mensaje diario (hora 0) y estado guardado.
    const stateFile = join(dir, 'estado.json');
    const r = await run({ PUSH_CONFIG: JSON.stringify(cfg), STATE_FILE: stateFile });
    assert.equal(r.code, 0, r.out);
    const titles = received.slice(1).map((x) => decrypt(x.body).title);
    assert.ok(titles.some((x) => /Día 4 sin fumar/.test(x)), titles.join(' | '));
    const st = JSON.parse(readFileSync(stateFile, 'utf8'));
    assert.ok(st.lastRun && st.lastDaily);

    // 3) Segunda ejecución inmediata: nada nuevo.
    const n = received.length;
    await run({ PUSH_CONFIG: JSON.stringify(cfg), STATE_FILE: stateFile });
    assert.equal(received.length, n);

    // 4) Suscripción caducada: el trabajo falla con un mensaje claro.
    status = 410;
    writeFileSync(stateFile, '{}');
    const bad = await run({ PUSH_CONFIG: JSON.stringify(cfg), TEST: 'true' });
    assert.notEqual(bad.code, 0);
    assert.match(bad.out, /ya no es válida/);

    // 5) Sin secreto: termina sin error.
    const none = await run({ PUSH_CONFIG: '' });
    assert.equal(none.code, 0);
  } finally {
    server.close();
  }
});
