module BABYLON {
    export class GroundMesh extends Mesh {
        public chunkSize = 128; // Aiming to get around 128 indices per submesh
        private _worldInverse = new BABYLON.Matrix();

        public _subdivisions: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public get subdivisions(): number {
            return this._subdivisions;
        }

        public _setReady(state: boolean): void {
            if (state) {
                this.subdivide(this._subdivisions);

                this.createOrUpdateSubmeshesOctree();
            }

            super._setReady(state);
        }

        public getHeightAtCoordinates(x: number, z: number): number {
            var ray = new BABYLON.Ray(new BABYLON.Vector3(x, this.getBoundingInfo().boundingBox.maximumWorld.y + 1, z), new BABYLON.Vector3(0, -1, 0));

            this.getWorldMatrix().invertToRef(this._worldInverse);

            ray = BABYLON.Ray.Transform(ray, this._worldInverse);

            var pickInfo = this.intersects(ray);

            if (pickInfo.hit) {
                var result = BABYLON.Vector3.TransformCoordinates(pickInfo.pickedPoint, this.getWorldMatrix());
                return result.y;
            }

            return 0;
        }
    }
} 