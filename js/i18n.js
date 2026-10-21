/**
 * ASTER Soluciones Técnicas - Bilingual Engine (ES / EN)
 * Complete multi-language support for HVAC-R refrigeration modules,
 * Mollier diagram, digital gauges, and interactive modals.
 */

const ASTER_TRANSLATIONS = {
    es: {
        tagline: "Soluciones Técnicas · Frío Industrial",
        nav_averias: "[01] AVERÍAS",
        nav_contratos: "[02] CONTRATOS",
        nav_eficiencia: "[03] EFICIENCIA",
        nav_contacto: "[04] CONTACTO",
        audio_active: "ACTIVO",
        audio_mute: "MUTE",
        crt_label: "CRT:",
        
        // HVAC-R HUD Labels
        hud_mollier_title: "DIAGRAMA DE MOLLIER // p-h",
        hud_eev_title: "VÁLVULA EXPANSIÓN // EEV",
        hud_manifold_title: "MANÓMETROS DIGITALES",
        hud_inverter_title: "VARIADOR DE FRECUENCIA",
        hud_cooling_active: "COOLING SYSTEM: ACTIVE",
        hud_standby: "SELECCIÓN: STANDBY",
        hud_target_prefix: "OBJETIVO:",
        hud_toggle_btn: "HUD",
        
        // Cube faces
        face_reparar: "REPARAR",
        face_reparar_sub: "ASISTENCIA TÉCNICA 24H",
        face_mantenimiento: "MANTENIMIENTO",
        face_mantenimiento_sub: "PLANES PREVENTIVOS ASTER",
        face_contacto: "CONTACTO",
        face_contacto_sub: "TEL: 675 38 75 75 · WHATSAPP",
        face_sustituir: "SUSTITUIR",
        face_sustituir_sub: "RENOVE F-GAS & ECOLÓGICO",
        face_eficiencia: "EFICIENCIA",
        face_eficiencia_sub: "VÁLVULAS & INVERTER DRIVE",

        // Modals
        modal_reparar_title: "SERVICIO DE REPARACIÓN DE URGENCIA 24/7",
        modal_reparar_intro: "Despliegue inmediato de unidades móviles de guardia técnica de ASTER. Diagnóstico termodinámico in situ, reparación de fugas, central de compresores y cámaras frigoríficas.",
        modal_reparar_btn: "SOLICITAR DESPACHO TÉCNICO INMEDIATO",

        modal_sustituir_title: "PLAN RENOVE F-GAS & SUSTITUCIÓN ECOLÓGICA",
        modal_sustituir_intro: "Auditoría de reconversión hacia tecnologías de bajo GWP: CO2 Transcrítico (R-744), Propano (R-290) y fluidos A2L según directiva europea F-Gas.",

        modal_mantenimiento_title: "PLANES PREVENTIVOS ASTER SHIELD",
        modal_mantenimiento_intro: "Asegure la máxima fiabilidad de su cadena de frío. Control de fugas reglamentario (RSIF), análisis de aceites, termografía y calibración de sondas.",

        modal_eficiencia_title: "OPTIMIZACIÓN ENERGÉTICA & RETROFIT INVERTER",
        modal_eficiencia_intro: "Convierta sus máquinas e instalaciones frigoríficas existentes en sistemas INVERTER de alta eficiencia. Regulación electrónica micrométrica con válvulas termostáticas electrónicas y variadores de frecuencia.",

        modal_averias_title: "CENTRAL DE INCIDENCIAS & EMERGENCIAS 24H",
        modal_averias_hotline: "LÍNEA DIRECTA DE ASISTENCIA 24 HORAS",
        modal_averias_btn: "ABRIR PARTE DE AVERÍA URGENTE ONLINE",

        modal_contratos_title: "ACUERDOS DE NIVEL DE SERVICIO (SLA)",
        modal_contratos_intro: "Mantenimiento especializado para industria alimentaria, cadenas logísticas y sector farmacéutico.",

        contact_copy_btn: "COPIAR NÚMERO",
        contact_copied: "¡NÚMERO COPIADO!",
        contact_whatsapp_btn: "WHATSAPP DIRECTO",
        contact_back_btn: "ATRÁS",
        contact_rebuild_cube: "ATRÁS"
    },
    en: {
        tagline: "Technical Solutions · Industrial Refrigeration",
        nav_averias: "[01] BREAKDOWNS",
        nav_contratos: "[02] CONTRACTS",
        nav_eficiencia: "[03] EFFICIENCY",
        nav_contacto: "[04] CONTACT",
        audio_active: "ACTIVE",
        audio_mute: "MUTE",
        crt_label: "CRT:",

        // HVAC-R HUD Labels
        hud_mollier_title: "MOLLIER DIAGRAM // p-h",
        hud_eev_title: "EXPANSION VALVE // EEV",
        hud_manifold_title: "DIGITAL MANIFOLD",
        hud_inverter_title: "FREQUENCY INVERTER",
        hud_cooling_active: "COOLING SYSTEM: ACTIVE",
        hud_standby: "SELECTION: STANDBY",
        hud_target_prefix: "TARGET:",
        hud_toggle_btn: "HUD",

        // Cube faces
        face_reparar: "REPAIR",
        face_reparar_sub: "24/7 TECHNICAL DISPATCH",
        face_mantenimiento: "MAINTENANCE",
        face_mantenimiento_sub: "ASTER SHIELD PREVENTIVE",
        face_contacto: "CONTACT",
        face_contacto_sub: "TEL: 675 38 75 75 · WHATSAPP",
        face_sustituir: "REPLACE",
        face_sustituir_sub: "F-GAS RETROFIT & ECO GAS",
        face_eficiencia: "EFFICIENCY",
        face_eficiencia_sub: "VALVES & INVERTER DRIVE",

        // Modals
        modal_reparar_title: "24/7 EMERGENCY REPAIR SERVICE",
        modal_reparar_intro: "Immediate deployment of ASTER mobile technical units. On-site thermodynamic diagnostics, leak repairs, compressor racks, and industrial cold rooms.",
        modal_reparar_btn: "REQUEST IMMEDIATE TECHNICAL DISPATCH",

        modal_sustituir_title: "F-GAS RETROFIT & SYSTEM REPLACEMENT",
        modal_sustituir_intro: "Transition audits toward low-GWP technologies: Transcritical CO2 (R-744), Propane (R-290), and HFO blends compliant with EU F-Gas regulations.",

        modal_mantenimiento_title: "ASTER SHIELD PREVENTIVE MAINTENANCE",
        modal_mantenimiento_intro: "Ensure zero downtime in your cold chain. Certified leak detection, oil tribology analysis, thermography, and sensor calibration.",

        modal_eficiencia_title: "ENERGY OPTIMIZATION & INVERTER RETROFIT",
        modal_eficiencia_intro: "Upgrade your standard machines into high-efficiency INVERTER systems. Micrometric electronic expansion valves and variable speed frequency drives.",

        modal_averias_title: "INCIDENT MANAGEMENT & 24H EMERGENCY",
        modal_averias_hotline: "24/7 DIRECT EMERGENCY HOTLINE",
        modal_averias_btn: "OPEN ONLINE URGENT BREAKDOWN TICKET",

        modal_contratos_title: "SERVICE LEVEL AGREEMENTS (SLA)",
        modal_contratos_intro: "Tailored refrigeration maintenance agreements for food processing, logistics hubs, and pharmaceutical cold storage.",

        contact_copy_btn: "COPY PHONE NUMBER",
        contact_copied: "NUMBER COPIED!",
        contact_whatsapp_btn: "DIRECT WHATSAPP",
        contact_back_btn: "BACK",
        contact_rebuild_cube: "BACK"
    }
};

class AsterI18n {
    constructor() {
        this.currentLang = localStorage.getItem('aster_lang') || 'es';
    }

    setLanguage(lang) {
        if (!ASTER_TRANSLATIONS[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('aster_lang', lang);
        this.applyLanguage();

        if (window.asterScene && typeof window.asterScene.updateCubeLanguage === 'function') {
            window.asterScene.updateCubeLanguage(lang);
        }

        if (window.asterAudio) {
            window.asterAudio.playSelect();
        }
    }

    t(key) {
        return ASTER_TRANSLATIONS[this.currentLang][key] || key;
    }

    applyLanguage() {
        const t = ASTER_TRANSLATIONS[this.currentLang];

        const langBtn = document.getElementById('lang-toggle-btn');
        if (langBtn) {
            langBtn.textContent = this.currentLang.toUpperCase();
            langBtn.setAttribute('title', this.currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español');
        }

        const tagline = document.querySelector('.logo-tagline');
        if (tagline) tagline.textContent = t.tagline;

        const btnAverias = document.querySelector('[data-target-modal="averias"]');
        if (btnAverias) btnAverias.innerHTML = `<span class="nav-idx">[01]</span> ${this.currentLang === 'es' ? 'AVERÍAS' : 'BREAKDOWNS'}`;

        const btnContratos = document.querySelector('[data-target-modal="contratos"]');
        if (btnContratos) btnContratos.innerHTML = `<span class="nav-idx">[02]</span> ${this.currentLang === 'es' ? 'CONTRATOS' : 'CONTRACTS'}`;

        const btnEficiencia = document.querySelector('[data-target-modal="eficiencia"]');
        if (btnEficiencia) btnEficiencia.innerHTML = `<span class="nav-idx">[03]</span> ${this.currentLang === 'es' ? 'EFICIENCIA' : 'EFFICIENCY'}`;

        const btnContacto = document.querySelector('[data-target-modal="contacto"]');
        if (btnContacto) btnContacto.innerHTML = `<span class="nav-idx">[04]</span> ${this.currentLang === 'es' ? 'CONTACTO' : 'CONTACT'}`;

        // HUD panel titles
        const mollierTitle = document.querySelector('.hud-top-left .hud-panel-title span:first-child');
        if (mollierTitle) mollierTitle.textContent = t.hud_mollier_title;

        const eevTitle = document.querySelector('.hud-bottom-left .hud-panel-title span:first-child');
        if (eevTitle) eevTitle.textContent = t.hud_eev_title;

        const manifoldTitle = document.querySelector('.hud-top-right .hud-panel-title span:first-child');
        if (manifoldTitle) manifoldTitle.textContent = t.hud_manifold_title;

        const inverterTitle = document.querySelector('.hud-bottom-right .hud-panel-title span:first-child');
        if (inverterTitle) inverterTitle.textContent = t.hud_inverter_title;

        // Generic elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                el.textContent = t[key];
            }
        });
    }
}

window.asterI18n = new AsterI18n();

document.addEventListener('DOMContentLoaded', () => {
    window.asterI18n.applyLanguage();
    
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const nextLang = window.asterI18n.currentLang === 'es' ? 'en' : 'es';
            window.asterI18n.setLanguage(nextLang);
        });
    }
});
