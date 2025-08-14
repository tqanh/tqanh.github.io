const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
let box = 20; // dynamic after resize
const rows = 20;
const cols = 20;
let snake = [{x: 10, y: 10}];
let direction = 'RIGHT';
let nextDirection = 'RIGHT';
let food = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)};
let score = 0;
let isPlaying = false;
let isPaused = false;
let allowWrap = false; // walls vs wrap option
let theme = 'classic';

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
    // Theme background
    if (theme === 'classic') ctx.fillStyle = '#e0f7fa';
    else if (theme === 'dark') ctx.fillStyle = '#0d1b2a';
    else if (theme === 'neon') ctx.fillStyle = '#001219';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	// Draw grid (light)
    ctx.strokeStyle = theme==='dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
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
        if (theme === 'neon') ctx.fillStyle = i===0 ? '#00e676' : '#69f0ae';
        else if (theme === 'dark') ctx.fillStyle = i===0 ? '#90caf9' : '#64b5f6';
        else ctx.fillStyle = i === 0 ? '#388e3c' : '#81c784';
		ctx.fillRect(snake[i].x*box, snake[i].y*box, box, box);
        ctx.strokeStyle = theme==='dark' ? '#263238' : '#fff';
		ctx.strokeRect(snake[i].x*box, snake[i].y*box, box, box);
	}
	// Draw food
    ctx.fillStyle = theme==='neon' ? '#ffd166' : '#fbc02d';
	ctx.beginPath();
	ctx.arc(food.x*box+box/2, food.y*box+box/2, box/2, 0, 2*Math.PI);
	ctx.fill();
	// Update HUD
	const scoreEl = document.getElementById('score-text');
	if (scoreEl) scoreEl.textContent = String(score);
	const stateEl = document.getElementById('state-badge');
	if (stateEl) stateEl.textContent = isPlaying ? (isPaused ? 'Paused' : 'Playing') : 'Ready';

    // Paused overlay
    if (isPlaying && isPaused) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
        ctx.restore();
    }
}

let __AC = null; // reuse a single AudioContext to avoid limits
function playBeep(freq = 520, dur = 0.05) {
	try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!__AC) __AC = new AC();
        const ac = __AC;
        const o = ac.createOscillator();
        const g = ac.createGain();
		o.connect(g); g.connect(ac.destination);
		o.frequency.value = freq;
        g.gain.setValueAtTime(0.12, ac.currentTime);
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

function gameLoop(currentTime) {
	if (!isPlaying || isPaused) {
		requestAnimationFrame(gameLoop);
		return;
	}
	
	// Accumulate time for consistent speed
	if (lastTime === 0) lastTime = currentTime;
	const deltaTime = currentTime - lastTime;
	lastTime = currentTime;
	accumulatorMs += deltaTime;
	
	// Move snake at fixed intervals
	if (accumulatorMs >= stepMs) {
		accumulatorMs = 0;
		
        // Apply queued direction once per step then move snake
        direction = nextDirection;
        // Move snake
		const head = {x: snake[0].x, y: snake[0].y};
		switch(direction) {
			case 'UP': head.y--; break;
			case 'DOWN': head.y++; break;
			case 'LEFT': head.x--; break;
			case 'RIGHT': head.x++; break;
		}
		
        // Check collision with walls or wrap-around
        if (allowWrap) {
            if (head.x < 0) head.x = cols - 1;
            if (head.x >= cols) head.x = 0;
            if (head.y < 0) head.y = rows - 1;
            if (head.y >= rows) head.y = 0;
        } else {
            if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
                gameOver();
                return;
            }
        }
		
		// Check collision with self
		if (snake.some(s => s.x === head.x && s.y === head.y)) {
			gameOver();
			return;
		}
		
		// Check food collision
		if (head.x === food.x && head.y === food.y) {
			score++;
			playBeep(680, 0.06);
			spawnFood();
			// Increase speed every 5 points
			if (score % 5 === 0) {
				stepMs = Math.max(40, baseStepMs - (score / 5) * 10);
			}
		} else {
			snake.pop(); // Remove tail if no food eaten
		}
		
		snake.unshift(head);
		draw();
	}
	
	requestAnimationFrame(gameLoop);
}

function gameOver() {
	isPlaying = false;
    updateSnakeMainButtonUI();
	showSnakeModal(`Game Over! Điểm số: ${score}`);
}

document.addEventListener('keydown', e => {
    // Prevent scrolling on arrow/space
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
    // Queue direction (no 180-degree)
    const opposites = { LEFT:'RIGHT', RIGHT:'LEFT', UP:'DOWN', DOWN:'UP' };
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { if (direction !== 'RIGHT') nextDirection = 'LEFT'; }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { if (direction !== 'LEFT') nextDirection = 'RIGHT'; }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (direction !== 'DOWN') nextDirection = 'UP'; }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { if (direction !== 'UP') nextDirection = 'DOWN'; }
    if (e.code === 'Space') {
        if (!isPlaying) startSnakeGame(); else setPaused(!isPaused);
    }
    if (e.code === 'KeyP') { if (isPlaying) setPaused(!isPaused); }
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
        if (dx > 20 && direction !== 'LEFT') nextDirection = 'RIGHT';
        else if (dx < -20 && direction !== 'RIGHT') nextDirection = 'LEFT';
	} else {
        if (dy > 20 && direction !== 'UP') nextDirection = 'DOWN';
        else if (dy < -20 && direction !== 'DOWN') nextDirection = 'UP';
	}
	if (!isPlaying) startSnakeGame();
});

function updateSnakeHighScore() {
	try {
		console.log('Updating snake high score...');
		if (window.gameHub && window.gameHub.getHighScore) {
			const hs = window.gameHub.getHighScore('snake');
			console.log('Got high score from gameHub:', hs);
			const wrap = document.getElementById('high-score');
			const val = document.getElementById('high-score-value');
			if (wrap && val && typeof hs === 'number') {
				val.textContent = String(hs);
				wrap.style.display = hs > 0 ? 'block' : 'none';
				console.log('Updated high score display:', hs);
			} else {
				console.log('High score elements not found or invalid score:', { wrap, val, hs });
			}
		} else {
			console.log('gameHub not available:', window.gameHub);
		}
	} catch (error) {
		console.error('Error updating snake high score:', error);
	}
}

function startSnakeGame(speedMs) {
	if (typeof speedMs === 'number' && speedMs > 40) baseStepMs = speedMs;
	
	// Reset game state
	snake = [{x: 10, y: 10}];
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
	spawnFood();
	score = 0;
	isPlaying = true;
	isPaused = false;
	lastTime = 0;
	accumulatorMs = 0;
	stepMs = baseStepMs;
	
	// Update display
	draw();
	updateSnakeHighScore();
    updateSnakeMainButtonUI();
}

function showSnakeModal(msg) {
	if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(300);
	
	// Save high score first
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
    retry.textContent = 'Đóng';
	retry.style.cssText = 'padding:8px 12px;';
    retry.addEventListener('click', () => { 
        modal.remove(); 
        // Cập nhật nút chính để người chơi có thể bấm lại
        if (window.updateSnakeMainButtonUI) updateSnakeMainButtonUI();
    });
	
	const back = document.createElement('button');
	back.textContent = 'Back to Hub';
	back.style.cssText = 'padding:8px 12px;';
	back.addEventListener('click', () => { 
		location.href='../../index.html'; 
	});
	
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
// Main single-button behavior
function snakeMainButtonClick(){
    if (!isPlaying) { startSnakeGame(); return; }
    setPaused(!isPaused);
}
function updateSnakeMainButtonUI(){
    const btn = document.getElementById('snakeMainBtn'); if (!btn) return;
    if (!isPlaying) { btn.textContent = 'Chơi ngay'; return; }
    btn.textContent = isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng';
}
function setPaused(v){ isPaused = !!v; updateSnakeMainButtonUI(); draw(); }
window.snakeMainButtonClick = snakeMainButtonClick;
window.updateSnakeMainButtonUI = updateSnakeMainButtonUI;
function initSnakeOptionsUI(){
    const diff = document.getElementById('opt-difficulty');
    const wrap = document.getElementById('opt-wrap');
    const th = document.getElementById('opt-theme');
    if (diff) diff.onchange = () => {
        const v = diff.value;
        if (v==='easy') baseStepMs = 240; else if (v==='hard') baseStepMs = 120; else baseStepMs = 180;
        if (isPlaying) stepMs = baseStepMs;
    };
    if (wrap) wrap.onchange = () => { allowWrap = (wrap.value==='wrap'); };
    if (th) th.onchange = () => { theme = th.value; draw(); };
}
window.initSnakeOptionsUI = initSnakeOptionsUI;
requestAnimationFrame(gameLoop);
