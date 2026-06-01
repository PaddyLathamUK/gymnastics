/* ═══════════════════════════════════════════
   ADMIN / SETTINGS — Navigation-based panel
═══════════════════════════════════════════ */

// ── Navigation stack ───────────────────────
const AdminNav = {
  _stack: [],

  async go(section, params = {}) {
    this._stack.push({ section, params });
    await this._render();
  },

  async back() {
    this._stack.pop();
    if (this._stack.length === 0) { closeAdmin(); return; }
    await this._render();
  },

  async home() {
    this._stack = [];
    await openAdmin();
  },

  current() {
    return this._stack[this._stack.length - 1] || null;
  },

  async _render() {
    const view = document.getElementById('view-admin');
    view.innerHTML = '';
    const cur = this.current();
    if (!cur) return;
    try {
      await AdminSections[cur.section]?.(view, cur.params);
    } catch(e) {
      console.error('Admin render error:', e);
      view.innerHTML = `
        <div class="nav-bar">
          <button class="nav-back" onclick="AdminNav.back()">‹ Back</button>
          <div class="nav-title">Error</div>
        </div>
        <div style="padding:24px 20px;">
          <div style="color:var(--red);font-size:14px;font-weight:600;margin-bottom:16px;">${e.message}</div>
          <button class="btn-primary" onclick="AdminNav.back()">Go Back</button>
        </div>`;
    }
  },
};

// ── Section builder helpers ────────────────
function adminNav(title, showBack = true) {
  const nav = el('div', 'nav-bar');
  nav.innerHTML = `
    ${showBack
      ? `<button class="nav-back" onclick="AdminNav.back()">‹ Back</button>`
      : `<button class="nav-back" onclick="closeAdmin()">✕ Close</button>`}
    <div class="nav-title">${title}</div>
  `;
  return nav;
}

function adminScroll() {
  const scroll  = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  return { scroll, content };
}

function adminMenuRow(icon, title, sub, onclick) {
  const row = el('div', 'admin-menu-row');
  row.innerHTML = `
    <div class="amr-icon">${icon}</div>
    <div class="amr-text">
      <div class="amr-title">${title}</div>
      ${sub ? `<div class="amr-sub">${sub}</div>` : ''}
    </div>
    <div class="amr-chevron">›</div>
  `;
  row.onclick = onclick;
  return row;
}

// ── Sections ───────────────────────────────
const AdminSections = {

  // ── Home ─────────────────────────────────
  async home(view) {
    view.appendChild(adminNav(Auth.isAdmin ? 'Admin' : 'Settings', false));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    // Debug strip — remove once stable
    const dbg = el('div', '');
    dbg.style.cssText = 'padding:6px 16px;font-size:10px;color:var(--text-soft);background:var(--purple-bg);';
    dbg.textContent = `${Auth.profile?.full_name || Auth.user?.email} · ${Auth.role}`;
    content.appendChild(dbg);

    const card = el('div', 'card');
    card.style.padding = '4px 0';

    const svg = {
      users:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      trophy:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M6 5h12v5a6 6 0 0 1-12 0V5z"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M8 19h8"/></svg>`,
      gymnast:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M15.5 8.5c.8.5 1.5 1.3 1.5 2.5v2a1 1 0 0 1-1 1h-2l1 5.5a1 1 0 0 1-2 .2L12 16l-1 3.7a1 1 0 0 1-2-.2L10 14H8a1 1 0 0 1-1-1V11c0-1.2.7-2 1.5-2.5L12 7l3.5 1.5z" fill="none"/></svg>`,
      supporters:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
      invite:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
      profile:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      signout:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    };

    if (Auth.isAdmin) {
      card.appendChild(adminMenuRow(svg.users,     'User Management', 'Parents, gymnasts, supporters', () => AdminNav.go('userManagement')));
      card.appendChild(adminMenuRow(svg.trophy,    'Competition Setup', 'Organisations, levels, age categories', () => AdminNav.go('competitionSetup')));
    }

    if (Auth.isAdmin || Auth.isParent) {
      card.appendChild(adminMenuRow(svg.gymnast,    'My Gymnasts', 'Profiles, levels, login setup', () => AdminNav.go('myGymnasts')));
      card.appendChild(adminMenuRow(svg.supporters, 'Supporters', 'Manage who follows your gymnasts', () => AdminNav.go('mySupporters')));
      card.appendChild(adminMenuRow(svg.invite,     'Invites', 'Generate invite links', () => AdminNav.go('invites')));
    }

    if (Auth.isGymnast) {
      card.appendChild(adminMenuRow(svg.profile, 'My Profile', 'Name, club, levels', () => AdminNav.go('gymnast Profile')));
    }

    card.appendChild(adminMenuRow(svg.settings, 'Settings', 'Dates, app configuration', () => AdminNav.go('appSettings')));
    card.appendChild(adminMenuRow(svg.signout,  'Sign Out', '', async () => {
      if (confirm('Sign out?')) { await Auth.logout(); location.reload(); }
    }));
    content.appendChild(card);

    // Version label
    const ver = el('div', '');
    ver.style.cssText = 'text-align:center;font-size:11px;color:var(--text-soft);padding:16px 0 4px;';
    ver.textContent = `v${APP_VERSION} · ${APP_BUILD}`;
    content.appendChild(ver);
  },

  // ── User Management ───────────────────────
  async userManagement(view) {
    view.appendChild(adminNav('User Management'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const card = el('div', 'card');
    card.style.padding = '4px 0';

    // Load counts
    const { data: profiles } = await db.from('profiles').select('id, role');
    const parentCount    = (profiles || []).filter(p => p.role === 'parent').length;
    const gymnCount      = (profiles || []).filter(p => p.role === 'gymnast').length;
    const supporterCount = (profiles || []).filter(p => p.role === 'supporter').length;

    card.appendChild(adminMenuRow('👨‍👧', 'Parents', `${parentCount} registered`, () => AdminNav.go('parents')));
    card.appendChild(adminMenuRow('🤸', 'Gymnasts', `${gymnCount} registered`, () => AdminNav.go('allGymnasts')));
    card.appendChild(adminMenuRow('👏', 'Supporters', `${supporterCount} registered`, () => AdminNav.go('allSupporters')));
    content.appendChild(card);
  },

  // ── Parents list ──────────────────────────
  async parents(view) {
    view.appendChild(adminNav('Parents'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const { data: parents } = await db.from('profiles')
      .select('id, full_name').eq('role', 'parent').order('full_name');

    const { data: pgLinks } = await db.from('parent_gymnast')
      .select('parent_id, gymnasts(id, name)');

    const { data: pending } = await db.from('invite_links')
      .select('id, invitee_name, expires_at')
      .eq('invite_type', 'parent')
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString());

    const card = el('div', 'card');
    let hasContent = false;

    // Registered parents
    (parents || []).forEach(p => {
      const gymnasts = (pgLinks || []).filter(l => l.parent_id === p.id).map(l => l.gymnasts?.name).filter(Boolean);
      card.appendChild(adminMenuRow('👨‍👧', p.full_name,
        gymnasts.length ? gymnasts.join(', ') : 'No gymnasts assigned',
        () => AdminNav.go('editUser', { userId: p.id, role: 'parent' })
      ));
      hasContent = true;
    });

    // Pending invites
    (pending || []).forEach(inv => {
      const expires = new Date(inv.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const row = el('div', 'admin-row');
      row.style.opacity = '0.7';
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-title">⏳ ${inv.invitee_name || 'Unnamed'}</div>
          <div class="admin-row-sub">Invite pending · expires ${expires}</div>
        </div>
        <button class="admin-btn delete" onclick="AdminSections.revokeInvite('${inv.id}')">Revoke</button>
      `;
      card.appendChild(row);
      hasContent = true;
    });

    if (!hasContent) card.innerHTML = `<div class="empty-note">No parents yet. Use Invites to add one.</div>`;
    content.appendChild(card);

    const inviteBtn = el('button', 'btn-primary');
    inviteBtn.style.marginTop = '12px';
    inviteBtn.textContent = '＋ Invite a Parent';
    inviteBtn.onclick = () => AdminNav.go('invites', { preselect: 'parent' });
    content.appendChild(inviteBtn);
  },

  // ── All gymnasts ──────────────────────────
  async allGymnasts(view) {
    view.appendChild(adminNav('Gymnasts'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const { data: gymnasts } = await db.from('gymnasts')
      .select('id, name, club, usaigc_level, user_id, username').order('name');

    const { data: pgLinks } = await db.from('parent_gymnast')
      .select('gymnast_id, profiles(full_name)');

    const card = el('div', 'card');
    if (!gymnasts?.length) {
      card.innerHTML = `<div class="empty-note">No gymnasts yet.</div>`;
    } else {
      (gymnasts || []).forEach(g => {
        const parents = (pgLinks || []).filter(l => l.gymnast_id === g.id).map(l => l.profiles?.full_name).filter(Boolean);
        const sub = [g.club, parents.length ? 'Parent: ' + parents.join(', ') : '', g.username ? '🔑 ' + g.username : 'No login'].filter(Boolean).join(' · ');
        card.appendChild(adminMenuRow('🤸', g.name, sub, () => AdminNav.go('editGymnast', { id: g.id })));
      });
    }
    content.appendChild(card);
  },

  // ── Edit gymnast ──────────────────────────
  async editGymnast(view, { id }) {
    const { data: g } = await db.from('gymnasts').select('*').eq('id', id).single();
    const { data: pgLinks } = await db.from('parent_gymnast')
      .select('parent_id, profiles(full_name)').eq('gymnast_id', id);
    const { data: parents } = await db.from('profiles').select('id, full_name').eq('role', 'parent').order('full_name');

    view.appendChild(adminNav(g?.name || 'Gymnast'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const linkedParentIds = (pgLinks || []).map(l => l.parent_id);

    const card = el('div', 'card');
    card.innerHTML = `
      <div class="admin-section-title">👤 Profile</div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Name</label>
        <input class="form-input" id="eg-name" value="${g?.name || ''}">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Club</label>
        <input class="form-input" id="eg-club" value="${g?.club || ''}">
      </div>
      <div class="form-row" style="padding:0;margin-top:10px;">
        <div class="form-group">
          <label class="form-label">USAIGC Level</label>
          <select class="form-select" id="eg-usaigc">
            ${['Copper 1','Copper 2','Silver 1','Silver 2','Gold 1','Gold 2','Platinum'].map(l =>
              `<option ${g?.usaigc_level === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">IGA Level</label>
          <select class="form-select" id="eg-iga">
            ${['Level 6','Level 7','Level 8','Level 9','Level 10'].map(l =>
              `<option ${g?.iga_level === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn-primary" style="margin-top:14px;" onclick="AdminSections.saveGymnastProfile('${id}')">Save Profile</button>
    `;
    content.appendChild(card);

    // Parent assignment
    const parentCard = el('div', 'card');
    parentCard.innerHTML = `<div class="admin-section-title">👨‍👧 Assigned Parents</div>`;
    (parents || []).forEach(p => {
      const linked = linkedParentIds.includes(p.id);
      const row = el('div', 'admin-row');
      row.innerHTML = `
        <div class="admin-row-info"><div class="admin-row-title">${p.full_name}</div></div>
        <button class="admin-btn ${linked ? 'delete' : 'edit'}"
          onclick="AdminSections.toggleParentLink('${p.id}','${id}',${linked})">
          ${linked ? 'Unlink' : 'Link'}
        </button>
      `;
      parentCard.appendChild(row);
    });
    content.appendChild(parentCard);

    // Club assignment
    const clubs = await Data.getClubs();
    const clubCard = el('div', 'card');
    clubCard.innerHTML = `
      <div class="admin-section-title">🏫 Club</div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Club</label>
        <select class="form-select" id="eg-club-id" onchange="AdminSections.onClubChange('${id}')">
          <option value="">— No club assigned —</option>
          ${clubs.map(c => `<option value="${c.id}" ${g?.club_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
    `;

    // Club level section
    const clubLevelWrap = el('div', '');
    clubLevelWrap.id = `club-level-wrap-${id}`;
    const selectedClub = clubs.find(c => c.id === (g?.club_id || ''));
    clubLevelWrap.appendChild(await buildClubLevelSection(id, selectedClub));
    clubCard.appendChild(clubLevelWrap);

    const saveClubBtn = el('button', 'btn-primary');
    saveClubBtn.style.marginTop = '12px';
    saveClubBtn.textContent = 'Save Club';
    saveClubBtn.onclick = () => AdminSections.saveGymnastClub(id);
    clubCard.appendChild(saveClubBtn);
    content.appendChild(clubCard);

    // Login management
    const loginCard = el('div', 'card');
    loginCard.innerHTML = `<div class="admin-section-title">🔑 Gymnast Login</div>`;
    loginCard.appendChild(buildGymnastLoginForm(g));
    content.appendChild(loginCard);
  },

  async saveGymnastProfile(id) {
    await db.from('gymnasts').update({
      name:         document.getElementById('eg-name')?.value?.trim(),
      club:         document.getElementById('eg-club')?.value?.trim(),
      usaigc_level: document.getElementById('eg-usaigc')?.value,
      iga_level:    document.getElementById('eg-iga')?.value,
    }).eq('id', id);
    await Auth._loadGymnasts();
    showToast('Saved ✓');
    AdminNav.back();
  },

  async saveGymnastClub(id) {
    const clubId      = document.getElementById('eg-club-id')?.value || null;
    const clubLevelId = document.getElementById(`eg-club-level-${id}`)?.value || null;
    const levelDate   = document.getElementById(`eg-club-level-date-${id}`)?.value || null;

    // Save club assignment on gymnast
    await db.from('gymnasts').update({ club_id: clubId || null }).eq('id', id);

    // Save club level if selected — temporarily set gid override
    if (clubLevelId) {
      const prevGymnast = Auth.gymnast;
      Auth.gymnast = { id };
      await Data.saveGymnastClubLevel(clubLevelId, levelDate);
      Auth.gymnast = prevGymnast;
    }
    showToast('Club saved ✓');
    await AdminNav._render();
  },

  async toggleParentLink(parentId, gymnastId, isLinked, fromUser = false) {
    if (isLinked) {
      await db.from('parent_gymnast').delete().eq('parent_id', parentId).eq('gymnast_id', gymnastId);
    } else {
      await db.from('parent_gymnast').insert({ parent_id: parentId, gymnast_id: gymnastId });
    }
    if (fromUser) await AdminNav._render();
    else await AdminNav.go('editGymnast', { id: gymnastId });
  },

  // ── All supporters ────────────────────────
  async allSupporters(view) {
    view.appendChild(adminNav('Supporters'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const { data: supporters } = await db.from('profiles')
      .select('id, full_name').eq('role', 'supporter').order('full_name');

    const { data: sgLinks } = await db.from('gymnast_supporters')
      .select('supporter_id, gymnasts(name)');

    const { data: pending } = await db.from('invite_links')
      .select('id, invitee_name, expires_at, gymnast_ids')
      .eq('invite_type', 'supporter')
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString());

    const card = el('div', 'card');
    let hasContent = false;

    // Registered supporters
    (supporters || []).forEach(s => {
      const gymnasts = (sgLinks || []).filter(l => l.supporter_id === s.id).map(l => l.gymnasts?.name).filter(Boolean);
      card.appendChild(adminMenuRow('👏', s.full_name,
        'Following: ' + (gymnasts.join(', ') || '—'),
        () => AdminNav.go('editUser', { userId: s.id, role: 'supporter' })
      ));
      hasContent = true;
    });

    // Pending supporter invites
    (pending || []).forEach(inv => {
      const expires = new Date(inv.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const row = el('div', 'admin-row');
      row.style.opacity = '0.7';
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-title">⏳ ${inv.invitee_name || 'Unnamed'}</div>
          <div class="admin-row-sub">Invite pending · expires ${expires}</div>
        </div>
        <button class="admin-btn delete" onclick="AdminSections.revokeInvite('${inv.id}')">Revoke</button>
      `;
      card.appendChild(row);
      hasContent = true;
    });

    if (!hasContent) card.innerHTML = `<div class="empty-note">No supporters yet.</div>`;
    content.appendChild(card);
  },

  // ── Edit any user (admin only) ────────────
  async editUser(view, { userId, role }) {
    const { data: profile } = await db.from('profiles').select('*').eq('id', userId).single();

    const roleIcon = { admin:'🔐', parent:'👨‍👧', gymnast:'🤸', supporter:'👏' };
    view.appendChild(adminNav(`${roleIcon[role] || '👤'} ${profile?.full_name || 'User'}`));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    // ── Basic details ─────────────────────
    // Get email via security-definer function
    const { data: emailData } = await db.rpc('get_user_email', { user_id: userId });

    const detailCard = el('div', 'card');
    detailCard.innerHTML = `
      <div class="admin-section-title">👤 Details</div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Full Name</label>
        <input class="form-input" id="eu-name" value="${profile?.full_name || ''}">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Login Email</label>
        <input class="form-input" id="eu-email" type="email" value="${emailData || profile?.email || ''}"
          placeholder="email@example.com">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Role</label>
        <select class="form-select" id="eu-role">
          ${['parent','supporter','gymnast','admin'].map(r =>
            `<option value="${r}" ${profile?.role === r ? 'selected' : ''}>${roleIcon[r]} ${r.charAt(0).toUpperCase() + r.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <button class="btn-primary" style="margin-top:14px;" onclick="AdminSections.saveUserDetails('${userId}')">Save Details</button>
    `;
    content.appendChild(detailCard);

    // ── Password reset ────────────────────
    const pwCard = el('div', 'card');
    pwCard.innerHTML = `
      <div class="admin-section-title">🔑 Reset Password</div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">New Password</label>
        <input class="form-input" id="eu-pw" type="password" placeholder="8+ characters">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Confirm Password</label>
        <input class="form-input" id="eu-pw2" type="password" placeholder="Repeat password">
      </div>
      <div id="eu-pw-err" class="auth-error" style="display:none;margin-top:8px;"></div>
      <button class="btn-primary" style="margin-top:14px;" onclick="AdminSections.resetUserPassword('${userId}')">Reset Password</button>
    `;
    content.appendChild(pwCard);

    // ── Gymnast links (for parents) ───────
    if (role === 'parent') {
      const { data: allGymnasts } = await db.from('gymnasts').select('id, name').order('name');
      const { data: pgLinks } = await db.from('parent_gymnast')
        .select('gymnast_id').eq('parent_id', userId);
      const linkedIds = (pgLinks || []).map(l => l.gymnast_id);

      const gymCard = el('div', 'card');
      gymCard.innerHTML = `<div class="admin-section-title">🤸 Linked Gymnasts</div>`;
      (allGymnasts || []).forEach(g => {
        const linked = linkedIds.includes(g.id);
        const row = el('div', 'admin-row');
        row.innerHTML = `
          <div class="admin-row-info"><div class="admin-row-title">${g.name}</div></div>
          <button class="admin-btn ${linked ? 'delete' : 'edit'}"
            onclick="AdminSections.toggleParentLink('${userId}','${g.id}',${linked},true)">
            ${linked ? 'Unlink' : 'Link'}
          </button>
        `;
        gymCard.appendChild(row);
      });
      content.appendChild(gymCard);
    }

    // ── Supporter gymnast links ───────────
    if (role === 'supporter') {
      const { data: allGymnasts } = await db.from('gymnasts').select('id, name').order('name');
      const { data: sgLinks } = await db.from('gymnast_supporters')
        .select('gymnast_id').eq('supporter_id', userId);
      const linkedIds = (sgLinks || []).map(l => l.gymnast_id);

      const gymCard = el('div', 'card');
      gymCard.innerHTML = `<div class="admin-section-title">🤸 Following Gymnasts</div>`;
      (allGymnasts || []).forEach(g => {
        const linked = linkedIds.includes(g.id);
        const row = el('div', 'admin-row');
        row.innerHTML = `
          <div class="admin-row-info"><div class="admin-row-title">${g.name}</div></div>
          <button class="admin-btn ${linked ? 'delete' : 'edit'}"
            onclick="AdminSections.toggleSupporterLink('${userId}','${g.id}',${linked})">
            ${linked ? 'Unlink' : 'Link'}
          </button>
        `;
        gymCard.appendChild(row);
      });
      content.appendChild(gymCard);
    }

    // ── Danger zone ───────────────────────
    const dangerCard = el('div', 'card');
    dangerCard.innerHTML = `<div class="admin-section-title" style="color:var(--red);">⚠️ Danger Zone</div>`;
    const removeBtn = el('button', 'btn-cancel');
    removeBtn.style.cssText = 'width:100%;margin-top:10px;color:var(--red);border-color:rgba(255,91,122,0.25);';
    removeBtn.textContent = `Remove ${profile?.full_name || 'User'}`;
    removeBtn.onclick = () => AdminSections.removeUser(userId, profile?.full_name || 'this user');
    dangerCard.appendChild(removeBtn);
    content.appendChild(dangerCard);
  },

  async saveUserDetails(userId) {
    const name  = document.getElementById('eu-name')?.value?.trim();
    const role  = document.getElementById('eu-role')?.value;
    const email = document.getElementById('eu-email')?.value?.trim();
    if (!name) return;
    await db.from('profiles').update({ full_name: name, role, email }).eq('id', userId);
    // Update email in auth via edge function if changed
    if (email) {
      try {
        const { data: { session } } = await db.auth.getSession();
        await fetch('https://absdbhasbcxfskapwzer.supabase.co/functions/v1/manage-gymnast-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'update_email', user_id: userId, email }),
        });
      } catch(e) { console.warn('Email update failed:', e); }
    }
    showToast('Saved ✓');
    await AdminNav._render();
  },

  async resetUserPassword(userId) {
    const pw  = document.getElementById('eu-pw')?.value;
    const pw2 = document.getElementById('eu-pw2')?.value;
    const err = document.getElementById('eu-pw-err');
    err.style.display = 'none';
    if (!pw || pw.length < 8) { err.textContent = 'Password must be at least 8 characters'; err.style.display = 'block'; return; }
    if (pw !== pw2) { err.textContent = 'Passwords do not match'; err.style.display = 'block'; return; }
    try {
      // Use edge function to reset password (same as gymnast password reset)
      const { data: { session } } = await db.auth.getSession();
      const resp = await fetch('https://absdbhasbcxfskapwzer.supabase.co/functions/v1/manage-gymnast-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'update_password_by_user_id', user_id: userId, password: pw }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Failed');
      document.getElementById('eu-pw').value = '';
      document.getElementById('eu-pw2').value = '';
      showToast('Password reset ✓');
    } catch(e) {
      err.textContent = e.message;
      err.style.display = 'block';
    }
  },

  async toggleSupporterLink(supporterId, gymnastId, isLinked) {
    if (isLinked) {
      await db.from('gymnast_supporters').delete().eq('supporter_id', supporterId).eq('gymnast_id', gymnastId);
    } else {
      await db.from('gymnast_supporters').insert({ supporter_id: supporterId, gymnast_id: gymnastId, granted_by: Auth.user.id });
    }
    await AdminNav._render();
  },

  async revokeInvite(inviteId) {
    if (!confirm('Revoke this invite? The link will no longer work.')) return;
    await db.from('invite_links').update({ expires_at: new Date().toISOString() }).eq('id', inviteId);
    showToast('Invite revoked');
    await AdminNav._render();
  },

  async removeUser(userId, name) {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    // Remove from profiles (cascade handles links)
    await db.from('gymnast_supporters').delete().eq('supporter_id', userId);
    await db.from('parent_gymnast').delete().eq('parent_id', userId);
    await db.from('profiles').delete().eq('id', userId);
    // Also delete auth user via edge function would be ideal but for now just remove profile
    showToast(`${name} removed`);
    await AdminNav._render();
  },

  // ── My gymnasts (parent view) ─────────────
  async myGymnasts(view) {
    view.appendChild(adminNav('My Gymnasts'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const gymnasts = Auth.gymnasts;
    if (!gymnasts.length) {
      const empty = el('div', 'card');
      empty.innerHTML = `<div class="empty-note">No gymnasts yet. Add one below.</div>`;
      content.appendChild(empty);
    } else {
      gymnasts.forEach(g => {
        const card = el('div', 'card');
        card.style.padding = '0';
        card.appendChild(adminMenuRow('🤸', g.name, `${g.club || ''} · ${g.usaigc_level || ''}`, () => AdminNav.go('editGymnast', { id: g.id })));
        content.appendChild(card);
      });
    }

    if (Auth.isAdmin || Auth.isParent) {
      const addBtn = el('button', 'btn-primary');
      addBtn.style.marginTop = '12px';
      addBtn.textContent = '＋ Add Gymnast';
      addBtn.onclick = () => AdminNav.go('addGymnast');
      content.appendChild(addBtn);
    }
  },

  // ── Add gymnast ───────────────────────────
  async addGymnast(view) {
    view.appendChild(adminNav('Add Gymnast'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const card = el('div', 'card');
    card.innerHTML = `
      <div class="form-group" style="padding:0;">
        <label class="form-label">Gymnast Name</label>
        <input class="form-input" id="ag-name" placeholder="e.g. Emma Smith">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Club</label>
        <input class="form-input" id="ag-club" value="Star-Tastic Gymnastics">
      </div>
      <div class="form-row" style="padding:0;margin-top:10px;">
        <div class="form-group">
          <label class="form-label">USAIGC Level</label>
          <select class="form-select" id="ag-usaigc">
            ${['Copper 1','Copper 2','Silver 1','Silver 2','Gold 1','Gold 2','Platinum'].map(l => `<option>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">IGA Level</label>
          <select class="form-select" id="ag-iga">
            ${['Level 6','Level 7','Level 8','Level 9','Level 10'].map(l => `<option ${l==='Level 8'?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="ag-error" class="auth-error" style="display:none;margin-top:10px;"></div>
      <button class="btn-primary" style="margin-top:14px;" onclick="AdminSections.saveNewGymnast()">Add Gymnast</button>
    `;
    content.appendChild(card);
  },

  async saveNewGymnast() {
    const name = document.getElementById('ag-name')?.value?.trim();
    const errEl = document.getElementById('ag-error');
    if (!name) { errEl.textContent = 'Please enter a name'; errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    const btn = document.querySelector('#view-admin .btn-primary');
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
    try {
      await Auth.createGymnast(
        name,
        document.getElementById('ag-club')?.value?.trim(),
        document.getElementById('ag-usaigc')?.value,
        document.getElementById('ag-iga')?.value
      );
      showToast(`${name} added ✓`);
      buildGymnastSwitcher();
      await AdminNav.go('myGymnasts');
    } catch(e) {
      errEl.textContent = e.message || 'Failed to create gymnast — try again';
      errEl.style.display = 'block';
      if (btn) { btn.textContent = 'Add Gymnast'; btn.disabled = false; }
    }
  },

  // ── Supporters (parent view) ──────────────
  async mySupporters(view) {
    view.appendChild(adminNav('Supporters'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const gymnasts = Auth.gymnasts;
    if (!gymnasts.length) {
      const c = el('div', 'card');
      c.innerHTML = `<div class="empty-note">Add a gymnast first before managing supporters.</div>`;
      content.appendChild(c);
      return;
    }

    for (const g of gymnasts) {
      const { data: links } = await db.from('gymnast_supporters')
        .select('supporter_id, profiles(full_name, role)').eq('gymnast_id', g.id);

      const card = el('div', 'card');
      card.innerHTML = `<div class="admin-section-title">🤸 ${g.name}</div>`;

      if (!links?.length) {
        card.innerHTML += `<div class="empty-note" style="margin:8px 0;">No supporters yet.</div>`;
      } else {
        links.forEach(l => {
          const name = l.profiles?.full_name || 'Unknown';
          const roleIcon = l.profiles?.role === 'parent' ? '👨‍👧' : '👏';
          const row = el('div', 'admin-row');
          row.innerHTML = `
            <div class="admin-row-info">
              <div class="admin-row-title">${roleIcon} ${name}</div>
            </div>
            <button class="admin-btn delete" onclick="AdminSections.removeSupporter('${l.supporter_id}','${g.id}','${name}')">Remove</button>
          `;
          card.appendChild(row);
        });
      }

      // Share with another parent button
      const shareBtn = el('button', 'btn-primary');
      shareBtn.style.cssText = 'margin-top:10px;width:100%;font-size:13px;padding:10px;';
      shareBtn.textContent = '🔗 Share with another parent';
      shareBtn.onclick = () => AdminNav.go('shareGymnast', { gymnastId: g.id, gymnastName: g.name });
      card.appendChild(shareBtn);

      content.appendChild(card);
    }

    // Invite new supporter
    const inviteBtn = el('button', 'btn-primary');
    inviteBtn.style.cssText = 'margin-top:12px;background:linear-gradient(135deg,var(--purple-mid) 0%,var(--purple) 100%);';
    inviteBtn.textContent = '＋ Invite a Supporter';
    inviteBtn.onclick = () => AdminNav.go('invites', { preselect: 'supporter' });
    content.appendChild(inviteBtn);
  },

  async removeSupporter(supporterId, gymnastId, name) {
    if (!confirm(`Remove ${name} as a supporter?`)) return;
    await db.from('gymnast_supporters').delete()
      .eq('supporter_id', supporterId).eq('gymnast_id', gymnastId);
    showToast(`${name} removed`);
    await AdminNav._render();
  },

  // ── Share gymnast with another parent ─────
  async shareGymnast(view, { gymnastId, gymnastName }) {
    view.appendChild(adminNav(`Share ${gymnastName}`));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const card = el('div', 'card');
    card.innerHTML = `
      <div class="admin-section-title">🔗 Share with a Parent</div>
      <div style="font-size:13px;color:var(--text-soft);margin:8px 0 14px;">
        Generate a link to share ${gymnastName}'s results with another parent.
        They accept it using their existing account — no new signup needed.
      </div>
      <div class="form-group" style="padding:0;">
        <label class="form-label">Their Name (optional)</label>
        <input class="form-input" id="share-name" placeholder="e.g. Emma's Mum">
      </div>
      <div id="share-result" style="display:none;margin-top:12px;background:var(--purple-bg);border-radius:12px;padding:12px;font-size:12px;color:var(--text-mid);word-break:break-all;"></div>
      <button class="btn-primary" style="margin-top:12px;" onclick="AdminSections.generateShareLink('${gymnastId}')">Generate Share Link</button>
    `;
    content.appendChild(card);
  },

  async generateShareLink(gymnastId) {
    const name = document.getElementById('share-name')?.value?.trim() || 'Parent';
    const invite = await Auth.createSupporterInvite([gymnastId], name);
    const url = Auth.inviteUrl(invite.token);
    const result = document.getElementById('share-result');
    result.style.display = 'block';
    result.innerHTML = `<strong>Link ready!</strong><br><br>${url}<br>
      <button class="admin-btn edit" style="margin-top:8px;width:100%;" onclick="copyInvite('${url}', this)">Copy Link</button>`;
  },

  // ── Invites ───────────────────────────────
  async invites(view, { preselect } = {}) {
    view.appendChild(adminNav('Invites'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    // Pending invites
    const { data: pending } = await db.from('invite_links')
      .select('*').is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (pending?.length) {
      const pendingCard = el('div', 'card');
      pendingCard.innerHTML = `<div class="admin-section-title">⏳ Pending Invites</div>`;
      pending.forEach(inv => {
        const typeLabel = inv.invite_type === 'parent' ? '👨‍👧 Parent' : inv.invite_type === 'gymnast' ? '🤸 Gymnast' : '👏 Supporter';
        const expires = new Date(inv.expires_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
        const url = Auth.inviteUrl(inv.token);
        const row = el('div', 'invite-row');
        row.innerHTML = `
          <div class="invite-row-info">
            <div class="invite-name">${inv.invitee_name || 'Unnamed'} <span class="invite-type-pill">${typeLabel}</span></div>
            <div class="invite-expires">Single-use · expires ${expires}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="admin-btn edit" onclick="copyInvite('${url}', this)">Copy</button>
            <button class="admin-btn delete" onclick="AdminSections.revokeInvite('${inv.id}')">✕</button>
          </div>
        `;
        pendingCard.appendChild(row);
      });
      content.appendChild(pendingCard);
    }

    // Generate buttons
    const genCard = el('div', 'card');
    genCard.id = 'invites-gen-card';
    genCard.innerHTML = `<div class="admin-section-title">✉️ New Invite</div>`;

    if (Auth.isAdmin) {
      const parentBtn = el('button', 'btn-primary');
      parentBtn.style.cssText = 'width:100%;margin-top:8px;';
      parentBtn.textContent = '＋ Invite a Parent';
      parentBtn.onclick = () => showInviteForm('parent', genCard);
      genCard.appendChild(parentBtn);
    }

    const gymnBtn = el('button', 'btn-primary');
    gymnBtn.style.cssText = 'width:100%;margin-top:8px;background:linear-gradient(135deg,#34C97F 0%,#22a866 100%);';
    gymnBtn.textContent = '＋ Invite a Gymnast';
    gymnBtn.onclick = () => showInviteForm('gymnast', genCard);
    genCard.appendChild(gymnBtn);

    // Supporters: only if this user is linked as a parent to at least one gymnast
    if (Auth.gymnasts.length > 0) {
      const suppBtn = el('button', 'btn-primary');
      suppBtn.style.cssText = 'width:100%;margin-top:8px;background:linear-gradient(135deg,var(--purple-mid) 0%,var(--purple) 100%);';
      suppBtn.textContent = '＋ Invite a Supporter';
      suppBtn.onclick = () => showInviteForm('supporter', genCard);
      genCard.appendChild(suppBtn);
    }

    content.appendChild(genCard);

    // Auto-open form if preselected
    if (preselect) setTimeout(() => showInviteForm(preselect, genCard), 100);
  },

  // ── Competition Setup ─────────────────────
  async competitionSetup(view) {
    view.appendChild(adminNav('Competition Setup'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const card = el('div', 'card');
    card.style.padding = '4px 0';
    card.appendChild(adminMenuRow('🏫', 'Clubs', 'Club profiles and internal level structures', () => AdminNav.go('clubs')));
    card.appendChild(adminMenuRow('🏅', 'Organisations', 'USAIGC, IGA UK, etc.', () => AdminNav.go('organisations')));
    card.appendChild(adminMenuRow('📊', 'Age Categories', 'Under 9, 9-10, etc.', () => AdminNav.go('ageCategories')));
    content.appendChild(card);
  },

  // ── Clubs list ────────────────────────────
  async clubs(view) {
    view.appendChild(adminNav('Clubs'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const clubs = await Data.getClubs();
    clubs.forEach(c => {
      const card = el('div', 'card');
      card.style.padding = '0';
      card.appendChild(adminMenuRow('🏫', c.name, `${c.levels.length} internal levels`, () => AdminNav.go('clubDetail', { clubId: c.id, clubName: c.name })));
      content.appendChild(card);
    });

    const addBtn = el('button', 'btn-primary');
    addBtn.style.marginTop = '12px';
    addBtn.textContent = '＋ Add Club';
    addBtn.onclick = () => AdminNav.go('addClub');
    content.appendChild(addBtn);
  },

  // ── Club detail ───────────────────────────
  async clubDetail(view, { clubId, clubName }) {
    const clubs = await Data.getClubs();
    const club  = clubs.find(c => c.id === clubId);
    view.appendChild(adminNav(clubName));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    // Club info card
    const infoCard = el('div', 'card');
    infoCard.innerHTML = `
      <div class="admin-section-title">🏫 Club Details</div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Name</label>
        <input class="form-input" id="cd-name" value="${club?.name || ''}">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Short Name</label>
        <input class="form-input" id="cd-short" value="${club?.shortName || ''}" placeholder="e.g. Star-Tastic">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Address</label>
        <input class="form-input" id="cd-addr" value="${club?.address || ''}" placeholder="Training venue">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Website</label>
        <input class="form-input" id="cd-web" value="${club?.website || ''}" placeholder="https://...">
      </div>
      <button class="btn-primary" style="margin-top:14px;" onclick="AdminSections.saveClubDetails('${clubId}')">Save Details</button>
    `;
    content.appendChild(infoCard);

    // Internal levels card
    const levelsCard = el('div', 'card');
    levelsCard.innerHTML = `
      <div class="admin-section-title">🎖️ Internal Levels (low → high)</div>
      <div style="font-size:12px;color:var(--text-soft);margin-bottom:10px;">
        These are the club's own training/competing grades — separate from USAIGC or IGA levels.
      </div>
    `;

    (club?.levels || []).forEach((l, i) => {
      const row = el('div', 'admin-row');
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-title">
            ${i + 1}. ${l.name}
            ${l.isCompeting ? '<span class="club-competing-badge">🏆 Competing</span>' : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="admin-btn edit" title="${l.isCompeting ? 'Remove competing flag' : 'Mark as competing grade'}"
            onclick="AdminSections.toggleCompeting('${l.id}','${clubId}','${clubName}',${l.isCompeting})">
            ${l.isCompeting ? '🏆' : '○'}
          </button>
          ${i > 0 ? `<button class="admin-btn edit" onclick="AdminSections.moveClubLevel('${l.id}','${clubId}','${clubName}',-1)">↑</button>` : ''}
          ${i < club.levels.length - 1 ? `<button class="admin-btn edit" onclick="AdminSections.moveClubLevel('${l.id}','${clubId}','${clubName}',1)">↓</button>` : ''}
          <button class="admin-btn delete" onclick="AdminSections.deleteClubLevel('${l.id}','${l.name}','${clubId}','${clubName}')">✕</button>
        </div>
      `;
      levelsCard.appendChild(row);
    });

    const addRow = el('div', '');
    addRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;';
    addRow.innerHTML = `
      <input class="form-input" id="new-club-level" placeholder="e.g. A10 or Foundation" style="flex:1;">
      <button class="btn-primary" style="flex:0 0 auto;padding:0 16px;"
        onclick="AdminSections.addClubLevel('${clubId}','${clubName}')">Add</button>
    `;
    levelsCard.appendChild(addRow);
    content.appendChild(levelsCard);
  },

  async saveClubDetails(clubId) {
    await db.from('clubs').update({
      name:       document.getElementById('cd-name')?.value?.trim(),
      short_name: document.getElementById('cd-short')?.value?.trim(),
      address:    document.getElementById('cd-addr')?.value?.trim(),
      website:    document.getElementById('cd-web')?.value?.trim(),
    }).eq('id', clubId);
    showToast('Saved ✓');
    const clubs = await Data.getClubs();
    const club  = clubs.find(c => c.id === clubId);
    await AdminNav.go('clubDetail', { clubId, clubName: club?.name || '' });
  },

  async addClubLevel(clubId, clubName) {
    const name = document.getElementById('new-club-level')?.value?.trim();
    if (!name) return;
    const clubs = await Data.getClubs();
    const club  = clubs.find(c => c.id === clubId);
    const nextOrder = (club?.levels?.length || 0) + 1;
    await db.from('club_levels').insert({ club_id: clubId, name, sort_order: nextOrder, is_competing: false });
    showToast(`${name} added ✓`);
    await AdminNav.go('clubDetail', { clubId, clubName });
  },

  async deleteClubLevel(levelId, name, clubId, clubName) {
    if (!confirm(`Delete level "${name}"?`)) return;
    await db.from('club_levels').delete().eq('id', levelId);
    await AdminNav.go('clubDetail', { clubId, clubName });
  },

  async toggleCompeting(levelId, clubId, clubName, current) {
    await db.from('club_levels').update({ is_competing: !current }).eq('id', levelId);
    await AdminNav.go('clubDetail', { clubId, clubName });
  },

  async moveClubLevel(levelId, clubId, clubName, direction) {
    const clubs  = await Data.getClubs();
    const club   = clubs.find(c => c.id === clubId);
    const levels = club?.levels || [];
    const idx    = levels.findIndex(l => l.id === levelId);
    const swap   = idx + direction;
    if (swap < 0 || swap >= levels.length) return;
    await db.from('club_levels').update({ sort_order: levels[swap].sortOrder }).eq('id', levelId);
    await db.from('club_levels').update({ sort_order: levels[idx].sortOrder }).eq('id', levels[swap].id);
    await AdminNav.go('clubDetail', { clubId, clubName });
  },

  async addClub(view) {
    view.appendChild(adminNav('Add Club'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const card = el('div', 'card');
    card.innerHTML = `
      <div class="form-group" style="padding:0;">
        <label class="form-label">Club Name</label>
        <input class="form-input" id="ac-name" placeholder="e.g. City Gymnastics Club">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Short Name</label>
        <input class="form-input" id="ac-short" placeholder="e.g. City GC">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Address</label>
        <input class="form-input" id="ac-addr" placeholder="Training venue address">
      </div>
      <button class="btn-primary" style="margin-top:14px;" onclick="AdminSections.saveNewClub()">Add Club</button>
    `;
    content.appendChild(card);
  },

  async saveNewClub() {
    const name = document.getElementById('ac-name')?.value?.trim();
    if (!name) return;
    const { data, error } = await db.from('clubs').insert({
      name,
      short_name: document.getElementById('ac-short')?.value?.trim() || '',
      address:    document.getElementById('ac-addr')?.value?.trim() || '',
    }).select().single();
    if (error) { showToast('Error: ' + error.message); return; }
    showToast(`${name} added ✓`);
    await AdminNav.go('clubDetail', { clubId: data.id, clubName: data.name });
  },

  // ── Organisations ─────────────────────────
  async organisations(view) {
    view.appendChild(adminNav('Organisations'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const orgs = await Data.getOrganisations();
    orgs.forEach(org => {
      const card = el('div', 'card');
      card.style.padding = '0';
      card.appendChild(adminMenuRow('🏅', org.name, `${org.levels.length} levels · max score ${org.scoreMax}`, () => AdminNav.go('orgDetail', { orgId: org.id, orgName: org.name })));
      content.appendChild(card);
    });

    const addBtn = el('button', 'btn-primary');
    addBtn.style.marginTop = '12px';
    addBtn.textContent = '＋ Add Organisation';
    addBtn.onclick = () => AdminNav.go('addOrg');
    content.appendChild(addBtn);
  },

  async orgDetail(view, { orgId, orgName }) {
    view.appendChild(adminNav(orgName));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const orgs = await Data.getOrganisations();
    const org  = orgs.find(o => o.id === orgId);

    // Levels
    const levelsCard = el('div', 'card');
    levelsCard.innerHTML = `<div class="admin-section-title">Levels (low → high)</div>`;

    (org?.levels || []).forEach((l, i) => {
      const row = el('div', 'admin-row');
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-title">${i + 1}. ${l.name}</div>
        </div>
        <div style="display:flex;gap:6px;">
          ${i > 0 ? `<button class="admin-btn edit" onclick="AdminSections.moveLevel('${l.id}','${orgId}',-1)">↑</button>` : ''}
          ${i < org.levels.length - 1 ? `<button class="admin-btn edit" onclick="AdminSections.moveLevel('${l.id}','${orgId}',1)">↓</button>` : ''}
          <button class="admin-btn delete" onclick="AdminSections.deleteLevel('${l.id}','${l.name}','${orgId}')">✕</button>
        </div>
      `;
      levelsCard.appendChild(row);
    });

    // Add level form
    const addRow = el('div', '');
    addRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;';
    addRow.innerHTML = `
      <input class="form-input" id="new-level-name" placeholder="e.g. Gold 3" style="flex:1;">
      <button class="btn-primary" style="flex:0 0 auto;padding:0 16px;" onclick="AdminSections.addLevel('${orgId}')">Add</button>
    `;
    levelsCard.appendChild(addRow);
    content.appendChild(levelsCard);

    // Delete org
    if (org?.levels.length === 0) {
      const delBtn = el('button', 'btn-cancel');
      delBtn.style.cssText = 'width:100%;color:var(--red);border-color:rgba(255,91,122,0.2);margin-top:8px;';
      delBtn.textContent = 'Delete Organisation';
      delBtn.onclick = async () => {
        if (confirm(`Delete ${orgName}?`)) {
          await db.from('organisations').delete().eq('id', orgId);
          showToast('Deleted');
          AdminNav.back();
        }
      };
      content.appendChild(delBtn);
    }
  },

  async addLevel(orgId) {
    const name = document.getElementById('new-level-name')?.value?.trim();
    if (!name) return;
    const orgs = await Data.getOrganisations();
    const org  = orgs.find(o => o.id === orgId);
    const nextOrder = (org?.levels?.length || 0) + 1;
    await db.from('org_levels').insert({ org_id: orgId, name, sort_order: nextOrder });
    showToast(`${name} added ✓`);
    await AdminNav.go('orgDetail', { orgId, orgName: org?.name });
  },

  async deleteLevel(levelId, name, orgId) {
    if (!confirm(`Delete level "${name}"? This will affect any competitions tagged to this level.`)) return;
    await db.from('org_levels').delete().eq('id', levelId);
    const orgs = await Data.getOrganisations();
    const org  = orgs.find(o => o.id === orgId);
    await AdminNav.go('orgDetail', { orgId, orgName: org?.name });
  },

  async moveLevel(levelId, orgId, direction) {
    const orgs = await Data.getOrganisations();
    const org  = orgs.find(o => o.id === orgId);
    const levels = org?.levels || [];
    const idx = levels.findIndex(l => l.id === levelId);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= levels.length) return;
    // Swap sort_orders
    await db.from('org_levels').update({ sort_order: levels[swapIdx].sortOrder }).eq('id', levelId);
    await db.from('org_levels').update({ sort_order: levels[idx].sortOrder }).eq('id', levels[swapIdx].id);
    await AdminNav.go('orgDetail', { orgId, orgName: org?.name });
  },

  async addOrg(view) {
    view.appendChild(adminNav('Add Organisation'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const card = el('div', 'card');
    card.innerHTML = `
      <div class="form-group" style="padding:0;">
        <label class="form-label">Name</label>
        <input class="form-input" id="ao-name" placeholder="e.g. British Gymnastics">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Max Score Per Apparatus</label>
        <input class="form-input" id="ao-score" type="number" step="0.1" value="10.0">
      </div>
      <button class="btn-primary" style="margin-top:14px;" onclick="AdminSections.saveNewOrg()">Add Organisation</button>
    `;
    content.appendChild(card);
  },

  async saveNewOrg() {
    const name     = document.getElementById('ao-name')?.value?.trim();
    const scoreMax = parseFloat(document.getElementById('ao-score')?.value) || 10.0;
    if (!name) return;
    await db.from('organisations').insert({ name, score_max: scoreMax });
    showToast(`${name} added ✓`);
    await AdminNav.go('organisations');
  },

  // ── Age categories ────────────────────────
  async ageCategories(view) {
    view.appendChild(adminNav('Age Categories'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    const { data: cats } = await db.from('age_categories')
      .select('*').order('sort_order');

    const card = el('div', 'card');
    (cats || []).forEach(c => {
      const range = c.age_min && c.age_max ? `${c.age_min}–${c.age_max}`
                  : c.age_max ? `Under ${c.age_max + 1}`
                  : c.age_min ? `${c.age_min}+` : 'Any age';
      const row = el('div', 'admin-row');
      row.innerHTML = `
        <div class="admin-row-info">
          <div class="admin-row-title">${c.name}</div>
          <div class="admin-row-sub">${range}</div>
        </div>
        <button class="admin-btn delete" onclick="AdminSections.deleteAgeCat('${c.id}','${c.name}')">✕</button>
      `;
      card.appendChild(row);
    });

    const addRow = el('div', '');
    addRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;';
    addRow.innerHTML = `
      <input class="form-input" id="ac-name" placeholder="Name e.g. 11-12" style="flex:2;min-width:80px;">
      <input class="form-input" id="ac-min" type="number" placeholder="Min age" style="flex:1;min-width:60px;">
      <input class="form-input" id="ac-max" type="number" placeholder="Max age" style="flex:1;min-width:60px;">
      <button class="btn-primary" style="flex:0 0 auto;padding:0 14px;" onclick="AdminSections.addAgeCat()">Add</button>
    `;
    card.appendChild(addRow);
    content.appendChild(card);
  },

  async deleteAgeCat(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    await db.from('age_categories').delete().eq('id', id);
    await AdminNav.go('ageCategories');
  },

  async addAgeCat() {
    const name   = document.getElementById('ac-name')?.value?.trim();
    const ageMin = parseInt(document.getElementById('ac-min')?.value) || null;
    const ageMax = parseInt(document.getElementById('ac-max')?.value) || null;
    if (!name) return;
    const { data: existing } = await db.from('age_categories').select('sort_order').order('sort_order', { ascending: false }).limit(1);
    const nextOrder = (existing?.[0]?.sort_order || 0) + 1;
    await db.from('age_categories').insert({ name, age_min: ageMin, age_max: ageMax, sort_order: nextOrder });
    showToast(`${name} added ✓`);
    await AdminNav.go('ageCategories');
  },

  // ── App settings ──────────────────────────
  async appSettings(view) {
    const dates   = await Data.getDates();
    const profile = await Data.getProfile();

    view.appendChild(adminNav('Settings'));
    const { scroll, content } = adminScroll();
    view.appendChild(scroll);

    // My profile
    const profileCard = el('div', 'card');
    if (Auth.isGymnast) {
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
        <button class="btn-primary" style="margin-top:14px;" onclick="saveProfile()">Save</button>
      `;
    } else {
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

    // Key dates
    const datesCard = el('div', 'card');
    datesCard.innerHTML = `
      <div class="admin-section-title">📅 Key Dates</div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Worlds Date (Orlando)</label>
        <input class="form-input" id="adm-worlds" type="date" value="${dates.worldsDate}">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Next Competition Name</label>
        <input class="form-input" id="adm-nextname" placeholder="e.g. Regional Champs" value="${dates.nextCompName || ''}">
      </div>
      <div class="form-group" style="padding:0;margin-top:10px;">
        <label class="form-label">Next Competition Date</label>
        <input class="form-input" id="adm-nextdate" type="date" value="${dates.nextCompDate || ''}">
      </div>
      <button class="btn-primary" style="margin-top:14px;" onclick="saveDates()">Save Dates</button>
    `;
    content.appendChild(datesCard);

    // Data migration (admin only)
    if (Auth.isAdmin) {
      const migrateCard = el('div', 'card');
      migrateCard.innerHTML = `
        <div class="admin-section-title">🔄 Data Migration</div>
        <div style="font-size:13px;color:var(--text-soft);margin:8px 0 12px;">Migrate old localStorage data to the database.</div>
      `;
      const migrateBtn = el('button', 'btn-primary');
      migrateBtn.textContent = 'Migrate Local Data';
      migrateBtn.onclick = async () => {
        migrateBtn.textContent = 'Migrating…'; migrateBtn.disabled = true;
        const count = await Data.migrateFromLocalStorage();
        showToast(`Migrated ${count} records ✓`);
        migrateBtn.textContent = 'Migrate Local Data'; migrateBtn.disabled = false;
      };
      migrateCard.appendChild(migrateBtn);
      content.appendChild(migrateCard);

      // Danger zone
      const dangerCard = el('div', 'card');
      dangerCard.innerHTML = `<div class="admin-section-title" style="color:var(--red);">⚠️ Danger Zone</div>`;
      const resetBtn = el('button', 'btn-cancel');
      resetBtn.style.cssText = 'width:100%;margin-top:10px;color:var(--red);border-color:rgba(255,91,122,0.25);';
      resetBtn.textContent = 'Reset All Competition Data';
      resetBtn.onclick = async () => {
        if (confirm('Delete ALL competition data? This cannot be undone.')) {
          await db.from('competition_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await db.from('competitions').delete().neq('id', 'none');
          await db.from('training_sessions').delete().neq('id', 'none');
          await db.from('achievements').delete().neq('id', 'none');
          showToast('All data reset');
          renderDashboard();
        }
      };
      dangerCard.appendChild(resetBtn);
      content.appendChild(dangerCard);
    }
  },
};

// ── Club level section builder ────────────────────────────
async function buildClubLevelSection(gymnastId, club) {
  const wrap = el('div', '');
  if (!club?.levels?.length) return wrap;

  const current = await Data.getGymnastClubLevel(gymnastId);

  wrap.innerHTML = `
    <div class="form-group" style="padding:0;margin-top:10px;">
      <label class="form-label">Current Club Level</label>
      <select class="form-select" id="eg-club-level-${gymnastId}">
        <option value="">— Not set —</option>
        ${club.levels.map(l => `
          <option value="${l.id}" ${current?.levelId === l.id ? 'selected' : ''}>
            ${l.name}${l.isCompeting ? ' 🏆' : ''}
          </option>`).join('')}
      </select>
    </div>
    <div class="form-group" style="padding:0;margin-top:8px;">
      <label class="form-label">Date Achieved</label>
      <input class="form-input" id="eg-club-level-date-${gymnastId}" type="date"
        value="${current?.achievedDate || new Date().toISOString().slice(0,10)}">
    </div>
  `;
  return wrap;
}

// Refresh club level dropdown when club changes
async function onClubChange(gymnastId) {
  const clubId = document.getElementById('eg-club-id')?.value;
  const clubs  = await Data.getClubs();
  const club   = clubs.find(c => c.id === clubId);
  const wrap   = document.getElementById(`club-level-wrap-${gymnastId}`);
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.appendChild(await buildClubLevelSection(gymnastId, club));
}

// ── Inline invite form (used in invites section) ──────────
function showInviteForm(type, card) {
  card.querySelector('.invite-form')?.remove();

  const form = el('div', 'invite-form');
  form.style.cssText = 'margin-top:12px;background:var(--purple-bg);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;';

  const label = type === 'parent' ? 'Parent name' : type === 'gymnast' ? 'Gymnast name' : 'Supporter name';

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
      <input class="form-input" id="inv-name" placeholder="Full name" style="background:white;">
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
  const name  = document.getElementById('inv-name')?.value.trim();
  const gymId = document.getElementById('inv-gymnast')?.value || Auth.gymnast?.id;
  if (!name) { showToast('Please enter a name'); return; }
  try {
    let invite;
    if (type === 'parent')        invite = await Auth.createParentInvite(name);
    else if (type === 'gymnast')  invite = await Auth.createGymnastInvite(gymId, name);
    else                          invite = await Auth.createSupporterInvite(gymId ? [gymId] : [], name);

    const url = Auth.inviteUrl(invite.token);
    const result = document.getElementById('inv-result');
    result.style.display = 'block';
    result.innerHTML = `<strong>Link ready!</strong><br>${url}<br>
      <button class="admin-btn edit" style="margin-top:8px;width:100%;" onclick="copyInvite('${url}', this)">Copy Link</button>`;
    showToast('Invite created ✓');
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

// ── Gymnast login form builder (shared) ───────────────────
function buildGymnastLoginForm(g) {
  const hasLogin = !!g?.user_id;
  const wrap = el('div', '');
  wrap.innerHTML = `
    <div style="font-size:13px;color:var(--text-soft);margin-bottom:10px;">
      ${hasLogin ? `Username: <strong>${g.username}</strong>` : 'No login set up yet.'}
    </div>
    ${!hasLogin ? `
    <div class="form-group" style="padding:0;margin-bottom:10px;">
      <label class="form-label">Username</label>
      <input class="form-input" id="gl-user-${g.id}" value="${g.name.toLowerCase().replace(/\s+/g, '.')}">
    </div>` : ''}
    <div class="form-group" style="padding:0;margin-bottom:10px;">
      <label class="form-label">${hasLogin ? 'New Password' : 'Password'}</label>
      <input class="form-input" id="gl-pass-${g.id}" type="password" placeholder="8+ characters">
    </div>
    <div class="form-group" style="padding:0;margin-bottom:10px;">
      <label class="form-label">Confirm Password</label>
      <input class="form-input" id="gl-pass2-${g.id}" type="password" placeholder="Repeat password">
    </div>
    <div id="gl-err-${g.id}" style="display:none;font-size:13px;color:var(--red);margin-bottom:8px;"></div>
    <button class="btn-primary" onclick="saveGymnastLogin('${g.id}', ${hasLogin})">
      ${hasLogin ? 'Change Password' : 'Create Login'}
    </button>
  `;
  return wrap;
}

async function saveGymnastLogin(gymnastId, hasLogin) {
  const usernameEl = document.getElementById(`gl-user-${gymnastId}`);
  const username   = usernameEl?.value.trim();
  const password   = document.getElementById(`gl-pass-${gymnastId}`)?.value;
  const password2  = document.getElementById(`gl-pass2-${gymnastId}`)?.value;
  const errEl      = document.getElementById(`gl-err-${gymnastId}`);

  errEl.style.display = 'none';
  if (!hasLogin && !username) { errEl.textContent = 'Please enter a username'; errEl.style.display = 'block'; return; }
  if (password.length < 8)    { errEl.textContent = 'Password must be at least 8 characters'; errEl.style.display = 'block'; return; }
  if (password !== password2) { errEl.textContent = 'Passwords do not match'; errEl.style.display = 'block'; return; }

  try {
    if (hasLogin) await Auth.updateGymnastPassword(gymnastId, password);
    else          await Auth.setupGymnastLogin(gymnastId, username, password);
    showToast(hasLogin ? 'Password updated ✓' : 'Login created ✓');
    await AdminNav._render();
  } catch(e) {
    errEl.textContent = e.message || 'Failed — try again';
    errEl.style.display = 'block';
  }
}

// ── Legacy save helpers (called from settings) ────────────
async function saveProfile() {
  await Data.saveProfile({
    name:        document.getElementById('adm-name')?.value?.trim() || '',
    club:        document.getElementById('adm-club')?.value?.trim() || '',
    usaigcLevel: document.getElementById('adm-usaigc')?.value || '',
    igaLevel:    document.getElementById('adm-iga')?.value || '',
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
  await Data.saveDates({
    worldsDate:   document.getElementById('adm-worlds')?.value || '2026-06-27',
    nextCompName: document.getElementById('adm-nextname')?.value?.trim() || '',
    nextCompDate: document.getElementById('adm-nextdate')?.value || '',
  });
  await renderDashboard();
  showToast('Dates saved ✓');
}

// ── Open / close ──────────────────────────────────────────
async function openAdmin() {
  document.getElementById('view-admin').classList.add('active');
  AdminNav._stack = [{ section: 'home', params: {} }];
  await AdminNav._render();
}

function closeAdmin() {
  document.getElementById('view-admin').classList.remove('active');
  AdminNav._stack = [];
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
      background:#2D1B69;color:#fff;font-size:13px;font-weight:700;
      padding:10px 20px;border-radius:20px;z-index:9000;
      box-shadow:0 4px 20px rgba(45,27,105,0.4);transition:opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}
