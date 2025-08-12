const canvas = document.getElementById('bubble-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-button');
const restartBtn = document.getElementById('restart-button');
const scoreValue = document.getElementById('score-value');
const currentEggDiv = document.getElementById('current-egg');

const COLORS = ['#ffe082', '#f06292', '#64b5f6', '#81c784', '#ba68c8'];
const RADIUS = 25; // Tăng kích thước trứng
const ROWS = Math.floor(canvas.height / (RADIUS * 2));
const COLS = Math.floor(canvas.width / (RADIUS * 2));
let grid = [];
let shooter = { x: canvas.width / 2, y: canvas.height - 80 }; // Đẩy shooter lên cao hơn
let currentEgg = null;
let isPlaying = false;
let score = 0;
let shootAngle = Math.PI / 2;
let shooting = false;
let shotEgg = null;
let moveDownInterval = null;

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const egg = grid[row][col];
            if (egg) {
                drawEgg(col * RADIUS * 2 + (row % 2 ? RADIUS : 0) + RADIUS, row * RADIUS * 2 + RADIUS, egg.color);
            }
        }
    }
    // Draw shot egg
    if (shotEgg) {
        drawEgg(shotEgg.x, shotEgg.y, shotEgg.color);
    }
    // Draw shooter direction
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x + Math.cos(shootAngle) * 60, shooter.y - Math.sin(shootAngle) * 60);
    ctx.stroke();
    ctx.restore();
}

function drawEgg(x, y, color) {
    ctx.save();
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
            addNewTopRow(); // Thêm hàng trứng mới ở trên cùng
            drawGrid();
            checkLose();
        }
    }, 5000); // Tăng thời gian lên 5 giây cho dễ chơi hơn
}

function endGame(win = false) {
    console.log("endGame được gọi:", win ? "Thắng" : "Thua");
    isPlaying = false;
    if (moveDownInterval) clearInterval(moveDownInterval);
    alert(win ? 'Bạn thắng! Điểm: ' + score : 'Game Over! Điểm: ' + score);
    startBtn.style.display = 'inline-block';
    restartBtn.style.display = 'none';
}

function shootEgg() {
    if (!isPlaying || shooting) return;
    shooting = true;
    // Tăng tốc độ trứng khi bắn (ví dụ: 16)
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
    // Bounce on wall
    if (shotEgg.x < RADIUS || shotEgg.x > canvas.width - RADIUS) {
        shotEgg.dx *= -1;
    }
    // Check collision with grid
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
    // Hit top
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
    // Find nearest empty spot
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
    // If no spot, just put at original
    if (!grid[row][col]) {
        grid[row][col] = { color: currentEgg.color };
        checkMatch(row, col);
        drawGrid();
        checkLose();
    }
}
// Dịch chuyển toàn bộ hàng trứng xuống một hàng
function moveRowsDown() {
    // Dịch chuyển tất cả các hàng xuống một hàng
    for (let row = ROWS - 1; row > 0; row--) {
        grid[row] = [...grid[row - 1]];
    }
    // Tạo hàng trống ở trên cùng để chuẩn bị cho hàng mới
    grid[0] = Array(COLS).fill(null);
}

// Thêm hàm tạo hàng trứng mới ở trên cùng
function addNewTopRow() {
    // Tạo hàng mới ở trên cùng
    grid[0] = Array(COLS).fill(null).map(() => ({ color: randomColor() }));
}

function checkMatch(row, col) {
    // BFS to find connected eggs of same color
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
        // 6 directions (hex grid)
        let dirs = [[-1,0],[1,0],[0,-1],[0,1],[r%2?-1:1,-1],[r%2?-1:1,1]];
        for (let [dr, dc] of dirs) {
            queue.push([r+dr, c+dc]);
        }
    }
    if (match.length >= 3) {
        for (let [r, c] of match) {
            grid[r][c] = null;
        }
        score += match.length;
        scoreValue.textContent = score;
    }
}

function checkLose() {
    // Game over nếu bất kỳ trứng nào tràn xuống vị trí của shooter
    let shooterTopY = shooter.y - RADIUS * 2; // Vị trí phía trên shooter để kiểm tra va chạm
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) {
                let eggBottomY = row * RADIUS * 2 + RADIUS * 2; // Vị trí dưới cùng của trứng
                if (eggBottomY >= shooterTopY) {
                    console.log("Game Over - Trứng chạm shooter!");
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

canvas.addEventListener('mousemove', e => {
    if (!isPlaying || shooting) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let angle = Math.atan2(shooter.y - my, mx - shooter.x);
    if (angle < Math.PI / 6) angle = Math.PI / 6;
    if (angle > 5 * Math.PI / 6) angle = 5 * Math.PI / 6;
    shootAngle = angle;
    drawGrid();
});

canvas.addEventListener('click', e => {
    if (!isPlaying || shooting) return;
    shootEgg();
});

function gameLoop() {
    if (isPlaying && shooting && shotEgg) {
        updateShotEgg();
        drawGrid();
    }
    requestAnimationFrame(gameLoop);
}

startBtn.onclick = startGame;
restartBtn.onclick = startGame;

gameLoop();
