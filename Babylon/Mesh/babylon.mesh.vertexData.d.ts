declare module BABYLON {
    interface IGetSetVerticesData {
        isVerticesDataPresent(kind: string): boolean;
        getVerticesData(kind: string): number[];
        getIndices(): number[];
        setVerticesData(kind: string, data: number[], updatable?: boolean): void;
        updateVerticesData(kind: string, data: number[], updateExtends?: boolean, makeItUnique?: boolean): void;
        setIndices(indices: number[]): void;
    }
    class VertexData {
        public positions: number[];
        public normals: number[];
        public uvs: number[];
        public uv2s: number[];
        public colors: number[];
        public matricesIndices: number[];
        public matricesWeights: number[];
        public indices: number[];
        public set(data: number[], kind: string): void;
        public applyToMesh(mesh: Mesh, updatable?: boolean): void;
        public applyToGeometry(geometry: Geometry, updatable?: boolean): void;
        public updateMesh(mesh: Mesh, updateExtends?: boolean, makeItUnique?: boolean): void;
        public updateGeometry(geometry: Geometry, updateExtends?: boolean, makeItUnique?: boolean): void;
        private _applyTo(meshOrGeometry, updatable?);
        private _update(meshOrGeometry, updateExtends?, makeItUnique?);
        public transform(matrix: Matrix): void;
        public merge(other: VertexData): void;
        static ExtractFromMesh(mesh: Mesh): VertexData;
        static ExtractFromGeometry(geometry: Geometry): VertexData;
        private static _ExtractFrom(meshOrGeometry);
        static CreateBox(size: number): VertexData;
        static CreateSphere(segments: number, diameter: number): VertexData;
        static CreateCylinder(height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions?: number): VertexData;
        static CreateTorus(diameter: any, thickness: any, tessellation: any): VertexData;
        static CreateLines(points: Vector3[]): VertexData;
        static CreateGround(width: number, height: number, subdivisions: number): VertexData;
        static CreateTiledGround(xmin: number, zmin: number, xmax: number, zmax: number, subdivisions?: {
            w: number;
            h: number;
        }, precision?: {
            w: number;
            h: number;
        }): VertexData;
        static CreateGroundFromHeightMap(width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, buffer: Uint8Array, bufferWidth: number, bufferHeight: number): VertexData;
        static CreatePlane(size: number): VertexData;
        static CreateTorusKnot(radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number): VertexData;
        static ComputeNormals(positions: number[], indices: number[], normals: number[]): void;
    }
}
