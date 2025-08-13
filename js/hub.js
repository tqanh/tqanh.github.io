// Hub management with multi-user profiles and per-game leaderboards
// Storage schema (localStorage):
// - gh_users: JSON string array of usernames
// - gh_current_user: current username string
// - gh_scores: { [username]: { 'egg-shooter': number, 'snake': number, 'memory': number } }
// - gh_leaderboards: { [gameKey]: Array<{ name: string, score: number }> }

const DEFAULT_GAMES = {
	'egg-shooter': { name: 'Egg Shooter' },
	'snake': { name: 'Snake' },
	'memory': { name: 'Memory Cards' }
};

function readJSON(key, fallback) {
	try {
		const v = localStorage.getItem(key);
		return v ? JSON.parse(v) : fallback;
	} catch { return fallback; }
}
function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

function ensureInit() {
	let users = readJSON('gh_users', []);
	let scores = readJSON('gh_scores', {});
	let current = localStorage.getItem('gh_current_user');
	if (!users.length) {
		users = ['Player 1', 'Player 2'];
		writeJSON('gh_users', users);
	}
	if (!current) {
		current = users[0];
		localStorage.setItem('gh_current_user', current);
	}
	if (!scores[current]) {
		scores[current] = { 'egg-shooter': 0, 'snake': 0, 'memory': 0 };
		writeJSON('gh_scores', scores);
	}
	const leader = readJSON('gh_leaderboards', { 'egg-shooter': [], 'snake': [], 'memory': [] });
	writeJSON('gh_leaderboards', leader);
}

function listUsers() { ensureInit(); return readJSON('gh_users', []); }
function getCurrentUser() { ensureInit(); return localStorage.getItem('gh_current_user'); }
function setCurrentUser(name) {
	ensureInit();
	const users = listUsers();
	if (!users.includes(name)) { users.push(name); writeJSON('gh_users', users); }
	localStorage.setItem('gh_current_user', name);
	const scores = readJSON('gh_scores', {});
	if (!scores[name]) { scores[name] = { 'egg-shooter': 0, 'snake': 0, 'memory': 0 }; writeJSON('gh_scores', scores); }
	updateHighScoresDisplay(); updateUserControls();
}
function getHighScore(gameKey) {
	ensureInit();
	const user = getCurrentUser();
	const scores = readJSON('gh_scores', {});
	return (scores[user] && typeof scores[user][gameKey] === 'number') ? scores[user][gameKey] : 0;
}

async function saveHighScore(gameKey, score) {
	ensureInit();
	const user = getCurrentUser();
	const scores = readJSON('gh_scores', {});
	if (!scores[user]) scores[user] = { 'egg-shooter': 0, 'snake': 0, 'memory': 0 };
	if (score > (scores[user][gameKey] || 0)) { scores[user][gameKey] = score; writeJSON('gh_scores', scores); }
	// Local leaderboard update
	const boards = readJSON('gh_leaderboards', { 'egg-shooter': [], 'snake': [], 'memory': [] });
	const arr = boards[gameKey] || [];
	const existingIdx = arr.findIndex(e => e.name === user);
	if (existingIdx >= 0) arr[existingIdx].score = Math.max(arr[existingIdx].score, score); else arr.push({ name: user, score });
	arr.sort((a,b) => b.score - a.score); boards[gameKey] = arr.slice(0, 10); writeJSON('gh_leaderboards', boards);
	// Remote leaderboard (optional)
	try { if (window.remoteLeaderboard && window.remoteLeaderboard.enabled) { await window.remoteLeaderboard.save(gameKey, user, score); } } catch {}
	updateHighScoresDisplay(); updateLeaderboards();
}

async function getLeaderboard(gameKey) {
	ensureInit();
	// Prefer remote if available
	try {
		if (window.remoteLeaderboard && window.remoteLeaderboard.enabled) {
			const r = await window.remoteLeaderboard.list(gameKey, 10);
			if (Array.isArray(r) && r.length) return r.map(x => ({ name: x.user, score: x.score }));
		}
	} catch {}
	const boards = readJSON('gh_leaderboards', { 'egg-shooter': [], 'snake': [], 'memory': [] });
	return boards[gameKey] || [];
}

function loadHighScores() { ensureInit(); updateUserControls(); updateHighScoresDisplay(); updateLeaderboards(); }
function updateUserControls() {
	const select = document.getElementById('userSelect'); const addBtn = document.getElementById('addUserBtn'); if (!select) return;
	const users = listUsers(); const current = getCurrentUser(); select.innerHTML = '';
	users.forEach(u => { const opt = document.createElement('option'); opt.value = u; opt.textContent = u; if (u === current) opt.selected = true; select.appendChild(opt); });
	select.onchange = () => setCurrentUser(select.value);
	if (addBtn) addBtn.onclick = () => { const name = prompt('Tên người dùng mới?', 'Player ' + (users.length + 1)); if (name && name.trim()) setCurrentUser(name.trim()); };
}
function updateHighScoresDisplay() {
	const scoresList = document.getElementById('highScores'); if (!scoresList) return;
	scoresList.innerHTML = '';
	const user = getCurrentUser(); const scores = readJSON('gh_scores', {}); const userScores = scores[user] || { 'egg-shooter': 0, 'snake': 0, 'memory': 0 };
	Object.keys(DEFAULT_GAMES).forEach(gameKey => { const li = document.createElement('li'); li.textContent = `${DEFAULT_GAMES[gameKey].name}: ${userScores[gameKey] || 0}`; scoresList.appendChild(li); });
	const currentUserLabel = document.getElementById('currentUserLabel'); if (currentUserLabel) currentUserLabel.textContent = user;
}
async function updateLeaderboards() {
	for (const gameKey of ['egg-shooter','snake','memory']) {
		const el = document.getElementById(`lb-${gameKey}`); if (!el) continue; el.innerHTML = '';
		const list = await getLeaderboard(gameKey);
		list.forEach((row, idx) => { const li = document.createElement('li'); li.textContent = `${idx+1}. ${row.name}: ${row.score}`; el.appendChild(li); });
	}
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', loadHighScores); } else { loadHighScores(); }

window.gameHub = { setCurrentUser, getCurrentUser, saveHighScore, getHighScore, getLeaderboard };
