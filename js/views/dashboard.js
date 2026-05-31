/* ── Dashboard View ── */

function renderDashboard() {
  const comps   = Data.getCompetitions();
  const pbs     = Data.getPersonalBests();
  const latest  = comps[0];
  const profile = Data.getProfile();
  const dates   = Data.getDates();

  const view = document.getElementById('view-home');
  view.innerHTML = '';

  // Athlete header
  const header = el('div', 'dash-header');
  header.innerHTML = `
    <div>
      <div class="greeting">Welcome back 👋</div>
      <div class="athlete-name">${profile.name}</div>
      <div class="club-line">${profile.club}</div>
      <div class="level-row">
        <span class="chip chip-purple">USAIGC ${profile.usaigcLevel}</span>
        <span class="chip chip-gold">IGA UK ${profile.igaLevel}</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
      <div class="avatar">🤸</div>
      <button class="gear-btn" onclick="openAdmin()" aria-label="Settings">⚙️</button>
    </div>
  `;
  view.appendChild(header);

  // Next competition banner if set
  if (dates.nextCompName && dates.nextCompDate) {
    const nextD = new Date(dates.nextCompDate + 'T12:00:00');
    const daysUntil = Math.ceil((nextD - new Date()) / 86400000);
    if (daysUntil > 0) {
      const banner = el('div', 'next-comp-banner');
      banner.innerHTML = `
        <span class="ncb-icon">📌</span>
        <div>
          <div class="ncb-title">Next: ${dates.nextCompName}</div>
          <div class="ncb-sub">${Data.formatDateShort(dates.nextCompDate)} — ${daysUntil} day${daysUntil !== 1 ? 's' : ''} away</div>
        </div>
      `;
      view.appendChild(banner);
    }
  }

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  // Countdown
  content.appendChild(buildCountdown());

  // Upgrade targets
  const upgradeWrap = el('div');
  upgradeWrap.innerHTML = `
    <div class="section-heading">
      <div class="s-title">Worlds Goals ⭐</div>
      <button class="s-action" onclick="switchView('worlds')">See Worlds →</button>
    </div>
  `;
  const upgradeGrid = el('div', 'upgrade-grid');
  for (const app of Data.UPGRADE_TARGETS) {
    const pb = pbs[app];
    const tile = el('div', 'upgrade-tile');
    tile.innerHTML = `
      <div class="ut-icon">${appIcon(app)}</div>
      <div class="ut-name">${app}</div>
      <div class="ut-target">→ Copper 2</div>
      <div class="ut-score">${pb ? pb.toFixed(2) : '—'}</div>
      <div class="ut-lbl">Current PB</div>
    `;
    upgradeGrid.appendChild(tile);
  }
  upgradeWrap.appendChild(upgradeGrid);
  content.appendChild(upgradeWrap);

  // Latest competition
  if (latest) {
    const aa = Data.allAroundScore(latest);
    const card = el('div', 'card');
    const resultRows = Data.APPARATUS.map(app => {
      const r = latest.results.find(x => x.apparatus === app);
      if (!r) return '';
      const isPB      = !r.dna && r.score === pbs[app];
      const isUpgrade = Data.UPGRADE_TARGETS.includes(app);
      const scoreBadge = r.dna
        ? `<span class="score-badge dna">DNA</span>`
        : `<span class="score-badge ${isPB ? 'pb' : ''}">${r.score.toFixed(2)}</span>`;
      return `
        <div class="result-row">
          <span class="rr-app">${app}</span>
          ${isUpgrade ? '<span class="rr-star">⭐</span>' : ''}
          <span class="rr-spacer"></span>
          ${r.position && !r.dna ? `<span class="pos-pill ${posCls(r.position)}">${posLabel(r.position)}</span>` : ''}
          ${scoreBadge}
        </div>`;
    }).join('');

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--text);">${latest.name}</div>
          <div style="font-size:11px;color:var(--text-soft);margin-top:2px;">${Data.formatDateShort(latest.date)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:26px;font-weight:800;color:var(--purple);letter-spacing:-1px;">${aa.toFixed(2)}</div>
          <div style="font-size:10px;color:var(--text-soft);">All-Around</div>
        </div>
      </div>
      <div class="divider"></div>
      ${resultRows}
    `;
    const wrap = el('div');
    wrap.innerHTML = `<div class="section-heading"><div class="s-title">Latest Results</div><button class="s-action" onclick="switchView('comps')">All →</button></div>`;
    wrap.appendChild(card);
    content.appendChild(wrap);
  }

  // Personal bests
  const pbWrap = el('div');
  pbWrap.innerHTML = `<div class="section-heading"><div class="s-title">Personal Bests 👑</div></div>`;
  const pbGrid = el('div', 'pb-grid');
  for (const app of Data.APPARATUS) {
    const score = pbs[app];
    const isUpgrade = Data.UPGRADE_TARGETS.includes(app);
    const tile = el('div', 'pb-tile');
    tile.innerHTML = `
      <div class="pb-tile-icon ${isUpgrade ? 'gold' : ''}">${appIcon(app)}</div>
      <div>
        <div class="pb-app">${app}${isUpgrade ? ' ⭐' : ''}</div>
        <div class="pb-score ${isUpgrade ? 'purple' : ''}">${score ? score.toFixed(2) : '—'}</div>
      </div>
    `;
    pbGrid.appendChild(tile);
  }
  pbWrap.appendChild(pbGrid);
  content.appendChild(pbWrap);
}
