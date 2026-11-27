// Avisos con la app cerrada (Web Push).
// La app genera en el propio móvil un par de claves VAPID y una suscripción
// push. Todo ello, junto con los datos necesarios para redactar los mensajes,
// forma un JSON que el usuario guarda como secreto PUSH_CONFIG en su repositorio
// de GitHub. Un workflow de GitHub Actions lo usa para enviar los avisos.
// Nada de esto sale del dispositivo salvo cuando el usuario lo copia.

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!window.crypto?.subtle;
}

/** Claves VAPID propias de este dispositivo (se generan una sola vez). */
export async function ensureVapid(existing) {
  if (existing?.publicKey && existing?.privateKey) return existing;
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = b64url(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return { publicKey, privateKey: jwk.d };
}

/** Crea (o reutiliza) la suscripción push ligada a estas claves. */
export async function subscribe(vapid) {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('No se ha concedido el permiso de notificaciones.');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    const key = sub.options?.applicationServerKey;
    const same = key && b64url(key) === vapid.publicKey;
    if (!same) { await sub.unsubscribe(); sub = null; }
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64url(vapid.publicKey) });
  }
  return sub.toJSON();
}

/** URL de la app y del formulario de secretos del repositorio (si está en GitHub Pages). */
export function repoInfo() {
  const appUrl = location.href.split('#')[0].replace(/index\.html$/, '');
  const m = location.hostname.match(/^([^.]+)\.github\.io$/);
  const repo = location.pathname.split('/').filter(Boolean)[0];
  const secretsUrl = m && repo ? `https://github.com/${m[1]}/${repo}/settings/secrets/actions/new` : null;
  const actionsUrl = m && repo ? `https://github.com/${m[1]}/${repo}/actions/workflows/recordatorios.yml` : null;
  return { appUrl, secretsUrl, actionsUrl };
}

/** JSON que se guarda como secreto PUSH_CONFIG. */
export function buildConfig(state, vapid, subscription) {
  const { appUrl } = repoInfo();
  const p = state.profile;
  return {
    v: 1,
    appUrl,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
    vapid: { publicKey: vapid.publicKey, privateKey: vapid.privateKey, subject: appUrl.startsWith('https:') ? appUrl : 'https://github.com' },
    subscription,
    settings: { dailyHour: state.settings.dailyHour, harmFrequency: state.settings.harmFrequency },
    profile: {
      name: p.name, quitAt: p.quitAt, cigsPerDay: p.cigsPerDay, pricePerPack: p.pricePerPack, cigsPerPack: p.cigsPerPack,
      motives: p.motives, triggers: p.triggers, plans: p.plans, supportPerson: p.supportPerson, medication: p.medication,
    },
  };
}

/** Huella de lo que afecta a los avisos, para saber si el secreto ha quedado desfasado. */
export function fingerprint(state) {
  const p = state.profile || {};
  return JSON.stringify([
    p.name, p.quitAt, p.cigsPerDay, p.pricePerPack, p.cigsPerPack, p.motives, p.triggers, p.plans, p.supportPerson,
    p.medication, state.settings.dailyHour, state.settings.harmFrequency,
  ]);
}
