declare module BABYLON {
    class InstancedMesh extends AbstractMesh {
        private _sourceMesh;
        private _currentLOD;
        constructor(name: string, source: Mesh);
        public receiveShadows : boolean;
        public material : Material;
        public visibility : number;
        public skeleton : Skeleton;
        public getTotalVertices(): number;
        public sourceMesh : Mesh;
        public getVerticesData(kind: string): number[];
        public isVerticesDataPresent(kind: string): boolean;
        public getIndices(): number[];
        public _positions : Vector3[];
        public refreshBoundingInfo(): void;
        public _preActivate(): void;
        public _activate(renderId: number): void;
        public getLOD(camera: Camera): AbstractMesh;
        public _syncSubMeshes(): void;
        public _generatePointsArray(): boolean;
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): InstancedMesh;
        public dispose(doNotRecurse?: boolean): void;
    }
}
