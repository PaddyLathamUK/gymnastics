/* ── Training View ── */

function renderTraining() {
  const sessions = Data.getSessions();
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

  // Stats card
  const upgradeCount = sessions.filter(s => s.flagged || s.focus.some(f => Data.UPGRADE_TARGETS.includes(f))).length;
  const totalHours = Math.round(sessions.reduce((t, s) => t + s.durationMins, 0) / 60);
  const statsCard = el('div', 'card');
  statsCard.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;">
      🏛 Star-Tastic, Leatherhead
    </div>
    <div class="stat-row">
      <div class="stat-pill"><div class="stat-val">3×</div><div class="stat-lbl">Per week</div></div>
      <div class="stat-pill"><div class="stat-val">${sessions.length}</div><div class="stat-lbl">Logged</div></div>
      <div class="stat-pill"><div class="stat-val">${totalHours}h</div><div class="stat-lbl">Total</div></div>
    </div>
    ${upgradeCount > 0 ? `<div style="margin-top:10px;font-size:12px;color:var(--purple);font-weight:600;">⭐ ${upgradeCount} upgrade-focus session${upgradeCount > 1 ? 's' : ''} this season</div>` : ''}
  `;
  content.appendChild(statsCard);

  // Notification card
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

  // Sessions
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

// ── Add session sheet ──
function openAddSession() {
  const sheet = document.getElementById('sheet-session');
  sheet.querySelector('.sheet-title').textContent = 'Log Training Session';
  sheet.querySelector('.sheet-body').innerHTML = buildSessionForm(null);
  sheet.classList.add('open');
}

function requestNotifPermission() {
  if (!('Notification' in window)) {
    alert('Notifications are not supported in this browser.');
    return;
  }
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      alert('Reminders set! You\'ll be notified before training sessions. 🌟');
    }
  });
}
