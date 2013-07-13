/// <reference path="babylon.d.ts" />

declare module BABYLON {
    interface ScenePickResult {
        hit: bool;
        distance: number;
        pickedMesh: Mesh;
        pickedPoint: Vector3;
    }
    class Scene {
        constructor(engine: Engine);

        getEngine(): Engine;
        getTotalVertices(): number;
        getActiveVertices(): number;
        getActiveParticles(): number;
        getLastFrameDuration(): number;
        getEvaluateActiveMeshesDuration(): number;
        getRenderTargetsDuration(): number;
        getRenderDuration(): number;
        getParticlesDuration(): number;
        getSpritesDuration(): number;
        getAnimationRatio(): number;

        isReady(): bool;
        executeWhenReady(func: Function): void;
        // TODO: Animations
        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
        getTransformMatrix(): Matrix;
        setTransformMatrix(view: Matrix, projection: Matrix);
        activeCameraByID(id: number): void;
        getMaterialByID(id: number): Material;
        getMeshByID(id: number): Mesh;
        getLastMeshByID(id: number): Mesh;
        getMeshByName(name: string): Mesh;
        isActiveMesh(mesh: Mesh): bool;
        _evaluateActiveMeshes(): void;
        _localRender(opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, activeMeshes);
        render();
        dispose();
        _getNewPosition(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;
        _collideWithWorld(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;
        createPickingRay(x: number, y: number, world: Matrix): Ray;
        pick(x: number, y: number): ScenePickResult;
    }
}