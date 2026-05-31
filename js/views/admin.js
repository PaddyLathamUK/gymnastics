/* ── Admin / Settings View ── */

async function renderAdmin() {
  const view = document.getElementById('view-admin');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<button class="nav-back" onclick="closeAdmin()">‹ Back</button><div class="nav-title">Admin</div>`;
  view.appendChild(nav);

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  const [profile, dates, comps, sessions] = await Promise.all([
    Data.getProfile(),
    Data.getDates(),
    Data.getCompetitions(),
    Data.getSessions(),
  ]);

  // ── Athlete Profile ──────────────────────
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

  // ── Competitions ─────────────────────────
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

  // ── Training Sessions ─────────────────────
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

  // ── Migrate from localStorage ─────────────
  const migrateCard = el('div', 'card');
  migrateCard.innerHTML = `
    <div class="admin-section-title">🔄 Data Migration</div>
    <div style="font-size:13px;color:var(--text-soft);margin-top:8px;margin-bottom:12px;">
      If you previously used this app, migrate your local data to the shared database.
    </div>
  `;
  const migrateBtn = el('button', 'btn-primary');
  migrateBtn.textContent = 'Migrate Local Data to Database';
  migrateBtn.onclick = async () => {
    migrateBtn.textContent = 'Migrating…';
    migrateBtn.disabled = true;
    try {
      const count = await Data.migrateFromLocalStorage();
      showToast(`Migrated ${count} records ✓`);
      renderAdmin();
    } catch(e) {
      showToast('Migration failed — check console');
      console.error(e);
    }
  };
  migrateCard.appendChild(migrateBtn);
  content.appendChild(migrateCard);

  // ── Danger zone ───────────────────────────
  const dangerCard = el('div', 'card');
  dangerCard.innerHTML = `<div class="admin-section-title" style="color:var(--red);">⚠️ Data</div>`;
  const resetBtn = el('button', 'btn-cancel');
  resetBtn.style.cssText = 'width:100%;margin-top:10px;color:var(--red);border-color:rgba(255,91,122,0.25);';
  resetBtn.textContent = 'Reset All Data';
  resetBtn.onclick = async () => {
    if (confirm('This will delete ALL data from the database. Are you sure?')) {
      await db.from('competition_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('competitions').delete().neq('id', 'none');
      await db.from('training_sessions').delete().neq('id', 'none');
      await db.from('achievements').delete().neq('id', 'none');
      await db.from('worlds_state').update({ vault: false, beam: false }).eq('id', 1);
      await Data.init();
      renderAdmin();
      renderDashboard();
    }
  };
  dangerCard.appendChild(resetBtn);
  content.appendChild(dangerCard);
}

// ── Profile / Dates save ──────────────────
async function saveProfile() {
  await Data.saveProfile({
    name:        document.getElementById('adm-name')?.value?.trim() || 'Thea Latham',
    club:        document.getElementById('adm-club')?.value?.trim() || 'Star-Tastic Gymnastics',
    usaigcLevel: document.getElementById('adm-usaigc')?.value || 'Copper 1',
    igaLevel:    document.getElementById('adm-iga')?.value || 'Level 8',
  });
  await renderDashboard();
  showToast('Profile saved ✓');
}

async function saveDates() {
  const worldsDate = document.getElementById('adm-worlds')?.value;
  await Data.saveDates({
    worldsDate:   worldsDate || '2026-06-27',
    nextCompName: document.getElementById('adm-nextname')?.value?.trim() || '',
    nextCompDate: document.getElementById('adm-nextdate')?.value || '',
  });
  await renderDashboard();
  showToast('Dates saved ✓');
}

// ── Open / close admin ────────────────────
function openAdmin() {
  renderAdmin();
  document.getElementById('view-admin').classList.add('active');
}

function closeAdmin() {
  document.getElementById('view-admin').classList.remove('active');
}

// ── Toast ─────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
      background:#2D1B69;color:#fff;font-size:13px;font-weight:700;
      padding:10px 20px;border-radius:20px;z-index:500;
      box-shadow:0 4px 20px rgba(45,27,105,0.4);transition:opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}
