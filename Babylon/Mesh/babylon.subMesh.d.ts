declare module BABYLON {
    class SubMesh {
        public materialIndex: number;
        public verticesStart: number;
        public verticesCount: number;
        public indexStart: any;
        public indexCount: number;
        public linesIndexCount: number;
        private _mesh;
        private _renderingMesh;
        private _boundingInfo;
        private _linesIndexBuffer;
        public _lastColliderWorldVertices: Vector3[];
        public _trianglePlanes: Plane[];
        public _lastColliderTransformMatrix: Matrix;
        public _renderId: number;
        public _alphaIndex: number;
        public _distanceToCamera: number;
        public _id: number;
        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: any, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean);
        public getBoundingInfo(): BoundingInfo;
        public getMesh(): AbstractMesh;
        public getRenderingMesh(): Mesh;
        public getMaterial(): Material;
        public refreshBoundingInfo(): void;
        public _checkCollision(collider: Collider): boolean;
        public updateBoundingInfo(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public render(): void;
        public getLinesIndexBuffer(indices: number[], engine: any): WebGLBuffer;
        public canIntersects(ray: Ray): boolean;
        public intersects(ray: Ray, positions: Vector3[], indices: number[], fastCheck?: boolean): IntersectionInfo;
        public clone(newMesh: AbstractMesh, newRenderingMesh?: Mesh): SubMesh;
        public dispose(): void;
        static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh): SubMesh;
    }
}
