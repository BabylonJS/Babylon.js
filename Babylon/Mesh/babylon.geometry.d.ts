declare module BABYLON {
    class Geometry implements IGetSetVerticesData {
        public id: string;
        public delayLoadState: number;
        public delayLoadingFile: string;
        private _scene;
        private _engine;
        private _meshes;
        private _totalVertices;
        private _indices;
        private _vertexBuffers;
        public _delayInfo: any;
        private _indexBuffer;
        public _boundingInfo: BoundingInfo;
        public _delayLoadingFunction: (any: any, Geometry: any) => void;
        constructor(id: string, scene: Scene, vertexData?: VertexData, updatable?: boolean, mesh?: Mesh);
        public getScene(): Scene;
        public getEngine(): Engine;
        public isReady(): boolean;
        public setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
        public setVerticesData(kind: string, data: number[], updatable?: boolean, stride?: number): void;
        public updateVerticesDataDirectly(kind: string, data: Float32Array, offset: number): void;
        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean): void;
        public getTotalVertices(): number;
        public getVerticesData(kind: string): number[];
        public getVertexBuffer(kind: string): VertexBuffer;
        public getVertexBuffers(): VertexBuffer[];
        public isVerticesDataPresent(kind: string): boolean;
        public getVerticesDataKinds(): string[];
        public setIndices(indices: number[], totalVertices?: number): void;
        public getTotalIndices(): number;
        public getIndices(): number[];
        public getIndexBuffer(): any;
        public releaseForMesh(mesh: Mesh, shouldDispose?: boolean): void;
        public applyToMesh(mesh: Mesh): void;
        private _applyToMesh(mesh);
        public load(scene: Scene, onLoaded?: () => void): void;
        public dispose(): void;
        public copy(id: string): Geometry;
        static ExtractFromMesh(mesh: Mesh, id: string): Geometry;
        static RandomId(): string;
    }
    module Geometry.Primitives {
        class _Primitive extends Geometry {
            private _beingRegenerated;
            private _canBeRegenerated;
            constructor(id: string, scene: Scene, vertexData?: VertexData, canBeRegenerated?: boolean, mesh?: Mesh);
            public canBeRegenerated(): boolean;
            public regenerate(): void;
            public asNewGeometry(id: string): Geometry;
            public setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
            public setVerticesData(kind: string, data: number[], updatable?: boolean): void;
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Box extends _Primitive {
            public size: number;
            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Sphere extends _Primitive {
            public segments: number;
            public diameter: number;
            constructor(id: string, scene: Scene, segments: number, diameter: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Cylinder extends _Primitive {
            public height: number;
            public diameterTop: number;
            public diameterBottom: number;
            public tessellation: number;
            public subdivisions: number;
            constructor(id: string, scene: Scene, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions?: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Torus extends _Primitive {
            public diameter: number;
            public thickness: number;
            public tessellation: number;
            constructor(id: string, scene: Scene, diameter: number, thickness: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Ground extends _Primitive {
            public width: number;
            public height: number;
            public subdivisions: number;
            constructor(id: string, scene: Scene, width: number, height: number, subdivisions: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class TiledGround extends _Primitive {
            public xmin: number;
            public zmin: number;
            public xmax: number;
            public zmax: number;
            public subdivisions: {
                w: number;
                h: number;
            };
            public precision: {
                w: number;
                h: number;
            };
            constructor(id: string, scene: Scene, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: {
                w: number;
                h: number;
            }, precision: {
                w: number;
                h: number;
            }, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Plane extends _Primitive {
            public size: number;
            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class TorusKnot extends _Primitive {
            public radius: number;
            public tube: number;
            public radialSegments: number;
            public tubularSegments: number;
            public p: number;
            public q: number;
            constructor(id: string, scene: Scene, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
    }
}
