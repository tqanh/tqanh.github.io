const canvas = document.getElementById('bubble-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-button');
const restartBtn = document.getElementById('restart-button');
const scoreValue = document.getElementById('score-value');
const currentEggDiv = document.getElementById('current-egg');

const RADIUS = 25; // Tăng kích thước trứng
const ROWS = Math.floor(canvas.height / (RADIUS * 2));
const COLS = Math.floor(canvas.width / (RADIUS * 2));
let grid = [];
let shooter = { x: canvas.width / 2, y: canvas.height - 80 };
let currentEgg = null;
let isPlaying = false;
let score = 0;
let shootAngle = Math.PI / 2;
let shooting = false;
let shotEgg = null;
let moveDownInterval = null;
let lastMoveDown = performance.now();
const MOVE_DOWN_INTERVAL = 5000;

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const egg = grid[row][col];
            if (egg) {
                drawEgg(col * RADIUS * 2 + (row % 2 ? RADIUS : 0) + RADIUS, row * RADIUS * 2 + RADIUS, egg.color, egg.fade !== undefined ? egg.fade : 1.0);
            }
        }
    }
    if (shotEgg) {
        drawEgg(shotEgg.x, shotEgg.y, shotEgg.color);
    }
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x + Math.cos(shootAngle) * 60, shooter.y - Math.sin(shootAngle) * 60);
    ctx.stroke();
    ctx.restore();
}

function animateEggRemoval(match) {
    if (window.eggShooterSounds) window.eggShooterSounds.playSound('explode');
    match.forEach(([r, c]) => {
        const egg = grid[r][c];
        if (egg) {
            egg.removing = true;
            egg.fade = 1.0;
        }
    });
    let fadeStep = 0.1;
    function fade() {
        let stillFading = false;
        match.forEach(([r, c]) => {
            const egg = grid[r][c];
            if (egg && egg.removing) {
                egg.fade -= fadeStep;
                if (egg.fade <= 0) {
                    grid[r][c] = null;
                } else {
                    stillFading = true;
                }
            }
        });
        drawGrid();
        if (stillFading) {
            requestAnimationFrame(fade);
        }
    }
    fade();
}

function drawEgg(x, y, color, fade = 1.0) {
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(x, y, RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.shadowColor = '#333';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.strokeStyle = '#fbc02d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

const COLORS = ['#ffe082', '#f06292', '#64b5f6', '#81c784', '#ba68c8'];
function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function initGrid() {
    grid = [];
    for (let row = 0; row < ROWS; row++) {
        let arr = [];
        for (let col = 0; col < COLS; col++) {
            if (row < 4) {
                arr.push({ color: randomColor() });
            } else {
                arr.push(null);
            }
        }
        grid.push(arr);
    }
}

function setCurrentEgg() {
    currentEgg = { color: randomColor() };
    currentEggDiv.style.background = currentEgg.color;
}

function startGame() {
    score = 0;
    scoreValue.textContent = score;
    isPlaying = true;
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    initGrid();
    setCurrentEgg();
    shotEgg = null;
    shooting = false;
    drawGrid();
    if (moveDownInterval) clearInterval(moveDownInterval);
    moveDownInterval = setInterval(() => {
        if (isPlaying) {
            moveRowsDown();
            addNewTopRow();
            drawGrid();
            checkLose();
        }
    }, 5000);
}

function showModal(message) {
    let modal = document.getElementById('game-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'game-modal';
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
            <span id="modal-message"></span><br><br>
            <button onclick="document.getElementById('game-modal').remove();">Đóng</button>
        </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('modal-message').textContent = message;
    modal.style.display = 'flex';
}

function endGame(win = false) {
    if (!win && window.navigator && window.navigator.vibrate) window.navigator.vibrate(300);
    if (window.eggShooterSounds) window.eggShooterSounds.playSound(win ? 'win' : 'lose');
    isPlaying = false;
    if (moveDownInterval) clearInterval(moveDownInterval);
    if (window.gameHub) {
        window.gameHub.saveHighScore('egg-shooter', score);
    }
    showModal(win ? 'Bạn thắng! Điểm: ' + score : 'Bạn đã thua!');
    startBtn.style.display = 'inline-block';
    restartBtn.style.display = 'none';
}

function shootEgg() {
    if (!isPlaying || shooting) return;
    shooting = true;
    if (window.eggShooterSounds) window.eggShooterSounds.playSound('shoot');
    shotEgg = {
        x: shooter.x,
        y: shooter.y,
        color: currentEgg.color,
        dx: Math.cos(shootAngle) * 16,
        dy: -Math.sin(shootAngle) * 16
    };
}

function updateShotEgg() {
    if (!shotEgg) return;
    shotEgg.x += shotEgg.dx;
    shotEgg.y += shotEgg.dy;
    if (shotEgg.x < RADIUS || shotEgg.x > canvas.width - RADIUS) {
        shotEgg.dx *= -1;
    }
    let hit = false;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const egg = grid[row][col];
            if (egg) {
                let cx = col * RADIUS * 2 + (row % 2 ? RADIUS : 0) + RADIUS;
                let cy = row * RADIUS * 2 + RADIUS;
                let dist = Math.hypot(shotEgg.x - cx, shotEgg.y - cy);
                if (dist < RADIUS * 2 - 2) {
                    placeEgg(row, col);
                    hit = true;
                    break;
                }
            }
        }
        if (hit) break;
    }
    if (shotEgg.y < RADIUS) {
        let col = Math.floor((shotEgg.x - RADIUS) / (RADIUS * 2));
        if (col < 0) col = 0;
        if (col >= COLS) col = COLS - 1;
        placeEgg(0, col);
        hit = true;
    }
    if (hit) {
        shotEgg = null;
        shooting = false;
        setCurrentEgg();
    }
}

function placeEgg(row, col) {
    for (let r = row; r < ROWS; r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(COLS - 1, col + 1); c++) {
            if (!grid[r][c]) {
                grid[r][c] = { color: currentEgg.color };
                checkMatch(r, c);
                drawGrid();
                checkLose();
                return;
            }
        }
    }
    if (!grid[row][col]) {
        grid[row][col] = { color: currentEgg.color };
        checkMatch(row, col);
        drawGrid();
        checkLose();
    }
}

function moveRowsDown() {
    for (let row = ROWS - 1; row > 0; row--) {
        grid[row] = [...grid[row - 1]];
    }
    grid[0] = Array(COLS).fill(null);
}

function addNewTopRow() {
    grid[0] = Array(COLS).fill(null).map(() => ({ color: randomColor() }));
}

function checkMatch(row, col) {
    let color = grid[row][col].color;
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let queue = [[row, col]];
    let match = [];
    
    while (queue.length) {
        let [r, c] = queue.pop();
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        if (visited[r][c]) continue;
        if (!grid[r][c] || grid[r][c].color !== color) continue;
        visited[r][c] = true;
        match.push([r, c]);
        let dirs = [[-1,0],[1,0],[0,-1],[0,1],[r%2?-1:1,-1],[r%2?-1:1,1]];
        for (let [dr, dc] of dirs) {
            queue.push([r+dr, c+dc]);
        }
    }
    
    if (match.length >= 3) {
        animateEggRemoval(match);
        score += match.length;
        scoreValue.textContent = score;
    }
}

function checkLose() {
    // Game over nếu bất kỳ trứng nào tràn xuống vị trí của shooter (vị trí trứng bắn)
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) {
                let cy = row * RADIUS * 2 + RADIUS;
                if (cy + RADIUS >= shooter.y) {
                    showModal('Bạn đã thua !');
                    endGame(false);
                    return;
                }
            }
        }
    }
    // Win condition: no eggs left
    let left = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) left++;
        }
    }
    if (left === 0) {
        endGame(true);
    }
}

// Handle both mouse and touch events
function handlePointerMove(e) {
    if (!isPlaying || shooting) return;
    const rect = canvas.getBoundingClientRect();
    // Get coordinates for both mouse and touch
    const px = e.clientX || e.touches[0].clientX;
    const py = e.clientY || e.touches[0].clientY;
    const mx = px - rect.left;
    const my = py - rect.top;
    let angle = Math.atan2(shooter.y - my, mx - shooter.x);
    if (angle < Math.PI / 6) angle = Math.PI / 6;
    if (angle > 5 * Math.PI / 6) angle = 5 * Math.PI / 6;
    shootAngle = angle;
    drawGrid();
    
    // Prevent scrolling on mobile
    e.preventDefault();
}

function handlePointerEnd(e) {
    if (!isPlaying || shooting) return;
    shootEgg();
    e.preventDefault();
}

// Mouse events
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('click', handlePointerEnd);

// Touch events
canvas.addEventListener('touchstart', handlePointerMove, { passive: false });
canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
canvas.addEventListener('touchend', handlePointerEnd, { passive: false });

function gameLoop() {
    const now = performance.now();
    if (isPlaying && now - lastMoveDown > MOVE_DOWN_INTERVAL) {
        moveRowsDown();
        addNewTopRow();
        drawGrid();
        checkLose();
        lastMoveDown = now;
    }
    if (isPlaying && shooting && shotEgg) {
        updateShotEgg();
        drawGrid();
    }
    requestAnimationFrame(gameLoop);
}

startBtn.onclick = startGame;
restartBtn.onclick = startGame;

gameLoop();
