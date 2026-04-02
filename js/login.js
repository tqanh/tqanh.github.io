// Login functionality
let isSignUpMode = false;

function showSignIn() {
    isSignUpMode = false;
    const signUpForm = document.getElementById('signUpForm');
    const signInForm = document.getElementById('signInForm');
    
    signUpForm.classList.add('hidden');
    setTimeout(() => {
        signUpForm.style.display = 'none';
        signInForm.style.display = 'block';
        setTimeout(() => signInForm.classList.remove('hidden'), 50);
    }, 400);
    
    hideError();
}

function showSignUp() {
    isSignUpMode = true;
    const signUpForm = document.getElementById('signUpForm');
    const signInForm = document.getElementById('signInForm');
    
    signInForm.classList.add('hidden');
    setTimeout(() => {
        signInForm.style.display = 'none';
        signUpForm.style.display = 'block';
        setTimeout(() => signUpForm.classList.remove('hidden'), 50);
    }, 400);
    
    hideError();
}

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError() {
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.remove('show');
}

function showHub() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('hubContent').classList.add('show');
    updateUserDisplay();
}

function updateUserDisplay() {
    let displayName = localStorage.getItem('gh_display_name') || 'Người chơi';
    try {
        const cached = localStorage.getItem('gh_display_name');
        if (cached && cached.trim()) displayName = cached.trim();
    } catch(_) {}
    document.getElementById('userDisplay').textContent = `Chào mừng, ${displayName}!`;
}

function logout() {
    if (window.remoteLeaderboard && window.remoteLeaderboard.signOut) {
        window.remoteLeaderboard.signOut();
    }
    localStorage.removeItem('gh_display_name');
    document.getElementById('hubContent').classList.remove('show');
    document.getElementById('loginScreen').style.display = 'flex';
    hideError();
    document.getElementById('signUpUser').value = '';
    document.getElementById('signUpPass').value = '';
    document.getElementById('signInUser').value = '';
    document.getElementById('signInPass').value = '';
}

async function checkAuthStatus() {
    try {
        if (window.remoteLeaderboard && window.remoteLeaderboard.currentUserId) {
            const userId = await window.remoteLeaderboard.currentUserId();
            if (userId) {
                showHub();
                return;
            }
        }
        
        const displayName = localStorage.getItem('gh_display_name');
        if (displayName) {
            showHub();
            return;
        }
    } catch (error) {
        console.log('Auth check failed:', error);
    }
}

// Event handlers
document.getElementById('btnSignUp').onclick = async () => {
    const user = document.getElementById('signUpUser').value.trim();
    const pass = document.getElementById('signUpPass').value.trim();
    
    if (!user || !pass) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    if (pass.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    try {
        hideError();
        const btn = document.getElementById('btnSignUp');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>Đang đăng ký...';
        
        // Try Supabase first
        if (window.remoteLeaderboard && window.remoteLeaderboard.enabled) {
            try {
                await window.remoteLeaderboard.signUpUserId(user, pass, user);
                localStorage.setItem('gh_display_name', user);
                showHub();
                return;
            } catch (err) {
                console.log('Supabase signup failed, falling back to local:', err);
                // Continue to local fallback
            }
        }
        
        // Local fallback
        const users = JSON.parse(localStorage.getItem('gh_local_users') || '[]');
        if (users.find(u => u.id === user)) {
            throw new Error('Tài khoản đã tồn tại');
        }
        users.push({ id: user, password: pass, displayName: user });
        localStorage.setItem('gh_local_users', JSON.stringify(users));
        localStorage.setItem('gh_display_name', user);
        showHub();
        
    } catch (error) {
        const msg = 'Đăng ký lỗi: ' + (error?.message || 'Không xác định');
        showError(msg);
        const btn = document.getElementById('btnSignUp');
        btn.disabled = false;
        btn.innerHTML = 'Đăng ký';
    }
};

document.getElementById('btnSignIn').onclick = async () => {
    const user = document.getElementById('signInUser').value.trim();
    const pass = document.getElementById('signInPass').value.trim();
    
    if (!user || !pass) {
        showError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    try {
        hideError();
        const btn = document.getElementById('btnSignIn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>Đang đăng nhập...';
        
        // Try Supabase first
        if (window.remoteLeaderboard && window.remoteLeaderboard.enabled) {
            try {
                await window.remoteLeaderboard.signInUserId(user, pass);
                localStorage.setItem('gh_display_name', user);
                showHub();
                return;
            } catch (err) {
                console.log('Supabase signin failed, falling back to local:', err);
                // Continue to local fallback
            }
        }
        
        // Local fallback
        const users = JSON.parse(localStorage.getItem('gh_local_users') || '[]');
        const foundUser = users.find(u => u.id === user && u.password === pass);
        if (!foundUser) {
            throw new Error('Sai tài khoản hoặc mật khẩu');
        }
        localStorage.setItem('gh_display_name', foundUser.displayName || user);
        showHub();
        
    } catch (error) {
        const msg = 'Đăng nhập lỗi: ' + (error?.message || 'Không xác định');
        showError(msg);
        const btn = document.getElementById('btnSignIn');
        btn.disabled = false;
        btn.innerHTML = 'Đăng nhập';
    }
};

// Enter key support
document.getElementById('signUpUser').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('signUpPass').focus();
});
document.getElementById('signUpPass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnSignUp').click();
});
document.getElementById('signInUser').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('signInPass').focus();
});
document.getElementById('signInPass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btnSignIn').click();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    loadVersion();
});

// Load version from file
async function loadVersion() {
    try {
        const response = await fetch('./version.txt');
        if (response.ok) {
            const version = await response.text();
            const versionDisplay = document.getElementById('versionDisplay');
            if (versionDisplay) {
                versionDisplay.textContent = version.trim();
            }
        }
    } catch (error) {
        console.log('Failed to load version:', error);
        const versionDisplay = document.getElementById('versionDisplay');
        if (versionDisplay) {
            versionDisplay.textContent = 'v1.5.0';
        }
    }
}

// Service Worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=2.5.0')
        .then(registration => {
            console.log('SW registered successfully:', registration);
            console.log('Service Worker version: 2.5.0');
        })
        .catch(error => {
            console.log('SW registration failed:', error);
        });
}
