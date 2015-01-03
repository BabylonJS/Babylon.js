declare module BABYLON {
    class CSG {
        private polygons;
        public matrix: Matrix;
        public position: Vector3;
        public rotation: Vector3;
        public scaling: Vector3;
        static FromMesh(mesh: Mesh): CSG;
        private static FromPolygons(polygons);
        public clone(): CSG;
        private toPolygons();
        public union(csg: CSG): CSG;
        public unionInPlace(csg: CSG): void;
        public subtract(csg: CSG): CSG;
        public subtractInPlace(csg: CSG): void;
        public intersect(csg: CSG): CSG;
        public intersectInPlace(csg: CSG): void;
        public inverse(): CSG;
        public inverseInPlace(): void;
        public copyTransformAttributes(csg: CSG): CSG;
        public buildMeshGeometry(name: string, scene: Scene, keepSubMeshes: boolean): Mesh;
        public toMesh(name: string, material: Material, scene: Scene, keepSubMeshes: boolean): Mesh;
    }
}
