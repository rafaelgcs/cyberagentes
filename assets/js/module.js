
import * as THREE from 'three';

// --- CONFIGURAÇÃO VISUAL CYBERPUNK ---
const CONFIG = {
    speed: 10, // Personagens mais rápidos
    colors: {
        // Paleta Neon Dark
        background: 0x050510, // Azul muito escuro (quase preto)
        fog: 0x100020,        // Neblina roxa escura

        // Elementos
        floorGrid: 0x220044,  // Chão Roxo Escuro
        floorLine: 0x00eaff,  // Linhas Cyan

        wallBase: 0x111111,   // Parede Preta
        wallDetail: 0xff00ff, // Detalhe Rosa Neon

        furniture: 0x222233,  // Móveis metálicos escuros

        // Personagens
        agent1: 0x00eaff,     // Cyan
        agent2: 0xd500f9,     // Roxo
        commander: 0xff6f00,  // Laranja Neon
        npc: 0x00ff88,        // Verde Neon
        skin: 0xffdbac,
        backpack: 0x111111,

        doorFrame: 0x444444
    }
};

// Variáveis Globais
let scene, camera, renderer, clock;
let player, playerBody;
let levelObjects = [];
let obstacles = [];
let interactables = [];

let selectedAgentId = null;
let missionProgress = 0;
let currentLevel = "LOBBY";

let isDialogOpen = false;
let currentDialogQueue = [];

let wallTextureBase = null;
let doorTextureBase = null;
let floorTextureBase = null;

let keys = { w: false, a: false, s: false, d: false };
let joystickVec = new THREE.Vector3();
let cameraAngle = 0;
let isDraggingView = false;
let dragStartX = 0;
let isMouseDown = false;
let walkTime = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// --- LÓGICA DO COMPUTADOR ---
window.checkPassword = () => {
    const pass = document.getElementById('pc-pass-input').value;
    const feedback = document.getElementById('pass-feedback');

    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*]/.test(pass);
    const isLong = pass.length >= 8;

    if (isLong && hasUpper && hasNumber && hasSpecial) {
        feedback.style.color = "#00ff88";
        feedback.innerText = "ACESSO PERMITIDO! CARREGANDO...";
        setTimeout(() => {
            document.getElementById('pc-view-login').classList.add('hidden');
            document.getElementById('pc-view-puzzle').classList.remove('hidden');
            startPuzzle();
        }, 1500);
    } else {
        feedback.style.color = "#ff5555";
        let msg = "⚠️ SENHA FRACA: ";
        if (!isLong) msg += "Mínimo 8 caracteres. ";
        else if (!hasUpper) msg += "Use uma Maiúscula. ";
        else if (!hasNumber) msg += "Use um Número. ";
        else if (!hasSpecial) msg += "Use um Símbolo (!@#).";
        feedback.innerText = msg;
    }
};

// Puzzle
let flippedCards = [];
let matchedPairs = 0;
const icons = ['🛡️', '👾', '🔑', '💾'];

window.startPuzzle = () => {
    const grid = document.getElementById('memory-game');
    grid.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;

    let deck = [...icons, ...icons];
    deck.sort(() => Math.random() - 0.5);

    deck.forEach((icon, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.icon = icon;
        card.innerText = '?';
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });
};

function flipCard(card) {
    if (flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    card.innerText = card.dataset.icon;
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        setTimeout(checkMatch, 800);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.icon === card2.dataset.icon) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        if (matchedPairs === 4) {
            setTimeout(() => {
                document.getElementById('pc-view-puzzle').classList.add('hidden');
                document.getElementById('pc-view-social').classList.remove('hidden');
            }, 500);
        }
    } else {
        card1.classList.remove('flipped');
        card1.innerText = '?';
        card2.classList.remove('flipped');
        card2.innerText = '?';
    }
    flippedCards = [];
}

window.reportFakeNews = () => {
    alert("FAKE NEWS DETECTADA! Você salvou a rede!");
    document.getElementById('computer-overlay').style.display = 'none';
    startDialog("COMANDANTE", ["Excelente, Agente!", "Ameaça neutralizada.", "Retorne à base pela porta de teleporte."]);

    missionProgress = 4;
    updateHUD("Volte para a Central", "#00ff88");
};

window.closePC = () => {
    document.getElementById('computer-overlay').style.display = 'none';
};

// --- UI GERAL ---
window.goToSelect = () => {
    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('screen-select').classList.remove('hidden');
};
window.goToCredits = () => {
    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('screen-credits').classList.remove('hidden');
};
window.goToMenu = () => {
    document.getElementById('screen-credits').classList.add('hidden');
    document.getElementById('screen-select').classList.add('hidden');
    document.getElementById('screen-menu').classList.remove('hidden');
};
window.selectAgent = (id) => {
    selectedAgentId = id;
    document.getElementById('agent-1').classList.remove('selected');
    document.getElementById('agent-2').classList.remove('selected');
    if (id === 1) document.getElementById('agent-1').classList.add('selected');
    if (id === 2) document.getElementById('agent-2').classList.add('selected');
    const btn = document.getElementById('btn-start-game');
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
    btn.style.background = '#ffd54f';
    btn.style.color = '#000';
    btn.style.boxShadow = '0 0 20px #ffd54f';
};
window.launchGame = () => {
    document.getElementById('screen-select').classList.add('hidden');
    document.getElementById('game-container').style.visibility = 'visible';
    document.getElementById('game-ui').style.display = 'block';
    initGame();
};

// --- TEXTURAS NEON ---
function createNeonGridTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fundo escuro
    ctx.fillStyle = '#100020';
    ctx.fillRect(0, 0, size, size);

    // Linhas do Grid
    ctx.strokeStyle = '#00eaff'; // Cyan Neon
    ctx.lineWidth = 4;

    // Desenhar quadrado
    ctx.strokeRect(0, 0, size, size);

    // Brilho interno (simulado)
    ctx.fillStyle = 'rgba(0, 234, 255, 0.1)';
    ctx.fillRect(10, 10, size - 20, size - 20);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

function createTechWallTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fundo escuro (cor do tijolo)
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, size, size);

    // Configuração dos tijolos
    const brickWidth = size / 4;
    const brickHeight = size / 8;
    const padding = 2; // Espaço do rejunte neon

    // Linhas de Circuito / Rejunte Neon
    ctx.strokeStyle = '#ff00ff'; // Rejunte Rosa Neon
    ctx.lineWidth = 4;

    for (let y = 0; y < size; y += brickHeight) {
        const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
        for (let x = -brickWidth / 2; x < size; x += brickWidth) {
            // Tijolo metálico escuro
            ctx.fillStyle = '#333';
            ctx.fillRect(x + offset + padding, y + padding, brickWidth - padding * 2, brickHeight - padding * 2);

            // Detalhes de circuito sobre o tijolo
            ctx.beginPath();
            ctx.moveTo(x + offset + brickWidth / 4, y + brickHeight / 2);
            ctx.lineTo(x + offset + 3 * brickWidth / 4, y + brickHeight / 2);
            ctx.stroke();

            // Ponto de luz ciano no tijolo
            ctx.fillStyle = '#00eaff';
            ctx.beginPath();
            ctx.arc(x + offset + brickWidth / 2, y + brickHeight / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Adicionar brilho geral nas linhas de rejunte
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.lineWidth = 8;
    for (let y = 0; y <= size; y += brickHeight) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    }
    for (let y = 0; y < size; y += brickHeight) {
        const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
        for (let x = -brickWidth / 2 + offset; x <= size; x += brickWidth) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + brickHeight); ctx.stroke();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createDoorTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size * 2;
    const ctx = canvas.getContext('2d');

    // Fundo
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, size, size * 2);

    // Divisão Neon
    ctx.fillStyle = '#00eaff';
    ctx.fillRect(size / 2 - 2, 0, 4, size * 2);

    // Faixas
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 10;
    for (let i = -size; i < size * 2; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i + size); ctx.stroke();
    }

    // Painel Topo Rosa
    ctx.fillStyle = '#d500f9';
    ctx.fillRect(20, 20, size - 40, 30);

    return new THREE.CanvasTexture(canvas);
}

// --- ENGINE ---
function initGame() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.colors.background);
    scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.02); // Neblina densa

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // ILUMINAÇÃO NEON
    const ambient = new THREE.AmbientLight(0xffffff, 0.2); // Ambiente escuro
    scene.add(ambient);

    // Luzes Coloridas Pontuais (Para dar clima)
    const blueLight = new THREE.PointLight(0x00eaff, 1, 30);
    blueLight.position.set(-10, 10, -10);
    scene.add(blueLight);

    const pinkLight = new THREE.PointLight(0xff00ff, 1, 30);
    pinkLight.position.set(10, 10, 10);
    scene.add(pinkLight);

    // Luz "Hero" em cima do player (suave)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    clock = new THREE.Clock();
    wallTextureBase = createTechWallTexture();
    floorTextureBase = createNeonGridTexture();
    doorTextureBase = createDoorTexture();

    loadScene("LOBBY");
    createPlayer(selectedAgentId);
    setupInputs();

    animate();

    startDialog("SISTEMA", [
        "Agente, bem-vindo à Rede.",
        "Sua missão começa agora.",
        "Fale com o Comandante na mesa central."
    ]);
}

function clearLevel() {
    levelObjects.forEach(obj => scene.remove(obj));
    levelObjects = [];
    obstacles = [];
    interactables = [];
}

function loadScene(sceneName) {
    const overlay = document.getElementById('transition-screen');
    overlay.style.display = 'flex';

    setTimeout(() => {
        clearLevel();
        currentLevel = sceneName;

        if (sceneName === "LOBBY") {
            createLobbyLevel();
            if (player) {
                if (missionProgress >= 4) player.position.set(15, 0, 0);
                else player.position.set(0, 0, 0);
            }
        } else if (sceneName === "ROOM") {
            createRoomLevel();
            if (player) player.position.set(-8, 0, 0);
        }

        overlay.style.display = 'none';
    }, 500);
}

// --- CENÁRIO 1: LOBBY NEON ---
function createLobbyLevel() {
    // Chão Grid
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
        map: floorTextureBase,
        roughness: 0.2,
        metalness: 0.5,
        emissive: 0x100020, // Brilho suave roxo no chão
        emissiveIntensity: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    levelObjects.push(floor);

    // Paredes Tech
    createWall(-20, 3, -20, 40, 6, 1);
    createWall(-20, 3, 0, 1, 6, 40);
    createWall(20, 3, -10, 1, 6, 20);
    createWall(20, 3, 10, 1, 6, 20);
    createWall(0, 3, 20, 40, 6, 1);

    // Porta Neon
    createDoor(19.5, 0, 0, "ROOM", -Math.PI / 2);

    // Mesa Comandante (Holográfica)
    const tableGeo = new THREE.CylinderGeometry(4, 4, 1, 6);
    const tableMat = new THREE.MeshStandardMaterial({
        color: 0x222244,
        emissive: 0x00eaff,
        emissiveIntensity: 0.3
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.5, -10);
    scene.add(table);
    levelObjects.push(table);
    addCollisionBox(table);

    // NPC Comandante
    createNPC(0, -10, CONFIG.colors.commander, "Comandante Motta", [
        "Olá Agente. A rede está instável.",
        "Detectamos invasores no Setor 2.",
        "Fale com a Agente Júlia."
    ]);

    // Estações Laterais
    createWorkstation(-12, -5);
    createWorkstation(-12, 5);
    createWorkstation(12, -5);
    createWorkstation(12, 5);

    createNPC(-12, -2, CONFIG.colors.npc, "Agente Júlia", []);
}

// --- CENÁRIO 2: QUARTO TECH ---
function createRoomLevel() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(25, 20), new THREE.MeshStandardMaterial({ map: floorTextureBase, roughness: 0.2 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    levelObjects.push(floor);

    createWall(0, 3, -10, 25, 6, 1);
    createWall(0, 3, 10, 25, 6, 1);
    createWall(12.5, 3, 0, 1, 6, 20);
    createWall(-12.5, 3, 0, 1, 6, 20);

    createDoor(-12, 0, 0, "LOBBY", Math.PI / 2);

    // Cama Futurista
    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 7), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    bedBase.position.set(6, 0.5, -4);
    scene.add(bedBase);
    levelObjects.push(bedBase);
    addCollisionBox(bedBase);
    // Colchão Neon
    const matress = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5, 6.5), new THREE.MeshStandardMaterial({ color: 0x00eaff, emissive: 0x00eaff, emissiveIntensity: 0.2 }));
    matress.position.set(6, 1.0, -4);
    scene.add(matress);
    levelObjects.push(matress);

    // Setup PC
    const desk = new THREE.Mesh(new THREE.BoxGeometry(5, 1.5, 2.5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    desk.position.set(6, 0.75, 4);
    scene.add(desk);
    levelObjects.push(desk);
    addCollisionBox(desk);

    // Tela Brilhante
    const pcScreen = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    pcScreen.position.set(6, 2, 4);
    scene.add(pcScreen);
    levelObjects.push(pcScreen);

    const screenGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
    screenGlow.position.set(6, 2, 3.94);
    screenGlow.rotation.y = Math.PI;
    scene.add(screenGlow);
    levelObjects.push(screenGlow);

    const pcHitbox = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ visible: false }));
    pcHitbox.position.set(6, 1.5, 3);
    pcHitbox.userData = { isInteractable: true, name: "Terminal Seguro", dialogs: [], type: "PC" };
    scene.add(pcHitbox);
    levelObjects.push(pcHitbox);
    interactables.push(pcHitbox);
}

// --- OBJETOS ---
function createDoor(x, y, z, targetScene, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 0.5), new THREE.MeshStandardMaterial({ color: CONFIG.colors.doorFrame }));
    frame.position.y = 3;
    group.add(frame);

    const doorGeo = new THREE.PlaneGeometry(3, 5.5);
    const doorMat = new THREE.MeshStandardMaterial({
        map: doorTextureBase,
        emissive: 0x222222
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 2.75, 0.3);
    group.add(door);

    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 2), new THREE.MeshBasicMaterial({ visible: false }));
    hitBox.position.set(0, 3, 0);
    hitBox.userData = { isInteractable: true, name: "Portal de Acesso", type: "DOOR", target: targetScene };
    group.add(hitBox);

    scene.add(group);
    levelObjects.push(group);
    interactables.push(hitBox);
}

function createWall(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const localTex = wallTextureBase.clone();
    localTex.wrapS = THREE.RepeatWrapping;
    localTex.wrapT = THREE.RepeatWrapping;
    const len = Math.max(w, d);
    localTex.repeat.set(len * 0.2, h * 0.2); // Menos repetição
    localTex.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
        map: localTex,
        color: 0x888888, // Escurece a textura
        roughness: 0.4,
        metalness: 0.6
    });

    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    levelObjects.push(wall);
    addCollisionBox(wall);
}

function createWorkstation(x, z) {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(5, 1.5, 2.5), new THREE.MeshStandardMaterial({ color: CONFIG.colors.furniture }));
    desk.position.set(x, 0.75, z);
    scene.add(desk);
    levelObjects.push(desk);
    addCollisionBox(desk);

    // Tela Holográfica
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), new THREE.MeshBasicMaterial({ color: 0x00eaff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
    screen.position.set(x, 2, z);
    screen.rotation.x = 0.2;
    scene.add(screen);
    levelObjects.push(screen);
}

// --- PERSONAGENS ---
function createHumanoid(color, hasBackpack = true) {
    const character = new THREE.Group();
    character.scale.set(1.4, 1.4, 1.4); // Bonecos maiores

    const skinMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.skin });
    const shirtMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.4 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const packMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.backpack });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.35), shirtMat);
    body.position.y = 1.1; character.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.4), skinMat);
    head.position.y = 1.7; character.add(head);

    // Óculos Visor (Em vez de olhos)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.2), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    visor.position.set(0, 1.75, 0.15);
    character.add(visor);

    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    const lArm = new THREE.Mesh(armGeo, shirtMat); lArm.position.set(0.4, 1.1, 0); character.add(lArm);
    const rArm = new THREE.Mesh(armGeo, shirtMat); rArm.position.set(-0.4, 1.1, 0); character.add(rArm);

    const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const lLeg = new THREE.Mesh(legGeo, pantsMat); lLeg.position.set(0.15, 0.35, 0); character.add(lLeg);
    const rLeg = new THREE.Mesh(legGeo, pantsMat); rLeg.position.set(-0.15, 0.35, 0); character.add(rLeg);

    if (hasBackpack) {
        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), packMat);
        pack.position.set(0, 1.15, -0.3); character.add(pack);
    }

    character.userData.parts = { body, head, leftArm: lArm, rightArm: rArm, leftLeg: lLeg, rightLeg: rLeg };
    return character;
}

function createNPC(x, z, color, name, dialogs) {
    const npc = createHumanoid(color, true);
    npc.position.set(x, 0, z);
    npc.userData = { isInteractable: true, name: name, dialogs: dialogs };
    scene.add(npc);
    levelObjects.push(npc);
    interactables.push(npc);

    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), new THREE.MeshBasicMaterial({ visible: false }));
    hitBox.position.set(x, 1, z);
    addCollisionBox(hitBox);
}

function addCollisionBox(mesh) {
    obstacles.push(new THREE.Box3().setFromObject(mesh));
}

function createPlayer(agentId) {
    let color = CONFIG.colors.agent1;
    if (agentId === 2) color = CONFIG.colors.agent2;
    player = createHumanoid(color, true);
    scene.add(player);
    playerBody = new THREE.Box3();
}

// --- INPUTS ---
function setupInputs() {
    document.addEventListener('keydown', (e) => {
        if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = true;
        if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = true;
        if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = true;
        if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = true;
        if (e.code === 'Space' || e.code === 'Enter') checkInteraction();
    });
    document.addEventListener('keyup', (e) => {
        if (['KeyW', 'ArrowUp'].includes(e.code)) keys.w = false;
        if (['KeyS', 'ArrowDown'].includes(e.code)) keys.s = false;
        if (['KeyA', 'ArrowLeft'].includes(e.code)) keys.a = false;
        if (['KeyD', 'ArrowRight'].includes(e.code)) keys.d = false;
    });

    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.screen')) return;
        if (e.target.closest('#joystick-zone') || e.target.closest('#dialog-box')) return;
        if (e.target.closest('#computer-overlay')) return;

        isMouseDown = true;
        dragStartX = e.clientX;
        isDraggingView = false;
    });

    window.addEventListener('pointermove', (e) => {
        if (isMouseDown) {
            if (Math.abs(e.clientX - dragStartX) > 5) isDraggingView = true;
            if (isDraggingView) {
                cameraAngle -= (e.clientX - dragStartX) * 0.005;
                dragStartX = e.clientX;
            }
        }
    });

    window.addEventListener('pointerup', (e) => {
        isMouseDown = false;
        if (!isDraggingView) {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(interactables, true);

            if (intersects.length > 0) {
                let target = intersects[0].object;
                while (target.parent && !target.userData.isInteractable) {
                    target = target.parent;
                    if (target === scene) break;
                }

                if (target.userData && target.userData.isInteractable) {
                    if (player.position.distanceTo(target.getWorldPosition(new THREE.Vector3())) < 10) {
                        handleInteraction(target);
                    }
                }
            }
        }
        isDraggingView = false;
    });

    const joyZone = document.getElementById('joystick-zone');
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        const manager = nipplejs.create({ zone: joyZone, mode: 'static', position: { left: '50%', top: '50%' }, color: 'cyan' });
        manager.on('move', (evt, data) => {
            const angle = data.angle.radian;
            const force = Math.min(data.force, 1.0);
            joystickVec.set(Math.cos(angle) * force, 0, -Math.sin(angle) * force);
        });
        manager.on('end', () => joystickVec.set(0, 0, 0));
    } else {
        joyZone.style.display = 'none';
    }
}

function checkInteraction() {
    let nearest = null;
    let minDist = 7;
    interactables.forEach(obj => {
        const dist = player.position.distanceTo(obj.getWorldPosition(new THREE.Vector3()));
        if (dist < minDist) nearest = obj;
    });
    if (nearest) handleInteraction(nearest);
}

function handleInteraction(obj) {
    const data = obj.userData;
    let dialogs = data.dialogs || [];

    if (data.type === "DOOR") {
        if (data.target === "LOBBY") { loadScene("LOBBY"); return; }
        if (data.target === "ROOM") {
            if (missionProgress >= 2) {
                loadScene(data.target);
                if (missionProgress < 3) {
                    startDialog("SISTEMA", ["Acessando área segura..."]);
                    missionProgress = 3;
                    updateHUD("Acesse o Terminal Seguro", "#ff00ff");
                }
            } else {
                startDialog("SISTEMA", ["Acesso Bloqueado. Fale com a Agente Júlia."]);
            }
            return;
        }
    }

    if (data.type === "PC") {
        if (missionProgress >= 3) {
            document.getElementById('computer-overlay').style.display = 'flex';
            document.getElementById('pc-view-login').classList.remove('hidden');
            document.getElementById('pc-view-puzzle').classList.add('hidden');
            document.getElementById('pc-view-social').classList.add('hidden');
            document.getElementById('pc-pass-input').value = '';
            document.getElementById('pass-feedback').innerText = '';
        } else {
            startDialog("SISTEMA", ["Terminal bloqueado."]);
        }
        return;
    }

    const npcName = data.name;
    if (npcName === "Comandante Motta") {
        if (missionProgress === 0) {
            updateHUD("Pegue o Tablet com a Agente Júlia", "#00ff88");
            missionProgress = 1;
        } else if (missionProgress === 4) {
            dialogs = ["Incrível! A rede está segura novamente."];
            updateHUD("Missão Completa - Aguardando...", "#ffffff");
        } else {
            dialogs = ["Vá falar com a Júlia."];
        }
    } else if (npcName === "Agente Júlia") {
        if (missionProgress === 0) dialogs = ["Fale com o Comandante primeiro."];
        else if (missionProgress === 1) {
            dialogs = ["Aqui está. Vá para o Quarto pela porta neon."];
            updateHUD("Entre na Porta Neon", "#d500f9");
            missionProgress = 2;
        } else {
            dialogs = ["Vá logo! A porta está aberta."];
        }
    }

    startDialog(npcName, dialogs);
}

function updateHUD(text, color) {
    const hud = document.getElementById('obj-text');
    hud.innerText = text;
    hud.style.color = color;
    hud.style.textShadow = `0 0 10px ${color}`;
}

function startDialog(name, texts) {
    if (!texts || texts.length === 0) return;
    if (isDialogOpen) return;
    isDialogOpen = true;
    document.getElementById('dialog-box').style.display = 'block';
    document.getElementById('npc-name').innerText = name;
    currentDialogQueue = [...texts];
    advanceDialog();
}

window.advanceDialog = function () {
    if (!isDialogOpen) return;
    if (currentDialogQueue.length > 0) {
        document.getElementById('dialog-text').innerText = currentDialogQueue.shift();
    } else {
        document.getElementById('dialog-box').style.display = 'none';
        isDialogOpen = false;
    }
}

function update(dt) {
    if (isDialogOpen) return;

    const move = new THREE.Vector3(0, 0, 0);
    if (keys.w) move.z -= 1;
    if (keys.s) move.z += 1;
    if (keys.a) move.x -= 1;
    if (keys.d) move.x += 1;
    if (joystickVec.lengthSq() > 0) move.add(new THREE.Vector3(joystickVec.x, 0, -joystickVec.z));

    if (move.lengthSq() > 0) {
        move.normalize();
        move.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle);

        const speed = CONFIG.speed * dt;
        const nextPos = player.position.clone().add(move.multiplyScalar(speed));

        playerBody.setFromCenterAndSize(nextPos, new THREE.Vector3(0.7, 2, 0.7));

        let collided = false;
        for (let box of obstacles) {
            if (playerBody.intersectsBox(box)) {
                collided = true;
                break;
            }
        }

        if (!collided) {
            player.position.copy(nextPos);
            player.rotation.y = Math.atan2(move.x, move.z);

            walkTime += dt * 12; // Animação mais rápida
            player.userData.parts.body.position.y = 1.1 + Math.sin(walkTime) * 0.05;
            player.userData.parts.head.position.y = 1.7 + Math.sin(walkTime) * 0.05;
            player.userData.parts.leftArm.rotation.x = Math.sin(walkTime) * 0.6;
            player.userData.parts.rightArm.rotation.x = -Math.sin(walkTime) * 0.6;
            player.userData.parts.leftLeg.rotation.x = -Math.sin(walkTime) * 0.6;
            player.userData.parts.rightLeg.rotation.x = Math.sin(walkTime) * 0.6;
        }
    } else {
        player.userData.parts.body.position.y = 1.1;
        player.userData.parts.head.position.y = 1.7;
        player.userData.parts.leftArm.rotation.x = 0;
        player.userData.parts.rightArm.rotation.x = 0;
        player.userData.parts.leftLeg.rotation.x = 0;
        player.userData.parts.rightLeg.rotation.x = 0;
    }

    const camDist = 22;
    const camHeight = 22;
    const offsetX = Math.sin(cameraAngle) * camDist;
    const offsetZ = Math.cos(cameraAngle) * camDist;

    const targetCamX = player.position.x + offsetX;
    const targetCamZ = player.position.z + offsetZ;

    camera.position.x += (targetCamX - camera.position.x) * 0.1;
    camera.position.z += (targetCamZ - camera.position.z) * 0.1;
    camera.position.y = camHeight;
    camera.lookAt(player.position);
}

function animate() {
    requestAnimationFrame(animate);
    if (clock && player) {
        update(clock.getDelta());
        renderer.render(scene, camera);
    }
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
