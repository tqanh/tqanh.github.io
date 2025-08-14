const canvas = document.getElementById('bubble-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreValue = document.getElementById('score-value');
const currentEggDiv = document.getElementById('current-egg');

const RADIUS = 25;
const ROWS = Math.floor(canvas.height / (RADIUS * 2));
const COLS = Math.floor(canvas.width / (RADIUS * 2));
// Giữ trạng thái lệch cột của lưới lục giác (0 hoặc 1). Khi dồn hàng, trạng thái sẽ đảo.
let rowParityOffset = 0;
function isOddRow(row){ return ((row + rowParityOffset) % 2) === 1; }

// Giới hạn particles để tránh GC và drop FPS
const MAX_PARTICLES = 400;

// Cache sprite quả trứng theo màu để giảm chi phí vẽ
const EGG_SPRITE_CACHE = {};
function getEggSprite(color) {
    if (EGG_SPRITE_CACHE[color]) return EGG_SPRITE_CACHE[color];
    const size = RADIUS * 2 + 8; // dư viền shadow
    const oc = document.createElement('canvas');
    oc.width = size; oc.height = size;
    const octx = oc.getContext('2d');
    octx.save();
    octx.translate(size / 2, size / 2);
    // Shadow được bake sẵn trong sprite
    octx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    octx.shadowBlur = 8;
    octx.shadowOffsetX = 2;
    octx.shadowOffsetY = 2;
    // Main circle
    octx.beginPath();
    octx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    octx.fillStyle = color;
    octx.fill();
    // Highlight
    octx.shadowBlur = 0;
    octx.shadowOffsetX = 0;
    octx.shadowOffsetY = 0;
    octx.beginPath();
    octx.arc(-RADIUS * 0.3, -RADIUS * 0.3, RADIUS * 0.4, 0, Math.PI * 2);
    octx.fillStyle = 'rgba(255,255,255,0.6)';
    octx.fill();
    // Border
    octx.strokeStyle = '#fbc02d';
    octx.lineWidth = 2;
    octx.stroke();
    octx.restore();
    EGG_SPRITE_CACHE[color] = oc;
    return oc;
}

let grid = [];
let shooter = { x: canvas.width / 2, y: canvas.height - 80 };
let currentEgg = null;
let isPlaying = false;
let score = 0;
let level = 1;
let shootAngle = Math.PI / 2;
let shooting = false;
let shotEgg = null;
let moveDownInterval = null;
let lastMoveDown = performance.now();
let MOVE_DOWN_INTERVAL = 5000;
let particles = [];
let powerUps = [];
let combo = 0;
let maxCombo = 0;
let streak = 0;
let gameStats = {
    eggsDestroyed: 0,
    perfectShots: 0,
    totalShots: 0
};

// Dirty-render flag to avoid full redraws each frame
let drawRequested = true;
function requestDraw() { drawRequested = true; }

// Power-up types
const POWER_UP_TYPES = {
    BOMB: 'bomb',
    RAINBOW: 'rainbow',
    FREEZE: 'freeze',
    SPEED: 'speed'
};

// Colors for eggs
const COLORS = ['#ffe082', '#f06292', '#64b5f6', '#81c784', '#ba68c8', '#ff8a65', '#4db6ac'];

function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Particle system for explosions
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw() {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

// Power-up class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.collected = false;
        this.animation = 0;
    }

    update() {
        this.animation += 0.1;
        this.y += 0.5; // slowly fall down
    }

    draw() {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.animation);
        
        // Draw power-up icon
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw symbol
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getSymbol(), 0, 0);
        
        ctx.restore();
    }

    getColor() {
        switch(this.type) {
            case POWER_UP_TYPES.BOMB: return '#ff5722';
            case POWER_UP_TYPES.RAINBOW: return '#9c27b0';
            case POWER_UP_TYPES.FREEZE: return '#2196f3';
            case POWER_UP_TYPES.SPEED: return '#4caf50';
            default: return '#ff9800';
        }
    }

    getSymbol() {
        switch(this.type) {
            case POWER_UP_TYPES.BOMB: return '💣';
            case POWER_UP_TYPES.RAINBOW: return '🌈';
            case POWER_UP_TYPES.FREEZE: return '❄️';
            case POWER_UP_TYPES.SPEED: return '⚡';
            default: return '?';
        }
    }
}

function createExplosion(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function drawGrid() {
    // Theme background
    if (eggTheme==='dark') {
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (eggTheme==='neon') {
        ctx.fillStyle = '#001219';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Gradient background for classic
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#e3f2fd');
        gradient.addColorStop(1, '#bbdefb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * RADIUS * 2);
        ctx.lineTo(canvas.width, row * RADIUS * 2);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * RADIUS * 2, 0);
        ctx.lineTo(col * RADIUS * 2, canvas.height);
        ctx.stroke();
    }
    
    // Draw eggs (guard when grid is not initialized yet)
    for (let row = 0; row < ROWS; row++) {
        const rowArr = grid[row];
        if (!rowArr) continue;
        for (let col = 0; col < COLS; col++) {
            const egg = rowArr[col];
            if (egg) {
                drawEgg(col * RADIUS * 2 + (isOddRow(row) ? RADIUS : 0) + RADIUS, row * RADIUS * 2 + RADIUS, egg.color, egg.fade !== undefined ? egg.fade : 1.0);
            }
        }
    }
    
    // Draw shot egg
    if (shotEgg) {
        drawEgg(shotEgg.x, shotEgg.y, shotEgg.color);
    }
    
    // Draw power-ups
    powerUps.forEach(powerUp => powerUp.draw());
    
    // Draw particles
    particles.forEach(particle => particle.draw());
    
    // Draw shooter line
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x + Math.cos(shootAngle) * 60, shooter.y - Math.sin(shootAngle) * 60);
    ctx.stroke();
    
    // Draw shooter glow
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x + Math.cos(shootAngle) * 65, shooter.y - Math.sin(shootAngle) * 65);
    ctx.stroke();
    ctx.restore();
    
    // Draw combo indicator
    if (combo > 1) {
        ctx.save();
        ctx.fillStyle = '#ff5722';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`COMBO x${combo}`, canvas.width / 2, 50);
        ctx.restore();
    }
    
    // Draw pause indicator
    if (isPlaying && isPaused) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⏸️ TẠM DỪNG', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText('Nhấn P hoặc bấm nút để tiếp tục', canvas.width / 2, canvas.height / 2 + 20);
        ctx.restore();
    }
}

function animateEggRemoval(match) {
    if (window.eggShooterSounds) window.eggShooterSounds.playSound('explode');
    
    // Create explosion particles
    match.forEach(([r, c]) => {
        const egg = grid[r][c];
        if (egg) {
            const x = c * RADIUS * 2 + (isOddRow(r) ? RADIUS : 0) + RADIUS;
            const y = r * RADIUS * 2 + RADIUS;
            createExplosion(x, y, egg.color, 6);
            
            egg.removing = true;
            egg.fade = 1.0;
        }
    });
    
    // Update stats and combo
    if (window.gameStats) {
        window.gameStats.eggsDestroyed = (window.gameStats.eggsDestroyed || 0) + match.length;
        window.gameStats.perfectShots = (window.gameStats.perfectShots || 0) + 1;
    }
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    
    // Add score with combo bonus
    const comboBonus = Math.floor(combo * 0.5);
    score += match.length + comboBonus;
    scoreValue.textContent = score;
    
    // Check for level up
    checkLevelUp();
    
    let fadeStep = 0.08;
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
        
        // Update particles
    if (particles.length > MAX_PARTICLES) particles.length = MAX_PARTICLES;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
    }
        
        requestDraw();
        if (stillFading) {
            requestAnimationFrame(fade);
        } else {
            // Reset combo after a delay
            setTimeout(() => {
                combo = 0;
                drawGrid();
            }, 1000);
        }
    }
    fade();
}

function drawEgg(x, y, color, fade = 1.0) {
    ctx.save();
    ctx.globalAlpha = fade;
    const sprite = getEggSprite(color);
    ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
    ctx.restore();
}

function initGrid() {
    grid = [];
    for (let row = 0; row < ROWS; row++) {
        let arr = [];
        for (let col = 0; col < COLS; col++) {
            if (row < Math.min(4 + Math.floor(level / 3), 6)) {
                arr.push({ color: randomColor() });
            } else {
                arr.push(null);
            }
        }
        grid.push(arr);
    }
    
    // Add some power-ups randomly
    addRandomPowerUps();
}

function addRandomPowerUps() {
    const powerUpCount = Math.min(Math.floor(level / 2), 3);
    for (let i = 0; i < powerUpCount; i++) {
        const row = Math.floor(Math.random() * 3);
        const col = Math.floor(Math.random() * COLS);
        if (!grid[row][col]) {
            const types = Object.values(POWER_UP_TYPES);
            const type = types[Math.floor(Math.random() * types.length)];
            const x = col * RADIUS * 2 + (row % 2 ? RADIUS : 0) + RADIUS;
            const y = row * RADIUS * 2 + RADIUS;
            powerUps.push(new PowerUp(x, y, type));
        }
    }
}

function setCurrentEgg() {
    currentEgg = { color: randomColor() };
    currentEggDiv.style.background = currentEgg.color;
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

function endGame(won) {
    isPlaying = false;
    isPaused = false; // Reset pause state when game ends
    
    // Show restart button and hide start button
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    if (startBtn) startBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'inline-block';
    
    if (won) {
        // Play win sound
        if (window.eggShooterSounds) window.eggShooterSounds.playSound('win');
        alert('🎉 Chúc mừng! Bạn đã thắng với điểm số: ' + score);
    } else {
        // Play lose sound
        if (window.eggShooterSounds) window.eggShooterSounds.playSound('lose');
        alert('💥 Game Over! Điểm số của bạn: ' + score);
    }
    
    // Save high score
    if (window.gameHub && window.gameHub.saveHighScore) {
        window.gameHub.saveHighScore('egg-shooter', score);
    }
    
    // Update button UI
    updateEggMainBtn();
    
    // Request final draw
    requestDraw();
}

function shootEgg() {
    if (!isPlaying || shooting) return;
    shooting = true;
    if (window.eggShooterSounds) window.eggShooterSounds.playSound('shoot');
    shotEgg = {
        x: shooter.x,
        y: shooter.y,
        color: (currentEgg && currentEgg.color) ? currentEgg.color : randomColor(),
        dx: Math.cos(shootAngle) * 16,
        dy: -Math.sin(shootAngle) * 16
    };
}

function updateShotEgg() {
    if (!shotEgg) return;
    
    // Lưu vị trí trước khi di chuyển để ước lượng điểm va chạm ổn định
    const prevX = shotEgg.x, prevY = shotEgg.y;
    shotEgg.x += shotEgg.dx;
    shotEgg.y += shotEgg.dy;
    
    // Bounce off walls
    if (shotEgg.x < RADIUS || shotEgg.x > canvas.width - RADIUS) {
        shotEgg.dx *= -1;
        shotEgg.x = Math.max(RADIUS, Math.min(canvas.width - RADIUS, shotEgg.x));
    }
    
    // Check collision with power-ups
    powerUps.forEach((powerUp, index) => {
        if (!powerUp.collected) {
            const dist = Math.hypot(shotEgg.x - powerUp.x, shotEgg.y - powerUp.y);
            if (dist < RADIUS + 15) {
                collectPowerUp(powerUp, index);
            }
        }
    });
    
    // Check collision chỉ quanh cụm lân cận để giảm chi phí
    let hit = false;
    const estRow = Math.max(0, Math.min(ROWS - 1, Math.round((shotEgg.y - RADIUS) / (RADIUS * 2))));
    const estCol = Math.max(0, Math.min(COLS - 1, Math.round((shotEgg.x - (isOddRow(estRow) ? RADIUS : 0) - RADIUS) / (RADIUS * 2))));
    for (let r = Math.max(0, estRow - 2); r <= Math.min(ROWS - 1, estRow + 2) && !hit; r++) {
        for (let c = Math.max(0, estCol - 2); c <= Math.min(COLS - 1, estCol + 2); c++) {
            const egg = grid[r][c];
            if (!egg) continue;
            let cx = c * RADIUS * 2 + (isOddRow(r) ? RADIUS : 0) + RADIUS;
            let cy = r * RADIUS * 2 + RADIUS;
            let dist = Math.hypot(shotEgg.x - cx, shotEgg.y - cy);
            if (dist < RADIUS * 2 - 2) {
                const vx = shotEgg.x - cx, vy = shotEgg.y - cy;
                const len = Math.hypot(vx, vy) || 1;
                const rHit = (RADIUS * 2 - 2);
                const ix = cx + (vx / len) * rHit;
                const iy = cy + (vy / len) * rHit;
                placeEgg(r, c, ix, iy);
                hit = true;
                break;
            }
        }
    }
    
    // Hit top wall
    if (shotEgg.y < RADIUS) {
        let col = Math.floor((shotEgg.x - RADIUS) / (RADIUS * 2));
        if (col < 0) col = 0;
        if (col >= COLS) col = COLS - 1;
        placeEgg(0, col, shotEgg.x, shotEgg.y);
        hit = true;
    }
    
    if (hit) {
        shotEgg = null;
        shooting = false;
        setCurrentEgg();
        gameStats.totalShots++;
    }
}

function collectPowerUp(powerUp, index) {
    powerUp.collected = true;
    powerUps.splice(index, 1);
    
    // Create collection effect
    createExplosion(powerUp.x, powerUp.y, powerUp.getColor(), 12);
    
    // Apply power-up effect
    switch(powerUp.type) {
        case POWER_UP_TYPES.BOMB:
            activateBomb();
            break;
        case POWER_UP_TYPES.RAINBOW:
            activateRainbow();
            break;
        case POWER_UP_TYPES.FREEZE:
            activateFreeze();
            break;
        case POWER_UP_TYPES.SPEED:
            activateSpeed();
            break;
    }
    
    if (window.eggShooterSounds) window.eggShooterSounds.playSound('win');
}

function activateBomb() {
    // Destroy eggs in a 3x3 area around shooter
    const centerRow = Math.floor((shooter.y - RADIUS) / (RADIUS * 2));
    const centerCol = Math.floor((shooter.x - RADIUS) / (RADIUS * 2));
    
    let destroyed = 0;
    for (let r = Math.max(0, centerRow - 1); r <= Math.min(ROWS - 1, centerRow + 1); r++) {
        for (let c = Math.max(0, centerCol - 1); c <= Math.min(COLS - 1, centerCol + 1); c++) {
            if (grid[r][c]) {
                const x = c * RADIUS * 2 + (r % 2 ? RADIUS : 0) + RADIUS;
                const y = r * RADIUS * 2 + RADIUS;
                createExplosion(x, y, grid[r][c].color, 4);
                grid[r][c] = null;
                destroyed++;
            }
        }
    }
    
    if (destroyed > 0) {
        score += destroyed * 2;
        scoreValue.textContent = score;
        checkLevelUp();
    }
}

function activateRainbow() {
    // Change all eggs to the same color for easier matching
    const newColor = randomColor();
    let changed = 0;
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) {
                grid[row][col].color = newColor;
                changed++;
            }
        }
    }
    
    if (changed > 0) {
        // Check for matches after color change
        setTimeout(() => {
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    if (grid[row][col]) {
                        checkMatch(row, col);
                    }
                }
            }
        }, 100);
    }
}

function activateFreeze() {
    // Freeze the game for 3 seconds
    const originalInterval = MOVE_DOWN_INTERVAL;
    isFrozen = true;
    
    // Visual freeze effect
    ctx.save();
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    setTimeout(() => {
        MOVE_DOWN_INTERVAL = originalInterval;
        isFrozen = false;
    }, 3000);
}

function activateSpeed() {
    // Increase shooting speed temporarily
    const originalSpeed = 16;
    shotEgg.dx *= 1.5;
    shotEgg.dy *= 1.5;
    
    // Visual speed effect
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(
            shotEgg.x + (Math.random() - 0.5) * 20,
            shotEgg.y + (Math.random() - 0.5) * 20,
            '#4caf50'
        ));
    }
}

function getCellCenter(row, col) {
    const x = col * RADIUS * 2 + (isOddRow(row) ? RADIUS : 0) + RADIUS;
    const y = row * RADIUS * 2 + RADIUS;
    return [x, y];
}

function getNeighbors(row, col) {
    const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [isOddRow(row) ? -1 : 1, -1], [isOddRow(row) ? -1 : 1, 1]
    ];
    const res = [];
    for (const [dr, dc] of dirs) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) res.push([r, c]);
    }
    return res;
}

function placeEgg(row, col, hitX, hitY) {
    // Chọn ô trống gần nhất quanh điểm va chạm để đặt trứng
    let candidates = [];
    if (!grid[row][col]) candidates.push([row, col]);
    candidates = candidates.concat(getNeighbors(row, col).filter(([r, c]) => !grid[r][c]));
    if (!candidates.length) return; // không còn chỗ trống hợp lệ

    let best = candidates[0];
    let bestDist = Infinity;
    for (const [r, c] of candidates) {
        const [cx, cy] = getCellCenter(r, c);
        const d = Math.hypot((hitX ?? shotEgg.x) - cx, (hitY ?? shotEgg.y) - cy);
        if (d < bestDist) { bestDist = d; best = [r, c]; }
    }

    const [pr, pc] = best;
    grid[pr][pc] = { color: currentEgg.color };

    // Kiểm tra match tại đúng ô vừa đặt
    checkMatch(pr, pc);
    requestDraw();
    checkLose();
}

function moveRowsDown() {
    // Dồn hàng theo ma trận lưới lục giác: giữ nguyên lệch cột giữa hàng chẵn/lẻ
    for (let row = ROWS - 1; row > 0; row--) {
        grid[row] = grid[row - 1] ? [...grid[row - 1]] : Array(COLS).fill(null);
    }
    grid[0] = Array(COLS).fill(null);
    
    // Move power-ups down too
    powerUps.forEach(powerUp => {
        powerUp.y += RADIUS * 2;
        powerUp.update();
    });
    
    // Remove power-ups that fall off screen
    powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height + 20);
}

function addNewTopRow() {
    const newRow = Array(COLS).fill(null);
    const fillChance = Math.min(0.7 + (level * 0.05), 0.9); // More eggs at higher levels
    
    for (let col = 0; col < COLS; col++) {
        if (Math.random() < fillChance) {
            newRow[col] = { color: randomColor() };
        }
    }
    
    grid[0] = newRow;
    // Sau mỗi lần thêm hàng mới, đảo offset chẵn/lẻ để duy trì pattern ổn định
    rowParityOffset = (rowParityOffset ^ 1);
    
    // Occasionally add new power-ups
    if (Math.random() < 0.3) {
        const col = Math.floor(Math.random() * COLS);
        if (!grid[0][col]) {
            const types = Object.values(POWER_UP_TYPES);
            const type = types[Math.floor(Math.random() * types.length)];
            const x = col * RADIUS * 2 + RADIUS;
            const y = RADIUS;
            powerUps.push(new PowerUp(x, y, type));
        }
    }
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
        
        // Check all 6 directions (hexagonal grid)
        let dirs = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [r % 2 ? -1 : 1, -1], [r % 2 ? -1 : 1, 1]
        ];
        
        for (let [dr, dc] of dirs) {
            queue.push([r + dr, c + dc]);
        }
    }
    
    if (match.length >= 3) {
        animateEggRemoval(match);
        return true;
    }
    
    return false;
}

function checkLose() {
    // Check if any egg reaches the shooter level
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) {
                let cy = row * RADIUS * 2 + RADIUS;
                if (cy + RADIUS >= shooter.y) {
                    endGame(false);
                    return;
                }
            }
        }
    }
    
    // Check win condition: no eggs left
    let eggsLeft = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col]) eggsLeft++;
        }
    }
    
    if (eggsLeft === 0) {
        endGame(true);
    }
}

function checkLevelUp() {
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel > level) {
        level = newLevel;
        MOVE_DOWN_INTERVAL = Math.max(2000, 5000 - (level - 1) * 200);
        
        showLevelUpMessage();
    }
}

function showLevelUpMessage() {
            const message = `Cấp độ ${level}! Tốc độ tăng!`;
    showModal(message);
    
    // Add level up particles
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            '#ffd700'
        ));
    }
}

function updateDisplays() {
    // Update score display
    const scoreValue = document.getElementById('scoreValue');
    if (scoreValue) scoreValue.textContent = score;
    
            // Update level display
        const levelValue = document.getElementById('level-value');
        if (levelValue) levelValue.textContent = level;
        
        // Update combo display
        const comboValue = document.getElementById('combo-value');
        if (comboValue) comboValue.textContent = combo;
    
    // Update game stats
    const eggsDestroyedValue = document.getElementById('eggsDestroyedValue');
    if (eggsDestroyedValue) eggsDestroyedValue.textContent = gameStats.eggsDestroyed;
    
    const perfectShotsValue = document.getElementById('perfectShotsValue');
    if (perfectShotsValue) perfectShotsValue.textContent = gameStats.perfectShots;
    
    const totalShotsValue = document.getElementById('totalShotsValue');
    if (totalShotsValue) totalShotsValue.textContent = gameStats.totalShots;
}

// Handle both mouse and touch events
function handlePointerMove(e) {
    if (!isPlaying || isPaused || shooting) return;
    
    const rect = canvas.getBoundingClientRect();
    // Get coordinates for both mouse and touch
    const px = e.clientX || e.touches[0].clientX;
    const py = e.clientY || e.touches[0].clientY;
    // Scale to canvas coordinate space
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (px - rect.left) * scaleX;
    const my = (py - rect.top) * scaleY;
    
    // Calculate angle with improved precision
    let angle = Math.atan2(shooter.y - my, mx - shooter.x);
    
    // Limit angle range for better gameplay
    const minAngle = 0.1;
    const maxAngle = Math.PI - 0.1;
    if (angle < minAngle) angle = minAngle;
    if (angle > maxAngle) angle = maxAngle;
    
    shootAngle = angle;
    drawGrid();
    
    // Prevent scrolling on mobile
    e.preventDefault();
}

function handlePointerEnd(e) {
    if (!isPlaying || isPaused || shooting) return;
    // Recompute aim toward click/touch position
    const rect = canvas.getBoundingClientRect();
    const pt = e.changedTouches ? e.changedTouches[0] : e.touches ? e.touches[0] : e;
    if (pt && rect) {
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (pt.clientX - rect.left) * scaleX;
        const my = (pt.clientY - rect.top) * scaleY;
        let angle = Math.atan2(shooter.y - my, mx - shooter.x);
        const minAngle = 0.1;
        const maxAngle = Math.PI - 0.1;
        if (angle < minAngle) angle = minAngle;
        if (angle > maxAngle) angle = maxAngle;
        shootAngle = angle;
    }
    // Add shooting animation
    createShootEffect();
    shootEgg();
    e.preventDefault();
}

function createShootEffect() {
    // Create shooting particles
    for (let i = 0; i < 8; i++) {
        const safeColor = (currentEgg && currentEgg.color) ? currentEgg.color : randomColor();
        particles.push(new Particle(
            shooter.x + (Math.random() - 0.5) * 10,
            shooter.y + (Math.random() - 0.5) * 10,
            safeColor
        ));
    }
    
    // Add recoil effect
    shooter.y += 2;
    setTimeout(() => {
        shooter.y -= 2;
        requestDraw();
    }, 100);
}

// Mouse events
canvas.addEventListener('mousemove', handlePointerMove);
// Chỉ dùng mousedown để bắn – tránh click gây bắn đúp (mousedown + click)

// Bắn bằng mousedown (trái/phải) và chặn menu chuột phải
function handleMouseDown(e) {
    if (!isPlaying || isPaused || shooting) return;
    // Debounce: khóa bắn trong 80ms để tránh sự kiện kép từ thiết bị/driver
    if (window.__lastShotTs && performance.now() - window.__lastShotTs < 80) {
        return;
    }
    if (e.button === 0 || e.button === 2 || e.buttons > 0) {
        // Recompute aim toward click point
        const rect = canvas.getBoundingClientRect();
        if (rect) {
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;
            let angle = Math.atan2(shooter.y - my, mx - shooter.x);
            const minAngle = 0.1;
            const maxAngle = Math.PI - 0.1;
            if (angle < minAngle) angle = minAngle;
            if (angle > maxAngle) angle = maxAngle;
            shootAngle = angle;
        }
        createShootEffect();
        shootEgg();
        window.__lastShotTs = performance.now();
        e.preventDefault();
    }
}
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('contextmenu', (e) => {
    // Ngăn menu chuột phải trên khu vực canvas để không cản sự kiện
    e.preventDefault();
});

// Also allow clicking current egg or shooter area to shoot
currentEggDiv.addEventListener('click', handlePointerEnd);
currentEggDiv.addEventListener('touchend', handlePointerEnd, { passive: false });
const shooterEl = document.getElementById('shooter');
if (shooterEl) {
    shooterEl.addEventListener('click', handlePointerEnd);
    shooterEl.addEventListener('mousedown', handleMouseDown);
    shooterEl.addEventListener('touchend', handlePointerEnd, { passive: false });
}

// Touch events
canvas.addEventListener('touchstart', handlePointerMove, { passive: false });
canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
canvas.addEventListener('touchend', (e)=>{ handlePointerEnd(e); e.preventDefault(); e.stopPropagation(); }, { passive: false });

// Flags
let isPaused = false;
let isFrozen = false;
let gameOver = false; // Added gameOver flag
let eggTheme = 'classic';

// Define startGame and expose
function startGame() {
    if (isPlaying) return;
    
    // Reset game state
    score = 0;
    level = 1;
    combo = 0;
    particles = [];
    powerUps = [];
    gameStats = { eggsDestroyed: 0, perfectShots: 0, totalShots: 0 };
    
    // Reset pause state
    isPaused = false;
    
    // Reset button states
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    if (startBtn) startBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'none';
    
    // Initialize game
    initGrid();
    setCurrentEgg();
    isPlaying = true;
    gameOver = false;
    
    // Start game loop
    if (typeof gameLoopRunning === 'undefined') { window.gameLoopRunning = false; }
    if (!window.gameLoopRunning) {
        window.gameLoopRunning = true;
        gameLoop();
    }
    
    // Update displays
    updateDisplays();
    
    // Request initial draw
    requestDraw();
}
window.startGame = startGame;

// Initialize game loop lazily to avoid running before grid is ready
let _loopStarted = false;
function ensureLoop() {
    if (_loopStarted) return;
    _loopStarted = true;
    const start = () => { if (typeof window.gameLoop === 'function') requestAnimationFrame(window.gameLoop); };
    if (typeof window.gameLoop === 'function') start();
    else window.addEventListener('load', start);
}

function gameLoop() {
    const now = performance.now();

    // Rơi hàng theo chu kỳ nếu đang chơi và không pause/freeze
    if (isPlaying && !isPaused && !isFrozen && now - lastMoveDown > MOVE_DOWN_INTERVAL) {
        moveRowsDown();
        addNewTopRow();
        requestDraw();
        checkLose();
        lastMoveDown = now;
    }

    // Cập nhật viên đạn đang bay
    if (isPlaying && !isPaused && shooting && shotEgg) {
        updateShotEgg();
        drawGrid();
    }

    // Particles & power-ups
    if (!isPaused) {
        particles = particles.filter(p => { p.update(); return p.life > 0; });
        powerUps.forEach(pu => pu.update());
        powerUps = powerUps.filter(pu => pu.y < canvas.height + 50);
    }

    // Vẽ mọi thứ
    if (drawRequested || (isPlaying && isPaused)) drawGrid();
    drawRequested = false; // Clear the flag after drawing

    // Expose cho UI
    window.level = level;
    window.combo = combo;
    window.gameStats = gameStats;

    requestAnimationFrame(window.gameLoop);
}

// Expose loop function on window to avoid ReferenceError
autoExposeLoop();
function autoExposeLoop() { window.gameLoop = gameLoop; }

// Initialize game
if (typeof window.gameLoop === 'function') {
    requestAnimationFrame(window.gameLoop);
} else {
    window.addEventListener('load', () => {
        if (typeof window.gameLoop === 'function') requestAnimationFrame(window.gameLoop);
    });
}

// Single button (eggMainBtn) handled in DOMContentLoaded block

// Leaderboard function
function showLeaderboard() {
    try {
        if (window.remoteLeaderboard && window.remoteLeaderboard.enabled) {
            // Chỉ hiển thị leaderboard ONLINE, không fallback local
            window.remoteLeaderboard.list('egg-shooter', 10)
              .then(scores => {
                let message = '🏆 Top 10 - Bắn Trứng\n\n';
                if (Array.isArray(scores) && scores.length) {
                  scores.forEach((row, i) => { message += `${i+1}. ${row.user}: ${row.score}\n`; });
                } else {
                  message += 'Chưa có điểm số nào (online).';
                }
                alert(message);
              })
              .catch(err => { alert('Không tải được bảng xếp hạng online: ' + (err?.message || 'Lỗi không xác định')); });
        } else {
            // Chỉ khi tắt remote mới dùng local
            showLocalLeaderboard();
        }
    } catch (error) {
        alert('Không tải được bảng xếp hạng: ' + (error?.message || 'Lỗi không xác định'));
    }
}

function showLocalLeaderboard() {
    try {
        if (window.gameHub && window.gameHub.getLeaderboard) {
            window.gameHub.getLeaderboard('egg-shooter').then(scores => {
                let message = '🏆 Top 10 - Bắn Trứng (Local)\n\n';
                
                if (scores && scores.length > 0) {
                    scores.forEach((score, index) => {
                        message += `${index + 1}. ${score.name}: ${score.score}\n`;
                    });
                } else {
                    message += 'Chưa có điểm số nào.';
                }
                
                alert(message);
            });
        } else {
            alert('Leaderboard chưa khả dụng.');
        }
    } catch (error) {
        alert('Không thể hiển thị leaderboard: ' + error.message);
    }
}

// Expose functions globally
window.showLeaderboard = showLeaderboard;

// Button event listeners
document.addEventListener('DOMContentLoaded', function() {
    const eggBtn = document.getElementById('eggMainBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const backBtn = document.getElementById('backBtn');
    if (eggBtn) eggBtn.onclick = function(){ if (!isPlaying) { if(window.startGame) window.startGame(); updateEggMainBtn(); requestDraw(); } else { isPaused = !isPaused; updateEggMainBtn(); requestDraw(); } };
    if (leaderboardBtn) leaderboardBtn.addEventListener('click', showLeaderboard);
    if (backBtn) backBtn.addEventListener('click', () => { location.href='../../index.html'; });
    updateEggMainBtn();
    // Auto-start on first pointer interaction for convenience (ignore clicks on main button)
    const __autoStartOnce = (e) => {
        const target = e && e.target ? e.target : null;
        if (target && (target.id === 'eggMainBtn' || (typeof target.closest === 'function' && target.closest('#eggMainBtn')))) {
            window.removeEventListener('pointerdown', __autoStartOnce, true);
            return;
        }
        if (!isPlaying && window.startGame) {
            window.startGame();
            updateEggMainBtn();
            requestDraw();
        }
        window.removeEventListener('pointerdown', __autoStartOnce, true);
    };
    window.addEventListener('pointerdown', __autoStartOnce, true);
    
    // Add keyboard support for pause (P key)
    document.addEventListener('keydown', function(e) {
        if (e.code === 'KeyP' && isPlaying) {
            isPaused = !isPaused;
            updateEggMainBtn();
            requestDraw();
        }
    });
});

function updateEggMainBtn(){ 
    const b=document.getElementById('eggMainBtn'); 
    if(!b) return; 
    b.textContent = !isPlaying ? '🎯 Bắt đầu' : (isPaused ? '▶️ Tiếp tục' : '⏸️ Tạm dừng'); 
}
window.updateEggMainBtn = updateEggMainBtn;

// Theme & speed setters exposed for options UI
function setEggTheme(v){ eggTheme = v || 'classic'; requestDraw(); }
function setEggFallSpeed(v){ const map = { slow: 6500, normal: 5000, fast: 3600 }; MOVE_DOWN_INTERVAL = map[v] || 5000; }
window.setEggTheme = setEggTheme; window.setEggFallSpeed = setEggFallSpeed;
