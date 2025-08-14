(async function(){
  function createOverlay(){
    const wrap = document.createElement('div');
    wrap.id = 'auth-guard-overlay';
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:99999;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:16px;max-width:520px;width:92vw;padding:24px 28px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.3);';
    box.innerHTML = '<h2 style="margin:0 0 10px;color:#1976d2">Cần đăng nhập</h2>'+
      '<p style="margin:0 0 14px;color:#444">Bạn cần đăng nhập để chơi game và lưu điểm trên bảng xếp hạng.</p>'+
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">'+
      '<a href="../../index.html" style="padding:10px 18px;border-radius:10px;background:#2196f3;color:#fff;text-decoration:none;font-weight:700;">Về Hub để đăng nhập</a>'+
      '</div>';
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  }
  try{
    // Nếu không cấu hình remote hoặc remote disabled → không chặn
    if (!window.remoteLeaderboard) return;
    if (!window.remoteLeaderboard.enabled) return;

    // Cho phép nếu đã có user local (đã đăng nhập ở Hub)
    const localDisplay = localStorage.getItem('gh_display_name');

    // Nếu chưa có user Supabase và cũng không có user local → chặn
    const uid = await window.remoteLeaderboard.currentUserId();
    if (!uid && !localDisplay) createOverlay();
  }catch(_){/* ignore */}
})();
