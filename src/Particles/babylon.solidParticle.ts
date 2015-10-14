module BABYLON {

    export class SolidParticle {
        public idx: number; 
        public shapeId: number;
        public color: Color4 = new Color4(1, 1, 1, 1);
        public position: Vector3 = Vector3.Zero();
        public rotation: Vector3 = Vector3.Zero();
        public quaternion: Vector4;
        public scale: Vector3 = new Vector3(1 ,1, 1);
        public uvs: Vector4 = new Vector4(0,0, 1,1);
        public velocity: Vector3 = Vector3.Zero();
        public alive: boolean = true;
        public _pos: number;
        public _shape: Vector3[]; 
        public _shapeUV : number[];   

        constructor(particleIndex: number, positionIndex: number, shape: Vector3[], shapeUV: number[], shapeID: number) {
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._shape = shape;
            this._shapeUV = shapeUV;
        }
    }
}