import * as THREE from 'three';

// Esta classe simula a estrutura que você pediu para NÃO alterar
// Imagine que aqui estão suas paredes, chão e teto originais
export class World {
    constructor(scene) {
        this.scene = scene;
        this.createBaseRoom();
    }

    createBaseRoom() {
        // Chão (Reflexivo escuro)
        const floorGeo = new THREE.PlaneGeometry(30, 30);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x050505,
            roughness: 0.1,
            metalness: 0.5
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Paredes Simples
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x101010 });

        // Parede Fundo
        const wall1 = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 1), wallMat);
        wall1.position.set(0, 5, -15);
        this.scene.add(wall1);

        // Parede Esquerda
        const wall2 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 30), wallMat);
        wall2.position.set(-15, 5, 0);
        this.scene.add(wall2);

        // Parede Direita
        const wall3 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 30), wallMat);
        wall3.position.set(15, 5, 0);
        this.scene.add(wall3);

        // Iluminação Ambiente (Escura e Azulada)
        const ambientLight = new THREE.AmbientLight(0x000044, 0.5);
        this.scene.add(ambientLight);
    }
}