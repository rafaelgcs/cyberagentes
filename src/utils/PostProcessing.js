import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class PostProcessing {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.composer = new EffectComposer(renderer);
        this.init();
    }

    init() {
        // 1. Renderização Normal da Cena
        const renderScene = new RenderPass(this.scene, this.camera);

        // 2. Efeito Bloom (Brilho Neon)
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // Força (Strength)
            0.4, // Raio (Radius)
            0.85 // Limiar (Threshold)
        );

        // Configurações Finas para o Estilo Cyberpunk
        bloomPass.strength = 1.8;  // Muito brilho
        bloomPass.radius = 0.5;    // Espalhamento médio
        bloomPass.threshold = 0.1; // Cores escuras não brilham, apenas luzes

        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);
    }

    resize(width, height) {
        this.composer.setSize(width, height);
    }

    render() {
        this.composer.render();
    }
}