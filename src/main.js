import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Imports dos Nossos Módulos
import { World } from './World.js';
import { PostProcessing } from './utils/PostProcessing.js';
import { CyberProps } from './entities/CyberProps.js';
import { CyberNPC } from './entities/CyberNPC.js';

// --- CONFIGURAÇÃO INICIAL ---
const scene = new THREE.Scene();
// Fog Exponencial Preto para esconder o fim do mundo
scene.fog = new THREE.FogExp2(0x000000, 0.03);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias false ajuda no desempenho com Bloom
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

// Controles (Orbit para debug, mas pode ser FirstPerson)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2; // Não deixa olhar por baixo do chão

// --- INICIALIZAÇÃO DO MUNDO E ENTIDADES ---
const world = new World(scene); // Carrega as salas
const propsGen = new CyberProps(scene);
const postProcess = new PostProcessing(scene, camera, renderer);

// Lista de Entidades Interativas
const npcs = [];

function initGameContent() {
    // 1. Criar Props de Ambiente
    propsGen.createHolographicWindow(-8, 3, -14.4);
    propsGen.createHolographicWindow(8, 3, -14.4);

    propsGen.createCyberBookshelf(-14, 0, -5, Math.PI / 2);
    propsGen.createCyberBookshelf(14, 0, 5, -Math.PI / 2);

    // 2. Criar NPCs
    const npc1 = new CyberNPC(scene, 1, "Hacker Neo", new THREE.Vector3(-5, 0, -8), 0x00ff00);
    const npc2 = new CyberNPC(scene, 2, "Cyber Guard", new THREE.Vector3(5, 0, -5), 0xff0055);

    npcs.push(npc1, npc2);
}

initGameContent();

// --- SISTEMA DE INTERAÇÃO (RAYCASTER) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // Zero = centro da tela

// Elementos UI
const promptUI = document.getElementById('interaction-prompt');
const interactText = document.getElementById('interaction-text');
let currentHoveredNPC = null;

function handleInteractions() {
    // Raycast sempre do centro da câmera
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    // Verifica intersecção com os grupos dos NPCs
    // Precisamos percorrer os filhos da cena e achar os que têm userData.isNPC
    const interactables = scene.children.filter(obj => obj.userData && obj.userData.isNPC);

    // Nota: Raycaster precisa checar recursivamente os filhos dos grupos
    const intersects = raycaster.intersectObjects(interactables, true);

    if (intersects.length > 0) {
        // Acha o objeto pai principal (o Grupo do NPC)
        let target = intersects[0].object;
        while (target.parent && !target.userData.isNPC) {
            target = target.parent;
        }

        if (target.userData.isNPC) {
            const dist = camera.position.distanceTo(target.position);

            if (dist < 5) { // Distância máxima de interação
                currentHoveredNPC = target.userData;
                promptUI.classList.remove('hidden');
                promptUI.style.display = 'block'; // Garante display
                interactText.innerText = `Falar com ${target.userData.name}`;
            } else {
                clearInteraction();
            }
        }
    } else {
        clearInteraction();
    }
}

function clearInteraction() {
    currentHoveredNPC = null;
    promptUI.classList.add('hidden');
}

// Escuta tecla 'E' para interagir
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && currentHoveredNPC) {
        alert(`Você iniciou uma conversa com: ${currentHoveredNPC.name}\n(Aqui entraria seu sistema de diálogo)`);
    }
});

// --- GAME LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Atualiza controles
    controls.update();

    // Atualiza NPCs (Passamos a câmera como referência do "Player")
    npcs.forEach(npc => npc.update(camera, elapsedTime));

    // Checa interações
    handleInteractions();

    // Renderiza com Bloom
    postProcess.render();
}

// --- REDIMENSIONAMENTO ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    postProcess.resize(window.innerWidth, window.innerHeight);
});

// Inicia
animate();