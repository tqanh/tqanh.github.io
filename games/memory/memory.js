const cards = ['🍎','🍌','🍇','🍉','🍓','🍒','🍍','🥝'];
let deck = [];
let flipped = [];
let matched = [];
let moves = 0;
let isPlaying = false;
let lockBoard = false;
let isPaused = false;

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function updateMemoryHighScore() {
	try {
		if (window.gameHub && window.gameHub.getHighScore) {
			const hs = window.gameHub.getHighScore('memory');
			const el = document.getElementById('high-score-value');
			if (el && typeof hs === 'number') el.textContent = String(hs);
		}
	} catch {}
}

function startMemoryGame() {
	deck = [...cards, ...cards];
	shuffle(deck);
	flipped = [];
	matched = [];
	moves = 0;
	isPlaying = true;
	lockBoard = false;
	renderMemory();
	updateMemoryHighScore();
}

function renderMemory() {
	const board = document.getElementById('memory-board');
	if (!board) return;
	board.innerHTML = '';
	deck.forEach((card, idx) => {
		const div = document.createElement('div');
		div.className = 'memory-card';
		const visible = matched.includes(idx) || flipped.includes(idx);
		div.textContent = visible ? card : '❓';
		if (!visible) div.classList.add('hidden');
		div.onclick = () => flipCard(idx);
		board.appendChild(div);
	});
	const movesEl = document.getElementById('memory-moves');
    if (movesEl) movesEl.textContent = 'Lượt: ' + moves;
	const badge = document.getElementById('moves-text');
	if (badge) badge.textContent = String(moves);
}

function flipCard(idx) {
    if (!isPlaying || lockBoard || isPaused) return;
	if (flipped.includes(idx) || matched.includes(idx)) return;
	flipped.push(idx);
	renderMemory();
	if (flipped.length === 2) {
		moves++;
		lockBoard = true;
		const [a, b] = flipped;
		setTimeout(() => {
			if (deck[a] === deck[b]) {
				matched.push(a, b);
				if (matched.length === deck.length) {
					finishMemory();
				}
			} 
			flipped = [];
			lockBoard = false;
			renderMemory();
		}, 500);
	}
}

function finishMemory() {
	isPlaying = false;
	if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(200);
	if (window.gameHub && window.gameHub.saveHighScore) {
		const score = Math.max(1, (cards.length * 2 * 2) - moves); // higher is better
		window.gameHub.saveHighScore('memory', score);
		updateMemoryHighScore();
	}
    showMemoryModal('Bạn đã thắng! Lượt: ' + moves);
}

// Toggle pause helper for UI
function memoryPauseToggle(){
    if (!isPlaying) return false;
    isPaused = !isPaused; 
    return isPaused;
}

function showMemoryModal(msg) {
	let modal = document.getElementById('memory-modal');
	if (!modal) {
		modal = document.createElement('div');
		modal.id = 'memory-modal';
		modal.style.position = 'fixed';
		modal.style.top = '0';
		modal.style.left = '0';
		modal.style.width = '100vw';
		modal.style.height = '100vh';
		modal.style.background = 'rgba(0,0,0,0.5)';
		modal.style.display = 'flex';
		modal.style.justifyContent = 'center';
		modal.style.alignItems = 'center';
		modal.style.zIndex = '9999';
        modal.innerHTML = `<div style="background:#fff;padding:30px 40px;border-radius:10px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);font-size:1.5em;">
			<span id="memory-modal-message"></span><br><br>
			<button onclick="document.getElementById('memory-modal').remove();startMemoryGame();">Chơi lại</button>
            <button onclick="location.href='../../index.html'">Về Hub</button>
		</div>`;
		document.body.appendChild(modal);
	}
	document.getElementById('memory-modal-message').textContent = msg;
	modal.style.display = 'flex';
}

// Auto-start for usability
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startMemoryGame);
} else {
	startMemoryGame();
}

// Expose
window.startMemoryGame = startMemoryGame;
window.updateMemoryHighScore = updateMemoryHighScore;
window.memoryPauseToggle = memoryPauseToggle;
