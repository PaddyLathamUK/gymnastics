/* ── Admin / Settings View ── */

async function renderAdmin() {
  const view = document.getElementById('view-admin');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<button class="nav-back" onclick="closeAdmin()">‹ Back</button><div class="nav-title">Admin</div>`;
  view.appendChild(nav);

  // DEBUG — remove once auth is confirmed working
  const dbg = el('div', '');
  dbg.style.cssText = 'padding:8px 16px;font-size:11px;color:var(--text-soft);background:var(--purple-bg);';
  dbg.textContent = `Logged in as: ${Auth.user?.email || 'not logged in'} | role: ${Auth.role || 'none'} | gymnast: ${Auth.gymnast?.name || 'none'}`;
  view.appendChild(dbg);

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

  // ── Users (admin only) ───────────────────
  if (Auth.isAdmin) {
    content.appendChild(await buildUsersCard());
    content.appendChild(await buildInvitesCard());
  }

  // ── Gymnast logins (admin + parent) ──────
  if (Auth.isAdmin || Auth.isParent) {
    content.appendChild(await buildGymnastLoginsCard());
  }

  // ── Profile ──────────────────────────────
  const profileCard = el('div', 'card');
  if (Auth.isGymnast) {
    // Gymnast sees full athletic profile
    profileCard.innerHTML = `
      <div class="admin-section-title">👤 My Profile</div>
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
  } else {
    // Parent / admin sees just their name
    profileCard.innerHTML = `
      <div class="admin-section-title">👤 My Profile</div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Name</label>
        <input class="form-input" id="adm-fullname" value="${Auth.profile?.full_name || ''}">
      </div>
      <button class="btn-primary" style="margin-top:14px;" onclick="saveUserProfile()">Save</button>
    `;
  }
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

  // ── Migrate / Danger (admin only) ────────
  if (!Auth.isAdmin) return; // parents don't need these sections

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

async function saveUserProfile() {
  const name = document.getElementById('adm-fullname')?.value?.trim();
  if (!name) return;
  await db.from('profiles').update({ full_name: name }).eq('id', Auth.user.id);
  Auth.profile.full_name = name;
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

// ── Users card ───────────────────────────
async function buildUsersCard() {
  const card = el('div', 'card');
  card.innerHTML = `<div class="admin-section-title">👥 Users</div>`;

  const { data: profiles } = await db.from('profiles')
    .select('id, full_name, role')
    .order('role');

  const { data: pgLinks } = await db.from('parent_gymnast')
    .select('parent_id, gymnasts(name)');

  const { data: sgLinks } = await db.from('gymnast_supporters')
    .select('supporter_id, gymnasts(name)');

  if (!profiles?.length) {
    card.innerHTML += `<div style="font-size:13px;color:var(--text-soft);margin-top:10px;">No users yet.</div>`;
    return card;
  }

  const roleIcon = { admin: '🔐', parent: '👨‍👧', gymnast: '🤸', supporter: '👏' };

  profiles.forEach(p => {
    const linked = p.role === 'parent'
      ? (pgLinks || []).filter(l => l.parent_id === p.id).map(l => l.gymnasts?.name).filter(Boolean)
      : p.role === 'supporter'
      ? (sgLinks || []).filter(l => l.supporter_id === p.id).map(l => l.gymnasts?.name).filter(Boolean)
      : [];

    const row = el('div', 'admin-row');
    row.innerHTML = `
      <div class="admin-row-info">
        <div class="admin-row-title">${roleIcon[p.role] || '👤'} ${p.full_name}</div>
        <div class="admin-row-sub">${p.role}${linked.length ? ' · ' + linked.join(', ') : ''}</div>
      </div>
    `;
    card.appendChild(row);
  });

  return card;
}

// ── Invites card ─────────────────────────
async function buildInvitesCard() {
  const card = el('div', 'card');
  card.id = 'invites-card';
  card.innerHTML = `<div class="admin-section-title">✉️ Invites</div>`;

  // Pending invites list
  const { data: pending } = await db.from('invite_links')
    .select('*')
    .is('used_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });

  if (pending?.length) {
    const pendingWrap = el('div', '');
    pendingWrap.style.cssText = 'margin-top:10px;display:flex;flex-direction:column;gap:8px;';
    pending.forEach(inv => {
      const typeLabel = inv.invite_type === 'parent' ? '👨‍👧 Parent'
                      : inv.invite_type === 'gymnast' ? '🤸 Gymnast'
                      : '👏 Supporter';
      const expires = new Date(inv.expires_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
      const url = Auth.inviteUrl(inv.token);
      const row = el('div', 'invite-row');
      row.innerHTML = `
        <div class="invite-row-info">
          <div class="invite-name">${inv.invitee_name || 'Unnamed'} <span class="invite-type-pill">${typeLabel}</span></div>
          <div class="invite-expires">Expires ${expires}</div>
        </div>
        <button class="admin-btn edit" onclick="copyInvite('${url}', this)">Copy</button>
      `;
      pendingWrap.appendChild(row);
    });
    card.appendChild(pendingWrap);
  } else {
    const none = el('div', '');
    none.style.cssText = 'font-size:13px;color:var(--text-soft);margin-top:8px;margin-bottom:4px;';
    none.textContent = 'No pending invites.';
    card.appendChild(none);
  }

  // Generate invite buttons
  const btns = el('div', '');
  btns.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:14px;';

  if (Auth.isAdmin) {
    const parentBtn = el('button', 'btn-primary');
    parentBtn.textContent = '＋ Invite a Parent';
    parentBtn.onclick = () => showInviteForm('parent', card);
    btns.appendChild(parentBtn);
  }

  const gymnastBtn = el('button', 'btn-primary');
  gymnastBtn.style.background = 'linear-gradient(135deg,#34C97F 0%,#22a866 100%)';
  gymnastBtn.textContent = '＋ Invite a Gymnast';
  gymnastBtn.onclick = () => showInviteForm('gymnast', card);
  btns.appendChild(gymnastBtn);

  const supporterBtn = el('button', 'btn-primary');
  supporterBtn.style.background = 'linear-gradient(135deg,var(--purple-mid) 0%,var(--purple) 100%)';
  supporterBtn.textContent = '＋ Invite a Supporter';
  supporterBtn.onclick = () => showInviteForm('supporter', card);
  btns.appendChild(supporterBtn);

  card.appendChild(btns);

  return card;
}

function showInviteForm(type, card) {
  // Remove any existing form
  card.querySelector('.invite-form')?.remove();

  const form = el('div', 'invite-form');
  form.style.cssText = 'margin-top:12px;background:var(--purple-bg);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;';

  const label = type === 'parent'   ? 'Parent name'
              : type === 'gymnast'  ? 'Gymnast name'
              :                      'Supporter name';

  // Gymnast and supporter invites need to be linked to a gymnast
  let gymSelect = '';
  if ((type === 'gymnast' || type === 'supporter') && Auth.gymnasts.length > 0) {
    gymSelect = `
      <div>
        <div class="form-label" style="margin-bottom:4px;">For gymnast</div>
        <select class="form-select" id="inv-gymnast">
          ${Auth.gymnasts.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
        </select>
      </div>`;
  }

  form.innerHTML = `
    <div>
      <div class="form-label" style="margin-bottom:4px;">${label}</div>
      <input class="form-input" id="inv-name" placeholder="e.g. Sarah Jones" style="background:white;">
    </div>
    ${gymSelect}
    <div style="display:flex;gap:8px;">
      <button class="btn-primary" style="flex:1;" onclick="generateInvite('${type}')">Generate Link</button>
      <button class="btn-cancel" style="flex:0 0 auto;padding:0 14px;" onclick="this.closest('.invite-form').remove()">✕</button>
    </div>
    <div id="inv-result" style="display:none;word-break:break-all;font-size:12px;color:var(--text-mid);background:white;border-radius:10px;padding:10px;"></div>
  `;
  card.appendChild(form);
  card.querySelector('#inv-name').focus();
}

async function generateInvite(type) {
  const name   = document.getElementById('inv-name')?.value.trim();
  const gymEl  = document.getElementById('inv-gymnast');
  const gymId  = gymEl ? gymEl.value : Auth.gymnast?.id;
  if (!name) { showToast('Please enter a name'); return; }

  try {
    let invite;
    if (type === 'parent') {
      invite = await Auth.createParentInvite(name);
    } else if (type === 'gymnast') {
      invite = await Auth.createGymnastInvite(gymId, name);
    } else {
      invite = await Auth.createSupporterInvite(gymId ? [gymId] : [], name);
    }
    const url = Auth.inviteUrl(invite.token);
    const result = document.getElementById('inv-result');
    result.style.display = 'block';
    result.innerHTML = `<strong>Link ready!</strong><br>${url}<br>
      <button class="admin-btn edit" style="margin-top:8px;width:100%;" onclick="copyInvite('${url}', this)">Copy Link</button>`;
    showToast('Invite created ✓');
    // Refresh the invites card
    setTimeout(() => renderAdmin(), 300);
  } catch(e) {
    showToast('Failed: ' + e.message);
  }
}

async function copyInvite(url, btn) {
  try {
    await navigator.clipboard.writeText(url);
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 2000);
  } catch {
    prompt('Copy this link:', url);
  }
}

// ── Gymnast logins card ───────────────────
async function buildGymnastLoginsCard() {
  const card = el('div', 'card');
  card.innerHTML = `<div class="admin-section-title">🔑 Gymnast Logins</div>
    <div style="font-size:13px;color:var(--text-soft);margin-top:4px;margin-bottom:12px;">
      Set up usernames and passwords so gymnasts can log in themselves.
    </div>`;

  // Fetch fresh gymnast data including username
  const ids = Auth.gymnasts.map(g => g.id);
  if (!ids.length) {
    card.innerHTML += `<div style="font-size:13px;color:var(--text-soft);">No gymnasts linked yet.</div>`;
    return card;
  }

  const { data: gymnasts } = await db.from('gymnasts').select('id, name, username, user_id').in('id', ids);
  if (!gymnasts?.length) {
    card.innerHTML += `<div style="font-size:13px;color:var(--text-soft);">No gymnasts found.</div>`;
    return card;
  }

  (gymnasts || []).forEach(g => {
    const hasLogin = !!g.user_id;
    const row = el('div', 'admin-row');
    row.style.flexDirection = 'column';
    row.style.alignItems = 'flex-start';
    row.style.gap = '10px';
    row.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
        <div>
          <div class="admin-row-title">🤸 ${g.name}</div>
          <div class="admin-row-sub">${hasLogin ? `Username: <strong>${g.username}</strong>` : 'No login set up yet'}</div>
        </div>
        <button class="admin-btn edit" onclick="toggleGymnastLoginForm('${g.id}', ${hasLogin})">
          ${hasLogin ? 'Change Password' : 'Set Up Login'}
        </button>
      </div>
      <div id="glf-${g.id}" style="display:none;width:100%;background:var(--purple-bg);border-radius:12px;padding:12px;">
        ${!hasLogin ? `
        <div class="form-label" style="margin-bottom:4px;">Username</div>
        <input class="form-input" id="gl-user-${g.id}" placeholder="e.g. thea.latham" style="margin-bottom:10px;background:white;"
               value="${g.name.toLowerCase().replace(/\s+/g, '.')}">
        ` : ''}
        <div class="form-label" style="margin-bottom:4px;">${hasLogin ? 'New Password' : 'Password'}</div>
        <input class="form-input" id="gl-pass-${g.id}" type="password" placeholder="8+ characters" style="margin-bottom:10px;background:white;">
        <div class="form-label" style="margin-bottom:4px;">Confirm Password</div>
        <input class="form-input" id="gl-pass2-${g.id}" type="password" placeholder="Repeat password" style="margin-bottom:10px;background:white;">
        <div id="gl-err-${g.id}" style="display:none;font-size:13px;color:var(--red);margin-bottom:8px;"></div>
        <div style="display:flex;gap:8px;">
          <button class="btn-primary" style="flex:1;padding:10px;" onclick="saveGymnastLogin('${g.id}', ${hasLogin})">Save</button>
          <button class="btn-cancel" style="flex:0 0 auto;padding:10px 14px;" onclick="document.getElementById('glf-${g.id}').style.display='none'">✕</button>
        </div>
      </div>
    `;
    card.appendChild(row);
  });

  return card;
}

function toggleGymnastLoginForm(gymnastId, hasLogin) {
  const form = document.getElementById(`glf-${gymnastId}`);
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') {
    const passEl = document.getElementById(`gl-pass-${gymnastId}`);
    if (passEl) passEl.focus();
  }
}

async function saveGymnastLogin(gymnastId, hasLogin) {
  const usernameEl = document.getElementById(`gl-user-${gymnastId}`);
  const username   = usernameEl?.value.trim();
  const password   = document.getElementById(`gl-pass-${gymnastId}`).value;
  const password2  = document.getElementById(`gl-pass2-${gymnastId}`).value;
  const errEl      = document.getElementById(`gl-err-${gymnastId}`);

  errEl.style.display = 'none';

  if (!hasLogin && !username) { errEl.textContent = 'Please enter a username'; errEl.style.display = 'block'; return; }
  if (password.length < 8)    { errEl.textContent = 'Password must be at least 8 characters'; errEl.style.display = 'block'; return; }
  if (password !== password2) { errEl.textContent = 'Passwords do not match'; errEl.style.display = 'block'; return; }

  const btn = document.querySelector(`#glf-${gymnastId} .btn-primary`);
  btn.textContent = 'Saving…';
  btn.disabled = true;

  try {
    if (hasLogin) {
      await Auth.updateGymnastPassword(gymnastId, password);
    } else {
      await Auth.setupGymnastLogin(gymnastId, username, password);
    }
    showToast(hasLogin ? 'Password updated ✓' : 'Login created ✓');
    document.getElementById(`glf-${gymnastId}`).style.display = 'none';
    renderAdmin();
  } catch(e) {
    errEl.textContent = e.message || 'Failed — try again';
    errEl.style.display = 'block';
    btn.textContent = 'Save';
    btn.disabled = false;
  }
}

// ── Open / close admin ────────────────────
async function openAdmin() {
  document.getElementById('view-admin').classList.add('active');
  try {
    await renderAdmin();
  } catch(e) {
    console.error('renderAdmin error:', e);
    const view = document.getElementById('view-admin');
    view.innerHTML += `<div style="padding:20px;color:var(--red);font-size:13px;">Error loading admin panel: ${e.message}</div>`;
  }
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
