const canvas = document.getElementById('snake-canvas');
const ctx = canvas.getContext('2d');
const box = 20;
const rows = 20;
const cols = 20;
let snake = [{x: 10, y: 10}];
let direction = 'RIGHT';
let food = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)};
let score = 0;
let isPlaying = false;

function draw() {
    ctx.fillStyle = '#e0f7fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    // Draw score
    ctx.fillStyle = '#333';
    ctx.font = '20px Roboto';
    ctx.fillText('Score: ' + score, 10, 30);
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
        food = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)};
    } else {
        snake.pop();
    }
}

function gameLoop() {
    if (isPlaying) {
        moveSnake();
        draw();
    }
    setTimeout(gameLoop, 150); // giảm tốc độ lại
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    if (e.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
    if (e.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    if (e.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
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
});

function startSnakeGame() {
    snake = [{x: 10, y: 10}];
    direction = 'RIGHT';
    food = {x: Math.floor(Math.random()*cols), y: Math.floor(Math.random()*rows)};
    score = 0;
    isPlaying = true;
    draw();
}

function showSnakeModal(msg) {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(300);
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
        modal.innerHTML = `<div style="background:#fff;padding:30px 40px;border-radius:10px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);font-size:1.5em;">
            <span id="snake-modal-message"></span><br><br>
            <button onclick="document.getElementById('snake-modal').remove();startSnakeGame();">Chơi lại</button>
            <button onclick="location.href='../../index.html'">Back to Hub</button>
        </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('snake-modal-message').textContent = msg;
    modal.style.display = 'flex';
}

window.startSnakeGame = startSnakeGame;
gameLoop();
