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

  hide() {
    document.getElementById('auth-overlay').classList.remove('active');
  },

  // ── Login screen ───────────────────────────
  _showLogin() {
    const body = document.getElementById('auth-body');
    body.innerHTML = `
      <div class="auth-logo">🤸</div>
      <div class="auth-title">Thea's Gymnastics</div>
      <div class="auth-sub">Sign in to continue</div>

      <div class="auth-form">
        <div class="auth-field">
          <label>Email</label>
          <input id="auth-email" type="email" placeholder="your@email.com" autocomplete="email">
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
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
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

  // ── Helpers ────────────────────────────────
  _setError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) return;
    if (msg) { el.textContent = msg; el.style.display = 'block'; }
    else      { el.style.display = 'none'; }
  },
};
