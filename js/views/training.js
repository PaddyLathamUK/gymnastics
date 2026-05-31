/* ── Training View ── */

async function renderTraining() {
  const sessions = await Data.getSessions();
  const view = document.getElementById('view-training');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">Training Log</div>`;
  const addBtn = el('button', 'nav-action');
  addBtn.textContent = '+';
  addBtn.onclick = () => openAddSession();
  nav.appendChild(addBtn);
  view.appendChild(nav);

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  const upgradeCount = sessions.filter(s => s.flagged || s.focus.some(f => Data.UPGRADE_TARGETS.includes(f))).length;
  const totalHours = Math.round(sessions.reduce((t, s) => t + s.durationMins, 0) / 60);

  const statsCard = el('div', 'card');
  statsCard.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;">🏛 Star-Tastic, Leatherhead</div>
    <div class="stat-row">
      <div class="stat-pill"><div class="stat-val">3×</div><div class="stat-lbl">Per week</div></div>
      <div class="stat-pill"><div class="stat-val">${sessions.length}</div><div class="stat-lbl">Logged</div></div>
      <div class="stat-pill"><div class="stat-val">${totalHours}h</div><div class="stat-lbl">Total</div></div>
    </div>
    ${upgradeCount > 0 ? `<div style="margin-top:10px;font-size:12px;color:var(--purple);font-weight:600;">⭐ ${upgradeCount} upgrade-focus session${upgradeCount > 1 ? 's' : ''} this season</div>` : ''}
  `;
  content.appendChild(statsCard);

  const notifCard = el('div', 'card');
  notifCard.innerHTML = `
    <div class="notif-row">
      <div class="notif-text">
        <div class="notif-title">🔔 Training Reminders</div>
        <div class="notif-sub">Get notified before each session</div>
      </div>
      <button class="btn-sm" onclick="requestNotifPermission()">Set Up</button>
    </div>
  `;
  content.appendChild(notifCard);

  if (sessions.length === 0) {
    content.appendChild(emptyState('🤸', 'No sessions logged', 'Tap + to log your first training session'));
  } else {
    for (const session of sessions) {
      content.appendChild(buildSessionCard(session));
    }
  }
}

function buildSessionCard(session) {
  const d = new Date(session.date + 'T12:00:00');
  const dayNum  = d.getDate();
  const monthStr = d.toLocaleDateString('en-GB', { month: 'short' });
  const weekday  = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const hrs  = Math.floor(session.durationMins / 60);
  const mins = session.durationMins % 60;
  const durStr = mins ? `${hrs}h ${mins}m` : `${hrs}h`;
  const tags = session.focus.map(f => {
    const isU = Data.UPGRADE_TARGETS.includes(f);
    return `<span class="tag ${isU ? 'tag-gold' : 'tag-purple'}">${f}${isU ? ' ⭐' : ''}</span>`;
  }).join('');

  const card = el('div', 'session-card');
  card.innerHTML = `
    <div class="session-date">
      <div class="session-day">${dayNum}</div>
      <div class="session-month">${monthStr}</div>
    </div>
    <div class="session-body">
      <div class="session-top">
        <div class="session-weekday">${weekday}</div>
        <div class="session-duration">${durStr}</div>
      </div>
      ${tags ? `<div class="session-tags">${tags}</div>` : ''}
      ${session.notes ? `<div class="session-note">${session.notes}</div>` : ''}
    </div>
  `;
  return card;
}

function openAddSession() {
  const sheet = document.getElementById('sheet-session');
  sheet.querySelector('.sheet-title').textContent = 'Log Training Session';
  sheet.querySelector('.sheet-body').innerHTML = buildSessionForm(null);
  sheet.classList.add('open');
}

function buildSessionForm(sess) {
  const durOptions = [90,120,150,180,210,240].map(m =>
    `<option value="${m}" ${sess?.durationMins === m ? 'selected' : ''}>${Math.floor(m/60)}h${m%60 ? ' '+(m%60)+'m':''}</option>`
  ).join('');

  const appChecks = Data.APPARATUS.map(app => {
    const isU = Data.UPGRADE_TARGETS.includes(app);
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

async function saveSessionWithId(existingId) {
  const date = document.getElementById('sf-date')?.value;
  if (!date) return;
  await Data.saveSession({
    id:           existingId || Data.uid(),
    date,
    durationMins: parseInt(document.getElementById('sf-dur')?.value) || 180,
    focus:        [...document.querySelectorAll('input[name="sf-app"]:checked')].map(c => c.value),
    flagged:      document.getElementById('sf-flagged')?.checked || false,
    notes:        document.getElementById('sf-notes')?.value?.trim() || '',
  });
  closeSheet('sheet-session');
  renderTraining();
}

function openEditSession(id) {
  Data.getSessions().then(sessions => {
    const sess = sessions.find(s => s.id === id);
    if (!sess) return;
    closeAdmin();
    const sheet = document.getElementById('sheet-session');
    sheet.querySelector('.sheet-title').textContent = 'Edit Session';
    sheet.querySelector('.sheet-body').innerHTML = buildSessionForm(sess);
    sheet.classList.add('open');
  });
}

async function confirmDeleteSession(id) {
  if (confirm('Delete this training session?')) {
    await Data.deleteSession(id);
    renderAdmin();
    renderTraining();
  }
}

function requestNotifPermission() {
  if (!('Notification' in window)) { alert('Notifications not supported in this browser.'); return; }
  Notification.requestPermission().then(p => {
    if (p === 'granted') alert('Reminders set! 🌟');
  });
}
