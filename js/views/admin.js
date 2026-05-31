/* ── Admin / Settings View ── */

function renderAdmin() {
  const view = document.getElementById('view-admin');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `
    <button class="nav-back" onclick="closeAdmin()">‹ Back</button>
    <div class="nav-title">Admin</div>
  `;
  view.appendChild(nav);

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  // ── Athlete Profile ──────────────────────
  const profile = Data.getProfile();
  const profileCard = el('div', 'card');
  profileCard.innerHTML = `
    <div class="admin-section-title">👤 Athlete Profile</div>
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">Name</label>
      <input class="form-input" id="adm-name" value="${profile.name}">
    </div>
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">Club</label>
      <input class="form-input" id="adm-club" value="${profile.club}">
    </div>
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">USAIGC Level</label>
      <select class="form-select" id="adm-usaigc">
        ${['Copper 1','Copper 2','Silver 1','Silver 2','Gold 1'].map(l =>
          `<option ${profile.usaigcLevel === l ? 'selected' : ''}>${l}</option>`
        ).join('')}
      </select>
    </div>
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">IGA UK Level</label>
      <select class="form-select" id="adm-iga">
        ${['Level 6','Level 7','Level 8','Level 9','Level 10'].map(l =>
          `<option ${profile.igaLevel === l ? 'selected' : ''}>${l}</option>`
        ).join('')}
      </select>
    </div>
    <button class="btn-primary" style="margin-top:14px;" onclick="saveProfile()">Save Profile</button>
  `;
  content.appendChild(profileCard);

  // ── Key Dates ────────────────────────────
  const dates = Data.getDates();
  const datesCard = el('div', 'card');
  datesCard.innerHTML = `
    <div class="admin-section-title">📅 Key Dates</div>
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">Worlds Date (Orlando)</label>
      <input class="form-input" id="adm-worlds" type="date" value="${dates.worldsDate}">
    </div>
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">Next Competition Name</label>
      <input class="form-input" id="adm-nextname" placeholder="e.g. Regional Championships" value="${dates.nextCompName || ''}">
    </div>
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">Next Competition Date</label>
      <input class="form-input" id="adm-nextdate" type="date" value="${dates.nextCompDate || ''}">
    </div>
    <button class="btn-primary" style="margin-top:14px;" onclick="saveDates()">Save Dates</button>
  `;
  content.appendChild(datesCard);

  // ── Manage Competitions ──────────────────
  const comps = Data.getCompetitions();
  const compsCard = el('div', 'card');
  compsCard.innerHTML = `<div class="admin-section-title">📋 Competitions</div>`;

  if (comps.length === 0) {
    compsCard.innerHTML += `<div style="font-size:13px;color:var(--text-soft);margin-top:10px;">No competitions yet.</div>`;
  } else {
    comps.forEach(comp => {
      const row = el('div', 'admin-row');
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-title">${comp.name}</div>
          <div class="admin-row-sub">${Data.formatDateShort(comp.date)} · ${comp.organisation} ${comp.level}</div>
        </div>
        <div class="admin-row-actions">
          <button class="admin-btn edit" onclick="openEditComp('${comp.id}')">Edit</button>
          <button class="admin-btn delete" onclick="confirmDeleteComp('${comp.id}','${comp.name}')">Delete</button>
        </div>
      `;
      compsCard.appendChild(row);
    });
  }

  const addCompBtn = el('button', 'btn-primary');
  addCompBtn.style.marginTop = '12px';
  addCompBtn.textContent = '＋ Add Competition';
  addCompBtn.onclick = () => { closeAdmin(); setTimeout(openAddComp, 100); };
  compsCard.appendChild(addCompBtn);
  content.appendChild(compsCard);

  // ── Manage Training Sessions ─────────────
  const sessions = Data.getSessions();
  const sessCard = el('div', 'card');
  sessCard.innerHTML = `<div class="admin-section-title">🤸 Training Sessions</div>`;

  if (sessions.length === 0) {
    sessCard.innerHTML += `<div style="font-size:13px;color:var(--text-soft);margin-top:10px;">No sessions logged yet.</div>`;
  } else {
    sessions.forEach(sess => {
      const d = new Date(sess.date + 'T12:00:00');
      const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const row = el('div', 'admin-row');
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-title">${weekday} ${Data.formatDateShort(sess.date)}</div>
          <div class="admin-row-sub">${Math.floor(sess.durationMins/60)}h${sess.durationMins%60 ? ' '+(sess.durationMins%60)+'m' : ''}${sess.focus.length ? ' · ' + sess.focus.join(', ') : ''}</div>
        </div>
        <div class="admin-row-actions">
          <button class="admin-btn edit" onclick="openEditSession('${sess.id}')">Edit</button>
          <button class="admin-btn delete" onclick="confirmDeleteSession('${sess.id}')">Delete</button>
        </div>
      `;
      sessCard.appendChild(row);
    });
  }

  const addSessBtn = el('button', 'btn-primary');
  addSessBtn.style.marginTop = '12px';
  addSessBtn.textContent = '＋ Log Session';
  addSessBtn.onclick = () => { closeAdmin(); setTimeout(openAddSession, 100); };
  sessCard.appendChild(addSessBtn);
  content.appendChild(sessCard);

  // ── Danger zone ──────────────────────────
  const dangerCard = el('div', 'card');
  dangerCard.innerHTML = `<div class="admin-section-title" style="color:var(--red);">⚠️ Data</div>`;
  const resetBtn = el('button', 'btn-cancel');
  resetBtn.style.cssText = 'width:100%;margin-top:10px;color:var(--red);border-color:rgba(255,91,122,0.25);';
  resetBtn.textContent = 'Reset to Seed Data';
  resetBtn.onclick = () => {
    if (confirm('This will delete all data and restore the original seed data. Are you sure?')) {
      Object.values({ ...Object.fromEntries(Object.entries(localStorage).filter(([k]) => k.startsWith('thea_'))) })
        .forEach(() => {});
      ['thea_competitions','thea_sessions','thea_achievements','thea_worlds','thea_profile','thea_dates'].forEach(k => localStorage.removeItem(k));
      Data.init();
      renderAdmin();
      renderDashboard();
    }
  };
  dangerCard.appendChild(resetBtn);
  content.appendChild(dangerCard);
}

// ── Edit competition (reuses add sheet) ──
function openEditComp(id) {
  const comp = Data.getCompetitions().find(c => c.id === id);
  if (!comp) return;
  closeAdmin();
  const sheet = document.getElementById('sheet-comp');
  sheet.querySelector('.sheet-title').textContent = 'Edit Competition';
  sheet.querySelector('.sheet-body').innerHTML = buildCompForm(comp);
  sheet.classList.add('open');
}

function confirmDeleteComp(id, name) {
  if (confirm(`Delete "${name}"? This cannot be undone.`)) {
    Data.deleteCompetition(id);
    renderAdmin();
    renderDashboard();
    renderCompetitions();
  }
}

// ── Edit session ──────────────────────────
function openEditSession(id) {
  const sess = Data.getSessions().find(s => s.id === id);
  if (!sess) return;
  closeAdmin();

  const sheet = document.getElementById('sheet-session');
  sheet.querySelector('.sheet-title').textContent = 'Edit Session';
  sheet.querySelector('.sheet-body').innerHTML = buildSessionForm(sess);
  sheet.classList.add('open');
}

function buildSessionForm(sess) {
  const durOptions = [90,120,150,180,210,240].map(m =>
    `<option value="${m}" ${sess?.durationMins === m ? 'selected' : ''}>${Math.floor(m/60)}h${m%60 ? ' '+(m%60)+'m':''}</option>`
  ).join('');

  const appChecks = Data.APPARATUS.map(app => {
    const isU     = Data.UPGRADE_TARGETS.includes(app);
    const checked = sess?.focus.includes(app) ? 'checked' : '';
    return `
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;
        background:var(--white);border:1.5px solid #e0d8ff;border-radius:12px;
        padding:8px 14px;font-size:13px;font-weight:600;color:var(--text);">
        <input type="checkbox" value="${app}" name="sf-app" ${checked} style="accent-color:var(--purple);">
        ${app}${isU ? ' ⭐' : ''}
      </label>`;
  }).join('');

  const existingId = sess?.id || '';
  return `
    <div class="form-group">
      <label class="form-label">Date</label>
      <input class="form-input" id="sf-date" type="date" value="${sess?.date || new Date().toISOString().slice(0,10)}">
    </div>
    <div class="form-group">
      <label class="form-label">Duration</label>
      <select class="form-select" id="sf-dur">${durOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Focus Apparatus</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${appChecks}</div>
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600;color:var(--text-mid);">
        <input type="checkbox" id="sf-flagged" ${sess?.flagged ? 'checked' : ''} style="accent-color:var(--purple);">
        Flag as Upgrade Focus Session
      </label>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="sf-notes">${sess?.notes || ''}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" onclick="closeSheet('sheet-session')">Cancel</button>
      <button class="btn-primary" style="flex:2;" onclick="saveSessionWithId('${existingId}')">Save Session</button>
    </div>
  `;
}

function saveSessionWithId(existingId) {
  const date = document.getElementById('sf-date')?.value;
  if (!date) return;
  Data.saveSession({
    id:          existingId || Data.uid(),
    date,
    durationMins: parseInt(document.getElementById('sf-dur')?.value) || 180,
    focus:       [...document.querySelectorAll('input[name="sf-app"]:checked')].map(c => c.value),
    flagged:     document.getElementById('sf-flagged')?.checked || false,
    notes:       document.getElementById('sf-notes')?.value?.trim() || '',
  });
  closeSheet('sheet-session');
  renderTraining();
}

function confirmDeleteSession(id) {
  if (confirm('Delete this training session?')) {
    Data.deleteSession(id);
    renderAdmin();
    renderTraining();
  }
}

// ── Profile save ──────────────────────────
function saveProfile() {
  Data.saveProfile({
    name:        document.getElementById('adm-name')?.value?.trim() || 'Thea Latham',
    club:        document.getElementById('adm-club')?.value?.trim() || 'Star-Tastic Gymnastics',
    usaigcLevel: document.getElementById('adm-usaigc')?.value || 'Copper 1',
    igaLevel:    document.getElementById('adm-iga')?.value || 'Level 8',
  });
  renderDashboard();
  showToast('Profile saved ✓');
}

// ── Dates save ────────────────────────────
function saveDates() {
  const worldsDate = document.getElementById('adm-worlds')?.value;
  if (worldsDate) Data.WORLDS_DATE = new Date(worldsDate + 'T09:00:00');
  Data.saveDates({
    worldsDate:   worldsDate || '2026-06-27',
    nextCompName: document.getElementById('adm-nextname')?.value?.trim() || '',
    nextCompDate: document.getElementById('adm-nextdate')?.value || '',
  });
  renderDashboard();
  showToast('Dates saved ✓');
}

// ── Open / close admin ─────────────────────
function openAdmin() {
  renderAdmin();
  document.getElementById('view-admin').classList.add('active');
}

function closeAdmin() {
  document.getElementById('view-admin').classList.remove('active');
}

// ── Toast notification ─────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
      background:#2D1B69;color:#fff;font-size:13px;font-weight:700;
      padding:10px 20px;border-radius:20px;z-index:500;
      box-shadow:0 4px 20px rgba(45,27,105,0.4);
      transition:opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}
