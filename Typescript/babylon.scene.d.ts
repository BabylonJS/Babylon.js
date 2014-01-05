/// <reference path="babylon.d.ts" />

declare module BABYLON {
    interface ScenePickResult {
        hit: boolean;
        distance: number;
        pickedMesh: Mesh;
        pickedPoint: Vector3;
    }

    class Scene {
        constructor(engine: Engine);

        autoClear: boolean;
        clearColor: Color3;
        ambientColor: Color3;

        fogMode: number;
        fogColor: Color3;
        fogDensity: number;
        fogStart: number;
        fogEnd: number;

        lights: Light[];
        cameras: Camera[];
        activeCamera: Camera;
        meshes: Mesh[];
        materials: Material[];
        multiMaterials: MultiMaterial[];
        defaultMaterial: StandardMaterial;
        textures: Texture[];
        particlesEnabled: boolean;
        particleSystems: ParticleSystem[];
        spriteManagers: SpriteManager[];
        layers: Layer[];
        skeletons: Skeleton[];
        collisionsEnabled: boolean;
        gravity: Vector3;
        postProcessManager: PostProcessManager;

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
        getRenderId: number;

        isReady(): boolean;
        registerBeforeRender(func: Function): void;
        unregisterBeforeRender(func: Function): void;
        executeWhenReady(func: Function): void;
        getWaitingItemsCount(): number;

        beginAnimation(target: Mesh, from: number, to: number, loop: boolean, speedRatio?: number, onAnimationEnd?: Function): void;
        stopAnimation(target: Mesh);

        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
        getTransformMatrix(): Matrix;
        setTransformMatrix(view: Matrix, projection: Matrix);
        activeCameraByID(id: number): void;
        getMaterialByID(id: number): Material;
        getLightByID(id: number): Light;
        getMeshByID(id: number): Mesh;
        getLastMeshByID(id: number): Mesh;
        getMeshByName(name: string): Mesh;
        isActiveMesh(mesh: Mesh): boolean;
        getLastSkeletonByID(id: number): Skeleton;
        getSkeletonByID(id: number): Skeleton;
        getSkeletonByName(name: string): Skeleton;

        _evaluateActiveMeshes(): void;
        _localRender(opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, activeMeshes);
        render();
        dispose();
        _getNewPosition(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;
        _collideWithWorld(position: Vector3, velocity: Vector3, collider: Sphere, maximumRetries: number): Vector3;

        createOrUpdateSelectionOctree(): void;
        createPickingRay(x: number, y: number, world: Matrix): Ray;
        pick(x: number, y: number): ScenePickResult;

        static FOGMODE_NONE: number;
        static FOGMODE_EXP: number;
        static FOGMODE_EXP2: number;
        static FOGMODE_LINEAR: number;
    }
}