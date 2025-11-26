// Variables globales
let scene, camera, renderer;
let ocean, beach, sun, waves, sunReflection;
let palmTrees = [];
let time = 0;
let canvas;

// --- VARIABLES PARA ANIMACIÓN ---
let animatedTulips = []; 
let animatedFlames = []; 
let animatedWines = [];
let cloudTextMsg;
let sparklers = [];

// --- VARIABLES DE AUDIO ---
let oceanAudio, musicAudio;
let audioCtx = null;

// INICIALIZACIÓN SEGURA
window.addEventListener('load', init);

// ============================================
// REEMPLAZA LA SECCIÓN DE AUDIO EN init() CON ESTO:
// ============================================

function init() {
    setupScene();
    
    if (typeof setupWelcomeAnimation === "function") { 
        setupWelcomeAnimation(); 
    }

    // 1. CAPTURAR AUDIO
    oceanAudio = document.getElementById('bg-ocean');
    musicAudio = document.getElementById('bg-music');
    
    if(oceanAudio) oceanAudio.volume = 0.4;
    if(musicAudio) musicAudio.volume = 0.5;

    const startBtn = document.getElementById('start-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    
    // --- EVENTO DE INICIO (CLIC BLINDADO CON TIEMPO DE GRACIA) ---
if(startBtn) {
    startBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        // 1. Despertar el motor de audio (Context Resume)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') {
                await ctx.resume().catch(error => console.error("Could not resume AudioContext:", error));
            }
        }

        welcomeScreen.classList.add('hidden');
        
        // 2. REPRODUCCIÓN SIMPLE Y DIRECTA
        if(oceanAudio) oceanAudio.play().catch(error => console.error("Fallo audio mar:", error));
        if(musicAudio) musicAudio.play().catch(error => console.error("Fallo audio música:", error));
        
        // --- LA SOLUCIÓN FINAL: DIFERIR ANIMATE() ---
        // Esperamos 10ms para darle prioridad al hilo de audio antes de iniciar el WebGL pesado.
        setTimeout(() => {
            animate();
            console.log("3D INICIADO después de estabilización de audio.");
        }, 100); // 100ms es un buen margen de seguridad
    });
}

    // --- CONTROL DE MUTE (Resto del código sigue igual) ---
    const muteBtn = document.getElementById('mute-btn');
    let isMuted = false;
    
    if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isMuted = !isMuted;
            if (isMuted) {
                if(oceanAudio) oceanAudio.volume = 0;
                if(musicAudio) musicAudio.volume = 0;
                muteBtn.textContent = "🔇";
            } else {
                if(oceanAudio) oceanAudio.volume = 0.4;
                if(musicAudio) musicAudio.volume = 0.5;
                muteBtn.textContent = "🔊";
            }
        });
    }

    // --- RESPONSIVE Y GESTOS ---
    onWindowResize(); 

    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    document.addEventListener('touchmove', function(e) {
        if (e.scale !== 1) { e.preventDefault(); }
    }, { passive: false });
}

// =============================================================================
// CONFIGURACIÓN DE ESCENA 3D
// =============================================================================
function setupScene() {
    scene = new THREE.Scene();

    // CÁMARA: FOV 75 para vista natural
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
    camera.position.set(0, 3, 6);

    canvas = document.getElementById("canvas3d");

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene.background = new THREE.Color(0xff8c5a);
    scene.fog = new THREE.Fog(0xff9068, 40, 120);

    // CREAR ELEMENTOS
    createSun();
    createBeach();
    createOcean();
    createWaves();
    createPalmTrees();
    createPicnic();
    createClouds();
    createPalmGrove();
    createCloudMessage();

    // LUCES
    const ambientLight = new THREE.AmbientLight(0xffa500, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffa500, 1);
    sunLight.position.set(0, 10, -30);
    scene.add(sunLight);
    const sunPointLight = new THREE.PointLight(0xffaa00, 2, 100);
    sunPointLight.position.set(0, 5, -40);
    scene.add(sunPointLight);

    setupCameraControls();
    window.addEventListener('resize', onWindowResize);
    
    updateCameraPosition(); 
}


// ======================================================
// --- NUEVA FUNCIÓN: ANIMACIÓN DE BIENVENIDA ---
// ======================================================
function setupWelcomeAnimation() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const heading = welcomeScreen.querySelector('h1');
    const paragraph = welcomeScreen.querySelector('p');
    const startBtn = document.getElementById('start-btn');

    // 1. Función auxiliar para dividir texto en palabras (spans)
    function splitTextToWords(element) {
        const text = element.innerText;
        // Dividir por espacios, pero respetando emojis si están pegados
        const words = text.split(' '); 
        element.innerHTML = ''; // Limpiar contenido original
        
        words.forEach(wordText => {
            if (wordText.trim() === '') return; // Ignorar espacios extra
            
            const span = document.createElement('span');
            span.textContent = wordText;
            span.classList.add('word');
            element.appendChild(span);
            // Añadir un espacio normal después de cada palabra
            element.appendChild(document.createTextNode(' ')); 
        });
    }

    // Aplicar la división al H1 y al P
    splitTextToWords(heading);
    splitTextToWords(paragraph);

    // 2. Secuenciar la animación
    const allWords = welcomeScreen.querySelectorAll('.word');
    let delayTime = 0.3; // Retraso inicial antes de empezar (segundos)
    const delayIncrement = 0.15; // Tiempo entre cada palabra (ajusta velocidad aquí)

    allWords.forEach((word, index) => {
        // Usamos setTimeout para aplicar la clase de animación secuencialmente
        setTimeout(() => {
            if (!welcomeScreen.classList.contains('skip-animation')) {
               word.classList.add('animate-word');
            }
        }, delayTime * 1000);
        
        delayTime += delayIncrement;
    });

    // 3. Aparecer el botón al final
    // El botón aparece un poco después de que la última palabra haya comenzado su animación
    const buttonDelay = delayTime + 0.4; 
    setTimeout(() => {
        if (!welcomeScreen.classList.contains('skip-animation')) {
            startBtn.style.opacity = '1';
            startBtn.style.transform = 'translateY(0)';
        }
    }, buttonDelay * 1000);


    // ======================================================
    // --- LÓGICA DE DOBLE TOQUE PARA SALTAR (SKIP) ---
    // ======================================================
    let lastTapTime = 0;
    
    welcomeScreen.addEventListener('touchstart', function(e) {
        // Si tocan el botón, no hacemos nada aquí (ya lo maneja su propio listener)
        if (e.target === startBtn || startBtn.contains(e.target)) return;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;

        // Si el segundo toque ocurre antes de 300ms, es un doble toque
        if (tapLength < 300 && tapLength > 0) {
            // ¡Doble toque detectado!
            welcomeScreen.classList.add('skip-animation');
            // Asegurar que el botón sea visible y clicable inmediatamente
            startBtn.style.opacity = '1';
            startBtn.style.transform = 'translateY(0)';
            
            e.preventDefault(); // Evitar zoom en algunos navegadores
        }
        lastTapTime = currentTime;
    });
}


function setupCameraControls() {
    // Variables para el zoom táctil
    let initialPinchDistance = 0;
    let isPinching = false;

    // --- MOUSE ---
    canvas.addEventListener("mousedown", (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        cameraRotation.horizontal += deltaX * 0.003;
        cameraRotation.vertical -= deltaY * 0.003;
        cameraRotation.horizontal = Math.max(-maxHorizontalAngle, Math.min(maxHorizontalAngle, cameraRotation.horizontal));
        cameraRotation.vertical = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, cameraRotation.vertical));
        updateCameraPosition();
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener("mouseup", () => { isDragging = false; });
    canvas.addEventListener("mouseleave", () => { isDragging = false; });

    // --- ZOOM CON RUEDA (PC) ---
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault(); // Evita que la página haga scroll
        
        // Ajustar radio (Zoom in/out)
        cameraRadius += e.deltaY * 0.01;
        
        // Límites del Zoom:
        // 4 = Muy cerca (Macro)
        // 25 = Ultra Gran Angular (Lo que pediste para ver todo)
        cameraRadius = Math.max(4, Math.min(10, cameraRadius));
        
        updateCameraPosition();
    }, { passive: false });


    // --- TOUCH (MÓVIL) ---
    canvas.addEventListener("touchstart", (e) => {
        // Prevenir comportamiento default si son 2 dedos
        if (e.touches.length === 2) {
            e.preventDefault(); 
            isDragging = false;
            isPinching = true;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        } else if (e.touches.length === 1) {
            isDragging = true;
            isPinching = false;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, { passive: false }); // IMPORTANTE: passive: false permite usar preventDefault

    canvas.addEventListener("touchmove", (e) => {
        // Bloquear scroll nativo al tocar el canvas
        if(e.cancelable) e.preventDefault(); 

        if (e.touches.length === 1 && isDragging) {
            const deltaX = e.touches[0].clientX - previousMousePosition.x;
            const deltaY = e.touches[0].clientY - previousMousePosition.y;
            cameraRotation.horizontal += deltaX * 0.003;
            cameraRotation.vertical -= deltaY * 0.003;
            cameraRotation.horizontal = Math.max(-maxHorizontalAngle, Math.min(maxHorizontalAngle, cameraRotation.horizontal));
            cameraRotation.vertical = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, cameraRotation.vertical));
            updateCameraPosition();
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } 
        else if (e.touches.length === 2 && isPinching) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            
            const diff = initialPinchDistance - currentDistance;
            
            // CAMBIO: Sensibilidad bajada de 0.05 a 0.02 para que sea más suave
            cameraRadius += diff * 0.02; 
            
            // CAMBIO: Límite estricto (Máximo 14). Si pones 25 se ve el vacío.
            cameraRadius = Math.max(4, Math.min(15, cameraRadius));
            
            updateCameraPosition();
            initialPinchDistance = currentDistance;
        }
    }, { passive: false }); // IMPORTANTE

    canvas.addEventListener("touchend", () => {
        isDragging = false;
        isPinching = false;
    });
}

// ============================================
// FUNCIÓN AUXILIAR: GENERAR TEXTURA DE SOL
// ============================================
// Crea un canvas 2D en memoria y dibuja un gradiente radial perfecto.

function generateSunTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Crear gradiente radial (x0, y0, r0, x1, y1, r1)
    // Desde el centro (256,256) radio 0, hasta el centro radio 256.
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);

    // --- DEFINIR LOS COLORES DEL DEGRADADO ---
    // Basado en tu imagen de referencia:
    // 0.0 (Centro): Blanco puro y brillante
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)'); 
    // 0.15: Amarillo muy intenso (el "núcleo" caliente)
    gradient.addColorStop(0.15, 'rgba(255, 255, 200, 1.0)');
    // 0.3: Dorado naranja brillante
    gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.9)'); 
    // 0.6: Naranja rojizo del atardecer, empieza a transparentarse
    gradient.addColorStop(0.6, 'rgba(255, 100, 20, 0.5)'); 
    // 1.0 (Borde): Totalmente transparente para que no haya corte
    gradient.addColorStop(1.0, 'rgba(255, 50, 0, 0.0)');

    // Dibujar el gradiente en el canvas
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);

    return canvas;
}

// ============================================
// SOL REALISTA Y BRILLANTE (MULTICAPA)
// ============================================

// ============================================
// SOL REALISTA (TIPO SPRITE / DEGRADADO)
// ============================================

function createSun() {
    // 1. Generamos la textura del gradiente
    const sunTexture = new THREE.CanvasTexture(generateSunTexture());

    // 2. Creamos el material del Sprite
    const sunMaterial = new THREE.SpriteMaterial({
        map: sunTexture,
        // CLAVE DEL ÉXITO: AdditiveBlending.
        // Hace que el color del sol se SUME al color del cielo detrás,
        // creando un efecto de luz intensa y brillante.
        blending: THREE.AdditiveBlending, 
        color: 0xffffff, // Color base blanco (se tiñe con la textura)
        transparent: true,
        depthWrite: false // No escribir en el buffer de profundidad para evitar glitches con objetos delante
    });

    // 3. Creamos el Sprite
    sun = new THREE.Sprite(sunMaterial);

    // 4. Escala y Posición
    // Los sprites son de 1x1 por defecto, hay que hacerlos MUY grandes
    // para que el degradado se vea suave y grande como en la foto.
    sun.scale.set(40, 40, 1); 
    
    sun.position.set(0, 5, -60); // Misma posición que antes
    
    scene.add(sun);

    // (Opcional) Si aún quieres la luz puntual que ilumina la escena, déjala aquí.
    // Si la quitaste del setupScene, descomenta esto:
    /*
    const sunPointLight = new THREE.PointLight(0xffaa00, 2, 150);
    sunPointLight.position.copy(sun.position);
    scene.add(sunPointLight);
    */
}



function createBeach() {
    const beachGeometry = new THREE.PlaneGeometry(150, 50, 60, 20);
    const beachMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        roughness: 0.95,
        metalness: 0
    });
    
    beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.rotation.x = -Math.PI / 2;
    beach.position.y = 0.05;
    beach.position.z = 25;
    
    const positions = beach.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const ripple = Math.sin(x * 0.1) * 0.08 + Math.cos(y * 0.15) * 0.05;
        positions.setZ(i, ripple);
    }
    positions.needsUpdate = true;
    
    scene.add(beach);
}

function createOcean() {
    const geometry = new THREE.PlaneGeometry(150, 120, 120, 120);
    const material = new THREE.MeshStandardMaterial({
        // El color rojo/naranja original del fondo
        color: 0xe74c3c,        
        roughness: 0.2,
        metalness: 0.5,
        
        // Brillo tomate/naranja para que combine con el cielo
        emissive: 0xff6347,
        emissiveIntensity: 0.3,
        
        transparent: false
    });
    
    ocean = new THREE.Mesh(geometry, material);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = 0;
    ocean.position.z = -40;
    ocean.renderOrder = 0;
    scene.add(ocean);
}

// ============================================
// CREACIÓN DE OLAS (ESTRUCTURA NUEVA + COLOR ATARDECER ANTIGUO)
// ============================================

function createWaves() {
    // Geometría de alta resolución para la forma parabólica
    const waveGeometry = new THREE.PlaneGeometry(160, 40, 120, 120);
    
    const waveMaterial = new THREE.MeshStandardMaterial({
        // Usamos el color base original que te gustaba (Coral/Rojizo)
        color: 0xff6b4a, 
        
        // Brillo naranja intenso para el sol
        emissive: 0xff5733,     
        emissiveIntensity: 0.4, 
        
        roughness: 0.1,         // Muy brillante
        metalness: 0.3,         // Un poco metálico para reflejos
        transparent: true,
        opacity: 0.8,
        vertexColors: true,     // Necesario para la espuma y el degradado
        side: THREE.DoubleSide
    });
    
    waves = new THREE.Mesh(waveGeometry, waveMaterial);
    waves.rotation.x = -Math.PI / 2;
    // Posición correcta para que llegue a las palmeras pero no al picnic
    waves.position.set(0, 0.15, 0); 
    
    // Pintar vértices iniciales
    const count = waveGeometry.attributes.position.count;
    const colors = [];
    const baseColor = new THREE.Color(0xff6b4a); 

    for (let i = 0; i < count; i++) {
        colors.push(baseColor.r, baseColor.g, baseColor.b);
    }
    
    waveGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    scene.add(waves);
}

function createPalmTrees() {
    const leftPalm = createPalmTree();
    leftPalm.position.set(-18, 0, 20);
    leftPalm.scale.set(2, 2, 2);
    leftPalm.rotation.y = 0.5;
    scene.add(leftPalm);
    palmTrees.push(leftPalm);
    
    const rightPalm = createPalmTree();
    rightPalm.position.set(18, 0, 20);
    rightPalm.scale.set(2, 2, 2);
    rightPalm.rotation.y = -0.5;
    scene.add(rightPalm);
    palmTrees.push(rightPalm);
}
// ============================================
// FUNCIÓN AUXILIAR: TEXTURA DE TRONCO (ANILLOS DIBUJADOS)
// ============================================
function createTrunkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 512; // Alto para dibujar varios anillos
    const ctx = canvas.getContext('2d');

    // Color base del tronco (Marrón)
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, 0, 64, 512);

    // Dibujar los anillos (Líneas horizontales con sombra)
    const numRings = 16; // Cantidad de anillos a lo largo del tronco
    const segmentHeight = 512 / numRings;

    for (let i = 0; i < numRings; i++) {
        const y = i * segmentHeight;

        // Crear un degradado para dar volumen (efecto "grueso")
        // De oscuro (surco) a claro (centro del segmento) a oscuro
        const grd = ctx.createLinearGradient(0, y, 0, y + segmentHeight);
        grd.addColorStop(0.0, '#3d2614'); // Surco oscuro (unión)
        grd.addColorStop(0.1, '#4a2e18'); // Sombra borde
        grd.addColorStop(0.5, '#7d522b'); // Centro más claro (volumen)
        grd.addColorStop(0.9, '#4a2e18'); // Sombra borde
        grd.addColorStop(1.0, '#3d2614'); // Surco oscuro

        ctx.fillStyle = grd;
        ctx.fillRect(0, y, 64, segmentHeight);
        
        // Línea fina extra oscura para marcar bien el anillo
        ctx.fillStyle = 'rgba(30, 15, 5, 0.5)';
        ctx.fillRect(0, y, 64, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}


// ============================================
// PALMERA FINAL (TRONCO CON TEXTURA DE ANILLOS HORIZONTALES)
// ============================================

function createPalmTree() {
    const palmGroup = new THREE.Group();
    
    // --- 1. TRONCO CURVO ---
    const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.3, 3, 0.2),
        new THREE.Vector3(0.5, 6, 0.3),
        new THREE.Vector3(0.6, 9, 0.4),
        new THREE.Vector3(0.7, 12, 0.5)
    ]);
    
    const trunkGeometry = new THREE.TubeGeometry(trunkCurve, 20, 0.5, 8, false);
    
    // Ajuste de radio (hacerlo cónico: ancho abajo, fino arriba)
    const positions = trunkGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const radiusScale = 1 - (y / 12) * 0.6; 
        positions.setX(i, positions.getX(i) * radiusScale);
        positions.setZ(i, positions.getZ(i) * radiusScale);
    }
    positions.needsUpdate = true;
    
    // --- 2. MATERIAL DEL TRONCO (CON TEXTURA ROTADA) ---
    // Generamos la textura
    const trunkTex = createTrunkTexture();
    
    // ROTACIÓN DE TEXTURA (SOLUCIÓN AL PROBLEMA VERTICAL)
    trunkTex.center.set(0.5, 0.5);   // 1. Definir el punto de pivote en el centro
    trunkTex.rotation = Math.PI / 2; // 2. Rotar 90 grados
    
    const trunkMaterial = new THREE.MeshStandardMaterial({ 
        map: trunkTex,           // Color base
        bumpMap: trunkTex,       // Relieve (da el efecto 3D a los anillos)
        bumpScale: 0.15,         // Profundidad del relieve
        roughness: 0.9,          // Aspecto mate/madera
        color: 0xffffff          // Blanco para no alterar los colores de la textura
    });

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    palmGroup.add(trunk);
    
    // --- 3. HOJAS REALISTAS ---
    const topPoint = trunkCurve.getPointAt(1);
    const numFronds = 12;

    for (let i = 0; i < numFronds; i++) {
        const angle = (i / numFronds) * Math.PI * 2;
        const frond = createRealisticPalmFrond();
        
        frond.position.copy(topPoint);
        frond.rotation.y = angle;
        // Pequeña variación aleatoria para que no se vea rígido
        frond.rotation.x = Math.random() * 0.2; 
        
        palmGroup.add(frond);
    }
    
    return palmGroup;
}

// ============================================
// HOJA DE PALMERA REALISTA (CURVA Y ORGÁNICA)
// ============================================

function createRealisticPalmFrond() {
    const frondGroup = new THREE.Group();

    // 1. CREAR LA CURVA DEL TALLO (Arquitectura de la hoja)
    // Definimos puntos que salen del centro y caen hacia abajo
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),       // Origen (pegado al tronco)
        new THREE.Vector3(0, 0.5, 1.0),   // Sube un poco al inicio
        new THREE.Vector3(0, 0.0, 3.0),   // Se extiende hacia afuera
        new THREE.Vector3(0, -1.5, 5.0),  // Empieza a caer
        new THREE.Vector3(0, -4.0, 6.5)   // Cae totalmente en la punta
    ]);

    // Creamos el tubo sólido siguiendo esa curva
    const stemGeometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x6aa84f, roughness: 0.8 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    frondGroup.add(stem);

    // 2. CREAR LOS FOLIOLOS (Las hojitas laterales)
    // Geometría simple de hoja alargada
    const leafletShape = new THREE.Shape();
    leafletShape.moveTo(0, 0);
    leafletShape.lineTo(0.15, 0.2);   // Ancho base
    leafletShape.lineTo(0.0, 1.5);    // Punta larga
    leafletShape.lineTo(-0.15, 0.2);  // Ancho base
    leafletShape.lineTo(0, 0);

    const leafletGeometry = new THREE.ShapeGeometry(leafletShape);
    const leafletMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2e7d32, 
        side: THREE.DoubleSide,
        roughness: 0.7
    });

    const numLeaflets = 30; // Cantidad de pares de hojas

    for (let i = 2; i < numLeaflets; i++) {
        // 't' es el progreso a lo largo de la curva (0 a 1)
        const t = i / numLeaflets;
        
        // Obtenemos la posición exacta en la curva y su dirección (tangente)
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();
        
        // Escala: Pequeñas en las puntas, grandes en el medio
        const size = Math.sin(t * Math.PI) * 0.8 + 0.3; 

        // --- HOJA IZQUIERDA ---
        const left = new THREE.Mesh(leafletGeometry, leafletMaterial);
        left.position.copy(point);
        left.scale.set(size, size, size);
        
        // TRUCO DE ORIENTACIÓN:
        // 1. Mirar hacia donde va el tallo
        left.lookAt(point.clone().add(tangent));
        // 2. Ajustar ángulos para que salgan en V
        left.rotateX(Math.PI / 2); // Acostar
        left.rotateZ(-0.7);        // Abrir hacia la izquierda
        left.rotateX(-0.2);        // Pequeña inclinación hacia adelante
        
        frondGroup.add(left);

        // --- HOJA DERECHA ---
        const right = new THREE.Mesh(leafletGeometry, leafletMaterial);
        right.position.copy(point);
        right.scale.set(size, size, size);
        
        right.lookAt(point.clone().add(tangent));
        right.rotateX(Math.PI / 2);
        right.rotateZ(0.7);        // Abrir hacia la derecha
        right.rotateX(-0.2);

        frondGroup.add(right);
    }

    return frondGroup;
}

////////////////////////////////////////////////////////////
// 🎥 CONTROL DE CÁMARA — PRIMERA PERSONA + ÓRBITA LIMITADA
////////////////////////////////////////////////////////////

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

let cameraRotation = {
    horizontal: 0,
    vertical: 0
};

// límites de movimiento
const maxHorizontalAngle = THREE.MathUtils.degToRad(20);  // ±60° → total 120°
const maxVerticalAngle   = THREE.MathUtils.degToRad(55);  // ±30° → total 60°

let cameraRadius = 6;  // distancia alrededor del picnic

// punto alrededor del cual la cámara orbita
const picnicPosition = new THREE.Vector3(0, 1, 36);



// ===========================
// Actualizar posición cámara
// ===========================
function updateCameraPosition() {

    const offsetX = Math.sin(cameraRotation.horizontal) * cameraRadius;
    const offsetZ = Math.cos(cameraRotation.horizontal) * cameraRadius;

    // Altura optimizada
    const baseHeight = 5; // Altura fija para ver la escena completa
    const heightOffset = Math.sin(cameraRotation.vertical) * 2;

    const height = baseHeight + heightOffset;

    camera.position.set(
        picnicPosition.x + offsetX,
        height,
        picnicPosition.z + offsetZ
    );

    camera.lookAt(picnicPosition);
}
function createPicnicTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");

    const tile = size / 8; // 8x8 cuadritos

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? "#ffc0cb" : "#ffffff";  
            ctx.fillRect(x * tile, y * tile, tile, tile);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
}

// ============================================
// FUNCIÓN PRINCIPAL: CREAR PICNIC COMPLETO
// ============================================

function createPicnic() {
    const picnicGroup = new THREE.Group();
    
    // 1. Manta
    createPicnicBlanket(picnicGroup);
    
    // 2. Centro
    createCake(picnicGroup);
    
    // 3. Frutas (Fila Frontal)
    createGrapesBowl(picnicGroup);      // Izquierda (-3.5)
    createWatermelonBowl(picnicGroup);  // Derecha (3.5)
    createMangoBowl(picnicGroup);       // Centro (0)
    
    // 4. Comida Salada (Fila Trasera)
    createPizza(picnicGroup);           // Derecha Fondo
    createSushiBoard(picnicGroup);      // Izquierda Fondo

    // 5. Bebidas (Intercaladas al frente)
    createWineSet(picnicGroup);         

    // 6. Decoración (NUEVO!)
    createTulipVase(picnicGroup);       // Florero detrás a la izquierda
    
    // Posicionar todo el picnic
    picnicGroup.position.copy(picnicPosition);
    scene.add(picnicGroup);
}

// ============================================
// PIZZA CON PEPPERONI V2 (DISTRIBUCIÓN MEJORADA Y TEXTURA REALISTA)
// ============================================

function createPizza(parent) {
    const pizzaGroup = new THREE.Group();

    // --- 1. TABLA DE MADERA ---
    const board = new THREE.Mesh(
        new THREE.CylinderGeometry(2.3, 2.3, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
    );
    board.position.y = 0.05;
    pizzaGroup.add(board);

    // --- 2. MASA REALISTA (BASE + BORDE) ---
    
    // Base de la masa (debajo del queso, color más claro)
    const doughBaseGeo = new THREE.CylinderGeometry(1.95, 1.95, 0.12, 32);
    const doughBaseMat = new THREE.MeshStandardMaterial({ 
        color: 0xf4d4a4, // Color masa cruda/beige claro
        roughness: 0.9   // Muy rugoso, como harina
    });
    const doughBase = new THREE.Mesh(doughBaseGeo, doughBaseMat);
    doughBase.position.y = 0.15;
    pizzaGroup.add(doughBase);

    // Borde/Costra (Anillo exterior más oscuro y grueso)
    const crustGeo = new THREE.TorusGeometry(1.95, 0.12, 16, 64); // Toroide para el borde inflado
    const crustMat = new THREE.MeshStandardMaterial({ 
        color: 0xc78b4f, // Marrón dorado tostado
        roughness: 1.0,  // Aspecto seco y crujiente
        metalness: 0.0
    });
    const crust = new THREE.Mesh(crustGeo, crustMat);
    crust.rotation.x = Math.PI / 2;
    crust.position.y = 0.18; // Un poco más alto que el queso
    pizzaGroup.add(crust);

    // Motas tostadas/burbujas en el borde (para textura)
    const speckGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const speckMat = new THREE.MeshStandardMaterial({ color: 0x6b3e11, roughness: 1 }); // Marrón oscuro casi quemado
    for(let i=0; i<30; i++) {
        const speck = new THREE.Mesh(speckGeo, speckMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.9 + Math.random() * 0.15; // En la zona del borde
        speck.position.set(Math.cos(angle)*radius, 0.25 + Math.random()*0.03, Math.sin(angle)*radius);
        speck.scale.set(1 + Math.random(), 0.5, 1 + Math.random()); // Aplastadas e irregulares
        pizzaGroup.add(speck);
    }


    // --- 3. QUESO Y SALSA ---
    const cheeseGeometry = new THREE.CylinderGeometry(1.85, 1.85, 0.14, 32);
    const cheeseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffcc33,
        roughness: 0.5, // Menos brillo plástico
        emissive: 0xffaa00,
        emissiveIntensity: 0.15 // Un poco más de "grasa" brillante
    });
    const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
    cheese.position.y = 0.17;
    pizzaGroup.add(cheese);


    // --- 4. PEPPERONIS (DISTRIBUCIÓN UNIFORME REALISTA) ---
    const pepGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 16); // Un poco más pequeños
    const pepMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xb22222, // Rojo más oscuro y carnoso
        roughness: 0.6,
        metalness: 0.1
    });

    const numPepperonis = 22; // Más cantidad
    const maxPepRadius = 1.7; // Hasta casi el borde del queso

    for (let i = 0; i < numPepperonis; i++) {
        const pepperoni = new THREE.Mesh(pepGeometry, pepMaterial);
        
        // TRUCO MATEMÁTICO PARA DISTRIBUCIÓN UNIFORME:
        // Usamos la raíz cuadrada del random para el radio. 
        // Esto compensa que hay más área en los anillos exteriores, evitando que se agrupen en el centro.
        const rScaled = Math.sqrt(Math.random()); 
        const dist = rScaled * maxPepRadius;
        const angle = Math.random() * Math.PI * 2;
        
        pepperoni.position.set(
            Math.cos(angle) * dist,
            0.18 + Math.random() * 0.015, // Variación de altura para que no queden planos
            Math.sin(angle) * dist
        );

        // Variación realista
        pepperoni.rotation.y = Math.random() * Math.PI; // Giro aleatorio
        pepperoni.rotation.x = (Math.random() - 0.5) * 0.1; // Leve inclinación (no están perfectamente planos)
        pepperoni.rotation.z = (Math.random() - 0.5) * 0.1;
        const scaleVar = 0.85 + Math.random() * 0.3; // Variación de tamaño
        pepperoni.scale.set(scaleVar, 1, scaleVar);

        pizzaGroup.add(pepperoni);
    }

    // --- 5. CORTES DE REBANADA ---
    const cutGeometry = new THREE.BoxGeometry(3.8, 0.2, 0.03); // Cortes finos y oscuros
    const cutMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2c17, roughness: 1.0 }); // Color tostado oscuro

    for (let i = 0; i < 4; i++) {
        const cut = new THREE.Mesh(cutGeometry, cutMaterial);
        const angle = (i / 4) * Math.PI + (Math.PI/8); // Offset para no cortar pepperonis rectos
        cut.rotation.y = angle;
        cut.position.y = 0.17; 
        pizzaGroup.add(cut);
    }

    // POSICIÓN FINAL EN LA ESCENA
    pizzaGroup.position.set(3.8, 0.1, -0.5); 
    pizzaGroup.rotation.y = Math.random();
    
    parent.add(pizzaGroup);
}

// ============================================
// SET DE VINO (ANIMADO Y SEPARADO)
// ============================================

function createWineSet(parent) {
    // Limpiamos la lista de animación
    animatedWines = [];

    const wineGroup = new THREE.Group();

    // --- 1. MATERIALES VISIBLES ---
    const bottleGlassMat = new THREE.MeshStandardMaterial({
        color: 0x1a2b3c, roughness: 0.2, metalness: 0.4,
        transparent: true, opacity: 0.9, side: THREE.DoubleSide
    });
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.1, metalness: 0.1,
        transparent: true, opacity: 0.3, side: THREE.DoubleSide
    });
    const wineMat = new THREE.MeshStandardMaterial({
        color: 0x720e1e, emissive: 0x220000, roughness: 0.2, metalness: 0.0,
        transparent: true, opacity: 0.85, side: THREE.DoubleSide
    });

    // --- 2. BOTELLA (Igual) ---
    const bottle = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 32), bottleGlassMat);
    body.position.y = 0.6; bottle.add(body);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), bottleGlassMat);
    shoulder.position.y = 1.2; bottle.add(shoulder);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 32), bottleGlassMat);
    neck.position.y = 1.5; bottle.add(neck);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 }));
    cork.position.y = 1.8; bottle.add(cork);
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.6, 32, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf5e6d3, side: THREE.DoubleSide }));
    label.position.set(0, 0.6, 0); label.rotation.y = -Math.PI / 2; bottle.add(label);

    bottle.position.set(-2.0, 0.1, 3.2); 
    bottle.rotation.y = 0.2;
    wineGroup.add(bottle);

    // --- 3. COPAS ---
    const glassPoints = []; // Perfil Copa
    glassPoints.push(new THREE.Vector2(0.02, 0.0));
    glassPoints.push(new THREE.Vector2(0.15, 0.05));
    glassPoints.push(new THREE.Vector2(0.32, 0.20));
    glassPoints.push(new THREE.Vector2(0.34, 0.35));
    glassPoints.push(new THREE.Vector2(0.28, 0.55));
    const bowlGeometry = new THREE.LatheGeometry(glassPoints, 32);

    const winePoints = []; // Perfil Vino
    winePoints.push(new THREE.Vector2(0.0, 0.0));
    winePoints.push(new THREE.Vector2(0.14, 0.05)); 
    winePoints.push(new THREE.Vector2(0.33, 0.28)); 
    const wineGeometry = new THREE.LatheGeometry(winePoints, 32);

    for (let i = 0; i < 2; i++) {
        const glass = new THREE.Group();

        // Cristal
        const bowl = new THREE.Mesh(bowlGeometry, glassMat);
        bowl.position.y = 0.55; bowl.renderOrder = 2; glass.add(bowl);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 16), glassMat);
        stem.position.y = 0.275; glass.add(stem);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.01, 32), glassMat);
        base.position.y = 0.005; glass.add(base);

        // Líquido Cuerpo
        const liquid = new THREE.Mesh(wineGeometry, wineMat);
        liquid.position.y = 0.56; liquid.scale.set(0.92, 0.92, 0.92); liquid.renderOrder = 1; 
        glass.add(liquid);

        // --- SUPERFICIE ANIMADA (MENISCO) ---
        const liquidTop = new THREE.Mesh(new THREE.CircleGeometry(0.30, 32), wineMat);
        liquidTop.rotation.x = -Math.PI / 2; // Acostado plano
        liquidTop.position.y = 0.83; 
        liquidTop.renderOrder = 1;
        
        // Guardamos datos para la animación
        liquidTop.userData.initialRot = liquidTop.rotation.clone();
        liquidTop.userData.phaseOffset = i * 2; // Desfase para que no se muevan igual
        
        animatedWines.push(liquidTop); // Agregar a la lista global
        glass.add(liquidTop);

        // Posiciones
        if (i === 0) { glass.position.set(-1.1, 0.1, 3.4); } 
        else { glass.position.set(2.0, 0.1, 3.2); }
        
        wineGroup.add(glass);
    }

    wineGroup.position.set(0, 0, 0);
    parent.add(wineGroup);
}

// ============================================
// FLORERO ALTO CON RAMO REALISTA (ANIMADO)
// ============================================

function createTulipVase(parent) {
    // Limpiamos la lista por seguridad
    animatedTulips = []; 

    const vaseGroup = new THREE.Group();

    // --- A. FLORERO DE CERÁMICA (PERFIL ALTO) ---
    const vaseProfile = [
        new THREE.Vector2(0.35, 0.0),  // Base
        new THREE.Vector2(0.55, 0.3),  // Panza
        new THREE.Vector2(0.30, 1.0),  // Cuello estrecho
        new THREE.Vector2(0.40, 1.5)   // Borde superior
    ];
    const vaseGeometry = new THREE.LatheGeometry(vaseProfile, 32);
    const vaseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.1, metalness: 0.0,
        clearcoat: 1.0, clearcoatRoughness: 0.05, side: THREE.DoubleSide
    });
    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
    vaseGroup.add(vase);

    // --- B. MATERIALES Y GEOMETRÍAS ---
    const tulipColor = 0xff8a65; const stemColor = 0x4a7c2d; const leafColor = 0x558b38;
    
    // Geometrías reutilizables
    const petalShape = new THREE.Shape(); petalShape.moveTo(0, 0); petalShape.quadraticCurveTo(0.12, 0.25, 0.06, 0.6); petalShape.quadraticCurveTo(0, 0.65, -0.06, 0.6); petalShape.quadraticCurveTo(-0.12, 0.25, 0, 0);
    const petalGeo = new THREE.ExtrudeGeometry(petalShape, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2 });
    const petalMat = new THREE.MeshStandardMaterial({ color: tulipColor, roughness: 0.5, side: THREE.DoubleSide });
    
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.2, 0.3, 0.15, 0.8); leafShape.quadraticCurveTo(0, 1.0, -0.15, 0.8); leafShape.quadraticCurveTo(-0.2, 0.3, 0, 0);
    const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.01, bevelEnabled: false });
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.7, side: THREE.DoubleSide });
    
    const stemMat = new THREE.MeshStandardMaterial({ color: stemColor, roughness: 0.8 });

    // --- C. FUNCIÓN PARA CREAR UN TULIPÁN ---
    function createSingleTulip(heightScale) {
        const tulip = new THREE.Group();
        const stemLen = 1.3 * heightScale;
        
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, stemLen, 12), stemMat);
        stem.position.y = stemLen / 2; tulip.add(stem);
        
        const head = new THREE.Group();
        for (let j = 0; j < 6; j++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const angle = (j / 6) * Math.PI * 2; petal.position.set(Math.cos(angle)*0.05, 0, Math.sin(angle)*0.05);
            petal.rotation.order = 'YXZ'; petal.rotation.y = angle + Math.PI/2; petal.rotation.x = -0.15; head.add(petal);
        }
        head.position.y = stemLen; head.scale.setScalar(0.8 + Math.random() * 0.2); tulip.add(head);
        
        const numLeaves = 1 + Math.floor(Math.random() * 1.5); 
        for (let k = 0; k < numLeaves; k++) {
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            const leafAngle = Math.random() * Math.PI * 2; 
            const leafHeight = stemLen * (0.6 + Math.random() * 0.3); // Altura segura
            leaf.position.set(Math.cos(leafAngle)*0.02, leafHeight, Math.sin(leafAngle)*0.02);
            leaf.rotation.order = 'YXZ'; leaf.rotation.y = leafAngle + Math.PI/2; leaf.rotation.x = -0.3 - Math.random() * 0.3; leaf.scale.setScalar(0.6 + Math.random() * 0.2); tulip.add(leaf);
        }
        return tulip;
    }

    // --- D. DISTRIBUCIÓN Y REGISTRO PARA ANIMACIÓN ---
    const layers = [
        { count: 5,  radius: 0.04, incline: 0.1 }, 
        { count: 7,  radius: 0.09, incline: 0.25 }, 
        { count: 8,  radius: 0.14, incline: 0.4 }
    ];

    layers.forEach((layer, layerIdx) => {
        for (let i = 0; i < layer.count; i++) {
            const angle = (i / layer.count) * Math.PI * 2 + (layerIdx * 0.5); 
            const hScale = 1.0 + (Math.random() - 0.5) * 0.1;
            const tulip = createSingleTulip(hScale);

            const pivotY = 0.6; // Pivote alto para no atravesar
            tulip.position.set(Math.cos(angle) * layer.radius, pivotY + Math.random() * 0.1, Math.sin(angle) * layer.radius);

            const inclineAngle = layer.incline + (Math.random() - 0.5) * 0.1;
            const rotAxis = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle));
            tulip.rotateOnAxis(rotAxis, inclineAngle);
            tulip.rotation.y += Math.random() * Math.PI;

            // === GUARDAR DATOS PARA ANIMACIÓN ===
            tulip.userData.initialRotation = tulip.rotation.clone();
            tulip.userData.phaseOffset = Math.random() * Math.PI * 2; 
            
            animatedTulips.push(tulip); // Guardar en la lista global
            
            vaseGroup.add(tulip);
        }
    });

    // Posición final
    vaseGroup.position.set(-2.5, 0, -2.5);
    vaseGroup.scale.set(1.3, 1.3, 1.3);
    parent.add(vaseGroup);
}

// ============================================
// TABLA DE SUSHI/MAKIS (LADO IZQUIERDO)
// ============================================

function createSushiBoard(parent) {
    const sushiGroup = new THREE.Group();

    // 1. TABLA DE MADERA RECTANGULAR
    const boardGeometry = new THREE.BoxGeometry(3.5, 0.2, 2.2);
    const boardMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xd2b48c, // Madera clara (Bambú)
        roughness: 0.6 
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.y = 0.1;
    sushiGroup.add(board);

    // Patas de la tabla
    const legGeo = new THREE.BoxGeometry(3.5, 0.1, 0.2);
    const leg1 = new THREE.Mesh(legGeo, boardMaterial);
    leg1.position.set(0, 0, 0.8);
    sushiGroup.add(leg1);
    const leg2 = leg1.clone();
    leg2.position.set(0, 0, -0.8);
    sushiGroup.add(leg2);

    // 2. MAKIS (Rollos)
    const makiRadius = 0.35;
    const makiHeight = 0.35;
    
    // Materiales
    const riceMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const noriMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const salmonMaterial = new THREE.MeshStandardMaterial({ color: 0xff7f50 });
    const avocadoMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90 });

    // Crear 2 filas de 3 makis
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            const maki = new THREE.Group();
            
            // Arroz (Cilindro principal)
            const rice = new THREE.Mesh(
                new THREE.CylinderGeometry(makiRadius, makiRadius, makiHeight, 20),
                riceMaterial
            );
            maki.add(rice);
            
            // Nori (Cilindro exterior, un poco más ancho)
            // Usamos un cilindro hueco (Torus o cilindro abierto) o simplemente un cilindro negro un poco más grande
            // Para simplificar, un cilindro negro ligeramente más grande y corto
            const nori = new THREE.Mesh(
                new THREE.CylinderGeometry(makiRadius + 0.02, makiRadius + 0.02, makiHeight - 0.02, 20, 1, true),
                noriMaterial
            );
            maki.add(nori);
            
            // Relleno (Salmon y Palta en el centro superior)
            const filling1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.15), salmonMaterial);
            filling1.position.y = makiHeight/2 + 0.001;
            maki.add(filling1);
            
            const filling2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1), avocadoMaterial);
            filling2.position.set(0.1, makiHeight/2 + 0.001, 0.05);
            maki.add(filling2);

            // Posicionar maki en la tabla
            const xPos = (col - 1) * 1.0;
            const zPos = (row - 0.5) * 0.9;
            maki.position.set(xPos, 0.38, zPos);
            
            sushiGroup.add(maki);
        }
    }

    // 3. PEGO DE WASABI
    const wasabi = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x7cfc00, roughness: 0.5 })
    );
    wasabi.scale.set(1, 0.6, 1); // Aplastado
    wasabi.position.set(1.4, 0.25, -0.7);
    sushiGroup.add(wasabi);

    // POSICIÓN: A la izquierda de la torta, detrás de las uvas
    // Grapes estaban en (-3.5, 0, 2.5), ponemos esto en Z=0 aprox
    sushiGroup.position.set(-3.8, 0.05, -0.5);
    sushiGroup.rotation.y = 0.2; // Ligeramente girado hacia el centro

    parent.add(sushiGroup);
}

// ============================================
// MANTA DEL PICNIC (CELESTE Y BLANCO)
// ============================================

function createPicnicBlanket(parent) {
    // Crear textura de patrón cuadros blanco/celeste
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    
    const squares = 16; // 16x16 cuadros
    const squareSize = size / squares;
    
    for (let y = 0; y < squares; y++) {
        for (let x = 0; x < squares; x++) {
            // CAMBIO: Aquí definimos el color CELESTE (#87CEEB) y BLANCO
            ctx.fillStyle = (x + y) % 2 === 0 ? "#87CEEB" : "#ffffff";
            ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
        }
    }
    
    // Agregar borde decorativo
    // CAMBIO: Un azul un poco más fuerte para el borde
    ctx.strokeStyle = "#007FFF"; 
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, size - 8, size - 8);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    
    // Geometría de la manta con ondulaciones sutiles
    const blanketGeometry = new THREE.PlaneGeometry(14, 14, 30, 30);
    const blanketMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.DoubleSide
    });
    
    const blanket = new THREE.Mesh(blanketGeometry, blanketMaterial);
    blanket.rotation.x = -Math.PI / 2;
    blanket.position.y = 0.12; // Ligeramente sobre la arena
    
    // Agregar ondulaciones sutiles a la manta (para que parezca tela sobre arena)
    const positions = blanket.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const wave = Math.sin(x * 0.3) * 0.02 + Math.cos(y * 0.3) * 0.02;
        positions.setZ(i, wave);
    }
    positions.needsUpdate = true;
    
    parent.add(blanket);
}
// ============================================
// FUNCIÓN AUXILIAR: TEXTURA DE CHISPA
// ============================================
function createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Gradiente radial para que parezca un destello
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');   // Centro blanco
    grad.addColorStop(0.4, 'rgba(255, 240, 100, 1)'); // Halo dorado
    grad.addColorStop(1, 'rgba(255, 100, 0, 0)');     // Borde transparente
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}

// ============================================
// CREAR VELA BENGALA (CORREGIDA: APOYADA EN LA BASE)
// ============================================
function createSparkler(parent, position) {
    const candleHeight = 0.8;

    // 1. El cuerpo de la vela (Cilindro metálico/gris)
    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, candleHeight, 16);
    
    // --- CORRECCIÓN CLAVE ---
    // Movemos la geometría hacia arriba la mitad de su altura.
    // Ahora el punto (0,0,0) de la vela es SU BASE, no su centro.
    bodyGeo.translate(0, candleHeight / 2, 0); 

    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0x111111
    });
    const candle = new THREE.Mesh(bodyGeo, bodyMat);
    
    // Ahora 'position' indica dónde se apoya la BASE de la vela.
    candle.position.copy(position);
    
    // (Eliminamos el ajuste manual de Y que teníamos antes, ya no es necesario)
    // candle.position.y += 0.4; <--- BORRADO

    parent.add(candle);

    // 2. SISTEMA DE PARTÍCULAS
    const particleCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const particleData = [];

    // La punta de la vela ahora está a la altura total (0.8) desde la base
    const tipHeight = candleHeight; 

    for (let i = 0; i < particleCount; i++) {
        // Inicializar en la punta (Y = 0.8 local)
        positions[i*3] = 0; positions[i*3+1] = tipHeight; positions[i*3+2] = 0;
        
        particleData.push({
            velocity: new THREE.Vector3(),
            life: -1
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        map: createSparkTexture(), 
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });

    const sparks = new THREE.Points(geometry, material);
    candle.add(sparks); 

    sparklers.push({
        mesh: sparks,
        data: particleData,
        geometry: geometry,
        baseY: tipHeight // Usamos la nueva altura de la punta para el "respawn"
    });
}

// ============================================
// TORTA DE 3 PISOS CON VELAS ANIMADAS Y BENGALA
// ============================================

function createCake(parent) {
    const cakeGroup = new THREE.Group();
    
    animatedFlames = []; 
    sparklers = []; 

    const pink = 0xffb3d9; const lightPink = 0xffd4e5; const white = 0xffffff; const cream = 0xfff5e6; const pastelYellow = 0xfff9e6;

    // --- PISOS (Sin cambios) ---
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.8, 64), new THREE.MeshStandardMaterial({ color: lightPink, roughness: 0.6, metalness: 0.05 }));
    base1.position.y = 0.48; cakeGroup.add(base1);
    const cream1 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.12, 16, 64), new THREE.MeshStandardMaterial({ color: cream, roughness: 0.3 }));
    cream1.position.y = 0.90; cream1.rotation.x = Math.PI / 2; cakeGroup.add(cream1);
    for (let i = 0; i < 24; i++) { const angle = (i / 24) * Math.PI * 2; const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), new THREE.MeshStandardMaterial({ color: cream })); pearl.position.set(Math.cos(angle) * 1.8, 0.13, Math.sin(angle) * 1.8); cakeGroup.add(pearl); }
    
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.7, 64), new THREE.MeshStandardMaterial({ color: white, roughness: 0.6, metalness: 0.05 }));
    base2.position.y = 1.28; cakeGroup.add(base2);
    const cream2 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.1, 16, 64), new THREE.MeshStandardMaterial({ color: pink, roughness: 0.3 }));
    cream2.position.y = 1.66; cream2.rotation.x = Math.PI / 2; cakeGroup.add(cream2);
    for (let i = 0; i < 18; i++) { const angle = (i / 18) * Math.PI * 2; const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshStandardMaterial({ color: pink })); pearl.position.set(Math.cos(angle) * 1.3, 0.93, Math.sin(angle) * 1.3); cakeGroup.add(pearl); }
    
    const base3 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.6, 64), new THREE.MeshStandardMaterial({ color: pink, roughness: 0.6, metalness: 0.05 }));
    base3.position.y = 1.93; cakeGroup.add(base3);
    const cream3 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 16, 64), new THREE.MeshStandardMaterial({ color: cream, roughness: 0.3 }));
    cream3.position.y = 2.26; cream3.rotation.x = Math.PI / 2; cakeGroup.add(cream3);
    
    // --- VELAS NORMALES (Sin cambios) ---
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2; const radius = 0.7;
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16), new THREE.MeshStandardMaterial({ color: pastelYellow, roughness: 0.6, metalness: 0.1 }));
        candle.position.set(Math.cos(angle) * radius, 2.5, Math.sin(angle) * radius); cakeGroup.add(candle);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
        flame.position.set(Math.cos(angle) * radius, 2.72, Math.sin(angle) * radius); flame.scale.y = 1.3;
        flame.userData.initialPos = flame.position.clone(); flame.userData.phaseOffset = Math.random() * Math.PI * 2; animatedFlames.push(flame);
        cakeGroup.add(flame);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4 })); flame.add(glow);
    }
    for (let i = 0; i < 11; i++) {
        const angle = (i / 11) * Math.PI * 2; const radius = 1.15;
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16), new THREE.MeshStandardMaterial({ color: pastelYellow, roughness: 0.6, metalness: 0.1 }));
        candle.position.set(Math.cos(angle) * radius, 1.7, Math.sin(angle) * radius); cakeGroup.add(candle);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
        flame.position.set(Math.cos(angle) * radius, 1.92, Math.sin(angle) * radius); flame.scale.y = 1.3;
        flame.userData.initialPos = flame.position.clone(); flame.userData.phaseOffset = Math.random() * Math.PI * 2; animatedFlames.push(flame);
        cakeGroup.add(flame);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4 })); flame.add(glow);
    }
    
    // =========================================
    // CORRECCIÓN: POSICIÓN EXACTA DE LA BENGALA
    // =========================================
    // La superficie superior del último piso está en Y = 1.93 + 0.3 = 2.23
    // Como hemos ajustado el pivote de la vela a su base, usamos esta altura exacta.
    createSparkler(cakeGroup, new THREE.Vector3(0, 2.23, 0)); 
    
    parent.add(cakeGroup);
}

// ============================================
// TAZÓN DE CRISTAL AZULINO (REUTILIZABLE)
// ============================================

function createGlassBowl() {
    const bowlGroup = new THREE.Group();
    
    // Bowl de cristal azulino transparente
    const bowlGeometry = new THREE.SphereGeometry(0.9, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const bowlMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xadd8e6,        // Azul claro
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9,      // Alta transmisión para vidrio
        thickness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide
    });
    
    const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
    bowl.position.y = 0.15;
    bowlGroup.add(bowl);
    
    // Borde del bowl (más grueso)
    const rimGeometry = new THREE.TorusGeometry(0.9, 0.08, 16, 64);
    const rimMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xadd8e6,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.8,
        clearcoat: 1.0
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 0.15;
    rim.rotation.x = Math.PI / 2;
    bowlGroup.add(rim);
    
    return bowlGroup;
}

// ============================================
// TAZÓN DE UVAS (VERDES)
// ============================================

function createGrapesBowl(parent) {
    const bowlGroup = createGlassBowl();
    
    // CAMBIO: Nuevos materiales en tonos VERDES
    const grapeMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x8DB600, roughness: 0.3, metalness: 0.2 }), // Verde manzana
        new THREE.MeshStandardMaterial({ color: 0xA4C639, roughness: 0.3, metalness: 0.2 }), // Verde lima apagado
        new THREE.MeshStandardMaterial({ color: 0x77DD77, roughness: 0.3, metalness: 0.2 }), // Verde pastel
        new THREE.MeshStandardMaterial({ color: 0x6B8E23, roughness: 0.3, metalness: 0.2 })  // Verde oliva
    ];
    
    // Crear múltiples racimos de uvas (15-20 uvas por montón)
    for (let cluster = 0; cluster < 4; cluster++) {
        const clusterGroup = new THREE.Group();
        
        // Cada racimo tiene varias capas
        const layers = [
            { count: 3, radius: 0 },
            { count: 5, radius: 0.15 },
            { count: 6, radius: 0.3 },
            { count: 4, radius: 0.15 }
        ];
        
        let yPos = 0.3;
        
        layers.forEach((layer) => {
            for (let i = 0; i < layer.count; i++) {
                const angle = (i / layer.count) * Math.PI * 2 + (cluster * Math.PI / 2);
                const grape = new THREE.Mesh(
                    new THREE.SphereGeometry(0.09, 16, 16),
                    grapeMaterials[Math.floor(Math.random() * grapeMaterials.length)]
                );
                
                grape.position.set(
                    Math.cos(angle) * layer.radius,
                    yPos + (Math.random() * 0.05),
                    Math.sin(angle) * layer.radius
                );
                
                // Brillo en cada uva
                const highlight = new THREE.Mesh(
                    new THREE.SphereGeometry(0.03, 8, 8),
                    new THREE.MeshBasicMaterial({ 
                        color: 0xffffff, 
                        transparent: true, 
                        opacity: 0.7 
                    })
                );
                highlight.position.set(-0.03, 0.04, 0.05);
                grape.add(highlight);
                
                clusterGroup.add(grape);
            }
            yPos += 0.12;
        });
        
        // Posicionar cada racimo dentro del bowl
        const clusterAngle = (cluster / 4) * Math.PI * 2;
        clusterGroup.position.set(
            Math.cos(clusterAngle) * 0.3,
            0,
            Math.sin(clusterAngle) * 0.3
        );
        
        bowlGroup.add(clusterGroup);
    }
    
    // Posicionar a la izquierda, más cerca de la cámara
    bowlGroup.position.set(-3.5, 0, 2.5);
    parent.add(bowlGroup);
}

// ============================================
// TAZÓN DE SANDÍAS (APILADAS Y ORDENADAS)
// ============================================

function createWatermelonBowl(parent) {
    const bowlGroup = createGlassBowl();
    
    // --- CONFIGURACIÓN DE GEOMETRÍA ---
    const radius = 0.4;        
    const angle = Math.PI / 3; // 60 grados
    const thickness = 0.12;    // Grosor de la rebanada
    
    const extrudeSettings = {
        steps: 1,
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 32
    };

    // --- CONFIGURACIÓN DE LAS 3 COLUMNAS ---
    // Definimos las posiciones X y Z base para las 3 torres
    const columnPositions = [
        { x: -0.35, z: 0.1 }, // Columna Izquierda
        { x: 0,     z: -0.1}, // Columna Centro (un poco más atrás para dar profundidad)
        { x: 0.35,  z: 0.1 }  // Columna Derecha
    ];

    // Vamos a crear 9 sandías (3 por columna para que quede equilibrado)
    const totalSlices = 9;

    for (let i = 0; i < totalSlices; i++) {
        const sliceGroup = new THREE.Group();
        
        // 1. CREAR LA PULPA ROJA
        const redRadius = radius - 0.05;
        const redShape = new THREE.Shape();
        redShape.moveTo(0, 0);
        redShape.lineTo(redRadius, 0);
        redShape.absarc(0, 0, redRadius, 0, angle, false);
        redShape.lineTo(0, 0);
        
        const redGeometry = new THREE.ExtrudeGeometry(redShape, extrudeSettings);
        const redMesh = new THREE.Mesh(redGeometry, new THREE.MeshStandardMaterial({
            color: 0xff1744, roughness: 0.3, metalness: 0.0, side: THREE.DoubleSide
        }));

        // 2. CREAR LAS SEMILLAS (Hijas de la pulpa)
        for(let s=0; s<8; s++) { 
            const seedGeo = new THREE.SphereGeometry(0.012, 8, 8); 
            seedGeo.scale(1, 1.5, 0.3); 
            const seed = new THREE.Mesh(seedGeo, new THREE.MeshStandardMaterial({color: 0x111111}));
            
            const r = (Math.random() * (redRadius - 0.15)) + 0.05; 
            const t = (Math.random() * (angle - 0.2)) + 0.1;
            const isFront = Math.random() > 0.5;
            const zPos = isFront ? thickness : 0; 
            
            seed.position.set(Math.cos(t)*r, Math.sin(t)*r, zPos);
            seed.rotation.z = t - Math.PI/2;
            seed.rotation.x = (Math.random() - 0.5) * 0.5;
            redMesh.add(seed);
        }
        sliceGroup.add(redMesh);

        // 3. CREAR LA PARTE BLANCA
        const whiteOuter = radius - 0.02;
        const whiteInner = redRadius;
        const whiteShape = new THREE.Shape();
        whiteShape.moveTo(whiteInner, 0);
        whiteShape.lineTo(whiteOuter, 0);
        whiteShape.absarc(0, 0, whiteOuter, 0, angle, false);
        whiteShape.lineTo(Math.cos(angle) * whiteInner, Math.sin(angle) * whiteInner);
        whiteShape.absarc(0, 0, whiteInner, angle, 0, true);
        const whiteMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(whiteShape, extrudeSettings), new THREE.MeshStandardMaterial({color: 0xe8f5e9, roughness: 0.9}));
        sliceGroup.add(whiteMesh);

        // 4. CREAR LA CÁSCARA VERDE
        const greenOuter = radius;
        const greenInner = whiteOuter;
        const greenShape = new THREE.Shape();
        greenShape.moveTo(greenInner, 0);
        greenShape.lineTo(greenOuter, 0);
        greenShape.absarc(0, 0, greenOuter, 0, angle, false);
        greenShape.lineTo(Math.cos(angle) * greenInner, Math.sin(angle) * greenInner);
        greenShape.absarc(0, 0, greenInner, angle, 0, true);
        const greenMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(greenShape, extrudeSettings), new THREE.MeshStandardMaterial({color: 0x1b5e20, roughness: 0.8}));
        sliceGroup.add(greenMesh);

        // --- AJUSTE DE CENTRO DE MASA ---
        // Centramos las piezas para que al rotar el grupo, roten sobre su propio centro
        const centerOffset = radius / 1.5;
        const zOffset = -thickness / 2;
        
        // Aplicamos el offset a las mallas internas
        redMesh.position.set(-centerOffset, -centerOffset, zOffset);
        whiteMesh.position.set(-centerOffset, -centerOffset, zOffset);
        greenMesh.position.set(-centerOffset, -centerOffset, zOffset);


        // --- LÓGICA DE POSICIONAMIENTO EN COLUMNAS ---
        
        // Identificar en qué columna cae esta sandía (0, 1 o 2)
        const columnIndex = i % 3;
        
        // Identificar qué altura tiene en la torre (0, 1, 2...)
        const stackIndex = Math.floor(i / 3);
        
        // Obtener la posición base de la columna
        const basePos = columnPositions[columnIndex];
        
        // Calcular altura (Y): Base del plato + altura acumulada
        // Le sumamos 0.01 extra para que no se toquen exactamente (evita parpadeo visual)
        const posY = 0.25 + (stackIndex * (thickness + 0.01));

        // Asignar posición al GRUPO
        sliceGroup.position.set(basePos.x, posY, basePos.z);
        
        // --- ROTACIÓN ---
        // 1. Acostarlas: Rotamos -90 grados en X para que queden planas
        sliceGroup.rotation.x = -Math.PI / 2;
        
        // 2. Orientación en el plato:
        // Las rotamos un poco en Z (que ahora es el eje vertical relativo al suelo)
        // para que apunten hacia afuera o se vean naturales.
        // Math.PI * 0.7 hace que apunten generalmente hacia el frente/lados
        // + un pequeño valor aleatorio para que no se vean robóticas
        sliceGroup.rotation.z = (columnIndex * 2) + (Math.random() * 0.5);
        
        bowlGroup.add(sliceGroup);
    }
    
    // Posición final del bowl en la escena
    bowlGroup.position.set(3.5, 0, 2.5);
    parent.add(bowlGroup);
}

// ============================================
// TAZÓN DE MANGOS (PIRÁMIDE SIN COLISIONES)
// ============================================

function createMangoBowl(parent) {
    const bowlGroup = createGlassBowl();
    
    // POSICIONES PRE-CALCULADAS PARA EVITAR COLISIONES
    // Definimos manualmente dónde va cada mango para que no se toquen.
    // Formación: 3 abajo en triángulo, 2 arriba en los huecos.
    const positions = [
        // BASE (Capa inferior - Y baja)
        { x: -0.25, y: 0.25, z: 0.15,  rotX: 0,    rotY: 0.5,  rotZ: -0.2 }, // Izquierda frente
        { x: 0.25,  y: 0.25, z: 0.15,  rotX: 0,    rotY: -0.5, rotZ: 0.2 },  // Derecha frente
        { x: 0,     y: 0.22, z: -0.25, rotX: 0.2,  rotY: 1.5,  rotZ: 0 },    // Atrás centro
        
        // CIMA (Capa superior - Y alta)
        // Estos van más arriba (y: 0.48) y descansan en los huecos de abajo
        { x: -0.12, y: 0.48, z: -0.05, rotX: 0.5,  rotY: 2.0,  rotZ: -0.3 }, // Arriba izq
        { x: 0.15,  y: 0.50, z: 0.05,  rotX: 0.4,  rotY: 0.5,  rotZ: 0.3 }   // Arriba der
    ];

    positions.forEach((pos, i) => {
        const mangoGroup = new THREE.Group();
        
        // --- 1. CUERPO DEL MANGO ---
        // Usamos una esfera deformada para hacer el óvalo
        const mangoGeometry = new THREE.SphereGeometry(0.24, 24, 24);
        // Escalamos: Largo(x), Alto(y), Ancho(z)
        // Lo aplanamos un poco en Y para que se apile mejor
        mangoGeometry.scale(1.3, 0.95, 0.85); 
        
        // Variación de color entre amarillo, naranja y verdoso
        const colors = [0xffa500, 0xffb84d, 0xffcc00, 0xff9933];
        const mangoColor = colors[i % colors.length];
        
        const mangoMaterial = new THREE.MeshStandardMaterial({
            color: mangoColor,
            roughness: 0.5,
            metalness: 0.1
        });
        
        const mango = new THREE.Mesh(mangoGeometry, mangoMaterial);
        mangoGroup.add(mango);
        
        // --- 2. TALLO ---
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.03, 0.08, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a2511 })
        );
        // Movemos el tallo a la punta del mango (eje X positivo debido a la escala)
        stem.position.set(0.3, 0.05, 0); 
        stem.rotation.z = -1.5; // Acostado
        mangoGroup.add(stem);
        
        // --- 3. MANCHITAS REALISTAS ---
        for (let j = 0; j < 3; j++) {
            const spot = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                new THREE.MeshStandardMaterial({ 
                    color: 0xcc6600,
                    transparent: true,
                    opacity: 0.6
                })
            );
            // Manchas en posiciones aleatorias superficiales
            spot.position.set(
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.2,
                0.18 + Math.random() * 0.02 // En la superficie Z
            );
            spot.scale.set(1.2, 0.5, 0.5);
            mangoGroup.add(spot);
        }
        
        // --- 4. POSICIONAMIENTO FINAL ---
        // Aplicamos las coordenadas exactas de la lista 'positions'
        mangoGroup.position.set(pos.x, pos.y, pos.z);
        
        // Rotación base predefinida + pequeñísima variación aleatoria para naturalidad
        mangoGroup.rotation.set(
            pos.rotX + (Math.random() * 0.1),
            pos.rotY + (Math.random() * 0.1),
            pos.rotZ + (Math.random() * 0.1)
        );
        
        bowlGroup.add(mangoGroup);
    });
    
    // Posicionar el bowl centrado al frente
    bowlGroup.position.set(0, 0, 3.5);
    parent.add(bowlGroup);
}


function animate() {
    requestAnimationFrame(animate);
    
    time += 0.01;
    
    // --- ANIMACIÓN DEL TEXTO NUBE (APARICIÓN SUAVE) ---
    // Si la variable existe, aumentamos la opacidad poco a poco
    if (typeof cloudTextMsg !== 'undefined' && cloudTextMsg.material.opacity < 1.0) {
        cloudTextMsg.material.opacity += 0.003; 
    }

    // --- OCÉANO (Fondo) ---
    const oceanPos = ocean.geometry.attributes.position;
    for (let i = 0; i < oceanPos.count; i++) {
        const x = oceanPos.getX(i); const y = oceanPos.getY(i);
        const wave1 = Math.sin(x * 0.3 + time * 2) * 0.6; const wave2 = Math.cos(y * 0.2 + time * 1.8) * 0.5; const wave3 = Math.sin((x + y) * 0.15 + time * 1.5) * 0.4;
        oceanPos.setZ(i, wave1 + wave2 + wave3);
    }
    oceanPos.needsUpdate = true;

    // --- NUBES ---
    if (window.clouds) {
        window.clouds.rotation.y -= 0.0001; 
    }
    
    // ==================================================================================
    // --- ANIMACIÓN DE OLAS (FORMA NUEVA + COLORES CÁLIDOS) ---
    // ==================================================================================
    const wavePositions = waves.geometry.attributes.position;
    const waveColors = waves.geometry.attributes.color;
    const count = wavePositions.count;

    const deepWaterColor = new THREE.Color(0xe74c3c);    // Rojo atardecer
    const shallowWaterColor = new THREE.Color(0xffd700); // Dorado brillante
    const foamColor = new THREE.Color(0xffffff);         // Espuma blanca

    let waveCycle = (Math.sin(time * 0.7) + 1) / 2; 
    waveCycle = Math.pow(waveCycle, 0.7); 

    const maxRunUpZ = 18.0; 
    const minRetreatZ = -15.0; 
    const currentFrontBaseZ = minRetreatZ + waveCycle * (maxRunUpZ - minRetreatZ);

    for (let i = 0; i < count; i++) {
        const vX = wavePositions.getX(i);
        const vLocalY = wavePositions.getY(i); 

        const parabolicOffset = Math.cos(vX * 0.03) * 6.0 - 6.0; 
        const actualFrontZ = currentFrontBaseZ + parabolicOffset;

        const distanceToFront = actualFrontZ - vLocalY;

        let height = 0;
        let foamIntensity = 0;
        const finalColor = new THREE.Color();

        if (distanceToFront > 0) {
            height = Math.sqrt(distanceToFront) * 0.25;
            height += Math.sin(vX * 0.5 + time * 3) * 0.05 * (distanceToFront/10);

            const depthFactor = Math.min(1, distanceToFront / 20); 
            finalColor.lerpColors(shallowWaterColor, deepWaterColor, depthFactor);

            if (distanceToFront < 3.0) {
                foamIntensity = 1.0 - (distanceToFront / 3.0);
                foamIntensity *= (0.7 + Math.random() * 0.3); 
                foamIntensity = Math.pow(foamIntensity, 3);   
                finalColor.lerp(foamColor, foamIntensity);
                height += foamIntensity * 0.15;
            }
        } else {
            height = 0.0; 
            finalColor.set(shallowWaterColor); 
        }

        wavePositions.setZ(i, height);
        waveColors.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
    }

    wavePositions.needsUpdate = true;
    waveColors.needsUpdate = true;

    // --- REFLEJO SOL ---
    if (sunReflection) {
        const reflectionPos = sunReflection.geometry.attributes.position;
        for (let i = 0; i < reflectionPos.count; i++) {
            const x = reflectionPos.getX(i); const y = reflectionPos.getY(i);
            const shimmer = Math.sin(x * 0.5 + time * 3) * 0.2 + Math.cos(y * 0.3 + time * 2) * 0.15;
            reflectionPos.setZ(i, shimmer);
        }
        reflectionPos.needsUpdate = true; sunReflection.material.opacity = 0.35 + Math.sin(time * 2.5) * 0.1;
    }
    
    // --- PALMERAS ---
    palmTrees.forEach((palm, index) => {
        const sway = Math.sin(time * 0.8 + index) * 0.08;
        palm.rotation.z = sway;
        palm.children.forEach((child, idx) => {
            if (child.type === 'Group') {
                const leafSway = Math.sin(time * 2 + idx * 0.5) * 0.15;
                child.rotation.x = -0.4 + leafSway;
            }
        });
    });

    // --- TULIPANES ---
    const windStrength = 0.07; 
    animatedTulips.forEach(tulip => {
        const data = tulip.userData;
        tulip.rotation.x = data.initialRotation.x + Math.sin(time * 1.5 + data.phaseOffset) * windStrength;
        tulip.rotation.z = data.initialRotation.z + Math.cos(time * 1.3 + data.phaseOffset) * (windStrength * 0.7);
    });

    // --- LLAMAS (VELAS NORMALES) ---
    animatedFlames.forEach(flame => {
        const data = flame.userData;
        const flickerSpeed = time * 8;
        const scaleNoise = 1.3 + Math.sin(flickerSpeed + data.phaseOffset) * 0.15 + (Math.random() * 0.1);
        flame.scale.set(1, scaleNoise, 1);
        const windPushX = Math.sin(time * 3 + data.phaseOffset) * 0.015;
        const windPushZ = Math.cos(time * 3.5 + data.phaseOffset) * 0.015;
        flame.position.x = data.initialPos.x + windPushX;
        flame.position.z = data.initialPos.z + windPushZ;
    });

    // --- VINO ---
    animatedWines.forEach(wine => {
        const data = wine.userData;
        const wobbleX = Math.sin(time * 2 + data.phaseOffset) * 0.05; 
        const wobbleY = Math.cos(time * 2.5 + data.phaseOffset) * 0.05; 
        wine.rotation.x = data.initialRot.x + wobbleX;
        wine.rotation.y = data.initialRot.y + wobbleY;
    });

    // =========================================
    // ANIMACIÓN DE BENGALAS (CHISPAS)
    // =========================================
    if (typeof sparklers !== 'undefined') {
        sparklers.forEach(sys => {
            const positions = sys.geometry.attributes.position.array;
            const colors = sys.geometry.attributes.color.array;
            const sizes = sys.geometry.attributes.size.array;
            
            sys.data.forEach((p, i) => {
                if (p.life <= 0) {
                    // RESPAWN (Nacer de nuevo)
                    p.life = 1.0 + Math.random() * 0.5; 
                    
                    positions[i*3] = 0;   
                    positions[i*3+1] = sys.baseY; 
                    positions[i*3+2] = 0; 
                    
                    // Velocidad explosiva
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 0.02 + Math.random() * 0.03; 
                    const vertical = 0.05 + Math.random() * 0.05; 
                    
                    p.velocity.set(Math.cos(angle) * speed, vertical, Math.sin(angle) * speed);
                } else {
                    // UPDATE (Mover y envejecer)
                    p.life -= 0.02;      
                    p.velocity.y -= 0.002; // Gravedad
                    
                    positions[i*3] += p.velocity.x;
                    positions[i*3+1] += p.velocity.y;
                    positions[i*3+2] += p.velocity.z;
                    
                    // Color: Blanco -> Dorado -> Rojo
                    const lifeRatio = p.life; 
                    colors[i*3] = 1.0; 
                    colors[i*3+1] = lifeRatio * 0.8 + 0.2; 
                    colors[i*3+2] = lifeRatio * 0.2; 
                    
                    sizes[i] = lifeRatio * 0.25; 
                }
            });
            
            sys.geometry.attributes.position.needsUpdate = true;
            sys.geometry.attributes.color.needsUpdate = true;
            sys.geometry.attributes.size.needsUpdate = true;
        });
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Solo ajustamos el tamaño, NO la distancia ni el zoom
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    
    // Eliminamos el bloque "if (aspect < 1.0)..." para que no tome decisiones por ti
}
// ============================================
// FUNCIÓN AUXILIAR: GENERAR TEXTURA DE NUBE PROCEDURAL
// ============================================
function createCloudTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Rellenar con transparente
    ctx.clearRect(0, 0, 256, 256);

    // Dibujar múltiples círculos suaves para formar una nube irregular
    const numPuffs = 8 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numPuffs; i++) {
        const x = (0.3 + Math.random() * 0.4) * 256;
        const y = (0.3 + Math.random() * 0.4) * 256;
        const radius = (0.1 + Math.random() * 0.2) * 256;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0.0, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
}

// ============================================
// CREACIÓN DE NUBES SUAVES (CON SPRITES Y TEXTURA)
// ============================================

function createClouds() {
    const cloudsGroup = new THREE.Group();
    
    // Generamos la textura de nube
    const cloudTexture = createCloudTexture();
    
    // Material para las nubes (usamos SpriteMaterial)
    const cloudMaterial = new THREE.SpriteMaterial({
        map: cloudTexture,
        color: 0xffa500, // Tinte naranja para el atardecer
        transparent: true,
        opacity: 0.5, // Nubes semitransparentes
        depthWrite: false, // Evitar que bloqueen objetos detrás
        blending: THREE.AdditiveBlending // Hace que el color se sume, dando luminosidad
    });
    
    // Función auxiliar para crear una sola nube Sprite
    function createSingleCloudSprite() {
        const cloudSprite = new THREE.Sprite(cloudMaterial);
        return cloudSprite;
    }
    
    // Crear varias nubes y posicionarlas en el cielo cerca del sol
    
    // Nube 1: Grande, cerca del sol
    const cloud1 = createSingleCloudSprite();
    cloud1.scale.set(25, 15, 1); // Escala más ancha que alta
    cloud1.position.set(10, 12, -45);
    cloudsGroup.add(cloud1);
    
    // Nube 2: Un poco más lejos, a la izquierda
    const cloud2 = createSingleCloudSprite();
    cloud2.scale.set(20, 12, 1);
    cloud2.position.set(-18, 15, -50);
    cloud2.material.opacity = 0.4; // Un poco más tenue
    cloudsGroup.add(cloud2);
    
    // Nube 3: Más alta y centrada
    const cloud3 = createSingleCloudSprite();
    cloud3.scale.set(18, 10, 1);
    cloud3.position.set(-5, 20, -40);
    cloudsGroup.add(cloud3);
    
    // Nube 4: Más lejos y difusa
    const cloud4 = createSingleCloudSprite();
    cloud4.scale.set(30, 18, 1);
    cloud4.position.set(-35, 10, -55);
    cloud4.material.opacity = 0.3;
    cloudsGroup.add(cloud4);
    
    // Nube 5: Más lejos y difusa, derecha
    const cloud5 = createSingleCloudSprite();
    cloud5.scale.set(28, 16, 1);
    cloud5.position.set(30, 14, -55);
    cloud5.material.opacity = 0.3;
    cloudsGroup.add(cloud5);
    
    scene.add(cloudsGroup);
    
    // Guardar referencia para animación opcional
    window.clouds = cloudsGroup;
}

// ============================================
// CREACIÓN DE PALMERAS EXTRA (2 IZQ + 2 DER) - RETIRADAS DEL MAR
// ============================================

function createPalmGrove() {
    const extraPalmsData = [
        // --- LADO IZQUIERDO ---
        // Antes Z=15 (en el agua). AHORA Z=28 (arena seca)
        { x: -32, z: 33, scale: 1.3, rot: 0.5 },  
        // Antes Z=25. AHORA Z=38 (más atrás para dar profundidad)
        { x: -45, z: 33, scale: 1.6, rot: 1.2 },  

        // --- LADO DERECHO ---
        // Antes Z=15. AHORA Z=28
        { x: 32, z: 37, scale: 1.4, rot: -0.5 },  
        // Antes Z=25. AHORA Z=38
        { x: 45, z: 34, scale: 1.5, rot: -1.0 }   
    ];

    extraPalmsData.forEach(data => {
        const palm = createPalmTree();

        palm.position.set(data.x, 0, data.z);

        palm.scale.set(data.scale, data.scale, data.scale);
        palm.rotation.y = data.rot;

        scene.add(palm);
        
        // Agregamos al array para animación de viento
        palmTrees.push(palm); 
    });
}

// ============================================
// FUNCIÓN AUXILIAR: GENERAR TEXTURA DE TEXTO (21 AÑOS / ILUMINANDO)
// ============================================
function generateCloudTextTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512; 
    const ctx = canvas.getContext('2d');

    // Configuración de brillo y sombra (Efecto Nube)
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // --- LÍNEA 1: "21 AÑOS" (Más grande y arriba) ---
    ctx.font = 'bold 90px Arial, sans-serif';
    const text1 = "21 AÑOS";
    ctx.fillText(text1, centerX, centerY - 60); 
    // Repetimos para más intensidad
    ctx.fillText(text1, centerX, centerY - 60);

    // --- LÍNEA 2: "ILUMINANDO AL MUNDO" (Más pequeño para que quepa) ---
    ctx.font = 'bold 75px Arial, sans-serif';
    const text2 = "ILUMINANDO AL MUNDO";
    ctx.fillText(text2, centerX, centerY + 60); 
    ctx.fillText(text2, centerX, centerY + 60);

    // --- LÍNEA 2: "ILUMINANDO AL MUNDO" (Más pequeño para que quepa) ---
    ctx.font = 'bold 75px Arial, sans-serif';
    const text3 = "TE AMO";
    ctx.fillText(text3, centerX, centerY + 180); 
    ctx.fillText(text3, centerX, centerY + 180);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}
// ============================================
// CREAR MENSAJE DE NUBE SOBRE EL SOL
// ============================================
function createCloudMessage() {
    // Generamos la textura nueva
    const texture = generateCloudTextTexture();

    const material = new THREE.SpriteMaterial({
        map: texture,
        color: 0xffddaa, // Tinte dorado atardecer
        transparent: true,
        opacity: 0.0,    // Empieza invisible para la animación
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    cloudTextMsg = new THREE.Sprite(material);

    // Posición sobre el sol
    cloudTextMsg.position.set(0, 30, -55); 
    
    // Escala rectangular: 60 de ancho x 30 de alto
    // Esta proporción (2:1) coincide con el canvas (1024:512) para no deformar el texto
    cloudTextMsg.scale.set(60, 30, 1); 

    scene.add(cloudTextMsg);
}

// ============================================
// TRUCO: INTENTO DE DESBLOQUEO DE AUDIO CON EL PRIMER TOQUE
// ============================================
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('mousedown', unlockAudio, { once: true });

function unlockAudio() {
    // Si el contexto existe y está suspendido (Estado inicial en móvil)
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
        console.log("AudioContext resumed by first touch.");
    }
}