/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Light {
        name: string;
        id: string;

        constructor(name: string, scene: Scene);

        intensity: number;
        isEnabled: boolean;

        getScene(): Scene;
        getShadowGenerator: ShadowGenerator;
        dispose(): void;
    }
}