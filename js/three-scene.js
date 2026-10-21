/**
 * ASTER Soluciones Técnicas - 3D WebGL Scene Engine
 * Implements the iconic PS2-inspired industrial cryogenic main menu:
 * - Central frosty industrial cube with smooth faces, frost & icicles
 * - Three interactive faces: "REPARAR", "SUSTITUIR", "MANTENIMIENTO"
 * - Cold vapor / cryogenic fog venting from cube
 * - Floating ice cubes & crystals in 3D space
 * - Industrial steel truss tower silhouettes in background
 * - Raycasting and interactive inspection
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

        // Interaction state
        this.isDragging = false;
        this.prevMousePos = { x: 0, y: 0 };
        this.cubeRotation = { x: 0.38, y: -0.72 }; // Default signature isometric PS2 angle
        this.targetCubeRotation = { x: 0.38, y: -0.72 };
        this.defaultRotation = { x: 0.38, y: -0.72 };
        this.idleTimer = 0;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x030711, 0.022);

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        this.camera.position.set(0, 0.35, 7.8);
        this.camera.lookAt(0, 0, 0);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Lighting
        this.setupLights();

        // 5. Environment & Background Elements (Towers, Floating Cubes)
        this.createBackgroundTowers();
        this.createFloatingIceCubes();
        this.createCrystalParticles();

        // 6. Central Industrial Cryogenic Cube
        this.createCentralCube();

        // 7. Cold Fog / Vapor System
        this.createVaporSystem();

        // 8. Event Listeners
        this.setupEventListeners();

        // 9. Animation Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLights() {
        // Deep icy ambient
        const ambientLight = new THREE.AmbientLight(0x0c1b2e, 1.8);
        this.scene.add(ambientLight);

        // Key light (cool industrial white)
        const keyLight = new THREE.DirectionalLight(0xe6f4ff, 2.2);
        keyLight.position.set(4, 7, 5);
        keyLight.castShadow = true;
        this.scene.add(keyLight);

        // Rim light 1 (Vibrant cyan from back-left)
        const rimLight1 = new THREE.DirectionalLight(0x00d2ff, 3.2);
        rimLight1.position.set(-6, -2, -4);
        this.scene.add(rimLight1);

        // Rim light 2 (Deep icy blue from top-right back)
        const rimLight2 = new THREE.DirectionalLight(0x4facfe, 2.0);
        rimLight2.position.set(5, 5, -5);
        this.scene.add(rimLight2);

        // Bottom up-light (Cryogenic floor glow)
        const bottomGlow = new THREE.PointLight(0x00e1ff, 2.8, 12);
        bottomGlow.position.set(0, -3.5, 1);
        this.scene.add(bottomGlow);
    }

    createBackgroundTowers() {
        // Industrial scaffolding trusses visible in the dark background, matching reference.jpg
        const towerGroup = new THREE.Group();
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x121a24,
            roughness: 0.7,
            metalness: 0.8,
            wireframe: false
        });

        const beamGeo = new THREE.BoxGeometry(0.08, 18, 0.08);
        const strutGeo = new THREE.BoxGeometry(0.06, 2.8, 0.06);

        // Build 2 large industrial towers
        [-5.8, 5.8].forEach((posX) => {
            const tower = new THREE.Group();
            tower.position.set(posX, 0, -6.5);

            // 4 main pillars
            const offsets = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
            offsets.forEach(([ox, oz]) => {
                const pillar = new THREE.Mesh(beamGeo, metalMaterial);
                pillar.position.set(ox * 0.9, 0, oz * 0.9);
                tower.add(pillar);
            });

            // Cross struts
            for (let y = -8; y <= 8; y += 2.2) {
                const strut1 = new THREE.Mesh(strutGeo, metalMaterial);
                strut1.position.set(0, y, -0.9);
                strut1.rotation.z = Math.PI * 0.25;
                tower.add(strut1);

                const strut2 = new THREE.Mesh(strutGeo, metalMaterial);
                strut2.position.set(0, y, 0.9);
                strut2.rotation.z = -Math.PI * 0.25;
                tower.add(strut2);

                const strut3 = new THREE.Mesh(strutGeo, metalMaterial);
                strut3.position.set(-0.9, y, 0);
                strut3.rotation.x = Math.PI * 0.25;
                tower.add(strut3);
            }

            towerGroup.add(tower);
        });

        this.scene.add(towerGroup);
    }

    createFloatingIceCubes() {
        // PS2 BIOS inspired floating cubes
        const cubeCount = 55;
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);

        // Translucent ice material with glowing edges
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
            
            // Random distribution in spherical shell around central cube
            const radius = 3.6 + Math.random() * 6.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
            mesh.position.y = radius * Math.sin(phi) * Math.sin(theta) * 0.75;
            mesh.position.z = radius * Math.cos(phi) - 1.5;

            // Varying scales: from tiny ice crystal to medium floating cube
            const s = 0.12 + Math.random() * 0.42;
            mesh.scale.set(s, s, s);

            // Random initial rotation
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Individual tumbling physics
            mesh.userData = {
                rotSpeedX: (Math.random() - 0.5) * 0.018,
                rotSpeedY: (Math.random() - 0.5) * 0.018,
                rotSpeedZ: (Math.random() - 0.5) * 0.018,
                floatSpeed: 0.001 + Math.random() * 0.002,
                floatOffset: Math.random() * Math.PI * 2,
                baseY: mesh.position.y
            };

            this.floatingCubes.push(mesh);
            this.scene.add(mesh);
        }
    }

    createCrystalParticles() {
        // Thousands of tiny glittering ice particles drifting in vacuum
        const count = 900;
        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 22;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
            scales[i] = Math.random() * 0.04 + 0.015;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create glowing particle sprite texture
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

        // 1. Core Metallic Frame Chassis
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x16202c,
            roughness: 0.35,
            metalness: 0.85,
            emissive: 0x040e18
        });

        // Corner corner posts & beveled edges
        const strutRadius = 0.08;
        const edgeLength = cubeSize;
        const edgeGeo = new THREE.BoxGeometry(strutRadius * 2, edgeLength + 0.08, strutRadius * 2);

        // 12 edges of the cube frame
        const edgeConfigs = [
            // Vertical 4
            [-half, 0, -half, 0, 0, 0],
            [half, 0, -half, 0, 0, 0],
            [half, 0, half, 0, 0, 0],
            [-half, 0, half, 0, 0, 0],
            // Top 4
            [0, half, -half, 0, 0, Math.PI / 2],
            [0, half, half, 0, 0, Math.PI / 2],
            [-half, half, 0, Math.PI / 2, 0, 0],
            [half, half, 0, Math.PI / 2, 0, 0],
            // Bottom 4
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

        // Corner nodes / rivets
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

        // 2. High-Tech Frost & Text Inset Panels
        // Top Face: "SUSTITUIR"
        // Left Face (Front-Left): "REPARAR"
        // Right Face (Front-Right): "MANTENIMIENTO"
        const faceConfigs = [
            {
                name: 'REPARAR',
                title: 'REPARAR',
                sub: 'ASISTENCIA TÉCNICA 24H',
                code: 'SYS_ACT // 01',
                position: [0, 0, half - 0.02],
                rotation: [0, 0, 0],
                action: 'reparar'
            },
            {
                name: 'MANTENIMIENTO',
                title: 'MANTENIMIENTO',
                sub: 'PLANES PREVENTIVOS ASTER',
                code: 'SYS_ACT // 02',
                position: [half - 0.02, 0, 0],
                rotation: [0, Math.PI / 2, 0],
                action: 'mantenimiento'
            },
            {
                name: 'SUSTITUIR',
                title: 'SUSTITUIR',
                sub: 'RENOVE F-GAS & EFICIENCIA',
                code: 'SYS_ACT // 03',
                position: [0, half - 0.02, 0],
                rotation: [-Math.PI / 2, 0, 0],
                action: 'sustituir'
            },
            // Non-interactive back / bottom faces
            {
                name: 'BACK',
                title: 'ASTER // CRYO',
                sub: 'REFRIGERACIÓN INDUSTRIAL',
                code: 'SEC_CORE',
                position: [0, 0, -half + 0.02],
                rotation: [0, Math.PI, 0],
                interactive: false
            },
            {
                name: 'LEFT_BACK',
                title: 'TELEMETRÍA',
                sub: 'MONITORIZACIÓN REMOTA',
                code: 'SEC_LINK',
                position: [-half + 0.02, 0, 0],
                rotation: [0, -Math.PI / 2, 0],
                interactive: false
            },
            {
                name: 'BOTTOM',
                title: 'BASE CHASSIS',
                sub: 'CIRCUITO PRIMARIO',
                code: 'SEC_BASE',
                position: [0, -half + 0.02, 0],
                rotation: [Math.PI / 2, 0, 0],
                interactive: false
            }
        ];

        const panelSize = cubeSize - 0.16;
        const panelGeo = new THREE.PlaneGeometry(panelSize, panelSize);

        faceConfigs.forEach(cfg => {
            const { texture, emissiveTexture } = this.generateFaceTexture(cfg.title, cfg.sub, cfg.code, cfg.name);

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
                name: cfg.name,
                interactive: cfg.interactive !== false,
                baseEmissiveIntensity: 0.45,
                material: mat
            };

            this.faceMeshes[cfg.name] = panel;
            this.cubeGroup.add(panel);

            // Also add floating sci-fi 3D holographic frame badge for visible interactive faces
            if (cfg.interactive !== false) {
                const badge = this.createHoloBadge(cfg.title);
                badge.position.set(...cfg.position);
                badge.rotation.set(...cfg.rotation);
                // Offset slightly outward from face
                badge.translateZ(0.12);
                panel.userData.badge = badge;
                this.cubeGroup.add(badge);
            }
        });

        // 3. 3D Hanging Icicles (Carámbanos de hielo) around bottom rim
        this.createIcicles(cubeSize);

        // Position central cube
        this.cubeGroup.position.set(0, -0.05, 0);
        this.cubeGroup.rotation.set(this.cubeRotation.x, this.cubeRotation.y, 0);
        this.scene.add(this.cubeGroup);
    }

    generateFaceTexture(title, subtitle, code, faceName) {
        const size = 1024;
        
        // Base canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Emissive canvas
        const eCanvas = document.createElement('canvas');
        eCanvas.width = size;
        eCanvas.height = size;
        const eCtx = eCanvas.getContext('2d');

        // 1. Background deep frosted ice gradient
        const bgGrad = ctx.createLinearGradient(0, 0, size, size);
        bgGrad.addColorStop(0, '#0d2238');
        bgGrad.addColorStop(0.5, '#071524');
        bgGrad.addColorStop(1, '#030b14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);

        eCtx.fillStyle = '#000000';
        eCtx.fillRect(0, 0, size, size);

        // 2. Procedural ice cracks & crystalline frost
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

        // Frost crystalline noise pattern
        for (let i = 0; i < 400; i++) {
            const rx = Math.random() * size;
            const ry = Math.random() * size;
            const rRad = Math.random() * 3 + 1;
            ctx.fillStyle = 'rgba(210, 245, 255, ' + (Math.random() * 0.25) + ')';
            ctx.beginPath();
            ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Technical Grid lines & Sub-borders
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(36, 36, size - 72, size - 72);

        // Corner bracket accents
        const bLen = 50;
        ctx.strokeStyle = '#00e1ff';
        ctx.lineWidth = 8;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(36, 36 + bLen); ctx.lineTo(36, 36); ctx.lineTo(36 + bLen, 36);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(size - 36 - bLen, 36); ctx.lineTo(size - 36, 36); ctx.lineTo(size - 36, 36 + bLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(36, size - 36 - bLen); ctx.lineTo(36, size - 36); ctx.lineTo(36 + bLen, size - 36);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(size - 36 - bLen, size - 36); ctx.lineTo(size - 36, size - 36); ctx.lineTo(size - 36, size - 36 - bLen);
        ctx.stroke();

        // 4. Frost vignette on edges
        const frostGrad = ctx.createRadialGradient(size / 2, size / 2, size * 0.28, size / 2, size / 2, size * 0.68);
        frostGrad.addColorStop(0, 'rgba(200, 240, 255, 0.0)');
        frostGrad.addColorStop(0.8, 'rgba(180, 230, 255, 0.25)');
        frostGrad.addColorStop(1, 'rgba(230, 250, 255, 0.65)');
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, 0, size, size);

        // 5. Code & Subtitle readouts
        ctx.font = '700 24px "Share Tech Mono", monospace';
        ctx.fillStyle = '#00d2ff';
        ctx.textAlign = 'left';
        ctx.fillText(code, 64, 88);

        ctx.textAlign = 'right';
        ctx.fillText('CRYO-CORE // ASTER-90', size - 64, 88);

        // Central prominent banner box
        const boxY = size * 0.42;
        const boxH = 160;
        ctx.fillStyle = 'rgba(5, 20, 36, 0.85)';
        ctx.fillRect(70, boxY, size - 140, boxH);

        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(70, boxY, size - 140, boxH);

        // Main Title (e.g. "REPARAR", "SUSTITUIR", "MANTENIMIENTO")
        ctx.font = '900 78px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00d2ff';
        ctx.shadowBlur = 24;
        ctx.fillText(title, size / 2, boxY + 105);

        // Subtitle
        ctx.font = '600 22px "Rajdhani", sans-serif';
        ctx.fillStyle = '#9fe8ff';
        ctx.shadowBlur = 6;
        ctx.fillText(subtitle, size / 2, boxY + 140);
        ctx.shadowBlur = 0;

        // Bottom telemetry text
        ctx.font = '600 20px "Share Tech Mono", monospace';
        ctx.fillStyle = 'rgba(160, 210, 240, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('ESTADO: ÓPTIMO  |  TEMP: -28.4°C  |  PRESIÓN: 24.8 BAR', size / 2, size - 68);

        // Also draw text on the emissive canvas so it shines in the 3D scene!
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
        // Floating futuristic holographic bracket badge matching reference.jpg
        const group = new THREE.Group();
        const badgeWidth = 2.0;
        const badgeHeight = 0.55;

        // Thin glowing border plane
        const badgeGeo = new THREE.PlaneGeometry(badgeWidth, badgeHeight);
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 140;
        const ctx = canvas.getContext('2d');

        // Glowing border & corner brackets
        ctx.strokeStyle = '#00e1ff';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#00e1ff';
        ctx.shadowBlur = 12;
        ctx.strokeRect(10, 10, 492, 120);

        // Inset glowing banner
        ctx.fillStyle = 'rgba(0, 190, 255, 0.12)';
        ctx.fillRect(10, 10, 492, 120);

        // Corners
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
        // 3D crystalline icicle clusters hanging from the lower rim and corners
        const icicleGroup = new THREE.Group();
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

        // Generate clusters along the 4 bottom edges
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

                // Icicle cone
                const length = 0.2 + Math.random() * 0.55;
                const radius = 0.03 + Math.random() * 0.035;
                const coneGeo = new THREE.ConeGeometry(radius, length, 5);
                coneGeo.rotateX(Math.PI); // point downwards

                const icicle = new THREE.Mesh(coneGeo, icicleMat);
                icicle.position.set(px, py - length / 2, pz);
                icicle.rotation.z = (Math.random() - 0.5) * 0.15;
                icicle.rotation.x = (Math.random() - 0.5) * 0.15;
                icicleGroup.add(icicle);
            }
        });

        // Extra sharp long icicles at corners
        const corners = [
            [-half, -half, -half],
            [half, -half, -half],
            [-half, -half, half],
            [half, -half, half]
        ];

        corners.forEach(([cx, cy, cz]) => {
            const longLength = 0.7 + Math.random() * 0.45;
            const longRadius = 0.055;
            const cornerCone = new THREE.ConeGeometry(longRadius, longLength, 6);
            cornerCone.rotateX(Math.PI);
            const cornerMesh = new THREE.Mesh(cornerCone, icicleMat);
            cornerMesh.position.set(cx, cy - longLength / 2, cz);
            icicleGroup.add(cornerMesh);
        });

        this.cubeGroup.add(icicleGroup);
    }

    createVaporSystem() {
        // Cold cryogenic vapor / fog particles venting gently downwards and outwards
        const count = 120;
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2.8;
            positions[i * 3 + 1] = -1.2 + (Math.random() - 0.5) * 1.2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2.8;

            velocities.push({
                vx: (Math.random() - 0.5) * 0.006,
                vy: -0.004 - Math.random() * 0.006, // sinks slowly like cold heavy gas
                vz: (Math.random() - 0.5) * 0.006,
                life: Math.random() * 1.0,
                maxLife: 1.0 + Math.random() * 1.5,
                scale: 0.8 + Math.random() * 0.8
            });
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Soft fog puff texture
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

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());

        // Mouse move for parallax, raycasting, and drag rotation
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Drag to inspect cube
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', () => this.onMouseUp());

        // Touch support
        this.container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
        window.addEventListener('touchend', () => this.onMouseUp());

        // Click on 3D elements
        this.container.addEventListener('click', (e) => this.onClick(e));
    }

    onResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    onMouseMove(e) {
        // Normalized device coords (-1 to +1)
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (this.isDragging) {
            const dx = e.clientX - this.prevMousePos.x;
            const dy = e.clientY - this.prevMousePos.y;
            this.targetCubeRotation.y += dx * 0.008;
            this.targetCubeRotation.x += dy * 0.008;

            // Clamp vertical rotation so cube stays nicely viewable
            this.targetCubeRotation.x = Math.max(-0.8, Math.min(1.1, this.targetCubeRotation.x));

            this.prevMousePos = { x: e.clientX, y: e.clientY };
            this.idleTimer = 0;
        } else {
            // Subtle camera parallax
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
        }
    }

    onTouchMove(e) {
        if (this.isDragging && e.touches.length === 1) {
            const dx = e.touches[0].clientX - this.prevMousePos.x;
            const dy = e.touches[0].clientY - this.prevMousePos.y;
            this.targetCubeRotation.y += dx * 0.008;
            this.targetCubeRotation.x += dy * 0.008;
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
            if (action) {
                if (window.asterAudio) {
                    window.asterAudio.playSelect();
                }
                // Trigger modal
                if (window.asterUI) {
                    window.asterUI.openModal(action);
                }
            }
        }
    }

    checkIntersections() {
        if (!this.camera || !this.cubeGroup) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const interactiveMeshes = Object.values(this.faceMeshes).filter(m => m.userData.interactive);
        const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            if (this.hoveredFace !== hit) {
                // Unhover previous
                if (this.hoveredFace) {
                    this.hoveredFace.material.emissiveIntensity = this.hoveredFace.userData.baseEmissiveIntensity;
                    if (this.hoveredFace.userData.badge) {
                        this.hoveredFace.userData.badge.scale.set(1, 1, 1);
                    }
                }

                this.hoveredFace = hit;
                this.container.style.cursor = 'pointer';

                // Audio cue
                if (window.asterAudio) {
                    window.asterAudio.playHover();
                }

                // Highlight HUD
                const hudNotice = document.getElementById('hud-target-face');
                if (hudNotice) {
                    hudNotice.textContent = `OBJETIVO: [${hit.userData.name}]`;
                }
            }

            // Hover effects
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
                    hudNotice.textContent = 'SELECCIÓN: STANDBY';
                }
            }
        }
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        const delta = 0.016;

        // 1. Raycast
        this.checkIntersections();

        // 2. Camera Parallax Lerp
        const targetCamX = this.targetMouse.x * 0.45;
        const targetCamY = 0.35 + this.targetMouse.y * 0.35;
        this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;
        this.camera.position.y += (targetCamY - this.camera.position.y) * 0.05;
        this.camera.lookAt(0, 0, 0);

        // 3. Central Cube Rotation & Idle Spring
        if (!this.isDragging) {
            this.idleTimer += delta;
            if (this.idleTimer > 3.0) {
                // Gently drift back towards signature PS2 view
                this.targetCubeRotation.x += (this.defaultRotation.x - this.targetCubeRotation.x) * 0.02;
                this.targetCubeRotation.y += (this.defaultRotation.y - this.targetCubeRotation.y) * 0.02;
            } else {
                // Subtle slow breathing drift
                this.targetCubeRotation.y += 0.001;
            }
        }

        this.cubeRotation.x += (this.targetCubeRotation.x - this.cubeRotation.x) * 0.1;
        this.cubeRotation.y += (this.targetCubeRotation.y - this.cubeRotation.y) * 0.1;

        if (this.cubeGroup) {
            this.cubeGroup.rotation.x = this.cubeRotation.x;
            this.cubeGroup.rotation.y = this.cubeRotation.y;

            // Very subtle levitation bob
            this.cubeGroup.position.y = -0.05 + Math.sin(time * 0.0015) * 0.04;
        }

        // 4. Animate Floating PS2 Ice Cubes
        for (let i = 0; i < this.floatingCubes.length; i++) {
            const mesh = this.floatingCubes[i];
            const data = mesh.userData;

            mesh.rotation.x += data.rotSpeedX;
            mesh.rotation.y += data.rotSpeedY;
            mesh.rotation.z += data.rotSpeedZ;

            // Floating wave
            mesh.position.y = data.baseY + Math.sin(time * data.floatSpeed + data.floatOffset) * 0.25;
        }

        // 5. Animate Crystal Particles
        if (this.crystalParticles) {
            this.crystalParticles.rotation.y = time * 0.00015;
            this.crystalParticles.rotation.x = Math.sin(time * 0.0001) * 0.08;
        }

        // 6. Animate Cold Vapor / Fog
        if (this.vaporParticles) {
            const positions = this.vaporParticles.geometry.attributes.position.array;
            const vels = this.vaporParticles.userData.velocities;

            for (let i = 0; i < vels.length; i++) {
                const vel = vels[i];
                positions[i * 3] += vel.vx;
                positions[i * 3 + 1] += vel.vy;
                positions[i * 3 + 2] += vel.vz;

                vel.life += delta;
                if (vel.life > vel.maxLife) {
                    // Respawn near bottom/seams of central cube
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
