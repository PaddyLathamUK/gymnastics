/* ── Worlds View ── */

function renderWorlds() {
  const state = Data.getWorldsState();
  const pbs   = Data.getPersonalBests();
  const view  = document.getElementById('view-worlds');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">Worlds 🇺🇸</div>`;
  view.appendChild(nav);

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  // Hero card
  const hero = el('div', 'worlds-hero');
  hero.innerHTML = `
    <div class="wh-top">
      <div>
        <div class="wh-title">USAIGC World Championships</div>
        <div class="wh-venue">Orlando, Florida</div>
        <div class="wh-date">27 June 2026</div>
      </div>
      <div class="wh-trophy">🏆</div>
    </div>
    <div class="wh-mission">
      <div class="wh-mission-lbl">Mission</div>
      <div class="wh-mission-val">Upgrade Vault &amp; Beam to Copper 2</div>
    </div>
  `;
  content.appendChild(hero);

  // Countdown
  content.appendChild(buildCountdown());

  // Upgrade toggles
  const upgradeCard = el('div', 'card');
  upgradeCard.innerHTML = `<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px;">⭐ Upgrade Targets</div>`;

  for (const app of Data.UPGRADE_TARGETS) {
    const key = app.toLowerCase();
    const achieved = state[key] || false;
    const row = el('div', 'worlds-upgrade-row');
    row.innerHTML = `
      <div>
        <div class="wur-name">${app}</div>
        <div class="wur-pb">Current PB: <span>${pbs[app] ? pbs[app].toFixed(2) : '—'}</span></div>
      </div>
      <div class="wur-spacer"></div>
      <div class="upgrade-btn ${achieved ? 'done' : ''}" id="toggle-${key}">✓</div>
    `;
    row.querySelector(`#toggle-${key}`).onclick = () => toggleUpgrade(key);
    upgradeCard.appendChild(row);
  }
  content.appendChild(upgradeCard);

  // Celebration
  if (state.vault || state.beam) {
    const achieved = [];
    if (state.vault) achieved.push('Vault');
    if (state.beam)  achieved.push('Beam');
    const cel = el('div', 'celebration-card');
    cel.id = 'celebration';
    cel.innerHTML = `
      <div style="font-size:44px;">🌟</div>
      <div class="c-title">UPGRADE ACHIEVED!</div>
      <div class="c-sub">Thea Latham — ${achieved.join(' & ')} → Copper 2</div>
    `;
    launchSparkles(cel);
    content.appendChild(cel);
  }

  // Live score entry button
  const entryCard = el('div', 'card');
  entryCard.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;">✏️ Live Score Entry</div>
    <div style="font-size:13px;color:var(--text-soft);margin-bottom:14px;">
      Enter scores in real time at the event as each apparatus is completed.
    </div>
  `;
  const entryBtn = el('button', 'btn-primary');
  entryBtn.innerHTML = '＋ Enter Worlds Scores';
  entryBtn.onclick = () => {
    switchView('comps');
    setTimeout(openAddComp, 100);
  };
  entryCard.appendChild(entryBtn);
  content.appendChild(entryCard);
}

function toggleUpgrade(key) {
  const state = Data.getWorldsState();
  state[key] = !state[key];
  Data.saveWorldsState(state);
  if (state[key]) {
    // Trigger haptic-like feedback via a brief vibration if supported
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
  }
  renderWorlds();
}

function launchSparkles(container) {
  const symbols = ['✦', '★', '✧', '✶'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = symbols[i % symbols.length];
    s.style.cssText = `
      left: ${20 + Math.random() * 60}%;
      top:  ${20 + Math.random() * 60}%;
      font-size: ${10 + Math.random() * 10}px;
      color: ${i % 2 === 0 ? '#F5C842' : '#fff'};
      animation-delay: ${Math.random() * 0.5}s;
      --tx: ${(Math.random() - 0.5) * 120}px;
      --ty: ${(Math.random() - 0.7) * 100}px;
    `;
    container.appendChild(s);
  }
}
