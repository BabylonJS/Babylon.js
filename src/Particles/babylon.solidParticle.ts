module BABYLON {

    export class SolidParticle {
        public idx: number;
        public color = new Color4(1, 1, 1, 1);
        public position = Vector3.Zero();
        public rotation = Vector3.Zero();
        public quaternion: Vector4;
        public scale = new Vector3(1, 1, 1);
        public uvs = new Vector4(0, 0, 1, 1);
        public velocity = Vector3.Zero();
        public alive = true;
        public _pos: number;
        public _shape: Vector3[];
        public _shapeUV: number[];
        public previous: SolidParticle;
        public next: SolidParticle;

        constructor(particleIndex: number, positionIndex: number, shape: Vector3[], shapeUV: number[], public shapeId: number) {
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._shape = shape;
            this._shapeUV = shapeUV;
        }
    }
}
