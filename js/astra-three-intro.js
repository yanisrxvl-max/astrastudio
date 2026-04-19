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

    // LIGHTING (As requested)
    // AmbientLight dorée douce (~0.3)
    const ambientLight = new THREE.AmbientLight(0xffd700, 0.3);
    scene.add(ambientLight);

    // DirectionalLight chaude positionnée en haut à droite (~intensity 2)
    const directionalLight = new THREE.DirectionalLight(0xffeedd, 2.0);
    directionalLight.position.set(5, 5, 2);
    scene.add(directionalLight);

    // PointLight chaleureuse sur le côté pour accentuer les reflets métalliques
    const pointLight = new THREE.PointLight(0xffa500, 1.5, 50);
    pointLight.position.set(-5, 0, 3);
    scene.add(pointLight);

    // Subtle fill light from bottom
    const fillLight = new THREE.DirectionalLight(0x444455, 0.5);
    fillLight.position.set(0, -5, 2);
    scene.add(fillLight);

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
                    // Enhance metallic feel
                    child.material.metalness = 1.0;
                    child.material.roughness = Math.max(0.1, child.material.roughness); 
                    child.material.envMapIntensity = 2.0;
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
        
        if (logo) {
            // Rotation continue sur l'axe Y (0.008 radians/frame comme demandé)
            logo.rotation.y += 0.008;
            
            // Effet de barrel roll : petite rotation sur l'axe Z ou X de manière fluide pour donner l'impression de chute en boucle
            // Un barrel roll élégant peut être simulé par un mouvement sinusoïdal sur X (tombait et revenait)
            const time = clock.getElapsedTime();
            logo.rotation.x = Math.sin(time * 0.5) * 0.2; // slight elegant pitch
            logo.rotation.z = Math.cos(time * 0.3) * 0.1; // slight elegant roll
            
            // Hover effect on Y to make it float
            logo.position.y = Math.sin(time * 1.5) * (camera.position.z * 0.015);
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
