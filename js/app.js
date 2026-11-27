import {
  BODY_MILESTONES, HARMS, TRIGGERS, MOTIVES, MOODS, MEDICATIONS, PREP_CHECKLIST, URGE_SURF_SCRIPT, LEARN, SOURCES,
} from './content.js';
import {
  DAY, MIN, elapsedMs, dayIndex, cigarettesAvoided, moneySaved, lifeRegainedMinutes, milestoneStatus, nextMilestone,
  formatDuration, formatLife, formatMoney, formatNumber, dailyMessage, showHarmToday, harmOfDay, harmFor,
  cravingsByDay, topTriggers, buildICS, yearlyCost,
} from './logic.js';
import * as store from './store.js';
import * as notify from './notify.js';
import * as push from './push.js';

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
let state = store.load();
const $app = document.getElementById('app');
const $nav = document.getElementById('nav');
const $toast = document.getElementById('toast');
const $modal = document.getElementById('modal');
let installEvent = null;

function commit(rerender = true) {
  store.save(state);
  notify.syncSchedule(state);
  if (rerender) render();
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const triggerById = (id) => TRIGGERS.find((t) => t.id === id);
const isQuit = () => state.profile && elapsedMs(state.profile.quitAt) >= 0;
const now = () => Date.now();

function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => $toast.classList.remove('show'), 3200);
}

function showModal(html) {
  $modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}<button class="btn primary block" data-action="close-modal">Seguir</button></div>`;
  $modal.hidden = false;
  $modal.querySelector('button')?.focus();
}

function srcLinks(ids = []) {
  if (!ids.length) return '';
  return `<span class="src">Fuente: ${ids.map((id) => SOURCES[id] ? `<a href="${SOURCES[id].url}" target="_blank" rel="noopener">${esc(SOURCES[id].label.split(' – ')[0])}</a>` : '').join(', ')}</span>`;
}

function toLocalInput(d) {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

const dateFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const shortDate = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------
const routes = {
  '': viewHome, cuerpo: viewBody, sos: viewSOS, progreso: viewProgress, plan: viewPlan,
  ajustes: viewSettings, aprende: viewLearn, desliz: viewLapse, registro: viewLogCigarette,
};

function currentRoute() {
  return (location.hash.replace(/^#\/?/, '').split('?')[0]) || '';
}

function render() {
  if (!state.profile) {
    $nav.hidden = true;
    $app.innerHTML = viewOnboarding();
    document.title = 'Dejar de fumar';
    return;
  }
  $nav.hidden = false;
  const r = currentRoute();
  const view = routes[r] || viewHome;
  $app.innerHTML = view();
  for (const a of $nav.querySelectorAll('a')) a.classList.toggle('active', a.dataset.route === r);
  afterRender(r);
}

window.addEventListener('hashchange', () => {
  if (currentRoute() !== 'sos') resetSOS();
  render();
  window.scrollTo(0, 0);
});

// ---------------------------------------------------------------------------
// Configuración inicial
// ---------------------------------------------------------------------------
const draft = {
  step: 0, name: '', cigsPerDay: '', pricePerPack: '', cigsPerPack: '20', mode: 'now',
  quitAt: toLocalInput(now()), futureDate: '', motives: [], customMotive: '', triggers: [], plans: {},
  medication: 'none', supportPerson: '', rewardName: '', rewardCost: '',
};

const STEPS = ['Bienvenida', 'Tu consumo', 'Tu fecha', 'Tus motivos', 'Tus momentos', 'Tus planes', 'Tu apoyo'];

function viewOnboarding() {
  const s = draft.step;
  const progress = `<div class="steps" aria-label="Paso ${s + 1} de ${STEPS.length}">${STEPS.map((_, i) => `<span class="${i <= s ? 'on' : ''}"></span>`).join('')}</div>`;
  let body = '';
  if (s === 0) {
    body = `
      <div class="hero-icon" aria-hidden="true">🚭</div>
      <h1>Vamos a dejarlo juntos</h1>
      <p class="lead">Esta app reúne lo que ha demostrado funcionar en estudios científicos:</p>
      <ul class="ticks">
        <li><b>Ver cómo se recupera tu cuerpo</b> con cada hito sin fumar.</li>
        <li><b>Mensajes diarios</b> adaptados a tu fase, como los programas de SMS con mejor evidencia.</li>
        <li><b>Surfear el deseo</b> en lugar de pelear con él (terapia ACT, la de iCanQuit).</li>
        <li><b>Planes "si… entonces…"</b> para tus momentos de riesgo.</li>
        <li>Recordatorios de <b>lo que el tabaco te quita</b> y de cómo recuperarlo.</li>
      </ul>
      <p class="muted small">🔒 Tus datos se guardan solo en este dispositivo. Esta app no sustituye el consejo médico: combinarla con medicación y apoyo profesional es lo más eficaz.</p>
      <label class="field">¿Cómo quieres que te llame? (opcional)
        <input name="name" value="${esc(draft.name)}" autocomplete="given-name" placeholder="Tu nombre">
      </label>`;
  } else if (s === 1) {
    body = `
      <h1>Tu consumo</h1>
      <p class="lead">Lo usamos para calcular cigarrillos evitados, dinero ahorrado y vida recuperada.</p>
      <label class="field">Cigarrillos al día
        <input name="cigsPerDay" inputmode="numeric" value="${esc(draft.cigsPerDay)}" placeholder="p. ej. 15" required>
      </label>
      <div class="row2">
        <label class="field">Precio del paquete (€)
          <input name="pricePerPack" inputmode="decimal" value="${esc(draft.pricePerPack)}" placeholder="p. ej. 5,50" required>
        </label>
        <label class="field">Cigarrillos por paquete
          <input name="cigsPerPack" inputmode="numeric" value="${esc(draft.cigsPerPack)}">
        </label>
      </div>
      <p class="muted small">Si fumas tabaco de liar, calcula el coste aproximado de 20 cigarrillos.</p>`;
  } else if (s === 2) {
    const minDate = new Date(); const maxDate = new Date(now() + 14 * DAY);
    const d = (x) => toLocalInput(x).slice(0, 10);
    body = `
      <h1>Tu fecha</h1>
      <div class="choice">
        <label class="opt"><input type="radio" name="mode" value="now" ${draft.mode === 'now' ? 'checked' : ''}>
          <span><b>Ya lo he dejado / lo dejo ahora</b><br><span class="muted small">Indica cuándo fue tu último cigarrillo.</span></span></label>
        <label class="opt"><input type="radio" name="mode" value="future" ${draft.mode === 'future' ? 'checked' : ''}>
          <span><b>Quiero prepararme y elegir un día</b><br><span class="muted small">Mejor en las próximas 2 semanas. Mientras, registrarás tus cigarrillos para conocer tus momentos de riesgo.</span></span></label>
      </div>
      ${draft.mode === 'now'
        ? `<label class="field">Último cigarrillo<input type="datetime-local" name="quitAt" value="${esc(draft.quitAt)}" max="${toLocalInput(now())}"></label>`
        : `<label class="field">Mi día D (desde las 00:00)<input type="date" name="futureDate" value="${esc(draft.futureDate)}" min="${d(minDate)}" max="${d(maxDate)}"></label>`}`;
  } else if (s === 3) {
    body = `
      <h1>¿Por qué quieres dejarlo?</h1>
      <p class="lead">Tus motivos son tu brújula: aparecerán cada vez que tengas ganas. Elige los que de verdad te importen.</p>
      <div class="chips">${[...new Set([...MOTIVES, ...draft.motives])].map((m) => `<button type="button" class="chip ${draft.motives.includes(m) ? 'on' : ''}" data-action="toggle-motive" data-value="${esc(m)}" aria-pressed="${draft.motives.includes(m)}">${esc(m)}</button>`).join('')}</div>
      <div class="inline-add">
        <input name="customMotive" value="${esc(draft.customMotive)}" placeholder="Otro motivo, con tus palabras">
        <button type="button" class="btn" data-action="add-motive">Añadir</button>
      </div>`;
  } else if (s === 4) {
    body = `
      <h1>¿Cuándo sueles fumar?</h1>
      <p class="lead">Son tus momentos de riesgo. Prepararemos un plan para cada uno.</p>
      <div class="chips">${TRIGGERS.map((t) => `<button type="button" class="chip ${draft.triggers.includes(t.id) ? 'on' : ''}" data-action="toggle-trigger" data-value="${t.id}" aria-pressed="${draft.triggers.includes(t.id)}">${t.icon} ${esc(t.label)}</button>`).join('')}</div>`;
  } else if (s === 5) {
    body = `
      <h1>Tus planes "si… entonces…"</h1>
      <p class="lead">Decidir de antemano qué harás duplica las probabilidades de cumplir un propósito. Toca una sugerencia o escribe la tuya.</p>
      ${draft.triggers.length ? draft.triggers.map((id) => { const t = triggerById(id); return `
        <div class="card plan-card">
          <div class="plan-if">Si estoy <b>${esc(t.label.toLowerCase())}</b>, entonces…</div>
          <input name="plan-${t.id}" data-plan="${t.id}" value="${esc(draft.plans[t.id] || '')}" placeholder="${esc(t.tips[0])}">
          <div class="chips small">${t.tips.map((tip) => `<button type="button" class="chip" data-action="use-tip" data-trigger="${t.id}" data-value="${esc(tip)}">${esc(tip)}</button>`).join('')}</div>
        </div>`; }).join('') : '<p class="muted">No has elegido momentos. Puedes volver atrás o añadirlos más tarde en "Plan".</p>'}`;
  } else if (s === 6) {
    body = `
      <h1>Tu apoyo</h1>
      <label class="field">Medicación para dejar de fumar
        <select name="medication">${MEDICATIONS.map((m) => `<option value="${m.id}" ${draft.medication === m.id ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}</select>
      </label>
      <p class="muted small">💊 La medicación combinada con apoyo es lo que más aumenta las probabilidades de éxito. Algunos tratamientos están financiados con receta: pregunta en tu centro de salud o farmacia.</p>
      <label class="field">Persona de apoyo (opcional)
        <input name="supportPerson" value="${esc(draft.supportPerson)}" placeholder="p. ej. Laura">
      </label>
      <div class="row2">
        <label class="field">Mi recompensa
          <input name="rewardName" value="${esc(draft.rewardName)}" placeholder="p. ej. Un fin de semana fuera">
        </label>
        <label class="field">Cuesta (€)
          <input name="rewardCost" inputmode="decimal" value="${esc(draft.rewardCost)}" placeholder="300">
        </label>
      </div>
      <p class="muted small">Recompensarte con el dinero que ahorras funciona mejor que los premios virtuales.</p>`;
  }
  const canBack = s > 0;
  const last = s === STEPS.length - 1;
  return `
    <form class="onboarding" data-form="onboarding" novalidate>
      ${progress}
      ${body}
      <p class="error" id="ob-error" role="alert"></p>
      <div class="actions">
        ${canBack ? '<button type="button" class="btn ghost" data-action="ob-back">Atrás</button>' : '<span></span>'}
        <button type="submit" class="btn primary">${last ? 'Empezar' : 'Continuar'}</button>
      </div>
    </form>`;
}

function readOnboardingInputs(form) {
  const fd = new FormData(form);
  for (const [k, v] of fd.entries()) {
    if (k.startsWith('plan-')) draft.plans[k.slice(5)] = String(v).trim();
    else if (k in draft) draft[k] = String(v);
  }
}

function onboardingNext(form) {
  readOnboardingInputs(form);
  const err = (m) => { form.querySelector('#ob-error').textContent = m; };
  const s = draft.step;
  if (s === 1) {
    if (num(draft.cigsPerDay) <= 0) return err('Indica cuántos cigarrillos fumas al día.');
    if (num(draft.pricePerPack) <= 0) return err('Indica el precio del paquete.');
  }
  if (s === 2) {
    if (draft.mode === 'future' && !draft.futureDate) return err('Elige tu día D.');
    if (draft.mode === 'now' && new Date(draft.quitAt).getTime() > now() + MIN) return err('El último cigarrillo no puede ser en el futuro.');
  }
  if (s === 3 && !draft.motives.length) return err('Elige al menos un motivo.');
  if (s < STEPS.length - 1) { draft.step++; render(); window.scrollTo(0, 0); return; }

  const quitAt = draft.mode === 'now'
    ? new Date(draft.quitAt || now()).toISOString()
    : new Date(`${draft.futureDate}T00:00`).toISOString();
  state.profile = {
    name: draft.name.trim(),
    cigsPerDay: num(draft.cigsPerDay),
    pricePerPack: num(draft.pricePerPack),
    cigsPerPack: num(draft.cigsPerPack) || 20,
    quitAt,
    createdAt: new Date().toISOString(),
    motives: draft.motives,
    triggers: draft.triggers,
    plans: Object.fromEntries(Object.entries(draft.plans).filter(([k, v]) => v && draft.triggers.includes(k))),
    medication: draft.medication,
    supportPerson: draft.supportPerson.trim(),
    supportPhone: '',
    reward: { name: draft.rewardName.trim(), cost: num(draft.rewardCost) },
  };
  // Los hitos ya alcanzados no se notifican de golpe.
  state.notified = milestoneStatus(quitAt).filter((m) => m.unlocked).map((m) => m.id);
  if (draft.mode === 'future') state.checklist.fecha = true;
  if (draft.triggers.some((t) => state.profile.plans[t])) state.checklist.planes = true;
  if (state.profile.reward.name) state.checklist.recompensa = true;
  location.hash = '#/';
  commit();
  if (draft.mode === 'now') toast('¡Empieza tu camino! Ni una calada.');
}

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------
function harmCard(h, title = 'Lo que el tabaco te quita') {
  return `
    <section class="card harm" aria-label="${esc(title)}">
      <div class="eyebrow">⚠️ ${esc(title)} · ${esc(h.title)}</div>
      <p class="harm-fact">${esc(h.fact)}</p>
      <p class="harm-gain">✅ ${esc(h.gain)}</p>
      ${srcLinks(h.src)}
    </section>`;
}

function rewardCard() {
  const r = state.profile.reward;
  if (!r?.name || !r.cost) return '';
  const saved = moneySaved(state.profile);
  const p = Math.min(1, saved / r.cost);
  return `
    <section class="card">
      <div class="eyebrow">🎁 Tu recompensa</div>
      <div class="between"><b>${esc(r.name)}</b><span>${formatMoney(saved)} / ${formatMoney(r.cost)}</span></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}"><span style="width:${p * 100}%"></span></div>
      ${p >= 1 ? '<p class="ok">¡Ya puedes darte tu recompensa! Te la has ganado.</p>' : `<p class="muted small">Te faltan ${formatMoney(r.cost - saved)}.</p>`}
    </section>`;
}

function medCard() {
  const med = state.profile.medication;
  if (!med || med === 'none') return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const done = state.logs.some((l) => l.type === 'med' && new Date(l.at) >= today);
  const label = MEDICATIONS.find((m) => m.id === med)?.label || 'medicación';
  return `
    <section class="card med">
      <div class="between">
        <span>💊 <b>Medicación de hoy</b><br><span class="muted small">${esc(label)}</span></span>
        ${done ? '<span class="ok">✓ Hecho</span>' : '<button class="btn small" data-action="med-done">La he tomado</button>'}
      </div>
    </section>`;
}

function viewHome() {
  const p = state.profile;
  const msg = dailyMessage(p);
  const harmFreq = state.settings.harmFrequency;
  if (!isQuit()) {
    const left = -elapsedMs(p.quitAt);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCigs = state.logs.filter((l) => l.type === 'cigarette' && new Date(l.at) >= today).length;
    const totalCigs = state.logs.filter((l) => l.type === 'cigarette').length;
    const tops = topTriggers(state.logs.filter((l) => l.type === 'cigarette'));
    const done = PREP_CHECKLIST.filter((c) => state.checklist[c.id]).length;
    return `${pushOutdatedBanner()}
      <section class="hero prep">
        <div class="eyebrow">Fase de preparación</div>
        <div class="big" data-live="countdown">${formatDuration(left)}</div>
        <div>para tu día D · ${dateFmt.format(new Date(p.quitAt))}</div>
      </section>
      <section class="card message"><div class="eyebrow">💬 Mensaje de hoy</div><p>${esc(msg.text)}</p></section>
      <section class="card">
        <div class="eyebrow">📝 Registro previo</div>
        <p>Anota cada cigarrillo: descubrirás tus momentos de riesgo. Hoy: <b>${todayCigs}</b> · Total: <b>${totalCigs}</b></p>
        ${tops.length ? `<p class="small">Tus momentos más frecuentes: ${tops.map((t) => `${t.trigger.icon} ${esc(t.trigger.label)} (${t.count})`).join(' · ')}</p>` : ''}
        <a class="btn primary block" href="#/registro">He fumado un cigarrillo</a>
      </section>
      ${harmFreq !== 'never' ? harmCard(harmOfDay(p, now(), 'often')) : ''}
      <section class="card">
        <div class="eyebrow">✅ Preparación (${done}/${PREP_CHECKLIST.length})</div>
        ${checklistHTML()}
      </section>
      ${medCard()}
      <section class="card center">
        <p class="small muted">¿Te sientes preparado/a antes de tiempo?</p>
        <button class="btn" data-action="quit-now">Lo dejo ahora</button>
      </section>`;
  }
  const ms = elapsedMs(p.quitAt);
  const next = nextMilestone(p.quitAt);
  const status = milestoneStatus(p.quitAt);
  const recent = status.filter((m) => m.unlocked && now() - m.unlockAt.getTime() < DAY).pop();
  const lapses = state.logs.filter((l) => l.type === 'lapse' && new Date(l.at) >= new Date(p.quitAt)).length;
  return `${pushOutdatedBanner()}
    <section class="hero">
      <div class="eyebrow">${p.name ? `${esc(p.name)}, llevas` : 'Llevas'} sin fumar</div>
      <div class="big" data-live="elapsed">${formatDuration(ms, { parts: 3 })}</div>
      ${lapses ? `<div class="small">con ${lapses} desliz${lapses > 1 ? 'es' : ''} superado${lapses > 1 ? 's' : ''}</div>` : ''}
    </section>
    <div class="tiles">
      <div class="tile"><div class="tile-v" data-live="avoided">${formatNumber(cigarettesAvoided(p))}</div><div class="tile-l">cigarrillos evitados</div></div>
      <div class="tile"><div class="tile-v" data-live="money">${formatMoney(moneySaved(p))}</div><div class="tile-l">ahorrados</div></div>
      <div class="tile"><div class="tile-v" data-live="life">${formatLife(lifeRegainedMinutes(p))}</div><div class="tile-l">de vida recuperada*</div></div>
    </div>
    ${recent ? `
      <a class="card unlocked-card" href="#/cuerpo">
        <div class="eyebrow">🎉 Nuevo cambio en tu cuerpo</div>
        <div class="ms-head"><span class="ms-icon">${recent.icon}</span><b>${esc(recent.title)}</b></div>
        <p>${esc(recent.body)}</p>
      </a>` : ''}
    ${next ? `
      <a class="card next" href="#/cuerpo">
        <div class="eyebrow">Próximo cambio en tu cuerpo · en <span data-live="next-left">${formatDuration(next.remainingMs)}</span></div>
        <div class="ms-head"><span class="ms-icon">${next.icon}</span><b>${esc(next.title)}</b></div>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(next.progress * 100)}"><span data-live="next-bar" style="width:${next.progress * 100}%"></span></div>
        <p class="small muted">${esc(next.area)} · toca para ver todos tus hitos</p>
      </a>` : ''}
    <section class="card message"><div class="eyebrow">💬 Mensaje del día ${msg.day + 1}</div><p>${esc(msg.text)}</p></section>
    ${showHarmToday(msg.day, harmFreq) ? harmCard(harmOfDay(p, now(), harmFreq)) : ''}
    ${medCard()}
    ${rewardCard()}
    <a class="btn sos-big block" href="#/sos">🆘 Tengo ganas de fumar</a>
    <p class="center"><a class="link-muted" href="#/desliz">He fumado</a></p>
    <p class="muted tiny">* Estimación media de ~20 minutos de vida por cigarrillo (UCL, 2025).</p>`;
}

function checklistHTML() {
  return `<ul class="checklist">${PREP_CHECKLIST.map((c) => `
    <li><label><input type="checkbox" data-action="check" data-id="${c.id}" ${state.checklist[c.id] ? 'checked' : ''}> <span>${esc(c.label)}</span></label></li>`).join('')}</ul>`;
}

// ---------------------------------------------------------------------------
// Cuerpo (insignias)
// ---------------------------------------------------------------------------
function viewBody() {
  const p = state.profile;
  const st = milestoneStatus(p.quitAt);
  const got = st.filter((m) => m.unlocked).length;
  const quit = isQuit();
  let currentMarked = false;
  return `
    <h1>Tu cuerpo se recupera</h1>
    <p class="lead">${quit ? `Has conseguido <b>${got} de ${st.length}</b> cambios. Cada uno es real y ya está ocurriendo dentro de ti.` : 'Esto empezará a ocurrir desde tu día D. Cada hito será una insignia.'}</p>
    <ol class="timeline">
      ${st.map((m) => {
        let cls = 'locked'; let meta = `en ${formatDuration(m.remainingMs)}`;
        if (m.unlocked) { cls = 'done'; meta = `✓ ${dateFmt.format(m.unlockAt)}`; } else if (quit && !currentMarked) { cls = 'current'; currentMarked = true; }
        if (!quit) meta = `${formatDuration(m.at * MIN)} después de dejarlo`;
        return `
          <li class="ms ${cls}">
            <div class="ms-dot" aria-hidden="true">${m.icon}</div>
            <div class="ms-body">
              <div class="ms-meta"><span class="ms-time">${formatDuration(m.at * MIN, { parts: 1 })}</span> · ${esc(m.area)} · <span>${meta}</span></div>
              <h3>${esc(m.title)}</h3>
              <p>${esc(m.body)}</p>
              ${cls === 'current' ? `<div class="bar"><span style="width:${m.progress * 100}%"></span></div>` : ''}
              ${srcLinks(m.src)}
            </div>
          </li>`;
      }).join('')}
    </ol>
    <p class="muted tiny">Los tiempos son aproximados y varían según la persona, los años fumando y la cantidad.</p>`;
}

// ---------------------------------------------------------------------------
// SOS: surfear el deseo
// ---------------------------------------------------------------------------
const SURF_SECONDS = 180;
const sos = { step: 0, intensity: 7, after: 4, trigger: '', start: 0, timer: null, breath: null };

function stopSOS() {
  clearInterval(sos.timer); clearTimeout(sos.breath);
  sos.timer = null; sos.breath = null;
}

function resetSOS() { stopSOS(); Object.assign(sos, { step: 0, intensity: 7, after: 4, trigger: '', start: 0 }); }

function viewSOS() {
  const p = state.profile;
  const steps = ['Puntúa', 'Surfea', 'Plan', 'Recuerda', 'Resultado'];
  const head = `<div class="sos-steps">${steps.map((s, i) => `<span class="${i === sos.step ? 'on' : i < sos.step ? 'done' : ''}">${s}</span>`).join('')}</div>`;
  if (sos.step === 0) {
    return `${head}
      <h1>Tranquilidad: esto pasa</h1>
      <p class="lead">Un deseo es como una ola: sube, llega a un pico y baja en unos minutos aunque no hagas nada. No tienes que obedecerlo.</p>
      <label class="field">¿Cómo de fuerte es ahora? <b id="int-v">${sos.intensity}</b>/10
        <input type="range" min="1" max="10" value="${sos.intensity}" data-range="intensity" aria-label="Intensidad del deseo">
      </label>
      <button class="btn primary block" data-action="sos-next">Empezar a surfear (3 min)</button>`;
  }
  if (sos.step === 1) {
    return `${head}
      <div class="surf">
        <div class="breath" aria-hidden="true"><div class="breath-circle"></div><span class="breath-label" id="breath-label">Inspira</span></div>
        <div class="surf-timer" id="surf-timer" aria-live="off">3:00</div>
        <p class="surf-text" id="surf-text" aria-live="polite">${esc(URGE_SURF_SCRIPT[0])}</p>
      </div>
      <button class="btn primary block" data-action="sos-next">Ya ha bajado, seguir</button>`;
  }
  if (sos.step === 2) {
    const mine = p.triggers || [];
    const ordered = [...mine.map(triggerById).filter(Boolean), ...TRIGGERS.filter((t) => !mine.includes(t.id))];
    const t = sos.trigger && triggerById(sos.trigger);
    const plan = t && p.plans?.[t.id];
    return `${head}
      <h1>¿Qué lo ha provocado?</h1>
      <div class="chips">${ordered.map((x) => `<button type="button" class="chip ${sos.trigger === x.id ? 'on' : ''}" data-action="sos-trigger" data-value="${x.id}" aria-pressed="${sos.trigger === x.id}">${x.icon} ${esc(x.label)}</button>`).join('')}</div>
      ${t ? `<section class="card plan-card">
        <div class="plan-if">Si estoy <b>${esc(t.label.toLowerCase())}</b>, entonces…</div>
        ${plan ? `<p class="plan-then">${esc(plan)}</p>` : `<p class="muted small">Aún no tienes plan para este momento. Ideas:</p><ul>${t.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <button class="btn small" data-action="sos-save-plan" data-value="${esc(t.tips[0])}">Guardar "${esc(t.tips[0])}" como mi plan</button>`}
      </section>` : ''}
      <button class="btn primary block" data-action="sos-next">Siguiente</button>`;
  }
  if (sos.step === 3) {
    const next = isQuit() ? nextMilestone(p.quitAt) : null;
    const h = harmFor(p, Math.floor(Math.random() * HARMS.length));
    return `${head}
      <h1>Recuerda por qué</h1>
      <section class="card motives"><div class="eyebrow">💚 Tus motivos</div>
        <ul>${(p.motives || []).map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section>
      ${next ? `<section class="card next"><div class="eyebrow">Si aguantas, en ${formatDuration(next.remainingMs)}:</div>
        <div class="ms-head"><span class="ms-icon">${next.icon}</span><b>${esc(next.title)}</b></div><p class="small">${esc(next.body)}</p></section>` : ''}
      ${harmCard(h, 'Si fumas ahora')}
      <button class="btn primary block" data-action="sos-next">Siguiente</button>`;
  }
  return `${head}
    <h1>¿Cómo está el deseo ahora?</h1>
    <label class="field">Intensidad: <b id="after-v">${sos.after}</b>/10 <span class="muted small">(antes: ${sos.intensity})</span>
      <input type="range" min="0" max="10" value="${sos.after}" data-range="after" aria-label="Intensidad ahora">
    </label>
    <button class="btn primary block" data-action="sos-win">💪 Lo he superado</button>
    <button class="btn block" data-action="sos-again">Necesito surfear otra vez</button>
    <button class="btn ghost block" data-action="sos-lost">He fumado</button>`;
}

function startSurf() {
  stopSOS();
  sos.start = now();
  const tick = () => {
    const el = document.getElementById('surf-timer');
    if (!el) return stopSOS();
    const left = Math.max(0, SURF_SECONDS - Math.floor((now() - sos.start) / 1000));
    el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    const idx = Math.min(URGE_SURF_SCRIPT.length - 1, Math.floor(((SURF_SECONDS - left) / SURF_SECONDS) * URGE_SURF_SCRIPT.length));
    const txt = document.getElementById('surf-text');
    if (txt && txt.dataset.idx !== String(idx)) { txt.dataset.idx = idx; txt.textContent = URGE_SURF_SCRIPT[idx]; }
    if (left === 0) {
      clearInterval(sos.timer);
      el.textContent = '¡Hecho!';
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };
  tick();
  sos.timer = setInterval(tick, 1000);
  // Respiración 4 s inspirar, 6 s espirar.
  let phase = 'in';
  const label = () => document.getElementById('breath-label');
  const circle = () => document.querySelector('.breath-circle');
  const setPhase = () => {
    if (!label()) return;
    label().textContent = phase === 'in' ? 'Inspira' : 'Espira';
    circle().className = `breath-circle ${phase}`;
  };
  setPhase();
  const loop = () => { phase = phase === 'in' ? 'out' : 'in'; setPhase(); clearTimeout(sos.breath); sos.breath = setTimeout(loop, phase === 'in' ? 4000 : 6000); };
  sos.breath = setTimeout(loop, 4000);
}

function logCraving(resisted) {
  state.logs.push({ id: store.uid(), type: 'craving', at: new Date().toISOString(), intensity: sos.intensity, intensityAfter: sos.after, trigger: sos.trigger || null, resisted });
}

// ---------------------------------------------------------------------------
// Desliz
// ---------------------------------------------------------------------------
function viewLapse() {
  const p = state.profile;
  return `
    <h1>Un desliz no es una recaída</h1>
    <p class="lead">Fumar un cigarrillo no borra lo que has conseguido. Lo que convierte un desliz en recaída es pensar "ya lo he estropeado, total…". No te castigues: aprende de lo que ha pasado y vuelve a cero ahora mismo.</p>
    <form data-form="lapse" class="stack">
      <label class="field">¿Cuántos cigarrillos?
        <input name="count" inputmode="numeric" value="1">
      </label>
      <fieldset class="field"><legend>¿Qué lo provocó?</legend>
        <div class="chips">${[...(p.triggers || []).map(triggerById).filter(Boolean), ...TRIGGERS.filter((t) => !(p.triggers || []).includes(t.id))].map((t) => `
          <label class="chip radio"><input type="radio" name="trigger" value="${t.id}"> ${t.icon} ${esc(t.label)}</label>`).join('')}</div>
      </fieldset>
      <label class="field">¿Qué harás diferente la próxima vez?
        <textarea name="note" rows="3" placeholder="p. ej. No iré a esa cena sin mi plan, o llamaré a ${esc(p.supportPerson || 'alguien')} antes"></textarea>
      </label>
      <div class="choice">
        <label class="opt"><input type="radio" name="decision" value="continue" checked>
          <span><b>Ha sido un desliz: sigo con mi fecha</b><br><span class="muted small">Recomendado si ha sido algo puntual.</span></span></label>
        <label class="opt"><input type="radio" name="decision" value="restart">
          <span><b>He vuelto a fumar: reinicio el contador ahora</b><br><span class="muted small">Tus registros y aprendizajes se conservan.</span></span></label>
      </div>
      <button class="btn primary block" type="submit">Guardar y volver a cero</button>
    </form>`;
}

function saveLapse(form) {
  const fd = new FormData(form);
  const count = Math.max(1, Math.round(num(fd.get('count')) || 1));
  const trigger = fd.get('trigger') || null;
  const note = String(fd.get('note') || '').trim();
  state.logs.push({ id: store.uid(), type: 'lapse', at: new Date().toISOString(), count, trigger, note });
  if (fd.get('decision') === 'restart') {
    state.resets.push({ at: new Date().toISOString(), previousQuitAt: state.profile.quitAt });
    state.profile.quitAt = new Date().toISOString();
    state.notified = [];
  }
  location.hash = '#/';
  commit();
  showModal(`<div class="hero-icon">🌱</div><h2>Ni una calada más</h2>
    <p>Has hecho lo más difícil: reconocerlo y seguir. ${note ? `Tu plan: <b>${esc(note)}</b>.` : ''}</p>
    <p class="small muted">Recuerda: cada intento enseña algo. La mayoría de personas que lo dejan para siempre lo consiguieron tras varios intentos.</p>`);
}

// ---------------------------------------------------------------------------
// Registro previo de cigarrillos
// ---------------------------------------------------------------------------
function viewLogCigarette() {
  const p = state.profile;
  const trig = [...(p.triggers || []).map(triggerById).filter(Boolean), ...TRIGGERS.filter((t) => !(p.triggers || []).includes(t.id))];
  return `
    <h1>Registrar cigarrillo</h1>
    <p class="lead">Anotarlo justo antes o después te ayuda a detectar el patrón. Tarda 10 segundos.</p>
    <form data-form="cig" class="stack">
      <fieldset class="field"><legend>¿En qué momento?</legend>
        <div class="chips">${trig.map((t) => `<label class="chip radio"><input type="radio" name="trigger" value="${t.id}"> ${t.icon} ${esc(t.label)}</label>`).join('')}</div>
      </fieldset>
      <fieldset class="field"><legend>¿Cómo te sentías?</legend>
        <div class="chips">${MOODS.map((m) => `<label class="chip radio"><input type="radio" name="mood" value="${m.id}"> ${m.icon} ${esc(m.label)}</label>`).join('')}</div>
      </fieldset>
      <label class="field">¿Cuánto lo necesitabas? <b id="need-v">5</b>/10
        <input type="range" name="need" min="1" max="10" value="5" data-range="need">
      </label>
      <button class="btn primary block" type="submit">Guardar</button>
      <a class="btn ghost block" href="#/">Cancelar</a>
    </form>`;
}

// ---------------------------------------------------------------------------
// Progreso
// ---------------------------------------------------------------------------
function cravingsChart(data) {
  const W = 340; const Hh = 150; const pad = { l: 24, r: 6, t: 12, b: 22 };
  const peak = Math.max(...data.map((d) => d.count));
  const max = Math.max(4, Math.ceil(peak / 2) * 2); // par: ticks 0, mitad, máximo
  const iw = W - pad.l - pad.r; const ih = Hh - pad.t - pad.b;
  const slot = iw / data.length; const bw = Math.max(4, slot - 4);
  const y = (v) => pad.t + ih - (v / max) * ih;
  const bars = data.map((d, i) => {
    const x = pad.l + i * slot + (slot - bw) / 2;
    const h = (d.count / max) * ih;
    const r = Math.min(4, h, bw / 2);
    const top = pad.t + ih - h;
    const path = h > 0
      ? `M${x},${pad.t + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${pad.t + ih} Z`
      : '';
    const label = `${shortDate.format(d.date)}: ${d.count} deseo${d.count === 1 ? '' : 's'}, ${d.resisted} superado${d.resisted === 1 ? '' : 's'}`;
    return `<g class="bar-g" data-tip="${esc(label)}" tabindex="0" role="img" aria-label="${esc(label)}">
      <rect x="${pad.l + i * slot}" y="${pad.t}" width="${slot}" height="${ih}" fill="transparent"/>
      ${path ? `<path d="${path}" class="bar-mark"/>` : ''}
    </g>`;
  }).join('');
  const ticks = [0, max / 2, max].map((v) => `
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/>
    <text x="${pad.l - 6}" y="${y(v) + 4}" class="axis" text-anchor="end">${v}</text>`).join('');
  const xl = data.map((d, i) => (i % 3 === 0 || i === data.length - 1)
    ? `<text x="${pad.l + i * slot + slot / 2}" y="${Hh - 6}" class="axis" text-anchor="middle">${d.date.getDate()}</text>` : '').join('');
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${Hh}" class="chart" aria-label="Deseos por día en los últimos 14 días">${ticks}${bars}${xl}</svg><div class="chart-tip" hidden></div></div>`;
}

const ACHIEVEMENTS = [
  { id: 'c1', icon: '🌊', label: 'Primer deseo surfeado', test: (s) => s.resisted >= 1 },
  { id: 'c10', icon: '🏄', label: '10 deseos superados', test: (s) => s.resisted >= 10 },
  { id: 'c50', icon: '🌟', label: '50 deseos superados', test: (s) => s.resisted >= 50 },
  { id: 'a100', icon: '🚭', label: '100 cigarrillos evitados', test: (s) => s.avoided >= 100 },
  { id: 'a1000', icon: '🏆', label: '1.000 cigarrillos evitados', test: (s) => s.avoided >= 1000 },
  { id: 'e100', icon: '💶', label: '100 € ahorrados', test: (s) => s.money >= 100 },
  { id: 'e1000', icon: '💰', label: '1.000 € ahorrados', test: (s) => s.money >= 1000 },
  { id: 'l1d', icon: '⏳', label: '1 día de vida recuperado', test: (s) => s.life >= 24 * 60 },
  { id: 'l1w', icon: '⌛', label: '1 semana de vida recuperada', test: (s) => s.life >= 7 * 24 * 60 },
];

function viewProgress() {
  const p = state.profile;
  const cravings = state.logs.filter((l) => l.type === 'craving');
  const resisted = cravings.filter((c) => c.resisted).length;
  const lapses = state.logs.filter((l) => l.type === 'lapse');
  const withAfter = cravings.filter((c) => typeof c.intensityAfter === 'number');
  const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const before = avg(withAfter.map((c) => c.intensity));
  const after = avg(withAfter.map((c) => c.intensityAfter));
  const data = cravingsByDay(state.logs);
  const tops = topTriggers([...cravings, ...lapses, ...state.logs.filter((l) => l.type === 'cigarette')]);
  const stats = { resisted, avoided: cigarettesAvoided(p), money: moneySaved(p), life: lifeRegainedMinutes(p) };
  const recent = [...state.logs].reverse().slice(0, 25);
  const typeLabel = { craving: '🌊 Deseo', lapse: '⚠️ Desliz', cigarette: '🚬 Cigarrillo', med: '💊 Medicación' };
  return `
    <h1>Tu progreso</h1>
    <div class="tiles">
      <div class="tile"><div class="tile-v">${isQuit() ? Math.floor(elapsedMs(p.quitAt) / DAY) : 0}</div><div class="tile-l">días sin fumar</div></div>
      <div class="tile"><div class="tile-v">${resisted}</div><div class="tile-l">deseos superados</div></div>
      <div class="tile"><div class="tile-v">${lapses.length}</div><div class="tile-l">deslices</div></div>
    </div>
    ${withAfter.length ? `<section class="card"><div class="eyebrow">🌊 El SOS funciona</div>
      <p>De media, tus deseos bajaron de <b>${before.toFixed(1).replace('.', ',')}</b> a <b>${after.toFixed(1).replace('.', ',')}</b> sobre 10 tras surfearlos.</p></section>` : ''}
    <section class="card">
      <div class="eyebrow">Deseos por día · últimos 14 días</div>
      ${cravings.length ? cravingsChart(data) : '<p class="muted small">Cuando uses el SOS verás aquí cómo los deseos se van espaciando.</p>'}
      ${cravings.length ? `<details class="small"><summary>Ver como tabla</summary><table class="tbl"><thead><tr><th>Día</th><th>Deseos</th><th>Superados</th></tr></thead><tbody>${data.map((d) => `<tr><td>${shortDate.format(d.date)}</td><td>${d.count}</td><td>${d.resisted}</td></tr>`).join('')}</tbody></table></details>` : ''}
    </section>
    ${tops.length ? `<section class="card"><div class="eyebrow">Tus momentos de riesgo</div>
      <ul class="plain">${tops.map((t) => `<li>${t.trigger.icon} ${esc(t.trigger.label)} <span class="muted">· ${t.count}</span>${p.plans?.[t.trigger.id] ? `<br><span class="small">Plan: ${esc(p.plans[t.trigger.id])}</span>` : `<br><a class="small" href="#/plan">Crear un plan</a>`}</li>`).join('')}</ul></section>` : ''}
    <section class="card"><div class="eyebrow">Logros de constancia</div>
      <div class="badges">${ACHIEVEMENTS.map((a) => { const ok = a.test(stats); return `<div class="badge ${ok ? 'on' : ''}" title="${esc(a.label)}"><span>${a.icon}</span><small>${esc(a.label)}</small></div>`; }).join('')}</div>
      <p class="muted tiny">Tus insignias principales son los <a href="#/cuerpo">cambios de tu cuerpo</a>.</p>
    </section>
    <section class="card"><div class="eyebrow">Historial</div>
      ${recent.length ? `<ul class="history">${recent.map((l) => `<li><span>${typeLabel[l.type] || l.type}${l.trigger ? ` · ${esc(triggerById(l.trigger)?.label || '')}` : ''}${l.type === 'craving' ? ` · ${l.intensity}→${l.intensityAfter ?? '?'} ${l.resisted ? '✓' : '✗'}` : ''}${l.type === 'lapse' ? ` · ${l.count}` : ''}<br><small class="muted">${dateFmt.format(new Date(l.at))}</small></span><button class="icon-btn" data-action="del-log" data-id="${l.id}" aria-label="Borrar registro">✕</button></li>`).join('')}</ul>` : '<p class="muted small">Aún no hay registros.</p>'}
    </section>`;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------
function viewPlan() {
  const p = state.profile;
  const others = TRIGGERS.filter((t) => !(p.triggers || []).includes(t.id));
  const med = p.medication || 'none';
  return `
    <h1>Tu plan</h1>
    <section class="card"><div class="eyebrow">💚 Mis motivos</div>
      <ul class="editable">${(p.motives || []).map((m, i) => `<li><span>${esc(m)}</span><button class="icon-btn" data-action="del-motive" data-i="${i}" aria-label="Quitar motivo">✕</button></li>`).join('')}</ul>
      <form data-form="add-motive" class="inline-add"><input name="motive" placeholder="Añadir un motivo" required><button class="btn">Añadir</button></form>
    </section>
    <section class="card"><div class="eyebrow">🧭 Mis planes "si… entonces…"</div>
      <form data-form="plans" class="stack">
        ${(p.triggers || []).map((id) => { const t = triggerById(id); if (!t) return ''; return `
          <div class="plan-card">
            <div class="between"><div class="plan-if">Si estoy <b>${esc(t.label.toLowerCase())}</b>, entonces…</div><button type="button" class="icon-btn" data-action="del-trigger" data-id="${t.id}" aria-label="Quitar momento">✕</button></div>
            <input name="plan-${t.id}" value="${esc(p.plans?.[t.id] || '')}" placeholder="${esc(t.tips[0])}">
          </div>`; }).join('')}
        ${others.length ? `<label class="field">Añadir un momento de riesgo
          <select name="newTrigger"><option value="">Elegir…</option>${others.map((t) => `<option value="${t.id}">${t.icon} ${esc(t.label)}</option>`).join('')}</select></label>` : ''}
        <button class="btn primary block" type="submit">Guardar planes</button>
      </form>
    </section>
    <section class="card"><div class="eyebrow">🤝 Apoyo</div>
      <form data-form="support" class="stack">
        <div class="row2">
          <label class="field">Persona de apoyo<input name="supportPerson" value="${esc(p.supportPerson || '')}"></label>
          <label class="field">Teléfono<input name="supportPhone" type="tel" value="${esc(p.supportPhone || '')}"></label>
        </div>
        ${p.supportPhone ? `<a class="btn block" href="tel:${esc(p.supportPhone.replace(/[^\d+]/g, ''))}">📞 Llamar a ${esc(p.supportPerson || 'mi apoyo')}</a>` : ''}
        <label class="field">Medicación
          <select name="medication">${MEDICATIONS.map((m) => `<option value="${m.id}" ${med === m.id ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}</select></label>
        <p class="muted small">💊 Combinar medicación con apoyo conductual es lo más eficaz. Consulta en tu centro de salud o farmacia; algunos tratamientos están financiados con receta.</p>
        <div class="row2">
          <label class="field">Mi recompensa<input name="rewardName" value="${esc(p.reward?.name || '')}"></label>
          <label class="field">Cuesta (€)<input name="rewardCost" inputmode="decimal" value="${p.reward?.cost || ''}"></label>
        </div>
        <button class="btn primary block" type="submit">Guardar</button>
      </form>
    </section>
    <section class="card"><div class="eyebrow">✅ Preparación</div>${checklistHTML()}</section>
    <a class="btn block" href="#/aprende">📚 Aprende cómo funciona</a>`;
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------
function viewSettings() {
  const p = state.profile;
  const s = state.settings;
  const perm = notify.permission();
  const permText = { granted: 'activadas', denied: 'bloqueadas en el navegador', default: 'sin permiso todavía', unsupported: 'no disponibles en este navegador' }[perm];
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
    <h1>Ajustes</h1>
    <section class="card"><div class="eyebrow">📲 Instalar en el móvil</div>
      ${standalone ? '<p class="ok">✓ La app está instalada.</p>' : installEvent
        ? '<button class="btn primary block" data-action="install">Instalar app</button>'
        : `<p class="small">${isIOS ? 'En Safari toca <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>.' : 'En Chrome toca el menú <b>⋮</b> → <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.'}</p>`}
    </section>
    ${pushCard(isIOS, standalone)}
    <section class="card"><div class="eyebrow">⏰ Mensaje diario</div>
      <label class="field">Hora del mensaje diario
        <select data-action="daily-hour">${Array.from({ length: 15 }, (_, i) => i + 7).map((h) => `<option value="${h}" ${s.dailyHour === h ? 'selected' : ''}>${h}:00</option>`).join('')}</select></label>
      <p class="muted small">Alternativa sin configurar nada: añade los hitos a tu calendario y sus alarmas te avisarán. Estado de los permisos de notificación: ${permText}.</p>
      <button class="btn block" data-action="ics">📅 Añadir hitos y recordatorio diario al calendario</button>
    </section>
    <section class="card"><div class="eyebrow">⚠️ Recordatorios de perjuicios del tabaco</div>
      <div class="choice compact">${[['often', 'A menudo (cada día)'], ['sometimes', 'De vez en cuando (días alternos)'], ['never', 'Nunca']].map(([v, l]) => `
        <label class="opt"><input type="radio" name="harmFrequency" data-action="harm-freq" value="${v}" ${s.harmFrequency === v ? 'checked' : ''}> <span>${l}</span></label>`).join('')}</div>
      <p class="muted small">Siempre aparecen acompañados de lo que ganas al dejarlo: así motivan sin paralizar.</p>
    </section>
    <section class="card"><div class="eyebrow">👤 Tus datos</div>
      <form data-form="profile" class="stack">
        <label class="field">Nombre<input name="name" value="${esc(p.name)}"></label>
        <div class="row2">
          <label class="field">Cigarrillos/día<input name="cigsPerDay" inputmode="numeric" value="${p.cigsPerDay}"></label>
          <label class="field">Precio paquete (€)<input name="pricePerPack" inputmode="decimal" value="${String(p.pricePerPack).replace('.', ',')}"></label>
        </div>
        <label class="field">Cigarrillos por paquete<input name="cigsPerPack" inputmode="numeric" value="${p.cigsPerPack}"></label>
        <label class="field">${isQuit() ? 'Último cigarrillo' : 'Día D'}<input type="datetime-local" name="quitAt" value="${toLocalInput(p.quitAt)}"></label>
        <p class="muted small">El tabaco te costaba unos ${formatMoney(yearlyCost(p))} al año.</p>
        <button class="btn primary block" type="submit">Guardar</button>
      </form>
    </section>
    <section class="card"><div class="eyebrow">💾 Copia de seguridad</div>
      <p class="muted small">Tus datos solo están en este dispositivo. Exporta una copia si cambias de móvil o de navegador.</p>
      <div class="row2"><button class="btn" data-action="export">Exportar</button><label class="btn file-btn">Importar<input type="file" accept="application/json" data-action="import" hidden></label></div>
      <button class="btn danger block" data-action="wipe">Borrar todos mis datos</button>
    </section>
    <section class="card"><div class="eyebrow">🔬 En qué se basa esta app</div>
      <ul class="plain small">
        <li><b>Mensajes diarios por fase</b>: los programas de SMS son la intervención digital con mejor evidencia (Cochrane).</li>
        <li><b>Surfear el deseo y valores</b>: técnicas de ACT; iCanQuit duplicó la abstinencia prolongada frente a la app de referencia del NCI.</li>
        <li><b>Hitos del cuerpo, dinero y "identidad de no fumador"</b>: técnicas de cambio de conducta usadas en Smoke Free.</li>
        <li><b>Planes "si… entonces…"</b>: intenciones de implementación.</li>
        <li><b>Perjuicios + eficacia</b>: los mensajes de miedo funcionan mejor si indican cómo evitar el daño.</li>
        <li><b>Desliz ≠ recaída</b> y regla de "ni una calada": prevención de recaídas.</li>
      </ul>
      <a href="#/aprende">Ver todas las fuentes</a>
    </section>
    <p class="muted tiny">Esta app es una herramienta de apoyo y no sustituye el consejo de un profesional sanitario.</p>`;
}

function pushOutdated() {
  return !!(state.push?.copiedFp && state.push.copiedFp !== push.fingerprint(state));
}

function pushOutdatedBanner() {
  if (!pushOutdated()) return '';
  return `<a class="card warn-card" href="#/ajustes">🔔 <b>Actualiza tus avisos</b><br><span class="small">Has cambiado datos que usan los avisos (por ejemplo, tu fecha). Vuelve a copiar la configuración y actualiza el secreto en GitHub.</span></a>`;
}

function pushCard(isIOS, standalone) {
  const { secretsUrl, actionsUrl } = push.repoInfo();
  const head = '<div class="eyebrow">🔔 Avisos con la app cerrada</div>';
  if (!push.pushSupported() || (isIOS && !standalone)) {
    return `<section class="card">${head}
      <p class="small">${isIOS ? 'En iPhone primero añade la app a la pantalla de inicio (Compartir → Añadir a pantalla de inicio), ábrela desde allí y vuelve a esta pantalla. Necesitas iOS 16.4 o posterior.' : 'Este navegador no admite notificaciones push. Prueba con Chrome, Edge o Firefox, o usa el calendario.'}</p></section>`;
  }
  const p = state.push || {};
  const ready = !!p.subscription;
  const copied = !!p.copiedFp;
  const step = (n, done, html) => `<li class="${done ? 'done' : ''}"><span class="num">${done ? '✓' : n}</span><div>${html}</div></li>`;
  return `<section class="card">${head}
    <p class="small muted">Para recibir tus hitos, el mensaje diario y los recordatorios <b>sin abrir la app</b>, tu repositorio de GitHub te los envía cada 15 minutos. Se configura una vez:</p>
    ${pushOutdated() ? '<p class="warn small">⚠️ Has cambiado datos desde la última vez: repite los pasos 2 y 3.</p>' : ''}
    <ol class="steps-list">
      ${step(1, ready, `<b>Activa los avisos en este móvil</b><br>${ready ? '<span class="small ok">Activados</span>' : '<button class="btn primary small" data-action="push-enable">Activar</button>'}`)}
      ${step(2, copied && !pushOutdated(), `<b>Copia tu configuración</b><br><span class="small muted">Contiene la "dirección" de tu móvil y lo necesario para redactar tus mensajes. Trátala como una contraseña.</span><br>
        <button class="btn small" data-action="push-copy" ${ready ? '' : 'disabled'}>📋 Copiar configuración</button>
        <div id="push-json"></div>`)}
      ${step(3, copied && !pushOutdated(), `<b>Pégala como secreto en GitHub</b><br><span class="small">Nombre: <code>PUSH_CONFIG</code> · Valor: lo copiado. Si ya existe, edítalo y sustitúyelo.</span><br>
        ${secretsUrl ? `<a class="btn small" href="${secretsUrl}" target="_blank" rel="noopener">Abrir los secretos del repositorio</a>` : '<span class="small muted">Repositorio → Settings → Secrets and variables → Actions → New repository secret.</span>'}`)}
      ${step(4, false, `<b>Prueba</b><br><span class="small">En GitHub: Actions → Recordatorios → <i>Run workflow</i>. Te llegará "🔔 Los avisos funcionan".</span><br>
        ${actionsUrl ? `<a class="btn small" href="${actionsUrl}" target="_blank" rel="noopener">Abrir Recordatorios</a>` : ''}`)}
    </ol>
    <p class="muted tiny">Si desinstalas la app, borras los datos del navegador o tras un desliz reinicias la fecha, repite los pasos 2 y 3. GitHub puede retrasar los envíos unos minutos.</p>
  </section>`;
}

// ---------------------------------------------------------------------------
// Aprende
// ---------------------------------------------------------------------------
function viewLearn() {
  return `
    <h1>Aprende</h1>
    ${LEARN.map((l) => `<details class="card learn"><summary>${esc(l.title)}</summary><p>${esc(l.body)}</p></details>`).join('')}
    <section class="card"><div class="eyebrow">Fuentes científicas</div>
      <ul class="plain small sources">${Object.values(SOURCES).map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
    </section>`;
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const form = el.closest('form');
  switch (a) {
    case 'close-modal': $modal.hidden = true; $modal.innerHTML = ''; break;
    case 'ob-back': readOnboardingInputs(form); draft.step--; render(); break;
    case 'toggle-motive': {
      readOnboardingInputs(form);
      const v = el.dataset.value;
      draft.motives = draft.motives.includes(v) ? draft.motives.filter((m) => m !== v) : [...draft.motives, v];
      render(); break;
    }
    case 'add-motive': {
      readOnboardingInputs(form);
      const v = draft.customMotive.trim();
      if (v && !draft.motives.includes(v)) draft.motives.push(v);
      draft.customMotive = ''; render(); break;
    }
    case 'toggle-trigger': {
      const v = el.dataset.value;
      draft.triggers = draft.triggers.includes(v) ? draft.triggers.filter((t) => t !== v) : [...draft.triggers, v];
      render(); break;
    }
    case 'use-tip': {
      const input = form.querySelector(`[data-plan="${el.dataset.trigger}"]`);
      if (input) input.value = el.dataset.value;
      draft.plans[el.dataset.trigger] = el.dataset.value; break;
    }
    case 'quit-now':
      state.profile.quitAt = new Date().toISOString();
      state.notified = [];
      state.checklist.fecha = true;
      commit();
      toast('¡Hoy es tu día D! Ni una calada.');
      break;
    case 'med-done':
      state.logs.push({ id: store.uid(), type: 'med', at: new Date().toISOString() });
      commit(); toast('💊 Anotado. Seguir el tratamiento completo reduce las recaídas.'); break;
    case 'sos-next':
      if (sos.step === 1) stopSOS();
      sos.step = Math.min(4, sos.step + 1); render(); break;
    case 'sos-trigger': sos.trigger = sos.trigger === el.dataset.value ? '' : el.dataset.value; render(); break;
    case 'sos-save-plan': {
      const t = sos.trigger;
      state.profile.plans = { ...(state.profile.plans || {}), [t]: el.dataset.value };
      if (!state.profile.triggers.includes(t)) state.profile.triggers.push(t);
      commit(); toast('Plan guardado'); break;
    }
    case 'sos-again': sos.step = 1; render(); break;
    case 'sos-win': {
      logCraving(true);
      const total = state.logs.filter((l) => l.type === 'craving' && l.resisted).length;
      resetSOS(); location.hash = '#/'; commit();
      showModal(`<div class="hero-icon">🏄</div><h2>¡Deseo superado!</h2><p>Llevas <b>${total}</b> deseo${total === 1 ? '' : 's'} superado${total === 1 ? '' : 's'}. Cada vez que surfeas uno sin fumar, el siguiente llega más débil.</p>`);
      break;
    }
    case 'sos-lost': logCraving(false); resetSOS(); store.save(state); location.hash = '#/desliz'; break;
    case 'check': state.checklist[el.dataset.id] = el.checked; commit(false); break;
    case 'del-log':
      state.logs = state.logs.filter((l) => l.id !== el.dataset.id); commit(); break;
    case 'del-motive':
      state.profile.motives.splice(Number(el.dataset.i), 1); commit(); break;
    case 'del-trigger':
      state.profile.triggers = state.profile.triggers.filter((t) => t !== el.dataset.id);
      delete state.profile.plans?.[el.dataset.id]; commit(); break;
    case 'toggle-notif': {
      if (el.checked) {
        const r = await notify.requestPermission();
        state.settings.notifications = r === 'granted';
        if (r === 'granted') { notify.registerPeriodicSync(); toast('🔔 Te avisaré de cada nuevo cambio en tu cuerpo'); } else toast('No se ha concedido el permiso de notificaciones');
      } else state.settings.notifications = false;
      commit(); break;
    }
    case 'push-enable': {
      try {
        el.disabled = true;
        const vapid = await push.ensureVapid(state.push?.vapid);
        const subscription = await push.subscribe(vapid);
        state.push = { ...(state.push || {}), vapid, subscription };
        state.settings.notifications = true;
        commit(); toast('Avisos activados en este móvil. Ahora copia la configuración.');
      } catch (err) {
        el.disabled = false;
        toast(`No se pudieron activar los avisos: ${err.message || 'error desconocido'}`);
      }
      break;
    }
    case 'push-copy': {
      const cfg = JSON.stringify(push.buildConfig(state, state.push.vapid, state.push.subscription));
      let ok = false;
      try { await navigator.clipboard.writeText(cfg); ok = true; } catch { /* sin portapapeles */ }
      state.push.copiedFp = push.fingerprint(state);
      commit();
      if (ok) toast('Configuración copiada. Pégala en GitHub como PUSH_CONFIG.');
      else {
        const box = document.getElementById('push-json');
        if (box) {
          box.innerHTML = `<p class="small">Selecciona todo el texto y cópialo:</p><textarea readonly rows="5">${esc(cfg)}</textarea>`;
          box.querySelector('textarea').select();
        }
      }
      break;
    }
    case 'ics': {
      const ics = buildICS(state.profile, now(), { appUrl: location.href.split('#')[0], dailyHour: state.settings.dailyHour });
      download('dejar-de-fumar-hitos.ics', ics, 'text/calendar');
      toast('Abre el archivo descargado para añadirlo a tu calendario');
      break;
    }
    case 'install':
      if (installEvent) { installEvent.prompt(); await installEvent.userChoice; installEvent = null; render(); }
      break;
    case 'export': download(`dejar-de-fumar-copia-${new Date().toISOString().slice(0, 10)}.json`, store.exportJSON(state), 'application/json'); break;
    case 'wipe':
      if (confirm('¿Seguro? Se borrarán todos tus datos de este dispositivo.')) { state = store.reset(); draft.step = 0; location.hash = '#/'; render(); }
      break;
    default: break;
  }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.action === 'harm-freq') { state.settings.harmFrequency = el.value; commit(false); toast('Guardado'); }
  if (el.dataset.action === 'daily-hour') { state.settings.dailyHour = Number(el.value); commit(false); }
  if (el.dataset.action === 'import' && el.files?.[0]) {
    try {
      state = store.importJSON(await el.files[0].text());
      commit(); toast('Copia importada');
    } catch (err) { toast(err.message || 'No se pudo importar'); }
  }
  if (el.name === 'mode' && el.closest('[data-form="onboarding"]')) { readOnboardingInputs(el.form); render(); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  const r = el.dataset.range;
  if (r === 'intensity') { sos.intensity = Number(el.value); document.getElementById('int-v').textContent = el.value; }
  if (r === 'after') { sos.after = Number(el.value); document.getElementById('after-v').textContent = el.value; }
  if (r === 'need') document.getElementById('need-v').textContent = el.value;
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  const kind = form.dataset.form;
  if (!kind) return;
  e.preventDefault();
  const fd = new FormData(form);
  const p = state.profile;
  if (kind === 'onboarding') return onboardingNext(form);
  if (kind === 'lapse') return saveLapse(form);
  if (kind === 'cig') {
    state.logs.push({ id: store.uid(), type: 'cigarette', at: new Date().toISOString(), trigger: fd.get('trigger') || null, mood: fd.get('mood') || null, need: Number(fd.get('need')) });
    if (state.logs.filter((l) => l.type === 'cigarette').length >= 5) state.checklist.registro = true;
    location.hash = '#/'; commit(); toast('Anotado. Conocer tus momentos es parte del plan.');
    return;
  }
  if (kind === 'add-motive') {
    const v = String(fd.get('motive') || '').trim();
    if (v) { p.motives.push(v); commit(); }
    return;
  }
  if (kind === 'plans') {
    for (const id of p.triggers) { const v = String(fd.get(`plan-${id}`) || '').trim(); if (v) p.plans[id] = v; else delete p.plans[id]; }
    const nt = fd.get('newTrigger');
    if (nt && !p.triggers.includes(nt)) p.triggers.push(nt);
    if (Object.keys(p.plans).length) state.checklist.planes = true;
    commit(); toast('Planes guardados'); return;
  }
  if (kind === 'support') {
    p.supportPerson = String(fd.get('supportPerson') || '').trim();
    p.supportPhone = String(fd.get('supportPhone') || '').trim();
    p.medication = fd.get('medication');
    p.reward = { name: String(fd.get('rewardName') || '').trim(), cost: num(fd.get('rewardCost')) };
    if (p.reward.name) state.checklist.recompensa = true;
    if (p.supportPerson) state.checklist.contar = state.checklist.contar || false;
    commit(); toast('Guardado'); return;
  }
  if (kind === 'profile') {
    p.name = String(fd.get('name') || '').trim();
    p.cigsPerDay = num(fd.get('cigsPerDay')) || p.cigsPerDay;
    p.pricePerPack = num(fd.get('pricePerPack')) || p.pricePerPack;
    p.cigsPerPack = num(fd.get('cigsPerPack')) || 20;
    const q = fd.get('quitAt');
    if (q && new Date(q).toISOString() !== new Date(p.quitAt).toISOString()) {
      p.quitAt = new Date(q).toISOString();
      state.notified = milestoneStatus(p.quitAt).filter((m) => m.unlocked).map((m) => m.id);
    }
    commit(); toast('Datos guardados');
  }
});

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Tooltip del gráfico.
function wireChart() {
  const wrap = document.querySelector('.chart-wrap');
  if (!wrap) return;
  const tip = wrap.querySelector('.chart-tip');
  const showTip = (g) => {
    const r = g.getBoundingClientRect(); const w = wrap.getBoundingClientRect();
    tip.textContent = g.dataset.tip; tip.hidden = false;
    const x = Math.min(Math.max(r.left - w.left + r.width / 2, 70), w.width - 70);
    tip.style.left = `${x}px`;
    wrap.querySelectorAll('.bar-g').forEach((b) => b.classList.toggle('dim', b !== g));
  };
  const hide = () => { tip.hidden = true; wrap.querySelectorAll('.bar-g').forEach((b) => b.classList.remove('dim')); };
  wrap.querySelectorAll('.bar-g').forEach((g) => {
    g.addEventListener('pointerenter', () => showTip(g));
    g.addEventListener('focus', () => showTip(g));
    g.addEventListener('blur', hide);
  });
  wrap.addEventListener('pointerleave', hide);
}

function afterRender(route) {
  if (route === 'sos' && sos.step === 1 && !sos.timer) startSurf();
  if (route === 'progreso') wireChart();
}

// ---------------------------------------------------------------------------
// Reloj: actualiza contadores y detecta nuevos hitos.
// ---------------------------------------------------------------------------
async function checkMilestones() {
  if (!state.profile) return;
  const bg = await notify.readBackgroundNotified();
  if (bg.length) state.notified = [...new Set([...state.notified, ...bg])];
  const fresh = await notify.notifyNewMilestones(state);
  if (fresh.length) {
    state.notified.push(...fresh);
    const m = BODY_MILESTONES.find((x) => x.id === fresh[fresh.length - 1]);
    store.save(state); notify.syncSchedule(state);
    if (!['sos', 'desliz', 'registro'].includes(currentRoute())) render();
    showModal(`<div class="hero-icon">${m.icon}</div><div class="eyebrow center">Nuevo cambio en tu cuerpo</div><h2>${esc(m.title)}</h2><p>${esc(m.body)}</p>`);
  }
}

function tick() {
  if (!state.profile) return;
  const p = state.profile;
  const set = (k, v) => { const el = document.querySelector(`[data-live="${k}"]`); if (el) el.textContent = v; };
  if (isQuit()) {
    set('elapsed', formatDuration(elapsedMs(p.quitAt), { parts: 3 }));
    set('avoided', formatNumber(cigarettesAvoided(p)));
    set('money', formatMoney(moneySaved(p)));
    set('life', formatLife(lifeRegainedMinutes(p)));
    const n = nextMilestone(p.quitAt);
    if (n) { set('next-left', formatDuration(n.remainingMs)); const b = document.querySelector('[data-live="next-bar"]'); if (b) b.style.width = `${n.progress * 100}%`; }
  } else {
    const el = document.querySelector('[data-live="countdown"]');
    if (el) {
      if (elapsedMs(p.quitAt) >= 0) { render(); toast('¡Hoy es tu día D! Ni una calada.'); } else el.textContent = formatDuration(-elapsedMs(p.quitAt));
    }
  }
  checkMilestones();
}

setInterval(tick, 30 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkMilestones(); } });

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; if (currentRoute() === 'ajustes') render(); });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

render();
checkMilestones();
notify.syncSchedule(state);
