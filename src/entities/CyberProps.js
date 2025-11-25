import * as THREE from 'three';

export class CyberProps {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Cria uma Janela Holográfica
     * @param {number} x Posição X
     * @param {number} y Posição Y
     * @param {number} z Posição Z
     * @param {number} rotationY Rotação em radianos
     */
    createHolographicWindow(x, y, z, rotationY = 0) {
        const width = 4;
        const height = 3;

        // Geometria
        const geometry = new THREE.PlaneGeometry(width, height, 4, 4); // Segmentos para wireframe

        // Material Estilo "Grid Digital"
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Ciano
            side: THREE.DoubleSide,
            wireframe: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending // Faz brilhar mais
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotationY;

        // Luz de Área para iluminar o ambiente com a cor da janela
        const light = new THREE.PointLight(0x00ffff, 3, 15);
        light.position.set(x, y, z + (rotationY !== 0 ? 0 : 0.5));

        this.scene.add(mesh);
        this.scene.add(light);
    }

    /**
     * Cria uma Estante de Livros Cyberpunk
     */
    createCyberBookshelf(x, y, z, rotationY = 0) {
        const group = new THREE.Group();

        // Estrutura Principal (Metal Escuro)
        const frameGeo = new THREE.BoxGeometry(2.5, 4, 0.5);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.2,
            metalness: 0.8
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);

        // Gerar Livros/DataPads aleatórios
        const bookGeo = new THREE.BoxGeometry(0.15, 0.6, 0.4);

        for (let i = 0; i < 15; i++) {
            // Lógica para decidir se é um objeto neon ou comum
            const isNeon = Math.random() > 0.7;
            const neonColor = Math.random() > 0.5 ? 0xff00ff : 0x00ffff;

            const bookMat = new THREE.MeshStandardMaterial({
                color: isNeon ? neonColor : 0x444444,
                emissive: isNeon ? neonColor : 0x000000,
                emissiveIntensity: isNeon ? 2.0 : 0,
                roughness: 0.1
            });

            const book = new THREE.Mesh(bookGeo, bookMat);

            // Posicionamento nas prateleiras
            const shelfLevel = (Math.floor(Math.random() * 3) - 1) * 1.2; // 3 níveis
            const posX = (Math.random() - 0.5) * 2;

            book.position.set(posX, shelfLevel, 0.2);
            book.rotation.z = (Math.random() - 0.5) * 0.3; // Leve inclinação

            group.add(book);
        }

        group.position.set(x, y, z);
        group.rotation.y = rotationY;

        this.scene.add(group);
    }
}