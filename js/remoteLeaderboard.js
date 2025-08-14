(function(){
  const cfg = window.LEADERBOARD_CONFIG || null;
  function hasRemote(){ return !!(cfg && cfg.supabaseUrl && cfg.supabaseAnonKey); }

  let supa = null;
  async function initClient(){
    if (!hasRemote()) return null;
    try {
      if (!window.supabase) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (!supa) supa = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      return supa;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return null;
    }
  }

  async function currentUserId(){
    const c = await initClient(); if (!c) return null;
    try { 
      const { data } = await c.auth.getUser(); 
      if (data?.user?.id) return data.user.id;
    } catch { }
    // Không trả về local_* cho owner vì bảng remote không có cột owner cho local
    return null;
  }

  async function saveScoreRemote(game, displayName, score){
    const client = await initClient(); if (!client) return false;
    try {
      // Luôn lưu theo (user, game) để tránh lỗi schema owner/rls
      const payload = { user: displayName, game, score };
      let { error } = await client.from(cfg.table).upsert(payload, { onConflict: 'user,game' });
      // Fallback: table không có cột owner → thử lại không dùng owner
      if (error && (String(error.message || '').includes("owner") || error.code === 'PGRST204')){
        const fallbackPayload = { user: displayName, game, score };
        ({ error } = await client.from(cfg.table).upsert(fallbackPayload, { onConflict: 'user,game' }));
      }
      // Fallback 2: bảng chưa có unique index cho ON CONFLICT (42P10)
      if (error && (error.code === '42P10' || /no unique|exclusion constraint/i.test(String(error.message)))) {
        // Tự xử lý: nếu đã có bản ghi → update, nếu chưa → insert
        const match = { user: displayName, game };
        const { data: exists } = await client.from(cfg.table).select('id').match(match).limit(1).maybeSingle();
        if (exists && exists.id) {
          const { error: updErr } = await client.from(cfg.table).update({ score }).match(match);
          if (updErr) throw updErr;
          error = null;
        } else {
          const { error: insErr } = await client.from(cfg.table).insert([payload]);
          if (insErr) throw insErr;
          error = null;
        }
      }
      if (error) throw error; return true;
    } catch (error) {
      console.error('Failed to save score remotely:', error);
      return false; 
    }
  }

  async function getLeaderboardRemote(game, limit=10){
    const client = await initClient(); if (!client) return [];
    try {
      let query = client.from(cfg.table).select('user, game, score').eq('game', game).order('score', { ascending: false }).limit(limit);
      const { data, error } = await query;
      if (error) throw error; return data || [];
    } catch { return []; }
  }

  // -------- AUTH helpers --------
  async function signUpEmail(email, password, displayName){
    const c = await initClient(); if (!c) throw new Error('No client');
    const { data, error } = await c.auth.signUp({ email, password });
    if (error) throw error;
    if (displayName) localStorage.setItem('gh_display_name', displayName);
    return data;
  }
  async function signInEmail(email, password){
    const c = await initClient(); if (!c) throw new Error('No client');
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error; return data;
  }
  async function signOut(){ const c = await initClient(); if (c) await c.auth.signOut(); }

  function idToEmail(userId){
    // Try to use a more acceptable domain
    const domains = ['example.org', 'test.org', 'demo.org', 'supabase.co'];
    const dom = (cfg && cfg.usernameDomain) ? cfg.usernameDomain : domains[0];
    const email = `${String(userId).trim()}@${dom}`;
    console.log('Generated email:', email, 'using domain:', dom);
    return email;
  }
  
  async function signUpUserId(userId, password, displayName){
    try {
      const r = await signUpEmail(idToEmail(userId), password, displayName);
      try { localStorage.setItem('gh_display_name', displayName || userId); } catch {}
      return r;
    } catch (error) {
      console.error('Supabase signup failed:', error);
      // Fallback: create local user if Supabase fails
      if (error.message.includes('invalid') || error.message.includes('400')) {
        console.log('Falling back to local user creation');
        // Store user locally as fallback
        const users = JSON.parse(localStorage.getItem('gh_local_users') || '[]');
        const existingUser = users.find(u => u.id === userId);
        if (existingUser) {
          throw new Error('User ID already exists');
        }
        users.push({ id: userId, password: password, displayName: displayName || userId });
        localStorage.setItem('gh_local_users', JSON.stringify(users));
        localStorage.setItem('gh_display_name', displayName || userId);
        return { user: { id: 'local_' + userId }, session: null };
      }
      throw error;
    }
  }
  
  async function signInUserId(userId, password){
    try {
      const res = await signInEmail(idToEmail(userId), password);
      // Lưu tên hiển thị để dùng làm "user" khi ghi điểm online
      try { localStorage.setItem('gh_display_name', userId); } catch {}
      return res;
    } catch (error) {
      console.error('Supabase signin failed:', error);
      // Fallback: check local users
      const users = JSON.parse(localStorage.getItem('gh_local_users') || '[]');
      const user = users.find(u => u.id === userId && u.password === password);
      if (user) {
        console.log('Local user authentication successful');
        localStorage.setItem('gh_display_name', user.displayName);
        return { user: { id: 'local_' + userId }, session: null };
      }
      throw new Error('Invalid credentials');
    }
  }

  // Reset password
  async function resetPasswordByEmail(email){
    const c = await initClient(); if (!c) throw new Error('No client');
    const redirectTo = (cfg && cfg.resetRedirectTo) ? cfg.resetRedirectTo : (location.origin + '/index.html');
    const { data, error } = await c.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error; return data;
  }
  async function resetPasswordByUserId(userId){ return resetPasswordByEmail(idToEmail(userId)); }

  async function updatePassword(newPassword){
    const c = await initClient(); if (!c) throw new Error('No client');
    const { data, error } = await c.auth.updateUser({ password: newPassword });
    if (error) throw error; return data;
  }
  async function changePasswordWithOld(oldPassword, newPassword){
    const c = await initClient(); if (!c) throw new Error('No client');
    // First verify current password by re-authenticating
    const { data: { user } } = await c.auth.getUser();
    if (!user) throw new Error('Không có user đăng nhập');
    
    // Re-authenticate with old password to verify
    const { error: reAuthError } = await c.auth.signInWithPassword({
      email: user.email,
      password: oldPassword
    });
    if (reAuthError) throw new Error('Mật khẩu cũ không đúng');
    
    // Now update to new password
    const { data, error } = await c.auth.updateUser({ password: newPassword });
    if (error) throw error; return data;
  }
  async function onAuthStateChange(cb){
    const c = await initClient(); if (!c) return () => {};
    const { data } = c.auth.onAuthStateChange((event, session) => cb && cb(event, session));
    return () => data.subscription.unsubscribe();
  }

  window.remoteLeaderboard = {
    enabled: hasRemote(),
    save: saveScoreRemote,
    list: getLeaderboardRemote,
    signUpEmail,
    signInEmail,
    signOut,
    currentUserId,
    signUpUserId,
    signInUserId,
    resetPasswordByEmail,
    resetPasswordByUserId,
    updatePassword,
    changePasswordWithOld,
    onAuthStateChange
  };
})();
