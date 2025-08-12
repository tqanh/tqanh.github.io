
// Quản lý âm thanh dùng chung cho nhiều game
function createSound(src, volume) {
    var audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = typeof volume === 'number' ? volume : 1;
    audio.fade = function (fadeIn, duration) {
        fadeIn = (typeof fadeIn === 'undefined') ? true : fadeIn;
        duration = duration || 300;
        var start = fadeIn ? 0 : audio.volume;
        var end = fadeIn ? audio.volume : 0;
        var step = (end - start) / (duration / 20);
        audio.volume = start;
        audio.play();
        var interval = setInterval(function() {
            audio.volume += step;
            if ((fadeIn && audio.volume >= end) || (!fadeIn && audio.volume <= end)) {
                audio.volume = end;
                clearInterval(interval);
            }
        }, 20);
    };
    return audio;
}

const soundMap = {
    'egg-shooter': {
        shoot: createSound('/assets/sounds/shoot.mp3', 0.7),
        explode: createSound('/assets/sounds/explode.mp3', 0.7),
        win: createSound('/assets/sounds/win.mp3', 0.8),
        lose: createSound('/assets/sounds/lose.wav', 0.8)
    },
    'snake': {
        eat: createSound('/assets/sounds/eat.mp3', 0.7),
        lose: createSound('/assets/sounds/lose.mp3', 0.8),
        win: createSound('/assets/sounds/win.mp3', 0.8)
    },
    'memory': {
        match: createSound('/assets/sounds/match.mp3', 0.7),
        win: createSound('/assets/sounds/win.mp3', 0.8),
        lose: createSound('/assets/sounds/lose.mp3', 0.8)
    }
};

function playSound(name, game = 'egg-shooter', fade) {
    const sounds = soundMap[game];
    if (sounds && sounds[name]) {
        sounds[name].currentTime = 0;
        if (fade) {
            sounds[name].fade(true, 300);
        } else {
            sounds[name].play();
        }
    }
}

window.sounds = { playSound };
