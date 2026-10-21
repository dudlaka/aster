/**
 * ASTER Soluciones Técnicas - Audio Engine
 * High-tech industrial mechanical switches and dry pneumatic clicks.
 * Removed all melodic / choral / church-bell style chords ("canónigos") per user request.
 * Completely silent ambient background (zero continuous noise).
 */

class AsterAudioSystem {
    constructor() {
        this.ctx = null;
        this.isEnabled = false;
        this.isMuted = false;
        this.masterGain = null;
        this.initialized = false;
        
        const savedMute = localStorage.getItem('aster_sound_muted');
        if (savedMute !== null) {
            this.isMuted = savedMute === 'true';
        }
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.initialized = true;
            this.isEnabled = true;
            this.updateUi();
        } catch (e) {
            console.warn("Web Audio API not supported or blocked:", e);
        }
    }

    // Precise high-tech micro-click for hover
    playHover() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 2.2 kHz fast metallic switch tick (duration: 15ms)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.015);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.02);
    }

    // Industrial relay / contactor click (Crisp dry mechanical latch, NO bells / choral chords)
    playSelect() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Pulse 1: Mechanical striker impact
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1400, now);
        osc1.frequency.exponentialRampToValueAtTime(320, now + 0.025);

        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.03);

        // Pulse 2: Secondary contact snap (8ms later)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1800, now + 0.008);
        osc2.frequency.exponentialRampToValueAtTime(600, now + 0.03);

        gain2.gain.setValueAtTime(0.12, now + 0.008);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now + 0.008);
        osc2.stop(now + 0.038);
    }

    // Mechanical unlatch click for closing modals
    playBack() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.03);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    // Pneumatic valve click for modal opening
    playOpen() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Sharp crystalline snap when an icicle detaches on rotation
    playIcicleSnap() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2800 + Math.random() * 600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Ice shattering sound when clicking CONTACTO
    playIceShatter() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Low crack
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(160, now);
        bassOsc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.3);

        // Crisp shattering noise
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + i * 0.03;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2200 + Math.random() * 1800, t);
            osc.frequency.exponentialRampToValueAtTime(700, t + 0.12);

            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }

    // Confirmation tick when copying phone
    playCopy() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.04);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    toggleMute() {
        if (!this.ctx) {
            this.init();
            return;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.isMuted = !this.isMuted;
        localStorage.setItem('aster_sound_muted', this.isMuted);
        
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        }
        this.updateUi();
        if (!this.isMuted) {
            this.playSelect();
        }
    }

    ensureContext() {
        if (!this.initialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx !== null;
    }

    updateUi() {
        const audioBtn = document.getElementById('audio-toggle');
        const audioStatus = document.getElementById('audio-status');

        if (audioBtn && audioStatus) {
            if (this.isMuted) {
                audioStatus.textContent = 'MUTE';
                audioBtn.classList.add('muted');
            } else {
                audioStatus.textContent = 'ACTIVO';
                audioBtn.classList.remove('muted');
            }
        }
    }
}

window.asterAudio = new AsterAudioSystem();

document.addEventListener('click', () => {
    if (!window.asterAudio.initialized) {
        window.asterAudio.init();
    }
}, { once: true });
