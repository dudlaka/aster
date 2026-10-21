/**
 * ASTER Soluciones Técnicas - Audio Engine
 * Procedural Web Audio API sound synthesizer
 * Inspired by PS2 BIOS soundscape and industrial cryogenic systems
 */

class AsterAudioSystem {
    constructor() {
        this.ctx = null;
        this.isEnabled = false;
        this.isMuted = false;
        this.ambientGain = null;
        this.masterGain = null;
        this.ambientNodes = [];
        this.initialized = false;
        
        // Check saved preference
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
            
            // Master gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            
            // Ambient gain
            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            this.ambientGain.connect(this.masterGain);

            this.startAmbientSoundscape();
            this.initialized = true;
            this.isEnabled = true;
            this.updateUi();
        } catch (e) {
            console.warn("Web Audio API not supported or blocked:", e);
        }
    }

    startAmbientSoundscape() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Sub-bass resonant drone (PS2 boot inspired + deep cooling compressor hum)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, now); // A1 note

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(110, now); // A2 note

        // LFO for gentle pulsation
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.15, now); // slow 0.15 Hz breathing cycle
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(8, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc2.frequency);

        // Lowpass filter for smooth deep resonance
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, now);
        filter.Q.setValueAtTime(3, now);

        // Cryogenic cold wind noise layer
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(650, now);
        noiseFilter.Q.setValueAtTime(4.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.04, now);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ambientGain);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.ambientGain);

        osc1.start();
        osc2.start();
        lfo.start();
        whiteNoise.start();

        this.ambientNodes.push(osc1, osc2, lfo, whiteNoise);
    }

    // High-tech crisp crystalline hover
    playHover() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    // PS2-inspired confirmation tone
    playSelect() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        // Two harmonizing warm resonant chimes
        const notes = [440, 659.25, 880]; // A4, E5, A5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.03);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, now);
            filter.Q.setValueAtTime(2, now);

            gain.gain.setValueAtTime(0.12 / (idx + 1), now + idx * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.6 + idx * 0.1);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.03);
            osc.stop(now + 0.8);
        });
    }

    // PS2 cancel / back tone
    playBack() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const notes = [659.25, 440];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.1, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + idx * 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + idx * 0.05);
            osc.stop(now + 0.5);
        });
    }

    // Technical pneumatic whoosh (valve release / modal open)
    playOpen() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.28);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        filter.Q.setValueAtTime(4, now);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.32);
    }

    // Critical alarm tone
    playAlert() {
        if (!this.ensureContext() || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1760, now + 0.08);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.23);
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
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
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
        const eqBars = document.querySelectorAll('.eq-bar');

        if (audioBtn && audioStatus) {
            if (this.isMuted) {
                audioStatus.textContent = 'MUTE';
                audioBtn.classList.add('muted');
                eqBars.forEach(b => b.style.animationPlayState = 'paused');
            } else {
                audioStatus.textContent = 'ACTIVO';
                audioBtn.classList.remove('muted');
                eqBars.forEach(b => b.style.animationPlayState = 'running');
            }
        }
    }
}

// Global instance
window.asterAudio = new AsterAudioSystem();

// Auto unlock on first user gesture
document.addEventListener('click', () => {
    if (!window.asterAudio.initialized) {
        window.asterAudio.init();
    }
}, { once: true });
