/**
 * ASTER Soluciones Técnicas - Real-Time Telemetry & HUD Engine
 * Simulates high-precision industrial refrigeration cycle sensors,
 * dynamic oscillograms, frequency spectrums, and live system clocks.
 */

class AsterTelemetry {
    constructor() {
        this.clockEl = document.getElementById('hud-time');
        this.dateEl = document.getElementById('hud-date');
        this.oscCanvas = document.getElementById('osc-canvas');
        this.oscCtx = this.oscCanvas ? this.oscCanvas.getContext('2d') : null;
        
        this.oscPhase = 0;
        this.baseFreq = 0.08;
        
        // Sensor values
        this.sensors = {
            evapTemp: -28.4,
            condTemp: 32.1,
            cryoPress: 24.8,
            suctionPress: 3.42,
            superheat: 7.2,
            subcooling: 4.8,
            voltage: 230.4,
            frequency: 50.02,
            copRatio: 3.48,
            refrigFlow: 142.6
        };

        this.init();
    }

    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.jitterSensors(), 2000);

        if (this.oscCanvas) {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            this.animateOscilloscope();
        }

        this.animateSpectrumBars();
    }

    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        if (this.clockEl) {
            this.clockEl.textContent = `${hours}:${minutes}:${seconds}`;
        }

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        if (this.dateEl) {
            this.dateEl.textContent = `${year}.${month}.${day}`;
        }

        // Also update sub-header HUD times
        const miniClocks = document.querySelectorAll('.sub-clock');
        miniClocks.forEach(c => c.textContent = `${hours}:${minutes}`);
    }

    jitterSensors() {
        // Natural physical variance in cooling loop
        this.sensors.evapTemp = -28.4 + (Math.random() * 0.4 - 0.2);
        this.sensors.condTemp = 32.1 + (Math.random() * 0.3 - 0.15);
        this.sensors.cryoPress = 24.8 + (Math.random() * 0.5 - 0.25);
        this.sensors.suctionPress = 3.42 + (Math.random() * 0.12 - 0.06);
        this.sensors.superheat = 7.2 + (Math.random() * 0.2 - 0.1);
        this.sensors.voltage = 230.0 + (Math.random() * 1.6 - 0.8);
        this.sensors.frequency = 50.0 + (Math.random() * 0.08 - 0.04);
        this.sensors.refrigFlow = 142.6 + (Math.random() * 2.4 - 1.2);

        // Update DOM elements if present
        const elEvap = document.getElementById('tel-evap-temp');
        if (elEvap) elEvap.textContent = `${this.sensors.evapTemp.toFixed(1)}°C`;

        const elCond = document.getElementById('tel-cond-temp');
        if (elCond) elCond.textContent = `+${this.sensors.condTemp.toFixed(1)}°C`;

        const elPress = document.getElementById('tel-cryo-press');
        if (elPress) elPress.textContent = `${this.sensors.cryoPress.toFixed(1)} BAR`;

        const elSuct = document.getElementById('tel-suction-press');
        if (elSuct) elSuct.textContent = `${this.sensors.suctionPress.toFixed(2)} BAR`;

        const elSh = document.getElementById('tel-superheat');
        if (elSh) elSh.textContent = `${this.sensors.superheat.toFixed(1)} K`;

        const elVolt = document.getElementById('tel-voltage');
        if (elVolt) elVolt.textContent = `${Math.round(this.sensors.voltage)}V`;

        const elFreq = document.getElementById('tel-frequency');
        if (elFreq) elFreq.textContent = `${this.sensors.frequency.toFixed(1)}Hz`;

        // Update hex codes randomly
        const hexEl = document.getElementById('tel-hexcode');
        if (hexEl && Math.random() > 0.6) {
            const hex = '0x' + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
            hexEl.textContent = hex;
        }
    }

    resizeCanvas() {
        if (!this.oscCanvas) return;
        const rect = this.oscCanvas.parentElement.getBoundingClientRect();
        this.oscCanvas.width = rect.width || 240;
        this.oscCanvas.height = 70;
    }

    animateOscilloscope() {
        if (!this.oscCtx || !this.oscCanvas) return;
        
        const ctx = this.oscCtx;
        const w = this.oscCanvas.width;
        const h = this.oscCanvas.height;

        ctx.fillStyle = 'rgba(5, 11, 20, 0.25)';
        ctx.fillRect(0, 0, w, h);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < w; x += 24) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for (let y = 0; y < h; y += 18) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();

        // Draw wave (compressor cycle oscillation)
        ctx.strokeStyle = '#00D2FF';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#00D2FF';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        this.oscPhase += 0.06;
        const centerY = h * 0.52;
        const amplitude = h * 0.28;

        for (let x = 0; x < w; x++) {
            // Complex thermodynamic wave: fundamental + 2nd harmonic + cryogenic flutter
            const normalX = x / w;
            const y = centerY +
                Math.sin(normalX * 18 - this.oscPhase) * amplitude * 0.65 +
                Math.sin(normalX * 36 - this.oscPhase * 1.5) * (amplitude * 0.25) +
                (Math.random() * 2 - 1) * 0.8;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        requestAnimationFrame(() => this.animateOscilloscope());
    }

    animateSpectrumBars() {
        const bars = document.querySelectorAll('.hud-bar-fill');
        if (bars.length === 0) return;

        setInterval(() => {
            bars.forEach(bar => {
                const target = 25 + Math.random() * 70;
                bar.style.height = `${target}%`;
            });
        }, 180);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.asterTelemetry = new AsterTelemetry();
});
