/**
 * ASTER Soluciones Técnicas - Real-Time HVAC-R Telemetry Engine
 * Realistic refrigeration engineering instruments:
 * 1. Top-Left: Mollier p-h Diagram with animated circulating refrigerant cycle
 * 2. Bottom-Left: Electronic Expansion Valve (EEV) with % opening, evaporating temp & SH
 * 3. Top-Right: Digital Manifold (Dual High & Low Gauges with Evap, Cond, SH, SC)
 * 4. Bottom-Right: Frequency Inverter Drive with Hz, Amps, Volts & RPM
 */

class AsterRefrigerationTelemetry {
    constructor() {
        this.clockEl = document.getElementById('hud-time');
        this.dateEl = document.getElementById('hud-date');

        // Mollier Canvas
        this.mollierCanvas = document.getElementById('mollier-canvas');
        this.mollierCtx = this.mollierCanvas ? this.mollierCanvas.getContext('2d') : null;
        this.mollierParticles = [];
        this.initMollierParticles();

        // Thermodynamic state variables (R-449A Cycle)
        this.data = {
            lowPressure: 3.25,     // bar
            highPressure: 16.80,   // bar
            evapTemp: -28.2,       // °C
            condTemp: 38.5,        // °C
            suctionLineTemp: -21.4,// °C
            liquidLineTemp: 33.8,  // °C
            superheat: 6.8,        // K (suctionLineTemp - evapTemp)
            subcooling: 4.7,       // K (condTemp - liquidLineTemp)
            valveOpening: 44.5,    // %
            valveSteps: 223,       // Steps (out of 500)
            inverterHz: 48.5,      // Hz
            inverterAmps: 14.2,    // A
            inverterVolts: 398,    // V
            inverterPower: 8.4,    // kW
            compressorRpm: 1455    // RPM
        };

        this.init();
    }

    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.jitterRefrigerationMetrics(), 1800);

        if (this.mollierCanvas) {
            this.resizeMollierCanvas();
            window.addEventListener('resize', () => this.resizeMollierCanvas());
            this.animateMollier();
        }
    }

    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        if (this.clockEl) this.clockEl.textContent = `${hours}:${minutes}:${seconds}`;

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        if (this.dateEl) this.dateEl.textContent = `${year}.${month}.${day}`;
    }

    jitterRefrigerationMetrics() {
        // Natural physical variance in cooling loop
        const pJitter = (Math.random() - 0.5) * 0.08;
        this.data.lowPressure = Math.max(2.8, Math.min(3.8, 3.25 + pJitter));
        this.data.highPressure = Math.max(15.5, Math.min(18.2, 16.80 + (Math.random() - 0.5) * 0.25));

        this.data.evapTemp = -28.2 + (Math.random() - 0.5) * 0.3;
        this.data.condTemp = 38.5 + (Math.random() - 0.5) * 0.4;
        this.data.suctionLineTemp = -21.4 + (Math.random() - 0.5) * 0.2;
        this.data.liquidLineTemp = 33.8 + (Math.random() - 0.5) * 0.3;

        this.data.superheat = +(this.data.suctionLineTemp - this.data.evapTemp).toFixed(1);
        this.data.subcooling = +(this.data.condTemp - this.data.liquidLineTemp).toFixed(1);

        // Electronic Expansion Valve PID response
        this.data.valveOpening = Math.max(30, Math.min(65, 44.5 + (Math.random() - 0.5) * 1.8));
        this.data.valveSteps = Math.round((this.data.valveOpening / 100) * 500);

        // Inverter modulation
        this.data.inverterHz = Math.max(30.0, Math.min(60.0, 48.5 + (Math.random() - 0.5) * 0.8));
        this.data.inverterAmps = (14.2 * (this.data.inverterHz / 50)).toFixed(1);
        this.data.inverterVolts = Math.round(398 + (Math.random() - 0.5) * 4);
        this.data.inverterPower = (8.4 * (this.data.inverterHz / 50)).toFixed(1);
        this.data.compressorRpm = Math.round(this.data.inverterHz * 30);

        this.updateDomElements();
    }

    updateDomElements() {
        // Top-Left (Mollier readouts)
        const elEvapP = document.getElementById('mollier-pevap');
        if (elEvapP) elEvapP.textContent = `${this.data.lowPressure.toFixed(2)} bar`;

        const elCondP = document.getElementById('mollier-pcond');
        if (elCondP) elCondP.textContent = `${this.data.highPressure.toFixed(1)} bar`;

        // Bottom-Left (Electronic Expansion Valve)
        const elEevOpen = document.getElementById('eev-opening-val');
        if (elEevOpen) elEevOpen.textContent = `${this.data.valveOpening.toFixed(1)}%`;

        const elEevSteps = document.getElementById('eev-steps-val');
        if (elEevSteps) elEevSteps.textContent = `${this.data.valveSteps} / 500`;

        const elEevEvap = document.getElementById('eev-evap-temp');
        if (elEevEvap) elEevEvap.textContent = `${this.data.evapTemp.toFixed(1)}°C`;

        const elEevSh = document.getElementById('eev-superheat');
        if (elEevSh) elEevSh.textContent = `${this.data.superheat.toFixed(1)} K`;

        const elEevBar = document.getElementById('eev-valve-bar');
        if (elEevBar) elEevBar.style.width = `${this.data.valveOpening}%`;

        // Top-Right (Digital Manifold)
        const elManiLowP = document.getElementById('mani-low-press');
        if (elManiLowP) elManiLowP.textContent = `${this.data.lowPressure.toFixed(2)} bar`;

        const elManiLowEvap = document.getElementById('mani-low-evap');
        if (elManiLowEvap) elManiLowEvap.textContent = `${this.data.evapTemp.toFixed(1)}°C`;

        const elManiLowSh = document.getElementById('mani-low-sh');
        if (elManiLowSh) elManiLowSh.textContent = `+${this.data.superheat.toFixed(1)} K`;

        const elManiHighP = document.getElementById('mani-high-press');
        if (elManiHighP) elManiHighP.textContent = `${this.data.highPressure.toFixed(2)} bar`;

        const elManiHighCond = document.getElementById('mani-high-cond');
        if (elManiHighCond) elManiHighCond.textContent = `+${this.data.condTemp.toFixed(1)}°C`;

        const elManiHighSc = document.getElementById('mani-high-sc');
        if (elManiHighSc) elManiHighSc.textContent = `+${this.data.subcooling.toFixed(1)} K`;

        // Bottom-Right (Frequency Inverter Drive)
        const elInvHz = document.getElementById('inv-hz-val');
        if (elInvHz) elInvHz.textContent = `${this.data.inverterHz.toFixed(1)} Hz`;

        const elInvAmps = document.getElementById('inv-amps-val');
        if (elInvAmps) elInvAmps.textContent = `${this.data.inverterAmps} A`;

        const elInvVolts = document.getElementById('inv-volts-val');
        if (elInvVolts) elInvVolts.textContent = `${this.data.inverterVolts} V`;

        const elInvKw = document.getElementById('inv-power-val');
        if (elInvKw) elInvKw.textContent = `${this.data.inverterPower} kW`;

        const elInvRpm = document.getElementById('inv-rpm-val');
        if (elInvRpm) elInvRpm.textContent = `${this.data.compressorRpm} RPM`;

        const elInvBar = document.getElementById('inv-load-bar');
        if (elInvBar) elInvBar.style.width = `${((this.data.inverterHz / 60) * 100).toFixed(0)}%`;
    }

    // =========================================================================
    // MOLLIER (p-h) DIAGRAM ENGINE WITH SIMULATED REFRIGERANT FLOW
    // =========================================================================
    initMollierParticles() {
        this.mollierParticles = [];
        for (let i = 0; i < 16; i++) {
            this.mollierParticles.push({
                t: i / 16 // Progress along 4-step closed thermodynamic loop
            });
        }
    }

    resizeMollierCanvas() {
        if (!this.mollierCanvas) return;
        const rect = this.mollierCanvas.parentElement.getBoundingClientRect();
        this.mollierCanvas.width = rect.width || 240;
        this.mollierCanvas.height = 105;
    }

    animateMollier() {
        if (!this.mollierCtx || !this.mollierCanvas) return;
        const ctx = this.mollierCtx;
        const w = this.mollierCanvas.width;
        const h = this.mollierCanvas.height;

        ctx.fillStyle = 'rgba(5, 12, 22, 0.45)';
        ctx.fillRect(0, 0, w, h);

        // Subtle p-h grid lines
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 14; y < h; y += 18) {
            ctx.moveTo(20, y);
            ctx.lineTo(w - 10, y);
        }
        for (let x = 30; x < w; x += 32) {
            ctx.moveTo(x, 10);
            ctx.lineTo(x, h - 16);
        }
        ctx.stroke();

        // 1. Saturation Dome (Campana de Mollier R-449A)
        ctx.strokeStyle = 'rgba(160, 220, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Liquid line + Critical point + Vapor line
        const domeLeftX = 40;
        const critX = w * 0.48;
        const critY = 22;
        const domeRightX = w - 18;
        const baseDomeY = h - 18;

        ctx.moveTo(domeLeftX, baseDomeY);
        // Liquid curve
        ctx.bezierCurveTo(domeLeftX + 15, baseDomeY - 30, critX - 25, critY + 12, critX, critY);
        // Vapor curve
        ctx.bezierCurveTo(critX + 25, critY + 12, domeRightX - 10, baseDomeY - 35, domeRightX, baseDomeY);
        ctx.stroke();

        // 2. Closed Thermodynamic Cycle (1 -> 2 -> 3 -> 4 -> 1)
        // Point 1: Compressor Suction (Vapor sobrecalentado)
        const p1 = { x: w * 0.78, y: h * 0.72 };
        // Point 2: Compressor Discharge (Descarga caliente)
        const p2 = { x: w * 0.90, y: h * 0.32 };
        // Point 3: Condenser Outlet (Líquido subenfriado)
        const p3 = { x: w * 0.36, y: h * 0.32 };
        // Point 4: Expansion Valve Outlet (Expansión isentálpica vertical)
        const p4 = { x: w * 0.36, y: h * 0.72 };

        const cyclePoints = [p1, p2, p3, p4];

        // Draw cycle lines
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y); // Compresión isentrópica
        ctx.lineTo(p3.x, p3.y); // Condensación a P constante
        ctx.lineTo(p4.x, p4.y); // Expansión isentálpica (h constante)
        ctx.closePath();        // Evaporación a P constante
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw node points
        ctx.fillStyle = '#ffffff';
        cyclePoints.forEach((pt, idx) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // 3. Animated Circulating Refrigerant Flow (Flowing droplets)
        const flowSpeed = 0.0035;
        this.mollierParticles.forEach(pt => {
            pt.t = (pt.t + flowSpeed) % 1.0;

            // Interpolate position along 4 segments
            const seg = pt.t * 4;
            const segIdx = Math.floor(seg);
            const segFrac = seg - segIdx;

            const startNode = cyclePoints[segIdx];
            const endNode = cyclePoints[(segIdx + 1) % 4];

            const curX = startNode.x + (endNode.x - startNode.x) * segFrac;
            const curY = startNode.y + (endNode.y - startNode.y) * segFrac;

            // Refrigerant pulse dot
            ctx.fillStyle = segIdx === 0 ? '#ff4d6d' : (segIdx === 1 ? '#00e1ff' : '#00ffcc');
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Stage labels on canvas
        ctx.font = '600 8px "Share Tech Mono", monospace';
        ctx.fillStyle = 'rgba(160, 210, 240, 0.8)';
        ctx.fillText('EVAP', p4.x + 18, p4.y + 11);
        ctx.fillText('COND', p3.x + 18, p3.y - 5);
        ctx.fillText('EEV', p4.x - 16, (p3.y + p4.y) / 2);
        ctx.fillText('COMP', p2.x - 2, (p1.y + p2.y) / 2);

        requestAnimationFrame(() => this.animateMollier());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.asterRefrigTelemetry = new AsterRefrigerationTelemetry();
});
