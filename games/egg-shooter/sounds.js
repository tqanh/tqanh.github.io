// Simple sound manager
const sounds = {
    shoot: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7e.mp3'), // short pop
    explode: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7e.mp3'), // same for demo
    win: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7e.mp3'), // same for demo
    lose: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_115b6c7b7e.mp3'), // same for demo
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play();
    }
}

window.eggShooterSounds = { playSound };
