/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Particle {
        position: Vector3;
        direction: Vector3;
        lifetime: number;
        age: number;
        size: number;
        angle: number;
        angularSpeed: number;
        color: Color4;
        colorStep: Color4;

        constructor();

    }

    class ParticleSystem {
        name: string;
        id: string;
        gravity: Vector3;
        direction1: Vector3;
        direction2: Vector3;
        minEmitBox: Vector3;
        maxEmitBox: Vector3;
        color1: Color4;
        color2: Color4;
        colorDead: Color4;
        deadAlpha: number;
        textureMask: Color4;
        particles: Particle[];

        emitter: any; // needs update
        emitRate: number;
        manualEmitCount: number;
        updateSpeed: number;
        targetStopDuration: number;
        disposeOnStop: bool;
        minEmitPower: number;
        maxEmitPower: number;
        minLifeTime: number;
        maxLifeTime: number;
        minSize: number;
        maxSize: number;
        minAngularSpeed: number;
        maxAngularSpeed: number;

        particleTexture: Texture;

        onDispose: () => void;

        blendMode: number;

        constructor(name: string, capacity: number, scene: Scene);

        isAlive(): bool;
        start(): void;
        stop(): void;
        animate(): void;
        render(): number;
        dispose(): void;
        clone(name: string, newEmitter: any): ParticleSystem; // needs update (newEmitter)

        static BLENDMODE_ONEONE: number;
        static BLENDMODE_STANDARD: number;
    }
}