const canvas = document.getElementById('bubble-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-button');
const restartBtn = document.getElementById('restart-button');
const scoreValue = document.getElementById('score-value');
const currentEggDiv = document.getElementById('current-egg');

const RADIUS = 25;
const ROWS = Math.floor(canvas.height / (RADIUS * 2));
const COLS = Math.floor(canvas.width / (RADIUS * 2));

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e3f2fd');
    gradient.addColorStop(1, '#bbdefb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
                drawEgg(col * RADIUS * 2 + (row % 2 ? RADIUS : 0) + RADIUS, row * RADIUS * 2 + RADIUS, egg.color, egg.fade !== undefined ? egg.fade : 1.0);
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
}

function animateEggRemoval(match) {
    if (window.eggShooterSounds) window.eggShooterSounds.playSound('explode');
    
    // Create explosion particles
    match.forEach(([r, c]) => {
        const egg = grid[r][c];
        if (egg) {
            const x = c * RADIUS * 2 + (r % 2 ? RADIUS : 0) + RADIUS;
            const y = r * RADIUS * 2 + RADIUS;
            createExplosion(x, y, egg.color, 6);
            
            egg.removing = true;
            egg.fade = 1.0;
        }
    });
    
    // Update combo
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
        particles = particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
        
        drawGrid();
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
    
    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw main egg
    ctx.beginPath();
    ctx.arc(x, y, RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw highlight
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.arc(x - RADIUS * 0.3, y - RADIUS * 0.3, RADIUS * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = '#fbc02d';
    ctx.lineWidth = 2;
    ctx.stroke();
    
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
    
    // Check collision with eggs
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
    
    // Hit top wall
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

function placeEgg(row, col) {
    // Find the best position to place the egg
    let placed = false;
    
    // Try to place in the exact position first
    if (!grid[row][col]) {
        grid[row][col] = { color: currentEgg.color };
        placed = true;
    } else {
        // Find nearby empty positions
        for (let r = row; r < ROWS; r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(COLS - 1, col + 1); c++) {
                if (!grid[r][c]) {
                    grid[r][c] = { color: currentEgg.color };
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }
    }
    
    if (placed) {
        // Check for matches
        checkMatch(row, col);
        drawGrid();
        checkLose();
        
        // Update stats
        gameStats.eggsDestroyed++;
        
        // Check for perfect shot (immediate match)
        if (combo > 0) {
            gameStats.perfectShots++;
        }
    }
}

function moveRowsDown() {
    for (let row = ROWS - 1; row > 0; row--) {
        grid[row] = [...grid[row - 1]];
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
    const message = `Level ${level}! Tốc độ tăng!`;
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

// Handle both mouse and touch events
function handlePointerMove(e) {
    if (!isPlaying || shooting) return;
    
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
    if (!isPlaying || shooting) return;
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
        particles.push(new Particle(
            shooter.x + (Math.random() - 0.5) * 10,
            shooter.y + (Math.random() - 0.5) * 10,
            currentEgg.color
        ));
    }
    
    // Add recoil effect
    shooter.y += 2;
    setTimeout(() => {
        shooter.y -= 2;
        drawGrid();
    }, 100);
}

// Mouse events
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('click', handlePointerEnd);

// Bắn bằng mousedown (trái/phải) và chặn menu chuột phải
function handleMouseDown(e) {
    if (!isPlaying || shooting) return;
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
canvas.addEventListener('touchend', handlePointerEnd, { passive: false });

// Flags
let isPaused = false;
let isFrozen = false;

// Define startGame and expose
function startGame() {
    score = 0;
    level = 1;
    combo = 0;
    maxCombo = 0;
    streak = 0;
    particles = [];
    powerUps = [];
    gameStats = { eggsDestroyed: 0, perfectShots: 0, totalShots: 0 };
    
    scoreValue.textContent = score;
    isPlaying = true;
    isPaused = false;
    isFrozen = false;
    startBtn.style.display = 'none';
    restartBtn.style.display = 'inline-block';
    
    initGrid();
    setCurrentEgg();
    shotEgg = null;
    shooting = false;
    
    MOVE_DOWN_INTERVAL = 5000;
    lastMoveDown = performance.now();
    
    requestDraw();
    ensureLoop();
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
        drawGrid();
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
    if (drawRequested) drawGrid();
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

// Reinforce Start/Restart bindings and auto-start on first interaction
if (startBtn) {
    startBtn.onclick = () => window.startGame && window.startGame();
    startBtn.addEventListener('click', (e) => { e.preventDefault(); if (window.startGame) window.startGame(); });
}
if (restartBtn) {
    restartBtn.onclick = () => window.startGame && window.startGame();
    restartBtn.addEventListener('click', (e) => { e.preventDefault(); if (window.startGame) window.startGame(); });
}
// Auto-start on first user interaction in case button binding fails
window.addEventListener('pointerdown', () => {
    if (!isPlaying && window.startGame) window.startGame();
}, { once: true });
