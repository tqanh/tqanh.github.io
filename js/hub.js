// Hub management and high scores
const games = {
    'egg-shooter': { name: 'Egg Shooter', maxScore: 0 },
    'snake': { name: 'Snake', maxScore: 0 },
    'memory': { name: 'Memory Cards', maxScore: 0 }
};

// Load high scores from localStorage
function loadHighScores() {
    try {
        const savedScores = localStorage.getItem('gameHubScores');
        if (savedScores) {
            const scores = JSON.parse(savedScores);
            Object.keys(scores).forEach(game => {
                if (games[game]) {
                    games[game].maxScore = scores[game];
                }
            });
        }
    } catch (e) {
        // ignore storage parse errors
    }
    updateHighScoresDisplay();
}

// Update high scores display
function updateHighScoresDisplay() {
    const scoresList = document.getElementById('highScores');
    if (!scoresList) return; // Not on hub page
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
        try {
            localStorage.setItem('gameHubScores', JSON.stringify(scores));
        } catch (e) {
            // ignore quota errors
        }
        updateHighScoresDisplay();
    }
}

function getHighScore(gameKey) {
    return games[gameKey] ? games[gameKey].maxScore : 0;
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadHighScores();
    });
} else {
    loadHighScores();
}

// Export for use in games
window.gameHub = { saveHighScore, getHighScore };
