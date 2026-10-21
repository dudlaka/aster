/**
 * ASTER Soluciones Técnicas - 3D WebGL Scene Engine
 * Complete PS2-inspired industrial cryogenic menu with:
 * - 5 Interactive faces: REPARAR, MANTENIMIENTO, CONTACTO, SUSTITUIR, EFICIENCIA
 * - Dynamic falling icicles that break off when user rotates the cube
 * - High-impact CONTACTO show:
 *   1. Central cube shatters into ice shards.
 *   2. Shards form the word "CONTACTO" in front of the camera, perfectly centered,
 *      at uniform depth (z=0) and identical scale (no distance distortion).
 *   3. Holds "CONTACTO" for exactly 3 seconds.
 *   4. After 3 seconds, particles transition into an elliptical orbit circling around
 *      the floating 3D Contact Information Box as it slowly rises into the center!
 *   5. "ATRÁS" button restores the central cube smoothly.
 */

class AsterScene {
    constructor() {
        this.container = document.getElementById('webgl-container');
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(-999, -999);
        this.targetMouse = new THREE.Vector2(0, 0);

        // Core 3D objects
        this.cubeGroup = null;
        this.faceMeshes = {};
        this.floatingCubes = [];
        this.vaporParticles = null;
        this.crystalParticles = null;
        this.hoveredFace = null;

        // Icicle physics
        this.attachedIcicles = [];
        this.fallingIcicles = [];
        this.lastIcicleDropTime = 0;

        // Contact Show State
        this.isShattered = false;
        this.shatterPhase = 'idle'; // 'idle', 'exploding', 'forming_word', 'holding_word', 'orbiting'
        this.shatterTimer = 0;
        this.wordTargets = [];
        this.cubeShards = [];

        // Interaction state
        this.isDragging = false;
        this.prevMousePos = { x: 0, y: 0 };
        this.cubeRotation = { x: 0.38, y: -0.72 };
        this.targetCubeRotation = { x: 0.38, y: -0.72 };
        this.defaultRotation = { x: 0.38, y: -0.72 };
        this.idleTimer = 0;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x030711, 0.022);

        // 2. Camera with responsive distance
        const isMobile = width < 768;
        const camZ = isMobile ? 11.5 : 8.0;
        const camY = isMobile ? 0.6 : 0.35;

        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(0, camY, camZ);
        this.camera.lookAt(0, 0, 0);

        // 3. WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;
        this.container.appendChild(this.renderer.domElement);

        // 4. Lighting
        this.setupLights();

        // 5. Background Scaffolding & Particles
        this.createBackgroundTowers();
        this.createFloatingIceCubes();
        this.createCrystalParticles();

        // 6. Central Cryogenic Cube
        this.createCentralCube();

        // 7. Cold Fog / Vapor
        this.createVaporSystem();

        // 8. Generate Exact 3D Target Coordinates for "CONTACTO"
        this.generateContactoCoordinates();

        // 9. Event Listeners
        this.setupEventListeners();

        // 10. Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x0c1b2e, 1.8);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xe6f4ff, 2.2);
        keyLight.position.set(4, 7, 5);
        this.scene.add(keyLight);

        const rimLight1 = new THREE.DirectionalLight(0x00d2ff, 3.2);
        rimLight1.position.set(-6, -2, -4);
        this.scene.add(rimLight1);

        const rimLight2 = new THREE.DirectionalLight(0x4facfe, 2.0);
        rimLight2.position.set(5, 5, -5);
        this.scene.add(rimLight2);

        const bottomGlow = new THREE.PointLight(0x00e1ff, 2.8, 12);
        bottomGlow.position.set(0, -3.5, 1);
        this.scene.add(bottomGlow);
    }

    createBackgroundTowers() {
        const towerGroup = new THREE.Group();
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x121a24,
            roughness: 0.7,
            metalness: 0.8
        });

        const beamGeo = new THREE.BoxGeometry(0.08, 18, 0.08);
        const strutGeo = new THREE.BoxGeometry(0.06, 2.8, 0.06);

        [-5.8, 5.8].forEach((posX) => {
            const tower = new THREE.Group();
            tower.position.set(posX, 0, -6.5);

            const offsets = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
            offsets.forEach(([ox, oz]) => {
                const pillar = new THREE.Mesh(beamGeo, metalMaterial);
                pillar.position.set(ox * 0.9, 0, oz * 0.9);
                tower.add(pillar);
            });

            for (let y = -8; y <= 8; y += 2.2) {
                const strut1 = new THREE.Mesh(strutGeo, metalMaterial);
                strut1.position.set(0, y, -0.9);
                strut1.rotation.z = Math.PI * 0.25;
                tower.add(strut1);

                const strut2 = new THREE.Mesh(strutGeo, metalMaterial);
                strut2.position.set(0, y, 0.9);
                strut2.rotation.z = -Math.PI * 0.25;
                tower.add(strut2);
            }

            towerGroup.add(tower);
        });

        this.scene.add(towerGroup);
    }

    createFloatingIceCubes() {
        const cubeCount = 65;
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);

        const iceMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xcdeeff,
            emissive: 0x052238,
            roughness: 0.15,
            metalness: 0.1,
            transmission: 0.65,
            opacity: 0.85,
            transparent: true,
            reflectivity: 0.9
        });

        for (let i = 0; i < cubeCount; i++) {
            const mesh = new THREE.Mesh(boxGeo, iceMaterial.clone());
            
            const radius = 3.8 + Math.random() * 6.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
            mesh.position.y = radius * Math.sin(phi) * Math.sin(theta) * 0.75;
            mesh.position.z = radius * Math.cos(phi) - 1.5;

            const s = 0.12 + Math.random() * 0.36;
            mesh.scale.set(s, s, s);

            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            mesh.userData = {
                rotSpeedX: (Math.random() - 0.5) * 0.018,
                rotSpeedY: (Math.random() - 0.5) * 0.018,
                rotSpeedZ: (Math.random() - 0.5) * 0.018,
                floatSpeed: 0.001 + Math.random() * 0.002,
                floatOffset: Math.random() * Math.PI * 2,
                baseY: mesh.position.y,
                basePos: mesh.position.clone(),
                origScale: mesh.scale.clone(),
                orbitAngle: (i / cubeCount) * Math.PI * 2
            };

            this.floatingCubes.push(mesh);
            this.scene.add(mesh);
        }
    }

    createCrystalParticles() {
        const count = 900;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 22;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.3, 'rgba(0, 210, 255, 0.8)');
        grad.addColorStop(1, 'rgba(0, 210, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);

        const particleTex = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: 0.08,
            map: particleTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0x9be2ff
        });

        this.crystalParticles = new THREE.Points(geo, mat);
        this.scene.add(this.crystalParticles);
    }

    createCentralCube() {
        this.cubeGroup = new THREE.Group();
        const cubeSize = 2.6;
        const half = cubeSize / 2;

        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x16202c,
            roughness: 0.35,
            metalness: 0.85,
            emissive: 0x040e18
        });

        const strutRadius = 0.08;
        const edgeLength = cubeSize;
        const edgeGeo = new THREE.BoxGeometry(strutRadius * 2, edgeLength + 0.08, strutRadius * 2);

        const edgeConfigs = [
            [-half, 0, -half, 0, 0, 0],
            [half, 0, -half, 0, 0, 0],
            [half, 0, half, 0, 0, 0],
            [-half, 0, half, 0, 0, 0],
            [0, half, -half, 0, 0, Math.PI / 2],
            [0, half, half, 0, 0, Math.PI / 2],
            [-half, half, 0, Math.PI / 2, 0, 0],
            [half, half, 0, Math.PI / 2, 0, 0],
            [0, -half, -half, 0, 0, Math.PI / 2],
            [0, -half, half, 0, 0, Math.PI / 2],
            [-half, -half, 0, Math.PI / 2, 0, 0],
            [half, -half, 0, Math.PI / 2, 0, 0],
        ];

        edgeConfigs.forEach(([x, y, z, rx, ry, rz]) => {
            const edge = new THREE.Mesh(edgeGeo, frameMat);
            edge.position.set(x, y, z);
            edge.rotation.set(rx, ry, rz);
            this.cubeGroup.add(edge);
        });

        const cornerGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
        const cornerMat = new THREE.MeshStandardMaterial({
            color: 0x223040,
            roughness: 0.2,
            metalness: 0.95
        });

        for (let x of [-half, half]) {
            for (let y of [-half, half]) {
                for (let z of [-half, half]) {
                    const corner = new THREE.Mesh(cornerGeo, cornerMat);
                    corner.position.set(x, y, z);
                    this.cubeGroup.add(corner);
                }
            }
        }

        const lang = (window.asterI18n && window.asterI18n.currentLang) || 'es';

        this.faceConfigs = [
            {
                key: 'reparar',
                titleEs: 'REPARAR', titleEn: 'REPAIR',
                subEs: 'ASISTENCIA TÉCNICA 24H', subEn: '24/7 TECHNICAL DISPATCH',
                code: 'FRIGO // 01',
                position: [0, 0, half - 0.02],
                rotation: [0, 0, 0],
                action: 'reparar'
            },
            {
                key: 'mantenimiento',
                titleEs: 'MANTENIMIENTO', titleEn: 'MAINTENANCE',
                subEs: 'PLANES PREVENTIVOS ASTER', subEn: 'ASTER SHIELD PREVENTIVE',
                code: 'FRIGO // 02',
                position: [half - 0.02, 0, 0],
                rotation: [0, Math.PI / 2, 0],
                action: 'mantenimiento'
            },
            {
                key: 'contacto',
                titleEs: 'CONTACTO', titleEn: 'CONTACT',
                subEs: 'TEL: 675 38 75 75 · WHATSAPP', subEn: 'TEL: 675 38 75 75 · WHATSAPP',
                code: 'FRIGO // 04',
                position: [0, half - 0.02, 0],
                rotation: [-Math.PI / 2, 0, 0],
                action: 'contacto'
            },
            {
                key: 'sustituir',
                titleEs: 'SUSTITUIR', titleEn: 'REPLACE',
                subEs: 'RENOVE F-GAS & ECOLÓGICO', subEn: 'F-GAS RETROFIT & ECO GAS',
                code: 'FRIGO // 03',
                position: [0, 0, -half + 0.02],
                rotation: [0, Math.PI, 0],
                action: 'sustituir'
            },
            {
                key: 'eficiencia',
                titleEs: 'EFICIENCIA', titleEn: 'EFFICIENCY',
                subEs: 'VÁLVULAS & INVERTER DRIVE', subEn: 'VALVES & INVERTER DRIVE',
                code: 'FRIGO // 05',
                position: [-half + 0.02, 0, 0],
                rotation: [0, -Math.PI / 2, 0],
                action: 'eficiencia'
            },
            {
                key: 'bottom',
                titleEs: 'BASE CHASSIS', titleEn: 'BASE CHASSIS',
                subEs: 'BANCADA FRIGORÍFICA', subEn: 'PRIMARY BASE',
                code: 'SEC_BASE',
                position: [0, -half + 0.02, 0],
                rotation: [Math.PI / 2, 0, 0],
                interactive: false
            }
        ];

        const panelSize = cubeSize - 0.16;
        const panelGeo = new THREE.PlaneGeometry(panelSize, panelSize);

        this.faceConfigs.forEach(cfg => {
            const title = lang === 'es' ? cfg.titleEs : cfg.titleEn;
            const sub = lang === 'es' ? cfg.subEs : cfg.subEn;
            const { texture, emissiveTexture } = this.generateFaceTexture(title, sub, cfg.code);

            const mat = new THREE.MeshStandardMaterial({
                map: texture,
                emissiveMap: emissiveTexture,
                emissive: new THREE.Color(0x00d2ff),
                emissiveIntensity: 0.45,
                roughness: 0.25,
                metalness: 0.15,
                transparent: true,
                opacity: 0.95
            });

            const panel = new THREE.Mesh(panelGeo, mat);
            panel.position.set(...cfg.position);
            panel.rotation.set(...cfg.rotation);
            panel.userData = {
                action: cfg.action,
                name: title,
                cfg: cfg,
                interactive: cfg.interactive !== false,
                baseEmissiveIntensity: 0.45,
                material: mat
            };

            this.faceMeshes[cfg.key] = panel;
            this.cubeGroup.add(panel);

            if (cfg.interactive !== false) {
                const badge = this.createHoloBadge(title);
                badge.position.set(...cfg.position);
                badge.rotation.set(...cfg.rotation);
                badge.translateZ(0.12);
                panel.userData.badge = badge;
                this.cubeGroup.add(badge);
            }
        });

        this.createIcicles(cubeSize);

        this.cubeGroup.position.set(0, -0.05, 0);
        this.cubeGroup.rotation.set(this.cubeRotation.x, this.cubeRotation.y, 0);
        this.scene.add(this.cubeGroup);
    }

    updateCubeLanguage(lang) {
        if (!this.faceConfigs) return;
        this.faceConfigs.forEach(cfg => {
            const panel = this.faceMeshes[cfg.key];
            if (!panel) return;

            const title = lang === 'es' ? cfg.titleEs : cfg.titleEn;
            const sub = lang === 'es' ? cfg.subEs : cfg.subEn;
            const { texture, emissiveTexture } = this.generateFaceTexture(title, sub, cfg.code);

            panel.material.map = texture;
            panel.material.emissiveMap = emissiveTexture;
            panel.material.needsUpdate = true;
            panel.userData.name = title;

            if (panel.userData.badge) {
                this.cubeGroup.remove(panel.userData.badge);
                const badge = this.createHoloBadge(title);
                badge.position.set(...cfg.position);
                badge.rotation.set(...cfg.rotation);
                badge.translateZ(0.12);
                panel.userData.badge = badge;
                this.cubeGroup.add(badge);
            }
        });
    }

    generateFaceTexture(title, subtitle, code) {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const eCanvas = document.createElement('canvas');
        eCanvas.width = size;
        eCanvas.height = size;
        const eCtx = eCanvas.getContext('2d');

        const bgGrad = ctx.createLinearGradient(0, 0, size, size);
        bgGrad.addColorStop(0, '#0d2238');
        bgGrad.addColorStop(0.5, '#071524');
        bgGrad.addColorStop(1, '#030b14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);

        eCtx.fillStyle = '#000000';
        eCtx.fillRect(0, 0, size, size);

        // Ice cracks & frost
        ctx.strokeStyle = 'rgba(180, 230, 255, 0.28)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 24; i++) {
            ctx.beginPath();
            let x = Math.random() * size;
            let y = Math.random() * size;
            ctx.moveTo(x, y);
            for (let j = 0; j < 5; j++) {
                x += (Math.random() - 0.5) * 160;
                y += (Math.random() - 0.5) * 160;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(36, 36, size - 72, size - 72);

        const bLen = 50;
        ctx.strokeStyle = '#00e1ff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(36, 36 + bLen); ctx.lineTo(36, 36); ctx.lineTo(36 + bLen, 36);
        ctx.moveTo(size - 36 - bLen, 36); ctx.lineTo(size - 36, 36); ctx.lineTo(size - 36, 36 + bLen);
        ctx.moveTo(36, size - 36 - bLen); ctx.lineTo(size - 36, size - 36); ctx.lineTo(36 + bLen, size - 36);
        ctx.moveTo(size - 36 - bLen, size - 36); ctx.lineTo(size - 36, size - 36); ctx.lineTo(size - 36, size - 36 - bLen);
        ctx.stroke();

        ctx.font = '700 24px "Share Tech Mono", monospace';
        ctx.fillStyle = '#00d2ff';
        ctx.textAlign = 'left';
        ctx.fillText(code, 64, 88);

        ctx.textAlign = 'right';
        ctx.fillText('CRYO-CORE // ASTER-90', size - 64, 88);

        const boxY = size * 0.42;
        const boxH = 160;
        ctx.fillStyle = 'rgba(5, 20, 36, 0.85)';
        ctx.fillRect(70, boxY, size - 140, boxH);

        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(70, boxY, size - 140, boxH);

        // Main Title
        ctx.font = '900 78px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 24;
        ctx.fillText(title, size / 2, boxY + 105);

        ctx.font = '600 22px "Rajdhani", sans-serif';
        ctx.fillStyle = '#9fe8ff';
        ctx.shadowBlur = 6;
        ctx.fillText(subtitle, size / 2, boxY + 140);
        ctx.shadowBlur = 0;

        ctx.font = '600 20px "Share Tech Mono", monospace';
        ctx.fillStyle = 'rgba(160, 210, 240, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('ESTADO: ÓPTIMO  |  TEMP: -28.2°C  |  PRESIÓN: 3.25 / 16.8 BAR', size / 2, size - 68);

        eCtx.font = '900 78px "Orbitron", sans-serif';
        eCtx.textAlign = 'center';
        eCtx.fillStyle = '#ffffff';
        eCtx.shadowColor = '#00d2ff';
        eCtx.shadowBlur = 30;
        eCtx.fillText(title, size / 2, boxY + 105);

        eCtx.strokeStyle = '#00d2ff';
        eCtx.lineWidth = 6;
        eCtx.strokeRect(70, boxY, size - 140, boxH);

        const texture = new THREE.CanvasTexture(canvas);
        const emissiveTexture = new THREE.CanvasTexture(eCanvas);
        return { texture, emissiveTexture };
    }

    createHoloBadge(text) {
        const group = new THREE.Group();
        const badgeWidth = 2.0;
        const badgeHeight = 0.55;
        const badgeGeo = new THREE.PlaneGeometry(badgeWidth, badgeHeight);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 140;
        const ctx = canvas.getContext('2d');

        ctx.strokeStyle = '#00e1ff';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#00e1ff';
        ctx.shadowBlur = 12;
        ctx.strokeRect(10, 10, 492, 120);

        ctx.fillStyle = 'rgba(0, 190, 255, 0.12)';
        ctx.fillRect(10, 10, 492, 120);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, 6, 12, 12);
        ctx.fillRect(494, 6, 12, 12);
        ctx.fillRect(6, 122, 12, 12);
        ctx.fillRect(494, 122, 12, 12);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(badgeGeo, mat);
        group.add(mesh);
        return group;
    }

    createIcicles(cubeSize) {
        this.attachedIcicles = [];
        const half = cubeSize / 2;

        const icicleMat = new THREE.MeshPhysicalMaterial({
            color: 0xdaf2ff,
            emissive: 0x051a2d,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.8,
            transparent: true,
            opacity: 0.9,
            reflectivity: 0.95
        });

        const edges = [
            { start: [-half, -half, -half], dir: [1, 0, 0] },
            { start: [-half, -half, half], dir: [1, 0, 0] },
            { start: [-half, -half, -half], dir: [0, 0, 1] },
            { start: [half, -half, -half], dir: [0, 0, 1] }
        ];

        edges.forEach(edge => {
            const count = 7 + Math.floor(Math.random() * 4);
            for (let i = 0; i <= count; i++) {
                const t = i / count;
                const px = edge.start[0] + edge.dir[0] * cubeSize * t;
                const py = -half;
                const pz = edge.start[2] + edge.dir[2] * cubeSize * t;

                const length = 0.2 + Math.random() * 0.55;
                const radius = 0.03 + Math.random() * 0.035;
                const coneGeo = new THREE.ConeGeometry(radius, length, 5);
                coneGeo.rotateX(Math.PI);

                const icicle = new THREE.Mesh(coneGeo, icicleMat);
                icicle.position.set(px, py - length / 2, pz);
                icicle.rotation.z = (Math.random() - 0.5) * 0.15;
                icicle.rotation.x = (Math.random() - 0.5) * 0.15;

                icicle.userData = {
                    initialLocalPos: icicle.position.clone(),
                    initialLocalRot: icicle.rotation.clone(),
                    length: length,
                    attached: true
                };

                this.attachedIcicles.push(icicle);
                this.cubeGroup.add(icicle);
            }
        });
    }

    checkFallingIciclesOnRotation(rotVelocity) {
        const now = performance.now();
        if (rotVelocity > 0.015 && (now - this.lastIcicleDropTime > 350)) {
            const available = this.attachedIcicles.filter(ic => ic.userData.attached);
            if (available.length > 0) {
                const pickIndex = Math.floor(Math.random() * available.length);
                const icicle = available[pickIndex];
                icicle.userData.attached = false;
                this.lastIcicleDropTime = now;

                if (window.asterAudio) {
                    window.asterAudio.playIcicleSnap();
                }

                const worldPos = new THREE.Vector3();
                const worldQuat = new THREE.Quaternion();
                icicle.getWorldPosition(worldPos);
                icicle.getWorldQuaternion(worldQuat);

                this.cubeGroup.remove(icicle);
                icicle.position.copy(worldPos);
                icicle.quaternion.copy(worldQuat);
                this.scene.add(icicle);

                icicle.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.04,
                    -0.02,
                    (Math.random() - 0.5) * 0.04
                );
                icicle.userData.rotVel = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.08,
                    (Math.random() - 0.5) * 0.08,
                    (Math.random() - 0.5) * 0.08
                );

                this.fallingIcicles.push(icicle);

                setTimeout(() => {
                    icicle.position.copy(icicle.userData.initialLocalPos);
                    icicle.rotation.copy(icicle.userData.initialLocalRot);
                    icicle.userData.attached = true;
                    this.scene.remove(icicle);
                    this.cubeGroup.add(icicle);
                }, 6000);
            }
        }
    }

    createVaporSystem() {
        const count = 120;
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2.8;
            positions[i * 3 + 1] = -1.2 + (Math.random() - 0.5) * 1.2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2.8;

            velocities.push({
                vx: (Math.random() - 0.5) * 0.006,
                vy: -0.004 - Math.random() * 0.006,
                vz: (Math.random() - 0.5) * 0.006,
                life: Math.random() * 1.0,
                maxLife: 1.0 + Math.random() * 1.5
            });
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(210, 240, 255, 0.4)');
        grad.addColorStop(0.4, 'rgba(120, 200, 255, 0.2)');
        grad.addColorStop(0.8, 'rgba(40, 120, 200, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const fogTex = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: 1.6,
            map: fogTex,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.vaporParticles = new THREE.Points(geo, mat);
        this.vaporParticles.userData = { velocities };
        this.scene.add(this.vaporParticles);
    }

    // =========================================================================
    // GENERATE EXACT UNIFORM 3D VOXEL TARGETS FOR "CONTACTO"
    // (Strictly z = 0.0 and identical scale to prevent size/depth distortion)
    // =========================================================================
    generateContactoCoordinates() {
        const letterGrids = {
            'C': [
                [1,1,1],
                [1,0,0],
                [1,0,0],
                [1,0,0],
                [1,1,1]
            ],
            'O': [
                [1,1,1],
                [1,0,1],
                [1,0,1],
                [1,0,1],
                [1,1,1]
            ],
            'N': [
                [1,0,1],
                [1,1,1],
                [1,1,1],
                [1,0,1],
                [1,0,1]
            ],
            'T': [
                [1,1,1],
                [0,1,0],
                [0,1,0],
                [0,1,0],
                [0,1,0]
            ],
            'A': [
                [1,1,1],
                [1,0,1],
                [1,1,1],
                [1,0,1],
                [1,0,1]
            ]
        };

        const word = ['C', 'O', 'N', 'T', 'A', 'C', 'T', 'O'];
        this.wordTargets = [];

        const isMobile = (this.container.clientWidth || window.innerWidth) < 768;
        // Large prominent voxel size so "CONTACTO" appears large, clear, and imposing
        const voxelSize = isMobile ? 0.18 : 0.28;
        const letterSpacing = 1.0 * voxelSize;

        let totalWidth = 0;
        word.forEach((char, i) => {
            totalWidth += 3 * voxelSize;
            if (i < word.length - 1) totalWidth += letterSpacing;
        });

        let curX = -totalWidth / 2;
        const centerY = isMobile ? 0.45 : 0.30;

        word.forEach(char => {
            const grid = letterGrids[char];
            if (grid) {
                for (let r = 0; r < 5; r++) {
                    for (let c = 0; c < 3; c++) {
                        if (grid[r][c] === 1) {
                            const px = curX + c * voxelSize;
                            const py = centerY + (4 - r) * voxelSize;
                            const pz = 0.0; // Strictly zero depth for identical apparent size
                            this.wordTargets.push(new THREE.Vector3(px, py, pz));
                        }
                    }
                }
            }
            curX += 3 * voxelSize + letterSpacing;
        });
    }

    // =========================================================================
    // CONTACT SHOW: SHATTER -> FORM "CONTACTO" (3s) -> ORBIT AROUND 3D CARD
    // =========================================================================
    triggerContactShatter() {
        if (this.isShattered) return;
        this.isShattered = true;
        this.shatterPhase = 'exploding';
        this.shatterTimer = 0;

        if (window.asterAudio) {
            window.asterAudio.playIceShatter();
        }

        this.generateContactoCoordinates();

        // Hide ambient background cubes so ONLY the large cubes exist during Contact show
        this.floatingCubes.forEach(cube => {
            cube.visible = false;
        });

        // 1. Generate exclusively LARGE ice cubes for CONTACTO and organic orbiting
        this.cubeShards = [];
        const isMobile = (this.container.clientWidth || window.innerWidth) < 768;
        const largeCubeSize = isMobile ? 0.17 : 0.26;
        const shardCount = 104; // 80 voxels for "CONTACTO" + 24 outer floating chunks

        const shardGeo = new THREE.BoxGeometry(largeCubeSize, largeCubeSize, largeCubeSize);
        const shardMat = new THREE.MeshPhysicalMaterial({
            color: 0xd8f3ff,
            emissive: 0x00d2ff,
            emissiveIntensity: 0.95,
            roughness: 0.12,
            metalness: 0.2,
            transmission: 0.75,
            transparent: true,
            opacity: 0.96
        });

        for (let i = 0; i < shardCount; i++) {
            const shard = new THREE.Mesh(shardGeo, shardMat.clone());
            // Initial position from central cube volume
            shard.position.set(
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 2.5
            );

            const dir = shard.position.clone().normalize();
            // Slow, majestic initial explosion burst
            const burstSpeed = 0.045 + Math.random() * 0.055;

            const isWord = i < this.wordTargets.length;
            let targetPos = null;
            if (isWord) {
                targetPos = this.wordTargets[i].clone();
            } else {
                const aAngle = Math.random() * Math.PI * 2;
                const aRad = 3.6 + Math.random() * 2.2;
                targetPos = new THREE.Vector3(
                    Math.cos(aAngle) * aRad,
                    (Math.random() - 0.5) * 2.8,
                    (Math.random() - 0.5) * 1.5
                );
            }

            shard.userData = {
                velocity: dir.multiplyScalar(burstSpeed),
                targetPos: targetPos,
                isWordVoxel: isWord,
                voxelIndex: i,
                // Organic floating and slow orbital parameters
                orbitBaseAngle: (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
                orbitRadiusX: (isMobile ? 2.6 : 4.4) + (Math.random() - 0.5) * 1.6,
                orbitRadiusY: (isMobile ? 1.8 : 2.5) + (Math.random() - 0.5) * 1.0,
                orbitDepthZ: (Math.random() - 0.5) * 2.4, // Rich 3D depth in front & behind card
                orbitSpeed: 0.00030 + (Math.random() - 0.5) * 0.00010, // Very slow, majestic drifting
                floatWaveFreq: 0.0010 + Math.random() * 0.0011,
                floatWaveAmp: 0.16 + Math.random() * 0.22,
                organicTumble: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.008,
                    (Math.random() - 0.5) * 0.008,
                    (Math.random() - 0.5) * 0.008
                )
            };

            this.scene.add(shard);
            this.cubeShards.push(shard);
        }
    }

    rebuildCube() {
        if (!this.isShattered) return;
        this.isShattered = false;
        this.shatterPhase = 'idle';
        this.shatterTimer = 0;

        if (window.asterAudio) {
            window.asterAudio.playSelect();
        }

        // Remove dynamic large cube shards
        this.cubeShards.forEach(shard => {
            this.scene.remove(shard);
        });
        this.cubeShards = [];

        // Restore floating background cubes
        this.floatingCubes.forEach(cube => {
            cube.visible = true;
            cube.userData.targetPos = null;
            cube.userData.isWordVoxel = false;
            cube.scale.copy(cube.userData.origScale);
            cube.material.emissive.setHex(0x052238);
            cube.material.emissiveIntensity = 0.45;
        });

        // Restore central cube
        if (this.cubeGroup) {
            this.cubeGroup.visible = true;
            this.cubeGroup.scale.set(0.05, 0.05, 0.05);
        }

        // Hide Contact Card smoothly
        if (window.asterUI) {
            window.asterUI.hideContactCard();
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', () => this.onMouseUp());

        this.container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
        window.addEventListener('touchend', () => this.onMouseUp());

        this.container.addEventListener('click', (e) => this.onClick(e));
    }

    onResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        const isMobile = width < 768;
        const camZ = isMobile ? 11.5 : 8.0;
        const camY = isMobile ? 0.6 : 0.35;

        this.camera.aspect = width / height;
        this.camera.position.z = camZ;
        this.camera.position.y = camY;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        this.generateContactoCoordinates();
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (this.isDragging) {
            const dx = e.clientX - this.prevMousePos.x;
            const dy = e.clientY - this.prevMousePos.y;
            this.targetCubeRotation.y += dx * 0.008;
            this.targetCubeRotation.x += dy * 0.008;
            this.targetCubeRotation.x = Math.max(-0.8, Math.min(1.1, this.targetCubeRotation.x));

            const rotVelocity = Math.hypot(dx, dy) * 0.008;
            this.checkFallingIciclesOnRotation(rotVelocity);

            this.prevMousePos = { x: e.clientX, y: e.clientY };
            this.idleTimer = 0;
        } else {
            this.targetMouse.x = this.mouse.x;
            this.targetMouse.y = this.mouse.y;
        }
    }

    onMouseDown(e) {
        if (e.button !== 0) return;
        this.isDragging = true;
        this.prevMousePos = { x: e.clientX, y: e.clientY };
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }

    onTouchMove(e) {
        if (this.isDragging && e.touches.length === 1) {
            const dx = e.touches[0].clientX - this.prevMousePos.x;
            const dy = e.touches[0].clientY - this.prevMousePos.y;
            this.targetCubeRotation.y += dx * 0.008;
            this.targetCubeRotation.x += dy * 0.008;

            const rotVelocity = Math.hypot(dx, dy) * 0.008;
            this.checkFallingIciclesOnRotation(rotVelocity);

            this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            this.idleTimer = 0;
        }
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onClick(e) {
        if (this.hoveredFace && this.hoveredFace.userData.interactive) {
            const action = this.hoveredFace.userData.action;
            if (action === 'contacto') {
                this.triggerContactShatter();
            } else if (action && window.asterUI) {
                if (window.asterAudio) window.asterAudio.playSelect();
                window.asterUI.openModal(action);
            }
        }
    }

    checkIntersections() {
        if (!this.camera || !this.cubeGroup || this.isShattered) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const interactiveMeshes = Object.values(this.faceMeshes).filter(m => m.userData.interactive);
        const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            if (this.hoveredFace !== hit) {
                if (this.hoveredFace) {
                    this.hoveredFace.material.emissiveIntensity = this.hoveredFace.userData.baseEmissiveIntensity;
                    if (this.hoveredFace.userData.badge) {
                        this.hoveredFace.userData.badge.scale.set(1, 1, 1);
                    }
                }

                this.hoveredFace = hit;
                this.container.style.cursor = 'pointer';

                if (window.asterAudio) {
                    window.asterAudio.playHover();
                }

                const hudNotice = document.getElementById('hud-target-face');
                if (hudNotice) {
                    const prefix = window.asterI18n ? window.asterI18n.t('hud_target_prefix') : 'OBJETIVO:';
                    hudNotice.textContent = `${prefix} [${hit.userData.name}]`;
                }
            }

            hit.material.emissiveIntensity = 1.1;
            if (hit.userData.badge) {
                hit.userData.badge.scale.set(1.05, 1.05, 1.05);
            }
        } else {
            if (this.hoveredFace) {
                this.hoveredFace.material.emissiveIntensity = this.hoveredFace.userData.baseEmissiveIntensity;
                if (this.hoveredFace.userData.badge) {
                    this.hoveredFace.userData.badge.scale.set(1, 1, 1);
                }
                this.hoveredFace = null;
                this.container.style.cursor = 'default';

                const hudNotice = document.getElementById('hud-target-face');
                if (hudNotice) {
                    hudNotice.textContent = window.asterI18n ? window.asterI18n.t('hud_standby') : 'SELECCIÓN: STANDBY';
                }
            }
        }
    }

    animate(time) {
        requestAnimationFrame(this.animate);
        const delta = 0.016;

        this.checkIntersections();

        // Parallax
        const targetCamX = this.targetMouse.x * 0.45;
        this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;

        // Cube Rotation when normal
        if (!this.isDragging && !this.isShattered) {
            this.idleTimer += delta;
            if (this.idleTimer > 3.0) {
                this.targetCubeRotation.x += (this.defaultRotation.x - this.targetCubeRotation.x) * 0.02;
                this.targetCubeRotation.y += (this.defaultRotation.y - this.targetCubeRotation.y) * 0.02;
            } else {
                this.targetCubeRotation.y += 0.001;
            }
        }

        this.cubeRotation.x += (this.targetCubeRotation.x - this.cubeRotation.x) * 0.1;
        this.cubeRotation.y += (this.targetCubeRotation.y - this.cubeRotation.y) * 0.1;

        if (this.cubeGroup) {
            if (this.isShattered) {
                if (this.cubeGroup.scale.x > 0.01) {
                    const s = Math.max(0.0, this.cubeGroup.scale.x - 0.08);
                    this.cubeGroup.scale.set(s, s, s);
                    if (s <= 0.02) this.cubeGroup.visible = false;
                }
            } else {
                this.cubeGroup.rotation.x = this.cubeRotation.x;
                this.cubeGroup.rotation.y = this.cubeRotation.y;
                this.cubeGroup.position.y = -0.05 + Math.sin(time * 0.0015) * 0.04;

                if (this.cubeGroup.scale.x < 1.0) {
                    const s = Math.min(1.0, this.cubeGroup.scale.x + 0.06);
                    this.cubeGroup.scale.set(s, s, s);
                }
            }
        }

        // =====================================================================
        // CONTACT SHOW TIMELINE:
        // 0.0s - 0.75s: Slow-motion explosion of large ice chunks
        // 0.75s - 2.0s: Slow, fluid magnetic assembly into "CONTACTO"
        // 2.0s - 5.2s: Hold "CONTACTO" in center for 3.2s with gentle floating wave
        // 5.2s+: Card rises, particles smoothly transition into slow, organic 3D orbit
        // =====================================================================
        if (this.isShattered) {
            this.shatterTimer += delta;

            const isExploding = this.shatterTimer < 0.75;
            const isFormingWord = this.shatterTimer >= 0.75 && this.shatterTimer < 2.0;
            const isHoldingWord = this.shatterTimer >= 2.0 && this.shatterTimer < 5.2;
            const isOrbiting = this.shatterTimer >= 5.2;

            if (isOrbiting && this.shatterPhase !== 'orbiting') {
                this.shatterPhase = 'orbiting';
                if (window.asterUI) {
                    window.asterUI.showContactCard();
                }
            }

            const isMobile = (this.container.clientWidth || window.innerWidth) < 768;

            this.cubeShards.forEach((piece) => {
                if (isExploding && piece.userData.velocity) {
                    piece.position.add(piece.userData.velocity);
                    piece.rotation.x += piece.userData.organicTumble.x * 3.5;
                    piece.rotation.y += piece.userData.organicTumble.y * 3.5;
                } else if (isFormingWord) {
                    if (piece.userData.targetPos) {
                        // Smooth, graceful, slower lerp into "CONTACTO"
                        piece.position.lerp(piece.userData.targetPos, 0.038);
                        // Settle rotation gently
                        piece.rotation.x *= 0.92;
                        piece.rotation.y *= 0.92;
                        piece.rotation.z *= 0.92;
                        piece.material.emissive.setHex(0x00f0ff);
                        piece.material.emissiveIntensity = 1.35;
                    }
                } else if (isHoldingWord) {
                    if (piece.userData.targetPos) {
                        // Subtle organic breathing wave along the letters of "CONTACTO"
                        const wave = Math.sin(time * 0.0022 + piece.userData.targetPos.x * 0.45) * 0.04;
                        piece.position.x = piece.userData.targetPos.x;
                        piece.position.y = piece.userData.targetPos.y + wave;
                        piece.position.z = 0.0;
                        piece.rotation.set(0, 0, 0);
                        piece.material.emissive.setHex(0x00f0ff);
                        piece.material.emissiveIntensity = 1.4;
                    }
                } else if (isOrbiting) {
                    // Slow, organic, floating elliptical 3D orbit around the Contact Card
                    const angle = piece.userData.orbitBaseAngle + time * piece.userData.orbitSpeed;
                    const rx = piece.userData.orbitRadiusX;
                    const ry = piece.userData.orbitRadiusY;
                    const rz = piece.userData.orbitDepthZ;

                    const waveY = Math.sin(time * piece.userData.floatWaveFreq + piece.userData.orbitBaseAngle) * piece.userData.floatWaveAmp;
                    const waveZ = Math.cos(time * (piece.userData.floatWaveFreq * 0.8) + piece.userData.orbitBaseAngle * 1.4) * 0.35;
                    const centerCardY = isMobile ? 0.35 : 0.0;

                    const targetOrbitPos = new THREE.Vector3(
                        Math.cos(angle) * rx,
                        centerCardY + Math.sin(angle) * ry + waveY,
                        rz + waveZ
                    );

                    // Fluid, organic floating lerp
                    piece.position.lerp(targetOrbitPos, 0.024);
                    piece.rotation.x += piece.userData.organicTumble.x;
                    piece.rotation.y += piece.userData.organicTumble.y;
                    piece.rotation.z += piece.userData.organicTumble.z;
                    piece.material.emissive.setHex(0x00d2ff);
                    piece.material.emissiveIntensity = 1.05;
                }
            });
        } else {
            // Normal floating orbits when not in contact mode
            for (let i = 0; i < this.floatingCubes.length; i++) {
                const mesh = this.floatingCubes[i];
                const data = mesh.userData;

                if (mesh.position.distanceTo(data.basePos) > 0.05) {
                    mesh.position.lerp(data.basePos, 0.05);
                }
                mesh.rotation.x += data.rotSpeedX;
                mesh.rotation.y += data.rotSpeedY;
                mesh.position.y = data.baseY + Math.sin(time * data.floatSpeed + data.floatOffset) * 0.25;
            }
        }

        // Falling Icicles
        for (let i = this.fallingIcicles.length - 1; i >= 0; i--) {
            const icicle = this.fallingIcicles[i];
            icicle.userData.velocity.y -= 0.004;
            icicle.position.add(icicle.userData.velocity);
            icicle.rotation.x += icicle.userData.rotVel.x;
            icicle.rotation.y += icicle.userData.rotVel.y;

            if (icicle.position.y < -5.0) {
                this.scene.remove(icicle);
                this.fallingIcicles.splice(i, 1);
            }
        }

        // Crystals & Vapor
        if (this.crystalParticles) {
            this.crystalParticles.rotation.y = time * 0.00015;
        }

        if (this.vaporParticles && !this.isShattered) {
            const positions = this.vaporParticles.geometry.attributes.position.array;
            const vels = this.vaporParticles.userData.velocities;

            for (let i = 0; i < vels.length; i++) {
                const vel = vels[i];
                positions[i * 3] += vel.vx;
                positions[i * 3 + 1] += vel.vy;
                positions[i * 3 + 2] += vel.vz;

                vel.life += delta;
                if (vel.life > vel.maxLife) {
                    positions[i * 3] = (Math.random() - 0.5) * 2.4;
                    positions[i * 3 + 1] = -1.2 + (Math.random() - 0.5) * 0.4;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
                    vel.life = 0;
                }
            }
            this.vaporParticles.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.asterScene = new AsterScene();
});
