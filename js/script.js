import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== FUNÇÕES AUXILIARES GLOBAIS =====
window.toggleMenu = function() {
    document.getElementById('navLinks').classList.toggle('active');
};

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => document.getElementById('navLinks').classList.remove('active'));
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// Partículas hero
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.setProperty('--tx', (Math.random() - 0.5) * 300 + 'px');
        p.style.setProperty('--ty', (Math.random() - 0.5) * 300 + 'px');
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = 6 + Math.random() * 8 + 's';
        p.style.width = p.style.height = 3 + Math.random() * 8 + 'px';
        container.appendChild(p);
    }
}
createParticles();

// ===== SEÇÃO ÁTOMOS 3D =====
const atomData = {
    1: { name: 'Hidrogênio', protons: 1, neutrons: 0, electrons: 1 },
    2: { name: 'Hélio', protons: 2, neutrons: 2, electrons: 2 },
    6: { name: 'Carbono', protons: 6, neutrons: 6, electrons: 6 },
    8: { name: 'Oxigênio', protons: 8, neutrons: 8, electrons: 8 },
    92: { name: 'Urânio', protons: 92, neutrons: 146, electrons: 92 }
};

let currentAtom = 6;
let scene3d, camera3d, renderer3d, controls3d, atomGroup;
const atomCanvasContainer = document.getElementById('atom3dCanvas');

function initAtom3D() {
    scene3d = new THREE.Scene();
    scene3d.background = new THREE.Color(0x111111);
    camera3d = new THREE.PerspectiveCamera(45, atomCanvasContainer.clientWidth / atomCanvasContainer.clientHeight, 0.1, 1000);
    camera3d.position.set(0, 5, 20);
    renderer3d = new THREE.WebGLRenderer({ antialias: true });
    renderer3d.setSize(atomCanvasContainer.clientWidth, atomCanvasContainer.clientHeight);
    renderer3d.setPixelRatio(window.devicePixelRatio);
    atomCanvasContainer.appendChild(renderer3d.domElement);
    controls3d = new OrbitControls(camera3d, renderer3d.domElement);
    controls3d.enableDamping = true;
    controls3d.dampingFactor = 0.05;
    controls3d.autoRotate = true;
    controls3d.autoRotateSpeed = 1.0;
    atomGroup = new THREE.Group();
    scene3d.add(atomGroup);
    const ambient = new THREE.AmbientLight(0x404040);
    scene3d.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene3d.add(dirLight);
    buildAtomModel(atomData[currentAtom]);
    animate3d();
}

function buildAtomModel(data) {
    while (atomGroup.children.length) atomGroup.remove(atomGroup.children[0]);
    const nucleusGroup = new THREE.Group();
    const protonGeom = new THREE.SphereGeometry(0.5, 32, 32);
    const neutronGeom = new THREE.SphereGeometry(0.5, 32, 32);
    const protonMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.3, metalness: 0.1 });
    const neutronMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.1 });
    const totalNucleons = data.protons + data.neutrons;
    const spacing = 0.9;
    for (let i = 0; i < totalNucleons; i++) {
        const mesh = new THREE.Mesh(i < data.protons ? protonGeom : neutronGeom, i < data.protons ? protonMat : neutronMat);
        const angle = (i / totalNucleons) * Math.PI * 2;
        const radius = Math.max(1.2, totalNucleons * 0.12);
        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.8, (Math.random() - 0.5) * 0.8);
        nucleusGroup.add(mesh);
    }
    atomGroup.add(nucleusGroup);

    const electronGeom = new THREE.SphereGeometry(0.25, 16, 16);
    const electronMat = new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 0.8 });
    const orbitCount = Math.min(3, Math.ceil(data.electrons / 2));
    for (let o = 0; o < orbitCount; o++) {
        const orbitRadius = 2.5 + o * 1.5;
        const electronsInOrbit = o === orbitCount - 1 ? data.electrons - o * 2 : 2;
        const orbitGroup = new THREE.Group();
        for (let e = 0; e < electronsInOrbit; e++) {
            const electron = new THREE.Mesh(electronGeom, electronMat);
            const angle = (e / electronsInOrbit) * Math.PI * 2;
            electron.position.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius);
            orbitGroup.add(electron);
        }
        orbitGroup.userData = { radius: orbitRadius, speed: 0.5 + o * 0.3, angleOffset: o * 1.5 };
        atomGroup.add(orbitGroup);
    }
}

function animate3d() {
    requestAnimationFrame(animate3d);
    if (controls3d) controls3d.update();
    if (atomGroup) {
        atomGroup.children.forEach(child => {
            if (child.userData && child.userData.radius) {
                child.rotation.y += child.userData.speed * 0.02;
            }
        });
    }
    renderer3d.render(scene3d, camera3d);
}

document.querySelectorAll('.atom-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.atom-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentAtom = parseInt(btn.dataset.atomic);
        buildAtomModel(atomData[currentAtom]);
    });
});

window.addEventListener('resize', () => {
    if (renderer3d && camera3d) {
        camera3d.aspect = atomCanvasContainer.clientWidth / atomCanvasContainer.clientHeight;
        camera3d.updateProjectionMatrix();
        renderer3d.setSize(atomCanvasContainer.clientWidth, atomCanvasContainer.clientHeight);
    }
});

initAtom3D();

// ===== SEÇÃO MONTE SEU ÁTOMO =====
let builderScene, builderCamera, builderRenderer, builderControls, builderGroup;
const builderCanvas = document.getElementById('builderCanvas');
const protonSlider = document.getElementById('protonSlider');
const neutronSlider = document.getElementById('neutronSlider');
const electronSlider = document.getElementById('electronSlider');
const protonCount = document.getElementById('protonCount');
const neutronCount = document.getElementById('neutronCount');
const electronCount = document.getElementById('electronCount');
const elementInfo = document.getElementById('elementInfo');

function initBuilder() {
    builderScene = new THREE.Scene();
    builderScene.background = new THREE.Color(0x111111);
    builderCamera = new THREE.PerspectiveCamera(45, builderCanvas.clientWidth / builderCanvas.clientHeight, 0.1, 1000);
    builderCamera.position.set(0, 4, 15);
    builderRenderer = new THREE.WebGLRenderer({ antialias: true, canvas: builderCanvas });
    builderRenderer.setSize(builderCanvas.clientWidth, builderCanvas.clientHeight);
    builderRenderer.setPixelRatio(window.devicePixelRatio);
    builderControls = new OrbitControls(builderCamera, builderRenderer.domElement);
    builderControls.enableDamping = true;
    builderControls.autoRotate = true;
    builderControls.autoRotateSpeed = 1.5;
    builderGroup = new THREE.Group();
    builderScene.add(builderGroup);
    builderScene.add(new THREE.AmbientLight(0x404040));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 15, 10);
    builderScene.add(light);
    updateBuilderAtom();
    animateBuilder();
}

function updateBuilderAtom() {
    const p = parseInt(protonSlider.value);
    const n = parseInt(neutronSlider.value);
    const e = parseInt(electronSlider.value);
    protonCount.textContent = p;
    neutronCount.textContent = n;
    electronCount.textContent = e;
    const elementNames = {
        1: 'Hidrogênio (H)', 2: 'Hélio (He)', 3: 'Lítio (Li)', 4: 'Berílio (Be)', 5: 'Boro (B)',
        6: 'Carbono (C)', 7: 'Nitrogênio (N)', 8: 'Oxigênio (O)', 9: 'Flúor (F)', 10: 'Neônio (Ne)',
        11: 'Sódio (Na)', 12: 'Magnésio (Mg)', 13: 'Alumínio (Al)', 14: 'Silício (Si)', 15: 'Fósforo (P)',
        16: 'Enxofre (S)', 17: 'Cloro (Cl)', 18: 'Argônio (Ar)', 19: 'Potássio (K)', 20: 'Cálcio (Ca)'
    };
    elementInfo.textContent = elementNames[p] || 'Elemento desconhecido';
    while (builderGroup.children.length) builderGroup.remove(builderGroup.children[0]);
    const total = p + n;
    const protonGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const neutronGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const protonMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const neutronMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const nucleusGroup = new THREE.Group();
    for (let i = 0; i < total; i++) {
        const mesh = new THREE.Mesh(i < p ? protonGeo : neutronGeo, i < p ? protonMat : neutronMat);
        const angle = (i / Math.max(1, total)) * Math.PI * 2;
        const radius = Math.max(1, total * 0.1);
        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, (Math.random() - 0.5) * 0.5);
        nucleusGroup.add(mesh);
    }
    builderGroup.add(nucleusGroup);
    const electronGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const electronMat = new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 0.7 });
    const orbitCount = Math.min(4, Math.ceil(e / 2));
    for (let o = 0; o < orbitCount; o++) {
        const orbitRadius = 2.2 + o * 1.2;
        const electronsInOrbit = o === orbitCount - 1 ? e - o * 2 : 2;
        const orbitGroup = new THREE.Group();
        for (let i = 0; i < electronsInOrbit; i++) {
            const electron = new THREE.Mesh(electronGeo, electronMat);
            const ang = (i / electronsInOrbit) * Math.PI * 2;
            electron.position.set(Math.cos(ang) * orbitRadius, 0, Math.sin(ang) * orbitRadius);
            orbitGroup.add(electron);
        }
        orbitGroup.userData = { radius: orbitRadius, speed: 0.8 + o * 0.3 };
        builderGroup.add(orbitGroup);
    }
}

function animateBuilder() {
    requestAnimationFrame(animateBuilder);
    builderControls.update();
    builderGroup.children.forEach(child => {
        if (child.userData && child.userData.radius) child.rotation.y += child.userData.speed * 0.03;
    });
    builderRenderer.render(builderScene, builderCamera);
}

[protonSlider, neutronSlider, electronSlider].forEach(slider => {
    slider.addEventListener('input', updateBuilderAtom);
});

window.addEventListener('resize', () => {
    if (builderRenderer && builderCamera) {
        builderCamera.aspect = builderCanvas.clientWidth / builderCanvas.clientHeight;
        builderCamera.updateProjectionMatrix();
        builderRenderer.setSize(builderCanvas.clientWidth, builderCanvas.clientHeight);
    }
});

initBuilder();

// ===== SIMULAÇÃO DE PENETRAÇÃO =====
let selectedRadiation = 'alfa';
let selectedMaterial = 'papel';
const radiationBtns = document.querySelectorAll('.radiation-type-btn');
const materialBtns = document.querySelectorAll('.material-btn');
const simResult = document.getElementById('simResult');
const beamParticle = document.getElementById('beamParticle');
const materialLayer = document.getElementById('materialLayer');

function updateSimulation() {
    const passes = checkPenetration(selectedRadiation, selectedMaterial);
    if (passes) {
        simResult.innerHTML = `✅ A radiação <strong>${selectedRadiation}</strong> <span style="color:var(--verde-radioativo)">consegue atravessar</span> ${selectedMaterial}.`;
        simResult.style.color = '#39ff14';
        beamParticle.style.background = selectedRadiation === 'alfa' ? '#ff4444' : selectedRadiation === 'beta' ? '#ffaa00' : '#aa44ff';
        beamParticle.style.animation = 'none';
        beamParticle.offsetHeight;
        beamParticle.style.animation = 'beamMove 2s ease-in-out infinite';
        materialLayer.style.background = 'rgba(57,255,20,0.4)';
    } else {
        simResult.innerHTML = `⛔ A radiação <strong>${selectedRadiation}</strong> <span style="color:#ff4444">é bloqueada</span> pelo material ${selectedMaterial}.`;
        simResult.style.color = '#ff4444';
        beamParticle.style.animation = 'none';
        beamParticle.offsetHeight;
        beamParticle.style.animation = 'beamMove 0.5s ease-in-out infinite';
        materialLayer.style.background = 'rgba(255,68,68,0.6)';
    }
    beamParticle.style.left = '0%';
}

function checkPenetration(rad, mat) {
    if (rad === 'alfa') return mat === 'papel' ? false : true;
    if (rad === 'beta') return mat === 'aluminio' ? false : true;
    if (rad === 'gama') return mat === 'chumbo' ? false : true;
    return false;
}

radiationBtns.forEach(btn => btn.addEventListener('click', () => {
    radiationBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRadiation = btn.dataset.type;
    updateSimulation();
}));

materialBtns.forEach(btn => btn.addEventListener('click', () => {
    materialBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMaterial = btn.dataset.material;
    updateSimulation();
}));

updateSimulation();

// ===== QUIZ =====
const quizData = [
    { question: 'Quem descobriu a radioatividade?', options: ['Marie Curie', 'Henri Becquerel', 'Ernest Rutherford', 'Albert Einstein'], answer: 1 },
    { question: 'Qual partícula tem o menor poder de penetração?', options: ['Alfa', 'Beta', 'Gama', 'Nêutron'], answer: 0 },
    { question: 'Qual material bloqueia radiação gama?', options: ['Papel', 'Alumínio', 'Chumbo', 'Plástico'], answer: 2 },
    { question: 'Qual elemento é usado em detectores de fumaça?', options: ['Urânio', 'Amerício', 'Polônio', 'Rádio'], answer: 1 },
    { question: 'O que é meia-vida?', options: ['Tempo para o átomo morrer', 'Tempo para metade dos núcleos decaírem', 'Idade do átomo', 'Tempo de vida do elétron'], answer: 1 }
];

let currentQuizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const quizFeedback = document.getElementById('quizFeedback');
const quizNextBtn = document.getElementById('quizNextBtn');
const quizProgress = document.getElementById('quizProgress');
const quizResult = document.getElementById('quizResult');
const quizRestartBtn = document.getElementById('quizRestartBtn');

function loadQuizQuestion() {
    if (currentQuizIndex >= quizData.length) {
        showQuizResult();
        return;
    }
    quizAnswered = false;
    quizNextBtn.style.display = 'none';
    quizFeedback.textContent = '';
    quizResult.textContent = '';
    quizRestartBtn.style.display = 'none';
    const q = quizData[currentQuizIndex];
    quizProgress.textContent = `Pergunta ${currentQuizIndex + 1} de ${quizData.length}`;
    quizQuestion.textContent = q.question;
    quizOptions.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.classList.add('quiz-option');
        btn.textContent = opt;
        btn.addEventListener('click', () => selectQuizOption(idx, btn));
        quizOptions.appendChild(btn);
    });
}

function selectQuizOption(idx, btn) {
    if (quizAnswered) return;
    const q = quizData[currentQuizIndex];
    const buttons = quizOptions.querySelectorAll('.quiz-option');
    buttons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    quizAnswered = true;
    if (idx === q.answer) {
        quizScore++;
        quizFeedback.textContent = '✅ Correta!';
        quizFeedback.style.color = '#39ff14';
    } else {
        quizFeedback.textContent = `❌ Incorreta. Resposta certa: ${q.options[q.answer]}`;
        quizFeedback.style.color = '#ff4444';
    }
    quizNextBtn.style.display = 'inline-block';
}

function showQuizResult() {
    quizQuestion.textContent = '';
    quizOptions.innerHTML = '';
    quizFeedback.textContent = '';
    quizProgress.textContent = 'Quiz concluído!';
    const percentage = Math.round((quizScore / quizData.length) * 100);
    quizResult.textContent = `Sua pontuação: ${quizScore}/${quizData.length} (${percentage}%)`;
    quizResult.style.color = percentage >= 60 ? '#39ff14' : '#ff4444';
    quizRestartBtn.style.display = 'inline-block';
    quizNextBtn.style.display = 'none';
}

quizNextBtn.addEventListener('click', () => {
    currentQuizIndex++;
    loadQuizQuestion();
});

quizRestartBtn.addEventListener('click', () => {
    currentQuizIndex = 0;
    quizScore = 0;
    loadQuizQuestion();
});

loadQuizQuestion();
