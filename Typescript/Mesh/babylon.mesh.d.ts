/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    interface MeshRayHitTest { hit: boolean; distance: number }

    class Mesh {
        name: string;
        id: string;

        position: Vector3;
        rotation: Vector3;
        scaling: Vector3;
        rotationQuaternion: Quaternion;
        subMeshes: SubMesh[];
        animations: Animation[];

        constructor(name: string, scene: Scene);

        static BILLBOARDMODE_NONE: number;
        static BILLBOARDMODE_X: number;
        static BILLBOARDMODE_Y: number;
        static BILLBOARDMODE_Z: number;
        static BILLBOARDMODE_ALL: number;

        delayLoadState: boolean;
        material: Material;
        parent: Mesh;
        _isReady: boolean;
        _isEnabled: boolean;
        isVisible: boolean;
        isPickable: boolean;
        visibility: number;
        billboardMode: number;
        checkCollisions: boolean;
        receiveShadows: boolean;

        isDisposed: boolean;
        onDispose: () => void;
        skeleton: Skeleton;
        renderingGroupId: number;

        getBoundingInfo(): BoundingInfo;
        getScene(): Scene;
        getWorldMatrix: Matrix;
        getTotalVertices: number;
        getVerticesData(kind: string): any[];
        isVerticesDataPresent(kind: string): boolean;
        getTotalIndicies(): number;
        getIndices(): number[];
        getVertexStrideSize(): number;
        _needToSynchronizeChildren(): boolean;
        setPivotMatrix(matrix: Matrix): void;
        getPivotMatrix(): Matrix;
        isSynchronized(): boolean;
        isReady(): boolean;
        isEnabled(): boolean;
        setEnabled(value: boolean): void;
        isAnimated(): boolean;
        markAsDirty(property: string): void;
        refreshBoudningInfo(): void;
        computeWorldMatrix(): Matrix;
        _createGlobalSubMesh(): SubMesh;
        subdivide(count: number): void;
        setVerticesData(data: any[], kind: string, updatable: boolean): void;
        updateVerticesData(kind: string, data: any[]);
        setIndices(indices: number[]): void;
        bindAndDraw(subMesh: SubMesh, effect: Effect, wireframe: boolean): void;
        registerBeforeRender(func: Function): void;
        unregisterBeforeRender(func: Function): void;
        render(subMesh: SubMesh): void;
        isDescendantOf(ancestor: Mesh): boolean;
        getDescendants(): Mesh[];
        getEmittedParticleSystems(): ParticleSystem[];
        getHierarchyEmittedParticleSystems(): ParticleSystem[];
        getChildren(): Mesh[];
        isInFrustrum(frustumPlanes: Plane[]): boolean;
        setMaterialByID(id: string);
        getAnimatables(): Material;
        setLocalTranslation(vector3: Vector3): void;
        getLocalTranslation(): Vector3;
        bakeTransformIntoVertices(transform: Matrix): void;

        intersectsMesh(mesh: Mesh, precise: boolean): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersects(ray: Ray): MeshRayHitTest;
        clone(name: string, newParent: Mesh): Mesh;

        dispose(): void;

        static CreateBox(name: string, size: number, scene: Scene): Mesh;
        static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, scene: Scene, updatable: boolean): Mesh;
        static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene: Scene, updatable: boolean): Mesh;
        static CreateSphere(name: string, segments: number, diameter: number, scene: Scene): Mesh;
        static CreatePlane(name: string, size: number, scene: Scene): Mesh;
        static CreateGround(name: string, width: number, height: number, subdivisions: number, scene: Scene, updatable: boolean): Mesh;
        static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable: boolean): Mesh;
        static ComputeNormal(positions: number[], normals: number[], indices: number[]);
    }
}