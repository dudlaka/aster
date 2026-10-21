/**
 * ASTER Soluciones Técnicas - Main Application & UI Controller
 * Manages modal dialogs, interactive calculators, technical dispatch forms,
 * spare parts catalog filters, keyboard shortcuts, and sound integration.
 */

class AsterUI {
    constructor() {
        this.activeModal = null;
        this.cart = [];
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupCalculators();
        this.setupShop();
        this.setupKeyboardShortcuts();
        this.setupCrtToggle();
        this.setupMobileMenu();
    }

    setupNavigation() {
        // Top panel nav buttons
        const navButtons = document.querySelectorAll('[data-target-modal]');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = btn.getAttribute('data-target-modal');
                this.openModal(modalId);
            });

            btn.addEventListener('mouseenter', () => {
                if (window.asterAudio) window.asterAudio.playHover();
            });
        });

        // Audio toggle button in header
        const audioBtn = document.getElementById('audio-toggle');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                if (window.asterAudio) {
                    window.asterAudio.toggleMute();
                }
            });
        }
    }

    setupModals() {
        // Close buttons inside modals
        const closeBtns = document.querySelectorAll('.modal-close, .btn-modal-cancel');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeActiveModal();
            });
            btn.addEventListener('mouseenter', () => {
                if (window.asterAudio) window.asterAudio.playHover();
            });
        });

        // Close on backdrop click
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

        // If another modal is open, close it first
        if (this.activeModal && this.activeModal !== modal) {
            this.activeModal.classList.remove('active');
        }

        this.activeModal = modal;
        modal.classList.add('active');

        if (window.asterAudio) {
            window.asterAudio.playOpen();
        }

        // Announce in HUD
        const hudStatus = document.getElementById('hud-system-status');
        if (hudStatus) {
            hudStatus.textContent = `TERMINAL // [${modalId.toUpperCase()}] ABIERTO`;
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

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Escape or (O) for closing active modal
            if (e.key === 'Escape' || e.key.toLowerCase() === 'o') {
                if (this.activeModal) {
                    this.closeActiveModal();
                }
            }

            // (M) for Audio Mute
            if (e.key.toLowerCase() === 'm') {
                if (window.asterAudio) {
                    window.asterAudio.toggleMute();
                }
            }

            // Quick numbers 1-4 for top menu
            if (!this.activeModal) {
                if (e.key === '1') this.openModal('averias');
                if (e.key === '2') this.openModal('contratos');
                if (e.key === '3') this.openModal('tienda');
                if (e.key === '4') this.openModal('contacto');
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

    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-btn');
        const navLinks = document.querySelector('.header-nav-buttons');
        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('mobile-open');
                if (window.asterAudio) window.asterAudio.playSelect();
            });
        }
    }

    setupCalculators() {
        // 1. REPARAR Form
        const repairForm = document.getElementById('form-repair-dispatch');
        const repairResult = document.getElementById('repair-dispatch-result');
        if (repairForm && repairResult) {
            repairForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const ticketNum = 'AST-' + Math.floor(100000 + Math.random() * 900000);
                const etaMinutes = Math.floor(35 + Math.random() * 40);

                repairResult.innerHTML = `
                    <div class="result-success-box">
                        <div class="result-icon">⚡</div>
                        <h4>AVISO TÉCNICO REGISTRADO CON ÉXITO</h4>
                        <p class="ticket-id">CÓDIGO DE INTERVENCIÓN: <strong>${ticketNum}</strong></p>
                        <p class="eta-notice">Unidad móvil de guardia ASTER asignada. Tiempo estimado de intervención: <strong>< ${etaMinutes} minutos</strong>.</p>
                        <div class="result-telemetry">
                            <span>PROTOCOLO: RSIF // URGENCIAS</span>
                            <span>CANAL DE SEGUIMIENTO: ENCRIPTADO 24H</span>
                        </div>
                    </div>
                `;
                repairResult.style.display = 'block';
                repairForm.style.display = 'none';

                if (window.asterAudio) window.asterAudio.playAlert();
            });
        }

        // 2. SUSTITUIR (F-Gas Calculator)
        const calcBtn = document.getElementById('btn-calc-retrofit');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => {
                const gasSelect = document.getElementById('calc-current-gas');
                const powerInput = document.getElementById('calc-system-power');
                const resultBox = document.getElementById('retrofit-calc-result');

                const gwpValues = {
                    'r404a': { name: 'R-404A', gwp: 3922, reco: 'CO2 Transcrítico R-744 (GWP 1) o R-454A (GWP 239)', tax: 78.4 },
                    'r507': { name: 'R-507A', gwp: 3985, reco: 'CO2 Transcrítico R-744 (GWP 1)', tax: 79.7 },
                    'r134a': { name: 'R-134a', gwp: 1430, reco: 'R-1234ze (GWP < 1) o R-513A (GWP 631)', tax: 28.6 },
                    'r22': { name: 'R-22 (Prohibido)', gwp: 1810, reco: 'Reemplazo integral por R-290 Propano / CO2', tax: 0 }
                };

                const selected = gwpValues[gasSelect.value] || gwpValues['r404a'];
                const kw = parseFloat(powerInput.value) || 45;
                const estimatedSavingsKwh = Math.round(kw * 380 * 0.28);
                const co2ReductionTons = ((selected.gwp * kw * 0.35) / 1000).toFixed(1);

                resultBox.innerHTML = `
                    <div class="retrofit-summary-card">
                        <div class="retrofit-badge">INFORME PRELIMINAR DE SOSTENIBILIDAD F-GAS</div>
                        <div class="retrofit-stats-grid">
                            <div class="stat-card">
                                <span class="label">RECOMENDACIÓN TÉCNICA</span>
                                <span class="val highlight">${selected.reco}</span>
                            </div>
                            <div class="stat-card">
                                <span class="label">REDUCCIÓN GWP</span>
                                <span class="val">${selected.gwp} ➔ < 150</span>
                            </div>
                            <div class="stat-card">
                                <span class="label">AHORRO ENERGÉTICO ANUAL</span>
                                <span class="val">+${estimatedSavingsKwh.toLocaleString()} kWh/año (~28%)</span>
                            </div>
                            <div class="stat-card">
                                <span class="label">EMISIONES CO2 EVITADAS</span>
                                <span class="val">${co2ReductionTons} Toneladas eq.</span>
                            </div>
                        </div>
                        <p class="retrofit-cta">ASTER tramita íntegramente las subvenciones de eficiencia energética (Fondos FEDER / CAEs).</p>
                    </div>
                `;
                resultBox.style.display = 'block';
                if (window.asterAudio) window.asterAudio.playSelect();
            });
        }
    }

    setupShop() {
        // Spare parts catalog data
        this.products = [
            {
                id: 'bitzer-4ces',
                name: 'Compresor Semihermético Bitzer Ecoline 4CES-9Y',
                ref: 'REF: BTZ-4CES-9Y',
                cat: 'compresores',
                price: '2.840 €',
                desc: 'Compresor de pistón para refrigeración comercial e industrial. Apto para R-449A, R-448A y R-134a. Desplazamiento 32,5 m³/h.',
                stock: 'DISPONIBLE EN STOCK'
            },
            {
                id: 'bitzer-co2',
                name: 'Compresor Transcrítico Bitzer 2MTE-5K CO2',
                ref: 'REF: BTZ-2MTE-5K',
                cat: 'compresores',
                price: '4.650 €',
                desc: 'Compresor de alta presión (hasta 140 bar) para centrales de CO2 transcrítico ecológicas. Máxima fiabilidad en congelados.',
                stock: 'DISPONIBLE EN STOCK'
            },
            {
                id: 'danfoss-akv',
                name: 'Válvula de Expansión Electrónica Danfoss AKV-15',
                ref: 'REF: DNF-AKV15-4',
                cat: 'valvulas',
                price: '385 €',
                desc: 'Válvula modulante de pulso ancho (PWM) para control ultra-preciso del recalentamiento en cámaras frigoríficas.',
                stock: 'DISPONIBLE EN STOCK'
            },
            {
                id: 'carel-pco',
                name: 'Centralita Programable Carel c.pCO5+',
                ref: 'REF: CRL-CPCO5P',
                cat: 'controles',
                price: '920 €',
                desc: 'Controlador industrial para centrales frigoríficas multicomprensor y evaporadores remotos con soporte Modbus y BACnet.',
                stock: 'DISPONIBLE EN STOCK'
            },
            {
                id: 'gas-r449a',
                name: 'Botella Gas Refrigerante R-449A (11 Kg)',
                ref: 'REF: GAS-R449-11',
                cat: 'gases',
                price: '315 €',
                desc: 'Sustituto directo ecológico de R-404A con reducción del 65% de GWP. Botella retornable con precinto de garantía.',
                stock: 'DISPONIBLE EN STOCK'
            },
            {
                id: 'aceite-poe',
                name: 'Aceite Sintético Polioléster Fuchs Reniso Triton 68',
                ref: 'REF: LUB-POE-68L5',
                cat: 'gases',
                price: '118 €',
                desc: 'Garrafa 5 Litros de lubricante POE especial para compresores frigoríficos con gases HFC / HFO.',
                stock: 'DISPONIBLE EN STOCK'
            }
        ];

        this.renderShop(this.products);

        // Filter buttons
        const filterBtns = document.querySelectorAll('.shop-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                if (filter === 'all') {
                    this.renderShop(this.products);
                } else {
                    const filtered = this.products.filter(p => p.cat === filter);
                    this.renderShop(filtered);
                }

                if (window.asterAudio) window.asterAudio.playHover();
            });
        });

        // Search input
        const searchInput = document.getElementById('shop-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const filtered = this.products.filter(p => 
                    p.name.toLowerCase().includes(term) ||
                    p.ref.toLowerCase().includes(term) ||
                    p.desc.toLowerCase().includes(term)
                );
                this.renderShop(filtered);
            });
        }
    }

    renderShop(items) {
        const grid = document.getElementById('shop-product-grid');
        if (!grid) return;

        if (items.length === 0) {
            grid.innerHTML = '<div class="shop-empty">No se encontraron componentes para el criterio especificado.</div>';
            return;
        }

        grid.innerHTML = items.map(item => `
            <div class="product-card">
                <div class="product-badge">${item.stock}</div>
                <div class="product-ref">${item.ref}</div>
                <h4 class="product-title">${item.name}</h4>
                <p class="product-desc">${item.desc}</p>
                <div class="product-footer">
                    <div class="product-price">${item.price}</div>
                    <button class="btn-quote-req" onclick="window.asterUI.requestProductQuote('${item.id}', '${item.name}')">
                        SOLICITAR COTIZACIÓN
                    </button>
                </div>
            </div>
        `).join('');
    }

    requestProductQuote(id, name) {
        if (window.asterAudio) window.asterAudio.playSelect();
        alert(`Solicitud de cotización y ficha técnica añadida para:\n\n${name}\n\nUn ingeniero de soporte técnico de ASTER se pondrá en contacto para tramitar la disponibilidad y transporte.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.asterUI = new AsterUI();
});
