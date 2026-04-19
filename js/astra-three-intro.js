// astra-three-intro.js
document.addEventListener("DOMContentLoaded", () => {
    const introContainer = document.getElementById("astra-three-container");
    const introOverlay = document.getElementById("astra-intro");
    if (!introContainer || !introOverlay) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = null; // Transparent to see the CSS #0a0a0a and glow

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10; // Adjusted for 55-60% screen height

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Support gamma and proper colors for luxurious metallic feel
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    introContainer.appendChild(renderer.domElement);

    // LIGHTING (PREMIUM PRO METALLIC STUDIO)
    // Soft elegant ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    // Main studio key light (slightly warm white)
    const directionalLight = new THREE.DirectionalLight(0xfffae6, 2.0);
    directionalLight.position.set(5, 8, 5);
    scene.add(directionalLight);

    // Rim light (cool/digital white) to define the sharp metallic edges beautifully
    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.5);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // Subtle front fill light to reveal surface details
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(0, 0, 5);
    scene.add(fillLight);

    // ============================================
    // ASTRA SPIRITUAL COSMOS - BACKGROUND SCENE
    // ============================================
    
    const cosmosGroup = new THREE.Group();
    scene.add(cosmosGroup);

    // 1. NEBULA STARDUST (Different sizes)
    const starCount = 2000; 
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for(let i=0; i<starCount; i++) {
        const x = (Math.random() - 0.5) * 120;
        const y = (Math.random() - 0.5) * 120;
        const z = (Math.random() - 0.5) * 80 - 20; // push behind
        starPositions[i*3] = x;
        starPositions[i*3+1] = y;
        starPositions[i*3+2] = z;
        // Some larger, some smaller stars
        starSizes[i] = Math.random() > 0.95 ? 0.25 : 0.08;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    // Custom shader for point sizes
    const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            varying float vOpacity;
            uniform float time;
            void main() {
                vOpacity = 0.5 + 0.5 * sin(time + position.x * 10.0);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying float vOpacity;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(1.0, 0.98, 0.9, vOpacity * (1.0 - dist * 2.0));
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    cosmosGroup.add(stars);

    // 2. THE CELESTIAL BODY / PLANET (Eclipse effect)
    const planetGeometry = new THREE.SphereGeometry(25, 64, 64);
    const planetMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x050505, // Almost pure black
        emissive: 0xdcc8a0,
        emissiveIntensity: 0.05,
        roughness: 0.9,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.8
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(20, -10, -60); // Far behind, slightly offset
    cosmosGroup.add(planet);

    // Orbital Rings of the planet
    const ringGeometry = new THREE.TorusGeometry(35, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xdcc8a0,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 1.8;
    planet.add(ring);

    // 3. SHOOTING STARS
    const shootingStars = [];
    for(let i=0; i<3; i++) {
        const streakGeom = new THREE.BufferGeometry();
        const streakPos = new Float32Array([0,0,0, 0,0,0]);
        streakGeom.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
        const streakMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending
        });
        const streak = new THREE.Line(streakGeom, streakMat);
        streak.userData = {
            active: false,
            timer: Math.random() * 5, // random start delay
            p1: new THREE.Vector3(),
            p2: new THREE.Vector3(),
            speed: 0
        };
        cosmosGroup.add(streak);
        shootingStars.push(streak);
    }

    // LOAD MODEL
    const loader = new THREE.GLTFLoader();
    let logo;

    loader.load(
        'assets/3d/nouveaulogo.glb',
        (gltf) => {
            logo = gltf.scene;
            
            // Adjust materials for maximum gold reflection if needed
            logo.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Premium Champagne Gold / Titanium logic
                    if(child.material.color) {
                       child.material.color.setHex(0xdcc8a0); // Chic Pale Champagne Gold
                    }
                    child.material.metalness = 1.0;
                    child.material.roughness = 0.12; // Slight satin finish, not cheap mirror
                    child.material.envMapIntensity = 2.5;
                    child.material.needsUpdate = true;
                }
            });

            // Center the model geometry automatically
            const box = new THREE.Box3().setFromObject(logo);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Move mesh to perfectly center it
            logo.position.x += (logo.position.x - center.x);
            logo.position.y += (logo.position.y - center.y);
            logo.position.z += (logo.position.z - center.z);
            
            // Scale dynamically to fit more screen height and appear massive
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.4; // Reduced from 2.3 to zoom in significantly (massive scale)
            camera.position.z = cameraZ;

            // Offset slightly higher to balance the text at the bottom visually
            logo.position.y += maxDim * 0.1;
            
            scene.add(logo);
        },
        undefined,
        (error) => {
            console.error('An error happened while loading the 3D logo:', error);
        }
    );

    // ANIMATION LOOP
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        
        if (logo) {
            // Rotation continue sur l'axe Y (0.008 radians/frame comme demandé)
            logo.rotation.y += 0.008;
            
            // Effet de barrel roll : petite rotation sur l'axe Z ou X de manière fluide pour donner l'impression de chute en boucle
            // Un barrel roll élégant peut être simulé par un mouvement sinusoïdal sur X (tombait et revenait)
            logo.rotation.x = Math.sin(time * 0.5) * 0.2; // slight elegant pitch
            logo.rotation.z = Math.cos(time * 0.3) * 0.1; // slight elegant roll
            
            // Hover effect on Y to make it float dynamically
            logo.position.y += Math.sin(time * 1.5) * 0.002;
            
            // Mouse entering digital world: subtle zooming in and out pulsating
            camera.position.z += Math.sin(time * 0.8) * 0.01;
        }
        
        if (cosmosGroup) {
            // Subtle general rotation of the entire cosmos
            cosmosGroup.rotation.y += 0.0003;
            cosmosGroup.rotation.x += 0.0001;

            if (stars.material.uniforms) {
                stars.material.uniforms.time.value = time;
            }

            if (planet) {
                planet.rotation.y += 0.002;
                ring.rotation.z += 0.001;
            }

            // Shooting stars logic
            shootingStars.forEach(streak => {
                if(!streak.userData.active) {
                    streak.userData.timer -= 0.016;
                    if(streak.userData.timer <= 0) {
                        streak.userData.active = true;
                        streak.userData.speed = 2.0 + Math.random() * 2.5;
                        
                        // Start point (far top right usually)
                        const startX = 40 + Math.random() * 40;
                        const startY = 30 + Math.random() * 20;
                        const startZ = -20 - Math.random() * 40;
                        streak.userData.p1.set(startX, startY, startZ);
                        streak.userData.p2.copy(streak.userData.p1);
                        streak.material.opacity = 1.0;
                    }
                } else {
                    // Move across screen diagonally
                    const dir = new THREE.Vector3(-1, -0.6, 0.2).normalize();
                    streak.userData.p2.addScaledVector(dir, streak.userData.speed);
                    streak.userData.p1.addScaledVector(dir, streak.userData.speed * 0.95);
                    
                    const positions = streak.geometry.attributes.position.array;
                    positions[0] = streak.userData.p1.x; positions[1] = streak.userData.p1.y; positions[2] = streak.userData.p1.z;
                    positions[3] = streak.userData.p2.x; positions[4] = streak.userData.p2.y; positions[5] = streak.userData.p2.z;
                    streak.geometry.attributes.position.needsUpdate = true;
                    
                    streak.material.opacity -= 0.015;

                    if (streak.material.opacity <= 0 || streak.userData.p2.x < -80) {
                        streak.userData.active = false;
                        streak.userData.timer = 2 + Math.random() * 7;
                        streak.material.opacity = 0;
                    }
                }
            });
        }

        renderer.render(scene, camera);
    }
    animate();

    // RESIZE HANDLER
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // START INTERACTION
    const btnStart = document.getElementById("astra-btn-start");
    if (btnStart) {
        btnStart.addEventListener("click", () => {
            introOverlay.classList.add("is-fading-out");
            setTimeout(() => {
                document.body.classList.remove("has-intro-locked");
                if (introOverlay.parentNode) introOverlay.parentNode.removeChild(introOverlay);
            }, 1200);
        });
    }
});
