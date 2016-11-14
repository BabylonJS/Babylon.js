module BABYLON {
    export class BoneLookController {

        public target: Vector3;
        public mesh: AbstractMesh;
        public bone: Bone;
        public upAxis: Vector3 = Vector3.Up();

        public adjustYaw = 0;
        public adjustPitch = 0;
        public adjustRoll = 0;
        
        private _tmpVec1 = Vector3.Zero();
        private _tmpVec2 = Vector3.Zero();
        private _tmpVec3 = Vector3.Zero();
        private _tmpVec4 = Vector3.Zero();
        
        private _tmpMat1 = Matrix.Identity();
        private _tmpMat2 = Matrix.Identity();

        constructor(mesh: AbstractMesh, bone: Bone, target: Vector3, adjustYaw: number = 0, adjustPitch: number = 0, adjustRoll: number = 0){

            this.mesh = mesh;
            this.bone = bone;
            this.target = target;

            this.adjustYaw = adjustYaw;
            this.adjustPitch = adjustPitch;
            this.adjustRoll = adjustRoll;

        }

        public update (): void {
                
            var bone = this.bone;
            var target = this.target;

            var bonePos = this._tmpVec1;
            var zaxis = this._tmpVec2;
            var xaxis = this._tmpVec3;
            var yaxis = this._tmpVec4;
            var mat1 = this._tmpMat1;
            var mat2 = this._tmpMat2;

            bone.getAbsolutePositionToRef(this.mesh, bonePos);

            target.subtractToRef(bonePos, zaxis);
            zaxis.normalize();

            BABYLON.Vector3.CrossToRef(this.upAxis, zaxis, xaxis);
            xaxis.normalize();

            BABYLON.Vector3.CrossToRef(zaxis, xaxis, yaxis);
            yaxis.normalize();

            BABYLON.Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, mat1);

            if (this.adjustYaw || this.adjustPitch || this.adjustRoll) {
                BABYLON.Matrix.RotationYawPitchRollToRef(this.adjustYaw, this.adjustPitch, this.adjustRoll, mat2);
                mat2.multiplyToRef(mat1, mat1);
            }

            this.bone.setRotationMatrix(mat1, BABYLON.Space.WORLD, this.mesh);

        }

    }
}