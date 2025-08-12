// Hub management and high scores
const games = {
    'egg-shooter': { name: 'Egg Shooter', maxScore: 0 },
    'snake': { name: 'Snake', maxScore: 0 },
    'memory': { name: 'Memory Cards', maxScore: 0 }
};

// Load high scores from localStorage
function loadHighScores() {
    const savedScores = localStorage.getItem('gameHubScores');
    if (savedScores) {
        const scores = JSON.parse(savedScores);
        Object.keys(scores).forEach(game => {
            if (games[game]) {
                games[game].maxScore = scores[game];
            }
        });
    }
    updateHighScoresDisplay();
}

// Update high scores display
function updateHighScoresDisplay() {
    const scoresList = document.getElementById('highScores');
    scoresList.innerHTML = '';
    
    Object.keys(games).forEach(gameKey => {
        const game = games[gameKey];
        const li = document.createElement('li');
        li.textContent = `${game.name}: ${game.maxScore}`;
        scoresList.appendChild(li);
    });
}

// Save high score for a game
function saveHighScore(gameKey, score) {
    if (games[gameKey] && score > games[gameKey].maxScore) {
        games[gameKey].maxScore = score;
        const scores = Object.keys(games).reduce((acc, key) => {
            acc[key] = games[key].maxScore;
            return acc;
        }, {});
        localStorage.setItem('gameHubScores', JSON.stringify(scores));
        updateHighScoresDisplay();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHighScores();
});

// Export for use in games
window.gameHub = {
    saveHighScore
};
