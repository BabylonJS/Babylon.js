module BABYLON {

    export class SolidParticle {
        public idx: number;                     // particle global index
        public color = new Color4(1, 1, 1, 1);  // color
        public position = Vector3.Zero();       // position
        public rotation = Vector3.Zero();       // rotation
        public quaternion: Vector4;             // quaternion, will overwrite rotation
        public scale = new Vector3(1, 1, 1);    // scale
        public uvs = new Vector4(0, 0, 1, 1);   // uvs
        public velocity = Vector3.Zero();       // velocity
        public alive = true;                    // alive
        public _pos: number;                    // index of this particle in the global "positions" array
        public _shape: Vector3[];               // model shape array reference
        public _shapeUV: number[];              // model shape UVs array reference
        public shapeId: number;                 // model shape id
        public previous: SolidParticle;         // pointer to the previous particle in the global particles array
        public next: SolidParticle;             // pointer to the next particle in the global particles array
        public idxInShape: number;              // index of the particle in its shape id

        constructor(particleIndex: number, positionIndex: number, shape: Vector3[], shapeUV: number[], shapeId: number, idxInShape: number) {
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._shape = shape;
            this._shapeUV = shapeUV;
            this._shapeId = shapeId;
            this.idxInShape = idxInShape;
        }
    }
}
