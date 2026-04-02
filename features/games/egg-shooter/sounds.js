
// Hệ thống âm thanh nâng cao cho game Bắn Trứng (khởi tạo lười, an toàn autoplay)
class EggShooterSounds {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.7;
        this.audioContext = null;
        this.unlocked = false;
        this.initSounds();
    }

    initSounds() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return; // No Web Audio support
            this.audioContext = new AC();
        } catch (e) {
            console.warn('AudioContext init failed:', e);
            this.audioContext = null;
        }
        this.setupUnlockers();
        // Do NOT pre-create or start any oscillators here (autoplay policies)
    }

    setupUnlockers() {
        const unlock = async () => {
            if (!this.audioContext) return;
            try {
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                this.unlocked = this.audioContext.state === 'running';
            } catch (e) {
                // Ignore; will retry on next gesture
            }
        };
        ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach((evt) => {
            window.addEventListener(evt, unlock, { once: false, passive: true });
        });
    }

    ensureReady() {
        if (this.muted) return false;
        if (!this.audioContext) return false;
        if (this.audioContext.state === 'suspended') {
            try { this.audioContext.resume(); } catch {}
        }
        this.unlocked = this.audioContext.state === 'running';
        return this.unlocked;
    }

    // Factory helpers (only called when ensureReady() is true)
    createShootSound() {
        const o = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        o.connect(g); g.connect(this.audioContext.destination);
        o.frequency.setValueAtTime(800, this.audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        g.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        o.start(); o.stop(this.audioContext.currentTime + 0.1);
    }

    createExplodeSound() {
        [200, 300, 400, 150].forEach((freq, i) => {
            const o = this.audioContext.createOscillator();
            const g = this.audioContext.createGain();
            o.connect(g); g.connect(this.audioContext.destination);
            o.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            o.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioContext.currentTime + 0.3);
            g.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            o.start(); o.stop(this.audioContext.currentTime + 0.3);
        });
    }

    createWinSound() {
        [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
            const o = this.audioContext.createOscillator();
            const g = this.audioContext.createGain();
            o.connect(g); g.connect(this.audioContext.destination);
            o.frequency.setValueAtTime(f, this.audioContext.currentTime + idx * 0.1);
            g.gain.setValueAtTime(0, this.audioContext.currentTime + idx * 0.1);
            g.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioContext.currentTime + idx * 0.1 + 0.05);
            g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + idx * 0.1 + 0.3);
            o.start(this.audioContext.currentTime + idx * 0.1);
            o.stop(this.audioContext.currentTime + idx * 0.1 + 0.3);
        });
    }

    createLoseSound() {
        const o = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        o.connect(g); g.connect(this.audioContext.destination);
        o.frequency.setValueAtTime(400, this.audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        g.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        o.start(); o.stop(this.audioContext.currentTime + 0.5);
    }

    createPowerUpSound() {
        const o = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        o.connect(g); g.connect(this.audioContext.destination);
        o.frequency.setValueAtTime(600, this.audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);
        o.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.4);
        g.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        o.start(); o.stop(this.audioContext.currentTime + 0.4);
    }

    createComboSound() {
        const o = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        o.connect(g); g.connect(this.audioContext.destination);
        o.frequency.setValueAtTime(800, this.audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.15);
        g.gain.setValueAtTime(this.volume * 0.25, this.audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        o.start(); o.stop(this.audioContext.currentTime + 0.15);
    }

    createLevelUpSound() {
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, idx) => {
            const o = this.audioContext.createOscillator();
            const g = this.audioContext.createGain();
            o.connect(g); g.connect(this.audioContext.destination);
            o.frequency.setValueAtTime(f, this.audioContext.currentTime + idx * 0.08);
            g.gain.setValueAtTime(0, this.audioContext.currentTime + idx * 0.08);
            g.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + idx * 0.08 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + idx * 0.08 + 0.2);
            o.start(this.audioContext.currentTime + idx * 0.08);
            o.stop(this.audioContext.currentTime + idx * 0.08 + 0.2);
        });
    }

    createBounceSound() {
        const o = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        o.connect(g); g.connect(this.audioContext.destination);
        o.frequency.setValueAtTime(600, this.audioContext.currentTime);
        o.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        g.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        o.start(); o.stop(this.audioContext.currentTime + 0.1);
    }

    playSound(soundName) {
        try {
            if (!this.ensureReady()) return;
            switch (soundName) {
                case 'shoot': this.createShootSound(); break;
                case 'explode': this.createExplodeSound(); break;
                case 'win': this.createWinSound(); break;
                case 'lose': this.createLoseSound(); break;
                case 'powerUp': this.createPowerUpSound(); break;
                case 'combo': this.createComboSound(); break;
                case 'levelUp': this.createLevelUpSound(); break;
                case 'bounce': this.createBounceSound(); break;
            }
        } catch (error) {
            // Swallow autoplay NotAllowedError and keep game running
            // console.debug('Sound playback error:', error);
        }
    }

    playBackgroundMusic() {
        // Not implemented; keep silent to avoid autoplay errors
    }

    stopBackgroundMusic() {}

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // Convenience wrappers
    playComboSound(comboCount) { if (comboCount > 1) this.playSound('combo'); }
    playLevelUpSound() { this.playSound('levelUp'); }
    playPowerUpSound() { this.playSound('powerUp'); }
    playBounceSound() { this.playSound('bounce'); }
}

// Initialize sound system
window.eggShooterSounds = new EggShooterSounds();

// Add sound control helpers
window.toggleGameSound = () => window.eggShooterSounds.toggleMute();
window.setGameVolume = (v) => window.eggShooterSounds.setVolume(v);

// Add sound controls to the page after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const soundControls = document.createElement('div');
    soundControls.style.cssText = `
        text-align: center;
        margin: 15px 0;
        padding: 15px;
        background: rgba(255,255,255,0.1);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
    `;
    soundControls.innerHTML = `
        <h4>🔊 Điều khiển âm thanh:</h4>
        <button onclick="window.toggleGameSound()" id="mute-btn">🔇 Tắt âm</button>
        <input type="range" min="0" max="100" value="70" onchange="window.setGameVolume(this.value/100)" style="margin: 0 15px;">
        <span id="volume-display">70%</span>
    `;
    const soundTest = document.getElementById('sound-test');
    if (soundTest && soundTest.parentNode) {
        soundTest.parentNode.insertBefore(soundControls, soundTest.nextSibling);
    }
    const volumeSlider = soundControls.querySelector('input[type="range"]');
    const volumeDisplay = soundControls.querySelector('#volume-display');
    if (volumeSlider && volumeDisplay) {
        volumeSlider.addEventListener('input', (e) => {
            volumeDisplay.textContent = e.target.value + '%';
        });
    }
    const muteBtn = soundControls.querySelector('#mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const isMuted = window.toggleGameSound();
            muteBtn.textContent = isMuted ? '🔊 Bật âm' : '🔇 Tắt âm';
        });
    }
});
