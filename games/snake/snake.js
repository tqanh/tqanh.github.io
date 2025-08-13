const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
let box = 20; // dynamic after resize
const rows = 20;
const cols = 20;
let snake = [{x: 10, y: 10}];
let direction = 'RIGHT';
let food = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)};
let score = 0;
let isPlaying = false;
let isPaused = false;

// Responsive sizing
function resizeGame() {
	// Target canvas size based on viewport; keep square and grid-aligned
	const maxW = Math.min(window.innerWidth - 40, 600);
	const maxH = Math.min(window.innerHeight - 160, 600); // leave space for UI
	const size = Math.max(220, Math.min(maxW, maxH));
	box = Math.floor(size / cols);
	const cssSize = box * cols; // multiple of cols
	canvas.style.width = cssSize + 'px';
	canvas.style.height = cssSize + 'px';
	scaleCanvas();
	draw();
}

// HiDPI scaling for crisp rendering
function scaleCanvas() {
	const dpr = window.devicePixelRatio || 1;
	const rect = canvas.getBoundingClientRect();
	canvas.width = Math.round(rect.width * dpr);
	canvas.height = Math.round(rect.height * dpr);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeGame();
window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);

// Timing using RAF accumulator for smooth, consistent speed
let lastTime = 0;
let accumulatorMs = 0;
let baseStepMs = 200; // slower default
let stepMs = baseStepMs; // lower = faster

function draw() {
	ctx.fillStyle = '#e0f7fa';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	// Draw grid (light)
	ctx.strokeStyle = 'rgba(0,0,0,0.05)';
	for (let x = 0; x <= cols; x++) {
		ctx.beginPath();
		ctx.moveTo(x*box, 0);
		ctx.lineTo(x*box, rows*box);
		ctx.stroke();
	}
	for (let y = 0; y <= rows; y++) {
		ctx.beginPath();
		ctx.moveTo(0, y*box);
		ctx.lineTo(cols*box, y*box);
		ctx.stroke();
	}
	// Draw snake
	for (let i = 0; i < snake.length; i++) {
		ctx.fillStyle = i === 0 ? '#388e3c' : '#81c784';
		ctx.fillRect(snake[i].x*box, snake[i].y*box, box, box);
		ctx.strokeStyle = '#fff';
		ctx.strokeRect(snake[i].x*box, snake[i].y*box, box, box);
	}
	// Draw food
	ctx.fillStyle = '#fbc02d';
	ctx.beginPath();
	ctx.arc(food.x*box+box/2, food.y*box+box/2, box/2, 0, 2*Math.PI);
	ctx.fill();
	// Update HUD
	const scoreEl = document.getElementById('score-text');
	if (scoreEl) scoreEl.textContent = String(score);
	const stateEl = document.getElementById('state-badge');
	if (stateEl) stateEl.textContent = isPlaying ? (isPaused ? 'Paused' : 'Playing') : 'Ready';
}

function playBeep(freq = 520, dur = 0.05) {
	try {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		const ac = new AC();
		const o = ac.createOscillator();
		const g = ac.createGain();
		o.connect(g); g.connect(ac.destination);
		o.frequency.value = freq;
		g.gain.setValueAtTime(0.15, ac.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
		o.start(); o.stop(ac.currentTime + dur);
	} catch {}
}

function spawnFood() {
	let pos;
	do {
		pos = { x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows) };
	} while (snake.some(s => s.x === pos.x && s.y === pos.y));
	food = pos;
}

function moveSnake() {
	let head = {...snake[0]};
	if (direction === 'LEFT') head.x--;
	if (direction === 'RIGHT') head.x++;
	if (direction === 'UP') head.y--;
	if (direction === 'DOWN') head.y++;
	// Check collision
	if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || snake.some(s => s.x === head.x && s.y === head.y)) {
		isPlaying = false;
		showSnakeModal('Game Over! Score: ' + score);
		return;
	}
	snake.unshift(head);
	// Eat food
	if (head.x === food.x && head.y === food.y) {
		score++;
		playBeep(680, 0.06);
		spawnFood();
		// speed up slightly every 5 points
		if (score % 5 === 0) stepMs = Math.max(Math.floor(baseStepMs * 0.45), stepMs - 8);
	} else {
		snake.pop();
	}
}

function gameLoop(ts) {
	if (!lastTime) lastTime = ts;
	const dt = ts - lastTime;
	lastTime = ts;
	if (isPlaying && !isPaused) {
		accumulatorMs += dt;
		while (accumulatorMs >= stepMs) {
			moveSnake();
			accumulatorMs -= stepMs;
		}
	}
	draw();
	requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
	if (e.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
	if (e.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
	if (e.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
	if (e.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
	if (e.code === 'Space') { if (!isPlaying) startSnakeGame(); }
	if (e.code === 'KeyP') { if (isPlaying) { isPaused = !isPaused; draw(); } }
});

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', function(e) {
	const t = e.touches[0];
	touchStartX = t.clientX;
	touchStartY = t.clientY;
});
canvas.addEventListener('touchend', function(e) {
	const t = e.changedTouches[0];
	const dx = t.clientX - touchStartX;
	const dy = t.clientY - touchStartY;
	if (Math.abs(dx) > Math.abs(dy)) {
		if (dx > 20 && direction !== 'LEFT') direction = 'RIGHT';
		else if (dx < -20 && direction !== 'RIGHT') direction = 'LEFT';
	} else {
		if (dy > 20 && direction !== 'UP') direction = 'DOWN';
		else if (dy < -20 && direction !== 'DOWN') direction = 'UP';
	}
	if (!isPlaying) startSnakeGame();
});

function updateSnakeHighScore() {
	try {
		if (window.gameHub && window.gameHub.getHighScore) {
			const hs = window.gameHub.getHighScore('snake');
			const wrap = document.getElementById('high-score');
			const val = document.getElementById('high-score-value');
			if (wrap && val && typeof hs === 'number') {
				val.textContent = String(hs);
				wrap.style.display = hs > 0 ? 'block' : 'none';
			}
		}
	} catch {}
}

function startSnakeGame(speedMs) {
	if (typeof speedMs === 'number' && speedMs > 40) baseStepMs = speedMs;
	snake = [{x: 10, y: 10}];
	direction = 'RIGHT';
	spawnFood();
	score = 0;
	isPlaying = true;
	isPaused = false;
	lastTime = 0;
	accumulatorMs = 0;
	stepMs = baseStepMs;
	draw();
	updateSnakeHighScore();
}

function showSnakeModal(msg) {
	if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(300);
	if (window.gameHub && window.gameHub.saveHighScore) {
		window.gameHub.saveHighScore('snake', score);
		updateSnakeHighScore();
	}
	let modal = document.getElementById('snake-modal');
	if (!modal) {
		modal = document.createElement('div');
		modal.id = 'snake-modal';
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
		document.body.appendChild(modal);
	}
	// Build content programmatically (tránh inline handler)
	const content = document.createElement('div');
	content.style.cssText = 'background:#fff;padding:30px 40px;border-radius:10px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);font-size:1.5em;';
	const msgEl = document.createElement('span');
	msgEl.id = 'snake-modal-message';
	msgEl.textContent = msg;
	const actions = document.createElement('div');
	actions.style.cssText = 'margin-top:16px;display:flex;gap:10px;justify-content:center;';
	const retry = document.createElement('button');
	retry.textContent = 'Chơi lại';
	retry.style.cssText = 'padding:8px 12px;';
	retry.addEventListener('click', () => { modal.remove(); startSnakeGame(); });
	const back = document.createElement('button');
	back.textContent = 'Back to Hub';
	back.style.cssText = 'padding:8px 12px;';
	back.addEventListener('click', () => { location.href='../../index.html'; });
	actions.appendChild(retry);
	actions.appendChild(back);
	content.appendChild(msgEl);
	content.appendChild(document.createElement('br'));
	content.appendChild(document.createElement('br'));
	content.appendChild(actions);
	modal.innerHTML = '';
	modal.appendChild(content);
	modal.style.display = 'flex';
}

window.startSnakeGame = startSnakeGame;
requestAnimationFrame(gameLoop);
