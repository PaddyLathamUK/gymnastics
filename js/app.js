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
const VIEWS = ['home', 'training', 'comps', 'chat', 'worlds', 'achievements'];
let activeView = 'home';

async function switchView(name) {
  if (!VIEWS.includes(name)) return;
  closeMoreMenu();
  activeView = name;

  // Tab highlights — only the 4 main tabs + more
  const mainTabs = ['home', 'training', 'comps', 'chat'];
  mainTabs.forEach(v => {
    document.getElementById(`tab-${v}`)?.classList.toggle('active', v === name);
  });
  // More tab stays highlighted if viewing a "more" section
  const moreSections = ['worlds', 'achievements'];
  document.getElementById('tab-more')?.classList.toggle('active', moreSections.includes(name));

  VIEWS.forEach(v => {
    document.getElementById(`view-${v}`)?.classList.toggle('active', v === name);
  });

  const renderers = {
    home:         renderDashboard,
    comps:        renderCompetitions,
    training:     renderTraining,
    worlds:       renderWorlds,
    achievements: renderAchievements,
    chat:         renderChat,
  };
  await renderers[name]?.();
  if (name === 'chat') _clearChatBadge?.();
}

// ── More menu ──────────────────────────────
function openMoreMenu() {
  const overlay = document.getElementById('more-sheet-overlay');
  const items   = document.getElementById('more-sheet-items');
  if (!overlay || !items) return;

  const menuItems = [
    {
      label: 'Awards', view: 'achievements',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`,
    },
    {
      label: 'Next Comp', view: 'worlds',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>`,
    },
  ];

  items.innerHTML = menuItems.map(m => `
    <div class="more-menu-row" onclick="switchView('${m.view}')">
      <span class="more-menu-icon">${m.icon}</span>
      <span class="more-menu-label">${m.label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  `).join('');

  overlay.style.display = 'block';
}

function closeMoreMenu() {
  document.getElementById('more-sheet-overlay').style.display = 'none';
}

// ── Sheet helpers ──────────────────────────
function closeSheet(id) {
  document.getElementById(id)?.classList.remove('open');
}

// ── Gymnast switcher (header pill) ─────────
function buildGymnastSwitcher() {
  const el = document.getElementById('gymnast-switcher');
  if (!el) return;
  const gymnasts = Auth.gymnasts;
  if (gymnasts.length <= 1) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = gymnasts.map(g => `
    <button class="gs-pill ${Auth.gymnast?.id === g.id ? 'active' : ''}"
            onclick="selectGymnast('${g.id}')">${g.name.split(' ')[0]}</button>
  `).join('');
}

async function selectGymnast(id) {
  Auth.selectGymnast(id);
  buildGymnastSwitcher();
  await switchView(activeView);
}

// ── Gymnast selector for forms ──────────────
// Returns a form-group HTML string with a gymnast dropdown,
// but only when the user has more than one gymnast to choose from.
function buildGymnastSelectorField(selectedId) {
  if (Auth.gymnasts.length <= 1) return '';
  const options = Auth.gymnasts.map(g =>
    `<option value="${g.id}" ${g.id === (selectedId || Auth.gymnast?.id) ? 'selected' : ''}>${g.name}</option>`
  ).join('');
  return `
    <div class="form-group">
      <label class="form-label">👤 Gymnast</label>
      <select class="form-select" id="f-gymnast-id">${options}</select>
    </div>`;
}

// ── Role-gated write actions ────────────────
function canWrite() { return Auth.canWrite; }

// ── Init ───────────────────────────────────
async function appInit() {
  // Check for invite token in URL
  const params      = new URLSearchParams(location.search);
  const inviteToken = params.get('invite');

  // Boot auth — show login if no session
  const loggedIn = await Auth.init();
  if (!loggedIn) {
    AuthView.show(inviteToken);
    return;
  }

  await appAfterAuth(inviteToken);
}

// Called after successful login / signup
async function appAfterAuth(inviteToken) {
  // Already logged in but opened an invite link — show accept prompt
  if (inviteToken) {
    history.replaceState({}, '', location.pathname);
    await AuthView.showAcceptShare(inviteToken);
  }
  // New parent with no gymnasts yet → prompt setup
  if (Auth.isParent && Auth.gymnasts.length === 0) {
    AuthView.showGymnastSetup();
    return;
  }

  showLoading('view-home');
  await Data.init();
  hideLoading('view-home');

  // Show/hide write actions based on role
  document.querySelectorAll('.write-only').forEach(el => {
    el.style.display = Auth.canWrite ? '' : 'none';
  });

  // Supporter gets a slimmer tab bar (no training tab)
  if (Auth.isSupporter) {
    document.getElementById('tab-training')?.style.setProperty('display', 'none');
  }

  buildGymnastSwitcher();
  setInterval(tickCountdowns, 1000);
  await switchView('home');
  tickCountdowns();
}
