/* ═══════════════════════════════════════════
   AUTH — State & helpers
═══════════════════════════════════════════ */

const Auth = {
  user:     null,   // Supabase auth user
  profile:  null,   // { id, full_name, role }
  gymnast:  null,   // currently selected gymnast record
  gymnasts: [],     // all gymnasts visible to this user

  get role()        { return this.profile?.role; },
  get isAdmin()     { return this.profile?.role === 'admin'; },
  get isParent()    { return this.profile?.role === 'parent'; },
  get isGymnast()   { return this.profile?.role === 'gymnast'; },
  get isSupporter() { return this.profile?.role === 'supporter'; },
  get canWrite()    { return ['admin','parent','gymnast'].includes(this.profile?.role); },

  // ── Boot ───────────────────────────────────
  async init() {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      this.user = session.user;
      await this._loadProfile();
    }
    db.auth.onAuthStateChange(async (_event, session) => {
      this.user = session?.user ?? null;
      if (!this.user) {
        this.profile = null;
        this.gymnast = null;
        this.gymnasts = [];
      }
    });
    return !!this.user;
  },

  async _loadProfile() {
    const { data } = await db.from('profiles')
      .select('*').eq('id', this.user.id).single();
    if (!data) return false;
    this.profile = data;
    await this._loadGymnasts();
    if (this.gymnasts.length && !this.gymnast) this.gymnast = this.gymnasts[0];
    return true;
  },

  async _loadGymnasts() {
    const role = this.profile?.role;
    if (!role) return;
    if (role === 'admin') {
      const { data } = await db.from('gymnasts').select('*').order('name');
      this.gymnasts = data || [];
    } else if (role === 'parent') {
      const { data } = await db.from('parent_gymnast')
        .select('gymnasts(*)').eq('parent_id', this.user.id);
      this.gymnasts = (data || []).map(r => r.gymnasts).filter(Boolean);
    } else if (role === 'gymnast') {
      const { data } = await db.from('gymnasts')
        .select('*').eq('user_id', this.user.id).single();
      this.gymnasts = data ? [data] : [];
      this.gymnast  = data || null;
    } else if (role === 'supporter') {
      const { data } = await db.from('gymnast_supporters')
        .select('gymnasts(*)').eq('supporter_id', this.user.id);
      this.gymnasts = (data || []).map(r => r.gymnasts).filter(Boolean);
    }
  },

  selectGymnast(id) {
    this.gymnast = this.gymnasts.find(g => g.id === id) || this.gymnasts[0] || null;
  },

  // ── Auth actions ───────────────────────────
  async login(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    await this._loadProfile();
    return this.profile;
  },

  async logout() {
    await db.auth.signOut();
    this.user = null;
    this.profile = null;
    this.gymnast = null;
    this.gymnasts = [];
  },

  // ── Invite flow ────────────────────────────
  async validateInvite(token) {
    const { data, error } = await db.from('invite_links')
      .select('*')
      .eq('token', token.trim())
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .single();
    if (error || !data) throw new Error('Invalid or expired invite code');
    return data;
  },

  async signupWithInvite(token, { email, password, fullName }) {
    const invite = await this.validateInvite(token);

    const { data: authData, error: authError } = await db.auth.signUp({ email, password });
    if (authError) throw authError;
    const userId = authData.user.id;

    const role = invite.invite_type === 'parent'   ? 'parent'
               : invite.invite_type === 'gymnast'  ? 'gymnast'
               :                                     'supporter';

    const { error: profErr } = await db.from('profiles')
      .insert({ id: userId, full_name: fullName, role, email });
    if (profErr) throw profErr;

    if (role === 'supporter' && invite.gymnast_ids?.length) {
      await db.from('gymnast_supporters').insert(
        invite.gymnast_ids.map(gid => ({
          supporter_id: userId, gymnast_id: gid, granted_by: invite.parent_id,
        }))
      );
    }

    if (role === 'gymnast' && invite.gymnast_ids?.length) {
      await db.from('gymnasts')
        .update({ user_id: userId })
        .eq('id', invite.gymnast_ids[0]);
    }

    await db.from('invite_links')
      .update({ used_at: new Date().toISOString(), used_by: userId })
      .eq('id', invite.id);

    await this.login(email, password);
  },

  // ── Invite creation ────────────────────────
  async createParentInvite(inviteeName) {
    const { data, error } = await db.from('invite_links')
      .insert({ invite_type: 'parent', invitee_name: inviteeName, gymnast_ids: [] })
      .select().single();
    if (error) throw error;
    return data;
  },

  async createGymnastInvite(gymnastId, inviteeName) {
    const { data, error } = await db.from('invite_links')
      .insert({
        invite_type: 'gymnast',
        parent_id: this.user.id,
        gymnast_ids: [gymnastId],
        invitee_name: inviteeName,
      })
      .select().single();
    if (error) throw error;
    return data;
  },

  async createSupporterInvite(gymnastIds, inviteeName) {
    const { data, error } = await db.from('invite_links')
      .insert({
        invite_type: 'supporter',
        parent_id: this.user.id,
        gymnast_ids: gymnastIds,
        invitee_name: inviteeName,
      })
      .select().single();
    if (error) throw error;
    return data;
  },

  // ── Gymnast management (parent/admin) ──────
  async createGymnast(name, club, usaigcLevel, igaLevel) {
    const { data, error } = await db.from('gymnasts')
      .insert({ name, club, usaigc_level: usaigcLevel, iga_level: igaLevel, created_by: this.user.id })
      .select().single();
    if (error) throw error;
    await db.from('parent_gymnast')
      .insert({ parent_id: this.user.id, gymnast_id: data.id });
    await this._loadGymnasts();
    if (!this.gymnast) this.gymnast = data;
    return data;
  },

  inviteUrl(token) {
    return `${location.origin}${location.pathname}?invite=${token}`;
  },

  // ── Gymnast account management (via Edge Function) ──
  async setupGymnastLogin(gymnastId, username, password) {
    const { data: { session } } = await db.auth.getSession();
    const resp = await fetch(
      'https://absdbhasbcxfskapwzer.supabase.co/functions/v1/manage-gymnast-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'create', gymnast_id: gymnastId, username, password }),
      }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Failed to create login');
    // Update local cache
    const g = this.gymnasts.find(g => g.id === gymnastId);
    if (g) g.username = username;
    return result;
  },

  async updateGymnastPassword(gymnastId, password) {
    const { data: { session } } = await db.auth.getSession();
    const resp = await fetch(
      'https://absdbhasbcxfskapwzer.supabase.co/functions/v1/manage-gymnast-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'update_password', gymnast_id: gymnastId, password }),
      }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Failed to update password');
    return result;
  },
};
