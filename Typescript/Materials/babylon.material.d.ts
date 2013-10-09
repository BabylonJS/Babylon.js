//// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Material {
        name: string;
        id: string;

        constructor(name: string, scene: Scene);

        checkReadyOnEveryCall: boolean;
        alpha: number;
        wireframe: boolean;
        backFaceCulling: boolean;
        _effect: Effect;

        onDispose: () => void;

        isReady(): boolean;
        getEffect(): Effect;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;

        _preBind(): void;
        bind(world: Matrix, mesh: Mesh): void;
        unbind(): void;
        baseDispose(): void;

        dispose(): void;
    }
}