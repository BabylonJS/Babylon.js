declare module BABYLON {
    class GroundMesh extends Mesh {
        public generateOctree: boolean;
        private _worldInverse;
        public _subdivisions: number;
        constructor(name: string, scene: Scene);
        public subdivisions : number;
        public optimize(chunksCount: number): void;
        public getHeightAtCoordinates(x: number, z: number): number;
    }
}
