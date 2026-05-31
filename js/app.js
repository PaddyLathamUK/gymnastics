/* ═══════════════════════════════════════════
   THEA'S GYMNASTICS APP — Main
═══════════════════════════════════════════ */

// ── Shared helpers ─────────────────────────
function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function emptyState(icon, title, sub) {
  const d = el('div', 'empty-state');
  d.innerHTML = `<div class="e-icon">${icon}</div><div class="e-title">${title}</div><div>${sub}</div>`;
  return d;
}

function posCls(pos) {
  return ['', 'pos-1', 'pos-2', 'pos-3'][pos] || 'pos-other';
}

function posLabel(pos) {
  return ['', '1st 🥇', '2nd 🥈', '3rd 🥉'][pos] || `${pos}th`;
}

function appIcon(app) {
  return { Floor: '🟦', Vault: '🏃', Bars: '🤸', Beam: '⚖️' }[app] || '⭐';
}

// ── Countdown builder (shared) ─────────────
let cdInterval = null;
function buildCountdown() {
  const card = el('div', 'countdown-card');
  card.innerHTML = `
    <div class="cd-top">
      <div class="cd-icon">✈️</div>
      <div>
        <div class="cd-title">USAIGC World Championships</div>
        <div class="cd-sub">Orlando, Florida 🇺🇸</div>
      </div>
    </div>
    <div class="cd-grid">
      <div class="cd-unit"><div class="cd-num" data-cd="days">—</div><div class="cd-lbl">DAYS</div></div>
      <div class="cd-unit"><div class="cd-num" data-cd="hrs">—</div><div class="cd-lbl">HRS</div></div>
      <div class="cd-unit"><div class="cd-num" data-cd="min">—</div><div class="cd-lbl">MIN</div></div>
      <div class="cd-unit"><div class="cd-num" data-cd="sec">—</div><div class="cd-lbl">SEC</div></div>
    </div>
  `;
  return card;
}

function tickCountdowns() {
  const diff = Data.WORLDS_DATE - new Date();
  if (diff <= 0) return;
  const pad  = n => String(Math.max(0, n)).padStart(2, '0');
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  document.querySelectorAll('[data-cd="days"]').forEach(e => e.textContent = pad(days));
  document.querySelectorAll('[data-cd="hrs"]').forEach(e  => e.textContent = pad(hrs));
  document.querySelectorAll('[data-cd="min"]').forEach(e  => e.textContent = pad(mins));
  document.querySelectorAll('[data-cd="sec"]').forEach(e  => e.textContent = pad(secs));
}

// ── Status bar clock ───────────────────────
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const el = document.getElementById('status-time');
  if (el) el.textContent = t;
}

// ── Loading overlay ────────────────────────
function showLoading(viewId) {
  const view = document.getElementById(viewId);
  if (!view) return;
  const existing = view.querySelector('.loading-overlay');
  if (existing) return;
  const ov = el('div', 'loading-overlay');
  ov.innerHTML = `<div class="loading-spinner">✦</div>`;
  view.appendChild(ov);
}
function hideLoading(viewId) {
  document.getElementById(viewId)?.querySelector('.loading-overlay')?.remove();
}

// ── Tab routing ────────────────────────────
const VIEWS = ['home', 'comps', 'training', 'worlds', 'achievements'];
let activeView = 'home';

async function switchView(name) {
  if (!VIEWS.includes(name)) return;
  activeView = name;

  VIEWS.forEach(v => {
    document.getElementById(`view-${v}`)?.classList.toggle('active', v === name);
    document.getElementById(`tab-${v}`)?.classList.toggle('active', v === name);
  });

  const renderers = {
    home:         renderDashboard,
    comps:        renderCompetitions,
    training:     renderTraining,
    worlds:       renderWorlds,
    achievements: renderAchievements,
  };
  await renderers[name]?.();
}

// ── Sheet helpers ──────────────────────────
function closeSheet(id) {
  document.getElementById(id)?.classList.remove('open');
}

// ── Init ───────────────────────────────────
async function appInit() {
  showLoading('view-home');
  await Data.init();
  hideLoading('view-home');
  updateClock();
  setInterval(updateClock, 10000);
  setInterval(tickCountdowns, 1000);
  await switchView('home');
  tickCountdowns();
}
