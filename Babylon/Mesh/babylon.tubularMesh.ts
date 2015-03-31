module BABYLON {
    export class TubularMesh extends Mesh {
        public _pathArray: Vector3[][];
        public _path3D: Path3D;
        public _tessellation: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public get pathArray(): Vector3[][] {
            return this._pathArray;
        }

        public get path3D(): Path3D {
            return this._path3D;
        }

        public get tessellation(): number {
            return this._tessellation;
        }

        public set pathArray(pathArray) {
            this._pathArray = pathArray;
        }

        public set path3D(path3D) {
            this._path3D = path3D;
        }

        public set tessellation(tessellation) {
            this._tessellation = tessellation;
        }
    }
}