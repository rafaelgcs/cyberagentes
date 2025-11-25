import * as THREE from 'three';

export class CyberNPC {
    constructor(scene, id, name, position, color = 0x00ff00) {
        this.scene = scene;
        this.id = id;
        this.name = name;
        this.position = position;

        // Grupo para conter todas as partes do NPC
        this.meshGroup = new THREE.Group();
        this.meshGroup.position.copy(position);

        // Marcar para o Raycaster detectar
        this.meshGroup.userData = {
            isNPC: true,
            id: this.id,
            name: this.name
        };

        this.createBody(color);
        this.createInteractionZone(color);

        this.scene.add(this.meshGroup);
    }

    createBody(color) {
        // Corpo: Cápsula (Estilo Android)
        const geometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.3,
            metalness: 0.9,
            emissive: color,
            emissiveIntensity: 0.2
        });

        this.bodyMesh = new THREE.Mesh(geometry, material);
        this.bodyMesh.position.y = 1;
        this.meshGroup.add(this.bodyMesh);

        // Visor (Olhos)
        const visorGeo = new THREE.BoxGeometry(0.5, 0.15, 0.3);
        const visorMat = new THREE.MeshBasicMaterial({ color: color });
        this.visorMesh = new THREE.Mesh(visorGeo, visorMat);
        this.visorMesh.position.set(0, 1.5, 0.25);
        this.meshGroup.add(this.visorMesh);
    }

    createInteractionZone(color) {
        // Anel Holográfico no chão
        const geo = new THREE.RingGeometry(0.6, 0.7, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.ring = new THREE.Mesh(geo, mat);
        this.ring.rotation.x = -Math.PI / 2;
        this.ring.position.y = 0.05;
        this.meshGroup.add(this.ring);
    }

    update(playerRef, elapsedTime) {
        // 1. Animação Idle (Flutuando suavemente)
        const floatY = Math.sin(elapsedTime * 2) * 0.05;
        this.bodyMesh.position.y = 1 + floatY;
        this.visorMesh.position.y = 1.5 + floatY;

        // 2. Lógica de Olhar para o Jogador (LookAt)
        // Calcula distância simples
        const dist = this.meshGroup.position.distanceTo(playerRef.position);

        if (dist < 6) { // Se o jogador estiver perto (6 unidades)
            // Olha suavemente para o jogador (apenas eixo Y para não inclinar corpo)
            const lookTarget = new THREE.Vector3(playerRef.position.x, this.meshGroup.position.y, playerRef.position.z);
            this.meshGroup.lookAt(lookTarget);

            // Efeito visual de "Atenção"
            this.ring.scale.setScalar(1.2 + Math.sin(elapsedTime * 10) * 0.1);
            this.ring.material.opacity = 0.9;
        } else {
            // Volta ao estado normal
            this.ring.scale.setScalar(1);
            this.ring.material.opacity = 0.3;
        }
    }
}