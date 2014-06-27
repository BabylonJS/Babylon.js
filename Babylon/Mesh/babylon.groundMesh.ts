module BABYLON {
    export class GroundMesh extends Mesh {
        public generateOctree = false;

        private _worldInverse = new BABYLON.Matrix();
        public _subdivisions: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public get subdivisions(): number {
            return this._subdivisions;
        }

        public optimize(chunksCount: number): void {
            this.subdivide(this._subdivisions);
            this.createOrUpdateSubmeshesOctree(32);
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