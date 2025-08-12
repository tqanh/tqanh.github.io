const cards = [
    '🍎','🍌','🍇','🍉','🍓','🍒','🍍','🥝'
];
let deck = [];
let flipped = [];
let matched = [];
let moves = 0;
let isPlaying = false;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startMemoryGame() {
    deck = [...cards, ...cards];
    shuffle(deck);
    flipped = [];
    matched = [];
    moves = 0;
    isPlaying = true;
    renderMemory();
}

function renderMemory() {
    const board = document.getElementById('memory-board');
    board.innerHTML = '';
    deck.forEach((card, idx) => {
        const div = document.createElement('div');
        div.className = 'memory-card';
        if (matched.includes(idx) || flipped.includes(idx)) {
            div.textContent = card;
            div.style.background = '#fffde7';
        } else {
            div.textContent = '';
            div.style.background = '#bdbdbd';
        }
        div.onclick = () => flipCard(idx);
        board.appendChild(div);
    });
    document.getElementById('memory-moves').textContent = 'Moves: ' + moves;
}

function flipCard(idx) {
    if (!isPlaying || flipped.includes(idx) || matched.includes(idx)) return;
    flipped.push(idx);
    renderMemory();
    if (flipped.length === 2) {
        moves++;
        if (deck[flipped[0]] === deck[flipped[1]]) {
            matched.push(...flipped);
            flipped = [];
            if (matched.length === deck.length) {
                showMemoryModal('You win! Moves: ' + moves);
                isPlaying = false;
            }
        } else {
            setTimeout(() => {
                flipped = [];
                renderMemory();
            }, 800);
        }
    }
}

function showMemoryModal(msg) {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(300);
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
            <button onclick="location.href='../../index.html'">Back to Hub</button>
        </div>`;
        document.body.appendChild(modal);
    }
    document.getElementById('memory-modal-message').textContent = msg;
    modal.style.display = 'flex';
}

window.startMemoryGame = startMemoryGame;
