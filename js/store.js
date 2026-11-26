// Persistencia local. Todo se guarda en este dispositivo: no hay servidor.
const KEY = 'ddf-state-v1';

const DEFAULT_STATE = () => ({
  version: 1,
  profile: null, // se crea en la configuración inicial
  logs: [], // {id, type: 'cigarette'|'craving'|'lapse'|'med', at, ...}
  checklist: {},
  notified: [], // ids de hitos ya notificados
  settings: { harmFrequency: 'sometimes', notifications: false, dailyHour: 9 },
  resets: [],
});

let memory = null;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const def = DEFAULT_STATE();
      return { ...def, ...s, settings: { ...def.settings, ...(s.settings || {}) } };
    }
  } catch { /* almacenamiento no disponible: usamos memoria */ }
  return memory || DEFAULT_STATE();
}

export function save(state) {
  memory = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento */ }
}

export function reset() {
  memory = null;
  try { localStorage.removeItem(KEY); } catch { /* nada */ }
  return DEFAULT_STATE();
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const s = JSON.parse(text);
  if (!s || typeof s !== 'object' || !('logs' in s)) throw new Error('El archivo no parece una copia de esta app.');
  const def = DEFAULT_STATE();
  return { ...def, ...s, settings: { ...def.settings, ...(s.settings || {}) } };
}
