(function(){
  const cfg = window.LEADERBOARD_CONFIG || null;
  function hasRemote(){ return !!(cfg && cfg.supabaseUrl && cfg.supabaseAnonKey); }

  async function initClient(){
    if (!hasRemote()) return null;
    if (!window.supabase) {
      await new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
        s.onload = resolve; document.head.appendChild(s);
      });
    }
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  async function saveScoreRemote(game, user, score){
    const client = await initClient(); if (!client) return false;
    try {
      // Upsert highest score per (user, game)
      const { data, error } = await client
        .from(cfg.table)
        .upsert({ user, game, score }, { onConflict: 'user,game' })
        .select();
      if (error) throw error; return true;
    } catch { return false; }
  }

  async function getLeaderboardRemote(game, limit=10){
    const client = await initClient(); if (!client) return [];
    try {
      const { data, error } = await client
        .from(cfg.table)
        .select('user, game, score')
        .eq('game', game)
        .order('score', { ascending: false })
        .limit(limit);
      if (error) throw error; return data || [];
    } catch { return []; }
  }

  // Public wrapper used by hub.js if available
  window.remoteLeaderboard = {
    enabled: hasRemote(),
    save: saveScoreRemote,
    list: getLeaderboardRemote
  };
})();
