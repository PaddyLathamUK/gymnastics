/* ── Achievements View ── */

async function renderAchievements() {
  const achievements = await Data.getAchievements();
  const view = document.getElementById('view-achievements');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">Achievements 👑</div>`;
  view.appendChild(nav);

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  const pbs    = achievements.filter(a => a.kind === 'pb').length;
  const medals = achievements.filter(a => a.kind === 'medal').length;
  const pods   = achievements.filter(a => a.kind === 'podium').length;

  const statsCard = el('div', 'card');
  statsCard.innerHTML = `
    <div class="stat-row">
      <div class="stat-pill"><div class="stat-val">${pbs}</div><div class="stat-lbl">PBs Set</div></div>
      <div class="stat-pill"><div class="stat-val">${medals}</div><div class="stat-lbl">Medals</div></div>
      <div class="stat-pill"><div class="stat-val">${pods}</div><div class="stat-lbl">Podiums</div></div>
    </div>
  `;
  content.appendChild(statsCard);

  if (achievements.length === 0) {
    content.appendChild(emptyState('🌟', 'No achievements yet', 'Set personal bests and win medals to unlock achievements'));
    return;
  }

  for (const a of achievements) {
    const card = el('div', 'achieve-card');
    if (a.isNew) {
      setTimeout(async () => {
        await Data.markAchievementSeen(a.id);
        card.querySelector('.new-badge')?.remove();
      }, 2000);
    }
    card.innerHTML = `
      <div class="achieve-icon ${a.kind === 'pb' ? 'ai-purple' : 'ai-gold'}">${achieveEmoji(a.kind)}</div>
      <div class="achieve-body">
        <div class="a-title">
          ${a.title}
          ${a.isNew ? '<span class="new-badge">NEW</span>' : ''}
        </div>
        <div class="a-score ${a.kind === 'medal' || a.kind === 'podium' ? 'gold' : ''}">${a.detail}</div>
        <div class="a-meta">${kindLabel(a.kind)}${a.apparatus ? ' · ' + a.apparatus : ''} · ${Data.formatDateShort(a.date)}</div>
      </div>
    `;
    content.appendChild(card);
  }
}

function achieveEmoji(kind) {
  return { pb: '👑', medal: '🏅', podium: '🏆', milestone: '🎯', upgrade: '⭐' }[kind] || '🌟';
}

function kindLabel(kind) {
  return { pb: 'Personal Best', medal: 'Medal', podium: 'Podium', milestone: 'Milestone', upgrade: 'Upgrade' }[kind] || kind;
}
