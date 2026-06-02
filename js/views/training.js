/* ── Training View ── */

const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Main list view ─────────────────────────
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

  // Stats
  const upgradeCount = sessions.filter(s => s.flagged || s.focus.some(f => Data.UPGRADE_TARGETS.includes(f))).length;
  const totalHours   = Math.round(sessions.reduce((t, s) => t + s.durationMins, 0) / 60);
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

  // Notifications
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
    content.appendChild(emptyState('🤸', 'No sessions logged', 'Tap + to log a session or set up a recurring schedule'));
  } else {
    for (const session of sessions) {
      content.appendChild(buildSessionCard(session));
    }
  }
}

// ── Session card (clickable) ───────────────
function buildSessionCard(session) {
  const d = new Date(session.date + 'T12:00:00');
  const dayNum   = d.getDate();
  const monthStr = d.toLocaleDateString('en-GB', { month: 'short' });
  const weekday  = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const hrs  = Math.floor(session.durationMins / 60);
  const mins = session.durationMins % 60;
  const durStr = mins ? `${hrs}h ${mins}m` : `${hrs}h`;
  const isUpgrade = session.flagged || session.focus.some(f => Data.UPGRADE_TARGETS.includes(f));

  const tags = session.focus.map(f => {
    const isU = Data.UPGRADE_TARGETS.includes(f);
    return `<span class="tag ${isU ? 'tag-gold' : 'tag-purple'}">${f}${isU ? ' ⭐' : ''}</span>`;
  }).join('');

  const photoCount = session.photoUrls?.length || 0;
  const hasNotes   = session.notes?.trim().length > 0;

  const card = el('div', 'session-card');
  card.style.cursor = 'pointer';
  card.innerHTML = `
    <div class="session-date">
      <div class="session-day">${dayNum}</div>
      <div class="session-month">${monthStr}</div>
    </div>
    <div class="session-body">
      <div class="session-top">
        <div class="session-weekday">${weekday}${session.sessionTime ? ' · ' + session.sessionTime : ''}</div>
        <div class="session-duration">${durStr}</div>
      </div>
      ${tags ? `<div class="session-tags">${tags}</div>` : ''}
      ${hasNotes ? `<div class="session-note">${session.notes}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:6px;align-items:center;">
        ${session.recurringGroup ? '<span style="font-size:10px;color:var(--text-soft);">🔁 Recurring</span>' : ''}
        ${photoCount > 0 ? `<span style="font-size:10px;color:var(--purple);">📷 ${photoCount} photo${photoCount > 1 ? 's' : ''}</span>` : ''}
        <span style="font-size:10px;color:var(--purple-lt);margin-left:auto;">Tap to edit →</span>
      </div>
    </div>
  `;
  card.onclick = () => openSessionDetail(session);
  return card;
}

// ── Session detail / edit sheet ────────────
function openSessionDetail(session) {
  const sheet = document.getElementById('sheet-session');
  sheet.querySelector('.sheet-title').textContent = 'Session Details';
  sheet.querySelector('.sheet-body').innerHTML = buildSessionDetailForm(session);
  sheet.classList.add('open');

  // Render existing photos
  renderSessionPhotos(session);
}

function buildSessionDetailForm(sess) {
  const durOptions = [60,90,120,150,180,210,240].map(m =>
    `<option value="${m}" ${sess.durationMins === m ? 'selected' : ''}>${Math.floor(m/60)}h${m%60 ? ' '+(m%60)+'m':''}</option>`
  ).join('');

  const appChecks = Data.APPARATUS.map(app => {
    const isU = Data.UPGRADE_TARGETS.includes(app);
    const checked = sess.focus.includes(app) ? 'checked' : '';
    return `
      <label class="app-check-label">
        <input type="checkbox" value="${app}" name="sf-app" ${checked} style="accent-color:var(--purple);">
        ${app}${isU ? ' ⭐' : ''}
      </label>`;
  }).join('');

  return `
    <div class="form-group">
      <label class="form-label">Date</label>
      <input class="form-input" id="sf-date" type="date" value="${sess.date}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Time</label>
        <input class="form-input" id="sf-time" type="time" value="${sess.sessionTime || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Duration</label>
        <select class="form-select" id="sf-dur">${durOptions}</select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Focus Apparatus</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${appChecks}</div>
    </div>
    <div class="form-group">
      <label class="sf-check-row">
        <input type="checkbox" id="sf-flagged" ${sess.flagged ? 'checked' : ''} style="accent-color:var(--purple);">
        <span>Flag as Upgrade Focus Session</span>
      </label>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="sf-notes" rows="4">${sess.notes || ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Photos</label>
      <div id="photo-grid" class="photo-grid"></div>
      <label class="photo-upload-btn">
        <input type="file" id="photo-input" accept="image/*" multiple style="display:none;" onchange="uploadPhotos('${sess.id}')">
        📷 Add Photos
      </label>
      <div id="photo-upload-progress" style="font-size:12px;color:var(--purple);margin-top:6px;display:none;">Uploading…</div>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" onclick="closeSheet('sheet-session')">Cancel</button>
      <button class="btn-primary" style="flex:2;" onclick="saveSessionWithId('${sess.id}')">Save Changes</button>
    </div>
    ${sess.recurringGroup ? `
      <div style="padding:0 20px;margin-top:12px;">
        <button onclick="confirmDeleteRecurring('${sess.recurringGroup}')" style="width:100%;padding:12px;background:none;border:1.5px solid rgba(255,91,122,0.25);border-radius:14px;color:var(--red);font-size:13px;font-weight:700;cursor:pointer;">
          🔁 Delete All Sessions in This Series
        </button>
      </div>` : ''}
    <div style="padding:0 20px;margin-top:8px;padding-bottom:8px;">
      <button onclick="confirmDeleteSession('${sess.id}')" style="width:100%;padding:12px;background:none;border:1.5px solid rgba(255,91,122,0.25);border-radius:14px;color:var(--red);font-size:13px;font-weight:700;cursor:pointer;">
        Delete This Session
      </button>
    </div>
  `;
}

// Render photo thumbnails inside the detail form
function renderSessionPhotos(session) {
  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  grid.innerHTML = '';
  (session.photoUrls || []).forEach((url, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-thumb-wrap';
    wrap.innerHTML = `
      <img src="${url}" class="photo-thumb" onclick="openPhotoFull('${url}')">
      <button class="photo-delete-btn" onclick="removePhoto('${session.id}','${url}')">×</button>
    `;
    grid.appendChild(wrap);
  });
}

// Upload photos
async function uploadPhotos(sessionId) {
  const input = document.getElementById('photo-input');
  const progress = document.getElementById('photo-upload-progress');
  if (!input?.files?.length) return;

  // Show tag picker first
  const tag = await showPhotoTagPicker();
  if (!tag) { input.value = ''; return; } // cancelled

  progress.style.display = 'block';

  const sessions = await Data.getSessions();
  const session  = sessions.find(s => s.id === sessionId);
  if (!session) return;

  for (const file of input.files) {
    const url = await Data.uploadSessionPhoto(sessionId, file);
    if (url) {
      session.photoUrls.push(url);
      // Save rich metadata to photos table
      await Data.savePhoto({
        gymnastId: session.gymnasticId || Auth.gymnast?.id,
        sessionId,
        url,
        category:  tag.category,
        apparatus: tag.apparatus,
        takenAt:   session.date,
      });
    }
  }

  await Data.saveSession(session);
  progress.style.display = 'none';
  renderSessionPhotos(session);
  input.value = '';
}

// Remove a photo
async function removePhoto(sessionId, url) {
  if (!confirm('Remove this photo?')) return;
  const sessions = await Data.getSessions();
  const session  = sessions.find(s => s.id === sessionId);
  if (!session) return;
  await Data.deleteSessionPhoto(sessionId, url);
  session.photoUrls = session.photoUrls.filter(u => u !== url);
  await Data.saveSession(session);
  renderSessionPhotos(session);
}

// Open photo fullscreen
function openPhotoFull(url) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:999;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
  `;
  overlay.innerHTML = `<img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;">`;
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

// ── Add session sheet (single + recurring) ──
function openAddSession() {
  const sheet = document.getElementById('sheet-session');
  sheet.querySelector('.sheet-title').textContent = 'Log Training Session';
  sheet.querySelector('.sheet-body').innerHTML = buildAddSessionForm();
  sheet.classList.add('open');
}

function buildAddSessionForm() {
  const today = new Date().toISOString().slice(0, 10);
  const appChecks = Data.APPARATUS.map(app => {
    const isU = Data.UPGRADE_TARGETS.includes(app);
    return `
      <label class="app-check-label">
        <input type="checkbox" value="${app}" name="sf-app" style="accent-color:var(--purple);">
        ${app}${isU ? ' ⭐' : ''}
      </label>`;
  }).join('');

  const dayToggles = DAY_NAMES.map((d, i) => `
    <button type="button" class="day-toggle" data-day="${i}" onclick="toggleDay(this)">
      ${d}
    </button>`).join('');

  return `
    ${buildGymnastSelectorField()}
    <!-- Tab switcher -->
    <div class="session-tabs" id="session-tabs">
      <button class="session-tab active" onclick="switchSessionTab('single', this)">Single</button>
      <button class="session-tab" onclick="switchSessionTab('recurring', this)">Recurring 🔁</button>
    </div>

    <!-- Single session -->
    <div id="tab-single">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" id="sf-date" type="date" value="${today}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Time</label>
          <input class="form-input" id="sf-time" type="time" value="">
        </div>
        <div class="form-group">
          <label class="form-label">Duration</label>
          <select class="form-select" id="sf-dur">
            <option value="90">1h 30m</option>
            <option value="120">2h</option>
            <option value="150">2h 30m</option>
            <option value="180" selected>3h</option>
            <option value="210">3h 30m</option>
            <option value="240">4h</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Focus Apparatus</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">${appChecks}</div>
      </div>
      <div class="form-group">
        <label class="sf-check-row">
          <input type="checkbox" id="sf-flagged" style="accent-color:var(--purple);">
          <span>Flag as Upgrade Focus Session</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="sf-notes" placeholder="What did you work on?"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn-cancel" onclick="closeSheet('sheet-session')">Cancel</button>
        <button class="btn-primary" style="flex:2;" onclick="saveSessionWithId('')">Log Session</button>
      </div>
    </div>

    <!-- Recurring session -->
    <div id="tab-recurring" style="display:none;">
      <div class="form-group">
        <label class="form-label">Days of the Week</label>
        <div class="day-toggles">${dayToggles}</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input class="form-input" id="rec-start" type="date" value="${today}">
        </div>
        <div class="form-group">
          <label class="form-label">End Date</label>
          <input class="form-input" id="rec-end" type="date" value="">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Time</label>
          <input class="form-input" id="rec-time" type="time" value="">
        </div>
        <div class="form-group">
          <label class="form-label">Duration</label>
          <select class="form-select" id="rec-dur">
            <option value="90">1h 30m</option>
            <option value="120">2h</option>
            <option value="150">2h 30m</option>
            <option value="180" selected>3h</option>
            <option value="210">3h 30m</option>
            <option value="240">4h</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Focus Apparatus</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${Data.APPARATUS.map(app => {
            const isU = Data.UPGRADE_TARGETS.includes(app);
            return `<label class="app-check-label">
              <input type="checkbox" value="${app}" name="rec-app" style="accent-color:var(--purple);">
              ${app}${isU ? ' ⭐' : ''}
            </label>`;
          }).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="sf-check-row">
          <input type="checkbox" id="rec-flagged" style="accent-color:var(--purple);">
          <span>Flag as Upgrade Focus Sessions</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">Notes (applied to all sessions)</label>
        <textarea class="form-textarea" id="rec-notes" placeholder="e.g. Star-Tastic weekly training"></textarea>
      </div>
      <div id="rec-preview" style="font-size:12px;color:var(--purple);font-weight:600;padding:0 20px 8px;display:none;"></div>
      <div class="form-actions">
        <button class="btn-cancel" onclick="closeSheet('sheet-session')">Cancel</button>
        <button class="btn-primary" style="flex:2;" onclick="saveRecurringSessions()">Create Sessions</button>
      </div>
    </div>
  `;
}

function switchSessionTab(tab, btn) {
  document.querySelectorAll('.session-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-single').style.display    = tab === 'single'    ? 'block' : 'none';
  document.getElementById('tab-recurring').style.display = tab === 'recurring' ? 'block' : 'none';
}

function toggleDay(btn) {
  btn.classList.toggle('active');
  updateRecurringPreview();
}

function updateRecurringPreview() {
  const preview = document.getElementById('rec-preview');
  if (!preview) return;
  const days  = [...document.querySelectorAll('.day-toggle.active')].map(b => parseInt(b.dataset.day));
  const start = document.getElementById('rec-start')?.value;
  const end   = document.getElementById('rec-end')?.value;
  if (!days.length || !start || !end) { preview.style.display = 'none'; return; }

  let count = 0;
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end   + 'T12:00:00');
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (days.includes(d.getDay())) count++;
  }
  preview.style.display = 'block';
  preview.textContent = `📅 ${count} session${count !== 1 ? 's' : ''} will be created`;
}

// Wire up live preview updates
document.addEventListener('change', e => {
  if (e.target.id === 'rec-start' || e.target.id === 'rec-end') updateRecurringPreview();
});

async function saveRecurringSessions() {
  const days = [...document.querySelectorAll('.day-toggle.active')].map(b => parseInt(b.dataset.day));
  if (!days.length) { alert('Please select at least one day.'); return; }
  const startDate = document.getElementById('rec-start')?.value;
  const endDate   = document.getElementById('rec-end')?.value;
  if (!startDate || !endDate) { alert('Please set start and end dates.'); return; }
  if (endDate < startDate)    { alert('End date must be after start date.'); return; }

  const btn = document.querySelector('#tab-recurring .btn-primary');
  if (btn) { btn.textContent = 'Creating…'; btn.disabled = true; }

  const count = await Data.saveRecurringSessions({
    days,
    startDate,
    endDate,
    durationMins: parseInt(document.getElementById('rec-dur')?.value) || 180,
    focus:        [...document.querySelectorAll('input[name="rec-app"]:checked')].map(c => c.value),
    flagged:      document.getElementById('rec-flagged')?.checked || false,
    sessionTime:  document.getElementById('rec-time')?.value || '',
    notes:        document.getElementById('rec-notes')?.value?.trim() || '',
  });

  closeSheet('sheet-session');
  showToast(`${count} sessions created ✓`);
  renderTraining();
}

async function saveSessionWithId(existingId) {
  const date = document.getElementById('sf-date')?.value;
  if (!date) return;

  // Preserve existing photoUrls if editing
  let photoUrls = [];
  if (existingId) {
    const sessions = await Data.getSessions();
    photoUrls = sessions.find(s => s.id === existingId)?.photoUrls || [];
  }

  const timeVal = document.getElementById('sf-time')?.value || '';

  await Data.saveSession({
    id:          existingId || Data.uid(),
    date,
    durationMins: parseInt(document.getElementById('sf-dur')?.value) || 180,
    focus:        [...document.querySelectorAll('input[name="sf-app"]:checked')].map(c => c.value),
    flagged:      document.getElementById('sf-flagged')?.checked || false,
    notes:        document.getElementById('sf-notes')?.value?.trim() || '',
    sessionTime:  timeVal,
    photoUrls,
    recurringGroup: '',
  });
  // Switch active gymnast to match the one chosen in the form
  const formGid = document.getElementById('f-gymnast-id')?.value;
  if (formGid && formGid !== Auth.gymnast?.id) {
    Auth.selectGymnast(formGid);
    buildGymnastSwitcher();
  }

  closeSheet('sheet-session');
  renderTraining();
}

function openEditSession(id) {
  Data.getSessions().then(sessions => {
    const sess = sessions.find(s => s.id === id);
    if (!sess) return;
    closeAdmin();
    openSessionDetail(sess);
  });
}

async function confirmDeleteSession(id) {
  if (confirm('Delete this training session?')) {
    await Data.deleteSession(id);
    closeSheet('sheet-session');
    renderAdmin();
    renderTraining();
  }
}

async function confirmDeleteRecurring(groupId) {
  if (confirm('Delete ALL sessions in this recurring series?')) {
    await Data.deleteRecurringGroup(groupId);
    closeSheet('sheet-session');
    renderTraining();
  }
}

function requestNotifPermission() {
  if (!('Notification' in window)) { alert('Notifications not supported in this browser.'); return; }
  Notification.requestPermission().then(p => {
    if (p === 'granted') alert('Reminders set! 🌟');
  });
}
