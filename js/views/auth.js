/* ═══════════════════════════════════════════
   AUTH VIEW — Login, invite redemption, signup
═══════════════════════════════════════════ */

const AuthView = {
  _pendingInvite: null, // invite record after token validated

  // Called by app on boot if not authenticated
  show(inviteToken) {
    const overlay = document.getElementById('auth-overlay');
    overlay.classList.add('active');
    if (inviteToken) {
      this._showInviteEntry(inviteToken);
    } else {
      this._showLogin();
    }
  },

  // Called when already logged in but an invite link was opened
  async showAcceptShare(inviteToken) {
    try {
      const invite = await Auth.validateInvite(inviteToken);
      // Get gymnast names from invite
      let gymnNames = [];
      if (invite.gymnast_ids?.length) {
        const { data } = await db.from('gymnasts').select('name').in('id', invite.gymnast_ids);
        gymnNames = (data || []).map(g => g.name);
      }
      const overlay = document.getElementById('auth-overlay');
      overlay.classList.add('active');
      const body = document.getElementById('auth-body');
      body.innerHTML = `
        <div class="auth-logo">🔗</div>
        <div class="auth-title">Shared Access</div>
        <div class="auth-sub">You've been invited to follow${gymnNames.length ? ' ' + gymnNames.join(' & ') : ' a gymnast'}</div>
        <div class="auth-form" style="margin-top:16px;">
          <div id="auth-error" class="auth-error" style="display:none"></div>
          <button class="auth-btn" onclick="AuthView._acceptShare('${inviteToken}')">Accept Access</button>
        </div>
        <button class="auth-link" onclick="AuthView.hide();history.replaceState({},'',location.pathname)">Dismiss</button>
      `;
    } catch(e) {
      // Invalid invite — just ignore it
      history.replaceState({}, '', location.pathname);
    }
  },

  async _acceptShare(token) {
    const btn = document.querySelector('.auth-btn');
    btn.textContent = 'Accepting…'; btn.disabled = true;
    try {
      const invite = await Auth.validateInvite(token);
      const userId = Auth.user.id;
      if (invite.gymnast_ids?.length) {
        await db.from('gymnast_supporters').insert(
          invite.gymnast_ids.map(gid => ({
            supporter_id: userId, gymnast_id: gid, granted_by: invite.parent_id,
          }))
        );
      }
      await db.from('invite_links').update({ used_at: new Date().toISOString(), used_by: userId }).eq('id', invite.id);
      await Auth._loadGymnasts();
      this.hide();
      history.replaceState({}, '', location.pathname);
      buildGymnastSwitcher();
      showToast('Access granted ✓');
    } catch(e) {
      document.getElementById('auth-error').textContent = e.message;
      document.getElementById('auth-error').style.display = 'block';
      btn.textContent = 'Accept Access'; btn.disabled = false;
    }
  },

  hide() {
    document.getElementById('auth-overlay').classList.remove('active');
  },

  // ── Login screen ───────────────────────────
  _logoTaps: 0,
  _logoTimer: null,

  _onLogoTap() {
    this._logoTaps++;
    clearTimeout(this._logoTimer);
    this._logoTimer = setTimeout(() => { this._logoTaps = 0; }, 3000);
    if (this._logoTaps >= 10) {
      this._logoTaps = 0;
      this._showAdminSetup();
    }
  },

  _showLogin() {
    const body = document.getElementById('auth-body');
    body.innerHTML = `
      <div class="auth-logo" onclick="AuthView._onLogoTap()" style="cursor:default;user-select:none">🤸</div>
      <div class="auth-title">Thea's Gymnastics</div>
      <div class="auth-sub">Sign in to continue</div>

      <div class="auth-form">
        <div class="auth-field">
          <label>Email or Username</label>
          <input id="auth-email" type="text" placeholder="your@email.com or username" autocomplete="username">
        </div>
        <div class="auth-field">
          <label>Password</label>
          <input id="auth-password" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <button class="auth-btn" id="auth-login-btn" onclick="AuthView._doLogin()">Sign In</button>
      </div>

      <button class="auth-link" onclick="AuthView._showInviteEntry()">
        I have an invite code
      </button>
    `;
    document.getElementById('auth-email').focus();
    document.getElementById('auth-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') AuthView._doLogin();
    });
  },

  async _doLogin() {
    let email      = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    // Username login — convert to synthetic email
    if (email && !email.includes('@')) {
      email = `${email.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gymnastics.internal`;
    }
    const btn      = document.getElementById('auth-login-btn');
    if (!email || !password) return;
    this._setError(null);
    btn.textContent = 'Signing in…';
    btn.disabled = true;
    try {
      await Auth.login(email, password);
      this.hide();
      appAfterAuth();
    } catch (e) {
      this._setError(e.message || 'Sign in failed');
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  },

  // ── Invite code entry ──────────────────────
  _showInviteEntry(prefill) {
    const body = document.getElementById('auth-body');
    body.innerHTML = `
      <div class="auth-logo">✉️</div>
      <div class="auth-title">Invite Code</div>
      <div class="auth-sub">Enter the code you were sent</div>

      <div class="auth-form">
        <div class="auth-field">
          <label>Invite Code</label>
          <input id="auth-token" type="text" placeholder="Paste your code here" autocomplete="off"
                 value="${prefill || ''}" style="font-size:13px;letter-spacing:0.02em">
        </div>
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <button class="auth-btn" id="auth-validate-btn" onclick="AuthView._doValidateInvite()">Continue</button>
      </div>

      <button class="auth-link" onclick="AuthView._showLogin()">Back to sign in</button>
    `;
    const input = document.getElementById('auth-token');
    input.focus();
    if (prefill) this._doValidateInvite();
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') AuthView._doValidateInvite();
    });
  },

  async _doValidateInvite() {
    const token = document.getElementById('auth-token').value.trim();
    const btn   = document.getElementById('auth-validate-btn');
    if (!token) return;
    this._setError(null);
    btn.textContent = 'Checking…';
    btn.disabled = true;
    try {
      const invite = await Auth.validateInvite(token);
      this._pendingInvite = invite;
      this._showSignup(invite);
    } catch (e) {
      this._setError(e.message || 'Invalid code');
      btn.textContent = 'Continue';
      btn.disabled = false;
    }
  },

  // ── Signup screen (after invite validated) ─
  _showSignup(invite) {
    const roleLabel = invite.invite_type === 'parent'  ? 'Parent account'
                    : invite.invite_type === 'gymnast' ? 'Gymnast account'
                    :                                    'Supporter account';
    const nameHint = invite.invitee_name ? ` for ${invite.invitee_name}` : '';
    const body = document.getElementById('auth-body');
    body.innerHTML = `
      <div class="auth-logo">🎉</div>
      <div class="auth-title">Create Account</div>
      <div class="auth-sub">${roleLabel}${nameHint}</div>

      <div class="auth-form">
        <div class="auth-field">
          <label>Your Name</label>
          <input id="su-name" type="text" placeholder="Full name" autocomplete="name"
                 value="${invite.invitee_name || ''}">
        </div>
        <div class="auth-field">
          <label>Email</label>
          <input id="su-email" type="email" placeholder="your@email.com" autocomplete="email">
        </div>
        <div class="auth-field">
          <label>Password</label>
          <input id="su-password" type="password" placeholder="Choose a password (8+ chars)" autocomplete="new-password">
        </div>
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <button class="auth-btn" id="auth-signup-btn" onclick="AuthView._doSignup()">Create Account</button>
      </div>

      <button class="auth-link" onclick="AuthView._showInviteEntry()">Back</button>
    `;
    document.getElementById('su-name').focus();
    document.getElementById('su-password').addEventListener('keydown', e => {
      if (e.key === 'Enter') AuthView._doSignup();
    });
  },

  async _doSignup() {
    const fullName = document.getElementById('su-name').value.trim();
    const email    = document.getElementById('su-email').value.trim();
    const password = document.getElementById('su-password').value;
    const btn      = document.getElementById('auth-signup-btn');

    if (!fullName || !email || !password) {
      this._setError('Please fill in all fields'); return;
    }
    if (password.length < 8) {
      this._setError('Password must be at least 8 characters'); return;
    }
    this._setError(null);
    btn.textContent = 'Creating account…';
    btn.disabled = true;

    try {
      await Auth.signupWithInvite(this._pendingInvite.token, { email, password, fullName });
      this.hide();
      appAfterAuth();
    } catch (e) {
      this._setError(e.message || 'Signup failed');
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  },

  // ── Gymnast setup prompt (new parent with no gymnasts yet) ──
  showGymnastSetup() {
    const body = document.getElementById('auth-body');
    const overlay = document.getElementById('auth-overlay');
    overlay.classList.add('active');
    body.innerHTML = `
      <div class="auth-logo">🤸</div>
      <div class="auth-title">Add Your Gymnast</div>
      <div class="auth-sub">Set up your gymnast's profile</div>

      <div class="auth-form">
        <div class="auth-field">
          <label>Gymnast's Name</label>
          <input id="gs-name" type="text" placeholder="e.g. Thea Latham">
        </div>
        <div class="auth-field">
          <label>Club</label>
          <input id="gs-club" type="text" placeholder="e.g. Star-Tastic Gymnastics" value="Star-Tastic Gymnastics">
        </div>
        <div class="auth-field">
          <label>USAIGC Level</label>
          <input id="gs-usaigc" type="text" placeholder="e.g. Copper 1" value="Copper 1">
        </div>
        <div class="auth-field">
          <label>IGA Level</label>
          <input id="gs-iga" type="text" placeholder="e.g. Level 8" value="Level 8">
        </div>
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <button class="auth-btn" id="auth-gs-btn" onclick="AuthView._doCreateGymnast()">Save & Continue</button>
      </div>
    `;
    document.getElementById('gs-name').focus();
  },

  async _doCreateGymnast() {
    const name     = document.getElementById('gs-name').value.trim();
    const club     = document.getElementById('gs-club').value.trim();
    const usaigc   = document.getElementById('gs-usaigc').value.trim();
    const iga      = document.getElementById('gs-iga').value.trim();
    const btn      = document.getElementById('auth-gs-btn');
    if (!name) { this._setError('Please enter the gymnast\'s name'); return; }
    this._setError(null);
    btn.textContent = 'Saving…';
    btn.disabled = true;
    try {
      await Auth.createGymnast(name, club, usaigc, iga);
      this.hide();
      appAfterAuth();
    } catch (e) {
      this._setError(e.message || 'Failed to create gymnast');
      btn.textContent = 'Save & Continue';
      btn.disabled = false;
    }
  },

  // ── Secret admin setup ─────────────────────
  _showAdminSetup() {
    const body = document.getElementById('auth-body');
    body.innerHTML = `
      <div class="auth-logo">🔐</div>
      <div class="auth-title">Admin Setup</div>
      <div class="auth-sub">One-time admin account creation</div>

      <div class="auth-form">
        <div class="auth-field">
          <label>Email</label>
          <input id="adm-email" type="email" placeholder="your@email.com" autocomplete="email">
        </div>
        <div class="auth-field">
          <label>Password</label>
          <input id="adm-password" type="password" placeholder="Choose a strong password" autocomplete="new-password">
        </div>
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <button class="auth-btn" id="auth-adm-btn" onclick="AuthView._doAdminSetup()">Create Admin Account</button>
      </div>

      <button class="auth-link" onclick="AuthView._showLogin()">Cancel</button>
    `;
    document.getElementById('adm-email').focus();
  },

  async _doAdminSetup() {
    const email    = document.getElementById('adm-email').value.trim();
    const password = document.getElementById('adm-password').value;
    const btn      = document.getElementById('auth-adm-btn');
    if (!email || !password) { this._setError('Please fill in all fields'); return; }
    if (password.length < 8) { this._setError('Password must be at least 8 characters'); return; }
    this._setError(null);
    btn.textContent = 'Creating…';
    btn.disabled = true;
    try {
      // Check no admin exists yet
      const { data: existing } = await db.from('profiles')
        .select('id').eq('role', 'admin').limit(1);
      if (existing?.length) {
        this._setError('An admin account already exists');
        btn.textContent = 'Create Admin Account';
        btn.disabled = false;
        return;
      }
      const { data: authData, error: authError } = await db.auth.signUp({ email, password });
      if (authError) throw authError;
      const userId = authData.user.id;
      // Insert profile before session exists (bootstrap RLS policy allows this)
      const { error: profError } = await db.from('profiles')
        .insert({ id: userId, full_name: 'Admin', role: 'admin' });
      if (profError) throw profError;
      // Sign in — requires email confirmation to be OFF in Supabase dashboard
      const { error: loginError } = await db.auth.signInWithPassword({ email, password });
      if (loginError) {
        this._setError('Account created! Check your email to confirm, then sign in normally.');
        btn.textContent = 'Create Admin Account';
        btn.disabled = false;
        return;
      }
      await Auth._loadProfile();
      this.hide();
      appAfterAuth();
    } catch (e) {
      this._setError(e.message || 'Setup failed');
      btn.textContent = 'Create Admin Account';
      btn.disabled = false;
    }
  },

  // ── Helpers ────────────────────────────────
  _setError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    if (msg) { el.textContent = msg; el.style.display = 'block'; }
    else      { el.style.display = 'none'; }
  },
};
