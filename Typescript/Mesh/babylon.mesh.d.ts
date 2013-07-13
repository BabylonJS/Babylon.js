/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    interface MeshRayHitTest { hit: bool; distance: number };

    class Mesh {
        name: string;
        id: string;
        private _scene: Scene;
        private _vertexDeclaration: number[];
        private _vertexStrideSize: number;
        private _totalVertices: number;
        private _worldMatrix: Matrix;
        position: Vector3;
        rotation: Vector3;
        scaling: Vector3;
        subMeshes: SubMesh[];
        animations: Animation[];

        constructor(name: string, vertexDeclaration: number[], scene: Scene);

        static BILLBOARDMODE_NONE: number;
        static BILLBOARDMODE_X: number;
        static BILLBOARDMODE_Y: number;
        static BILLBOARDMODE_Z: number;
        static BILLBOARDMODE_ALL: number;

        material: Material;
        parent: Mesh;
        _isEnabled: bool;
        isVisible: bool;
        visibility: number;
        billboardMode: number;
        checkCollisions: bool;

        onDispose: () => void;

        getScene(): Scene;
        getWorldMatrix: Matrix;
        getTotalVertices: number;
        getVertices: VertexBuffer;
        getVertexStride(): number;
        getFloatVertexStrideSize(): number;
        _needToSynchronizeChildren(): bool;
        isSynchronized(): bool;
        isEnabled(): bool;
        setEnabled(value: bool): void;
        isAnimated(): bool;
        computeWorldMatrix(): Matrix;
        _createGlobalSubMesh(): SubMesh;
        setVertices(vertices: VertexBuffer, uvCount: number): void;
        setIndices(indices: number[]): void;
        render(subMesh: SubMesh): void;
        isDescendantOf(ancestor: Mesh): bool;
        getDescendants(): Mesh[];
        getEmittedParticleSystems(): ParticleSystem[];
        getHierarchyEmittedParticleSystems(): ParticleSystem[];
        getChildren(): Mesh[];
        isInFrustrum(frustumPlanes: Plane[]): bool;
        setMaterialByID(id: string);
        getAnimatables(): Material;

        intersectsMesh(mesh: Mesh, precise: bool): bool;
        intersectsPoint(point: Vector3): bool;
        intersects(ray: Ray): MeshRayHitTest;
        clone(name: string, newParent: Mesh): Mesh;

        dispose(): void;

        static createBox(name: string, size: number, scene: Scene): Mesh;
        static createSphere(name: string, segments: number, diameter: number, scene: Scene): Mesh;
        static createPlane(name: string, size: number, scene: Scene): Mesh;
    }

    class SubMesh {
        materialIndex: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;

        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: Mesh);

        getMaterial(): Material;
        updateBoundingInfo(world: Matrix, scale: Vector3): void;
        isInFrustrum(frustumPlanes: Plane[]): bool;
        render(): void;
        getLinesIndexBuffer(indices: number[], engine: Engine): IndexBuffer;
        canIntersects(ray: Ray): bool;
        intersects(ray: Ray, positions: Vector3[], indices: number[]): MeshRayHitTest;
        clone(newMesh: Mesh): SubMesh;
    }
}