/**
 * ASTER Soluciones Técnicas - Main Application Controller
 * Handles modal workflows, Inverter efficiency calculator,
 * Contact card 3D floating show, button push-back & glow animations,
 * and ATRÁS restoration logic.
 */

class AsterUI {
    constructor() {
        this.activeModal = null;
        this.contactPanel = document.getElementById('contact-interactive-panel');
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupEfficiencyCalculator();
        this.setupContactHandlers();
        this.setupKeyboardShortcuts();
        this.setupCrtToggle();
        this.setupMobileControls();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('[data-target-modal]');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = btn.getAttribute('data-target-modal');
                if (modalId === 'contacto') {
                    // Trigger 3D shatter explosion to form CONTACTO word
                    if (window.asterScene) {
                        window.asterScene.triggerContactShatter();
                    }
                } else {
                    this.openModal(modalId);
                }
            });

            btn.addEventListener('mouseenter', () => {
                if (window.asterAudio) window.asterAudio.playHover();
            });
        });

        const audioBtn = document.getElementById('audio-toggle');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                if (window.asterAudio) window.asterAudio.toggleMute();
            });
        }
    }

    setupModals() {
        const closeBtns = document.querySelectorAll('.modal-close, .btn-modal-cancel');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeActiveModal();
            });
            btn.addEventListener('mouseenter', () => {
                if (window.asterAudio) window.asterAudio.playHover();
            });
        });

        const modals = document.querySelectorAll('.aster-modal-overlay');
        modals.forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeActiveModal();
                }
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(`modal-${modalId}`);
        if (!modal) return;

        if (this.activeModal && this.activeModal !== modal) {
            this.activeModal.classList.remove('active');
        }

        this.activeModal = modal;
        modal.classList.add('active');

        if (window.asterAudio) {
            window.asterAudio.playOpen();
        }

        const hudStatus = document.getElementById('hud-system-status');
        if (hudStatus) {
            hudStatus.textContent = `TERMINAL // [${modalId.toUpperCase()}]`;
        }
    }

    closeActiveModal() {
        if (!this.activeModal) return;

        this.activeModal.classList.remove('active');
        this.activeModal = null;

        if (window.asterAudio) {
            window.asterAudio.playBack();
        }

        const hudStatus = document.getElementById('hud-system-status');
        if (hudStatus) {
            hudStatus.textContent = 'SISTEMA OPERATIVO // STANDBY';
        }
    }

    // =========================================================================
    // CONTACT CARD & 3D BUTTON PUSH-BACK + GLOW ANIMATIONS
    // =========================================================================
    showContactCard() {
        if (!this.contactPanel) return;
        this.contactPanel.classList.remove('closing');
        this.contactPanel.classList.add('active');
        if (window.asterAudio) window.asterAudio.playOpen();
    }

    hideContactCard() {
        if (!this.contactPanel) return;
        this.contactPanel.classList.add('closing');
        this.contactPanel.classList.remove('active');
    }

    triggerButton3DPush(btn) {
        if (!btn) return;
        btn.classList.add('btn-pressed-3d');
        if (window.asterAudio) window.asterAudio.playSelect();

        setTimeout(() => {
            btn.classList.remove('btn-pressed-3d');
        }, 240);
    }

    setupContactHandlers() {
        // Helper to bind events reliably across pointer and click
        const bindButton = (btn, callback) => {
            if (!btn) return;
            let triggered = false;

            const trigger = (e) => {
                if (e) {
                    e.stopPropagation();
                }
                if (triggered) return;
                triggered = true;
                setTimeout(() => { triggered = false; }, 320);

                this.triggerButton3DPush(btn);
                callback(e);
            };

            // pointerdown triggers IMMEDIATELY on touch or mouse press, 
            // completely immune to movement/rising/lowering target cancellation!
            btn.addEventListener('pointerdown', trigger);
            btn.addEventListener('click', trigger);
        };

        // 1. Copy phone button
        const copyBtn = document.getElementById('btn-copy-phone');
        bindButton(copyBtn, (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const phone = "675387575";
            navigator.clipboard.writeText(phone).then(() => {
                const originalHtml = copyBtn.innerHTML;
                const copiedText = window.asterI18n ? window.asterI18n.t('contact_copied') : '¡NÚMERO COPIADO!';
                copyBtn.innerHTML = `<span>✓</span> ${copiedText}`;
                copyBtn.classList.add('copied');

                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                    copyBtn.classList.remove('copied');
                }, 2500);
            }).catch(err => {
                console.error('Copy failed:', err);
            });
        });

        // 2. WhatsApp direct button
        const waBtn = document.getElementById('btn-whatsapp-direct');
        if (waBtn) {
            bindButton(waBtn, (e) => {
                // If triggered by pointerdown, let navigation proceed
                const href = waBtn.getAttribute('href');
                if (href && (!e || e.type === 'click')) {
                    window.open(href, '_blank', 'noopener,noreferrer');
                }
            });
        }

        // 3. ATRÁS button (Replaces Rebuild Cube)
        const backBtn = document.getElementById('btn-back-contact');
        bindButton(backBtn, (e) => {
            if (e && e.preventDefault) e.preventDefault();
            setTimeout(() => {
                if (window.asterScene) {
                    window.asterScene.rebuildCube();
                }
            }, 140);
        });
    }

    setupEfficiencyCalculator() {
        const calcBtn = document.getElementById('btn-calc-inverter');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => {
                const powerInput = document.getElementById('calc-inv-power');
                const hoursInput = document.getElementById('calc-inv-hours');
                const costInput = document.getElementById('calc-inv-kwh-price');
                const resultBox = document.getElementById('efficiency-calc-result');

                const kw = parseFloat(powerInput.value) || 30;
                const hours = parseFloat(hoursInput.value) || 16;
                const priceKwh = parseFloat(costInput.value) || 0.18;

                const annualKwhStandard = kw * hours * 365 * 0.72;
                const annualSavingsKwh = Math.round(annualKwhStandard * 0.32);
                const annualMoneySaved = Math.round(annualSavingsKwh * priceKwh);
                const co2AvoidedTons = ((annualSavingsKwh * 0.25) / 1000).toFixed(1);
                const roiMonths = Math.max(8, Math.round((kw * 180) / (annualMoneySaved / 12)));

                const lang = window.asterI18n ? window.asterI18n.currentLang : 'es';

                resultBox.innerHTML = `
                    <div class="retrofit-summary-card">
                        <div class="retrofit-badge">${lang === 'es' ? 'AUDITORÍA DE RETROFIT INVERTER & VÁLVULAS ELECTRÓNICAS' : 'INVERTER RETROFIT & ELECTRONIC VALVES AUDIT'}</div>
                        <div class="retrofit-stats-grid">
                            <div class="stat-card">
                                <span class="label">${lang === 'es' ? 'AHORRO ENERGÉTICO ANUAL' : 'ANNUAL ENERGY SAVING'}</span>
                                <span class="val highlight">${annualSavingsKwh.toLocaleString()} kWh/año (~32%)</span>
                            </div>
                            <div class="stat-card">
                                <span class="label">${lang === 'es' ? 'AHORRO ECONÓMICO ESTIMADO' : 'ESTIMATED FINANCIAL SAVINGS'}</span>
                                <span class="val highlight">+${annualMoneySaved.toLocaleString()} € / año</span>
                            </div>
                            <div class="stat-card">
                                <span class="label">${lang === 'es' ? 'RETORNO DE INVERSIÓN (ROI)' : 'RETURN ON INVESTMENT (ROI)'}</span>
                                <span class="val">~${roiMonths} ${lang === 'es' ? 'meses' : 'months'}</span>
                            </div>
                            <div class="stat-card">
                                <span class="label">${lang === 'es' ? 'CO2 EVITADO A LA ATMÓSFERA' : 'CO2 AVOIDED'}</span>
                                <span class="val">${co2AvoidedTons} ${lang === 'es' ? 'Toneladas/año' : 'Tons/year'}</span>
                            </div>
                        </div>
                        <div style="margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn-action-primary" onclick="alert('Solicitud de estudio técnico enviada para instalación de ${kw}kW. Contactaremos al 675 38 75 75.')">
                                ${lang === 'es' ? 'SOLICITAR ESTUDIO DE INSTALACIÓN INVERTER' : 'REQUEST INVERTER RETROFIT STUDY'}
                            </button>
                        </div>
                    </div>
                `;
                resultBox.style.display = 'block';
                if (window.asterAudio) window.asterAudio.playSelect();
            });
        }
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key.toLowerCase() === 'o') {
                if (this.activeModal) {
                    this.closeActiveModal();
                } else if (window.asterScene && window.asterScene.isShattered) {
                    window.asterScene.rebuildCube();
                }
            }

            if (e.key.toLowerCase() === 'm') {
                if (window.asterAudio) window.asterAudio.toggleMute();
            }

            if (!this.activeModal && (!window.asterScene || !window.asterScene.isShattered)) {
                if (e.key === '1') this.openModal('averias');
                if (e.key === '2') this.openModal('contratos');
                if (e.key === '3') this.openModal('eficiencia');
                if (e.key === '4') {
                    if (window.asterScene) window.asterScene.triggerContactShatter();
                }
            }
        });
    }

    setupCrtToggle() {
        const crtBtn = document.getElementById('crt-toggle');
        const crtOverlay = document.getElementById('crt-screen-overlay');
        const crtStatus = document.getElementById('crt-status');

        if (crtBtn && crtOverlay) {
            crtBtn.addEventListener('click', () => {
                const isActive = crtOverlay.classList.toggle('active');
                if (crtStatus) {
                    crtStatus.textContent = isActive ? 'ACTIVO' : 'OFF';
                }
                if (window.asterAudio) window.asterAudio.playSelect();
            });
        }
    }

    setupMobileControls() {
        const mobileToggle = document.getElementById('mobile-menu-btn');
        const navLinks = document.querySelector('.header-nav-buttons');
        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('mobile-open');
                if (window.asterAudio) window.asterAudio.playSelect();
            });
        }

        const hudToggleBtn = document.getElementById('mobile-hud-toggle');
        const hudPanels = document.querySelectorAll('.hud-corner-panel');
        if (hudToggleBtn) {
            hudToggleBtn.addEventListener('click', () => {
                hudPanels.forEach(p => p.classList.toggle('mobile-hud-visible'));
                if (window.asterAudio) window.asterAudio.playSelect();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.asterUI = new AsterUI();
});
