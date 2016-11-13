module BABYLON {
    export class BoneIKController {

        public target: AbstractMesh;
        public poleTarget: AbstractMesh;
        public poleAngle = 0;
        public mesh: AbstractMesh;

        private _bone1: Bone;
        private _bone2: Bone;
        private _bone1Length: number;
        private _bone2Length: number;
        private _maxAngle = Math.PI;
        private _maxReach: number;

        private _tmpVec1 = Vector3.Zero();
        private _tmpVec2 = Vector3.Zero();
        private _tmpVec3 = Vector3.Zero();
        private _tmpVec4 = Vector3.Zero();
        private _tmpVec5 = Vector3.Zero();

        private _tmpMat1 = Matrix.Identity();
        private _tmpMat2 = Matrix.Identity();

        private _rightHandedSystem = false;

        get maxAngle(): number {

            return this._maxAngle;

        }

        set maxAngle(value: number) {
            
            this._setMaxAngle(value);

        }

        constructor(mesh: AbstractMesh, bone: Bone, target: AbstractMesh, poleTarget: AbstractMesh, poleAngle: number, maxAngle: number = Math.PI){

            target.computeWorldMatrix(true);
            poleTarget.computeWorldMatrix(true);

            this._bone2 = bone;
            this._bone1 = bone.getParent();

            this.target = target;
            this.poleTarget = poleTarget;
            this.poleAngle = poleAngle;
            this.mesh = mesh;

            if(bone.getAbsoluteTransform().determinant() > 0){
                this._rightHandedSystem = true;
            }

            if (this._bone1.length) {

                var boneScale1 = this._bone1.getScale();
                var boneScale2 = this._bone2.getScale();
                
                this._bone1Length = this._bone1.length * boneScale1.y;
                this._bone2Length = this._bone2.length * boneScale2.y;

            } else if (this._bone1.children[0]) {
            
                mesh.computeWorldMatrix(true);

                var pos1 = this._bone2.children[0].getAbsolutePosition(mesh);
                var pos2 = this._bone2.getAbsolutePosition(mesh);
                var pos3 = this._bone1.getAbsolutePosition(mesh);

                this._bone1Length = Vector3.Distance(pos1, pos2);
                this._bone2Length = Vector3.Distance(pos2, pos3);

            }

            this.maxAngle = maxAngle;

        }

        private _setMaxAngle(ang: number): void{

            if (ang < 0) {
                ang = 0;
            }

            if (ang > Math.PI || ang == undefined) {
                ang = Math.PI;
            }

            this._maxAngle = ang;

            var a = this._bone1Length;
            var b = this._bone2Length;

            this._maxReach = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(ang));

        }

        public update (): void {
	
            var bone1 = this._bone1;
            var target = this.target.getAbsolutePosition();
            var poleTarget = this.poleTarget.getAbsolutePosition();

            var bonePos = this._tmpVec1;
            var zaxis = this._tmpVec2;
            var xaxis = this._tmpVec3;
            var yaxis = this._tmpVec4;
            var upAxis = this._tmpVec5;
            var mat1 = this._tmpMat1;
            var mat2 = this._tmpMat2;

            bone1.getAbsolutePositionToRef(this.mesh, bonePos);

            poleTarget.subtractToRef(bonePos, upAxis);

            if (upAxis.x == 0 && upAxis.y == 0 && upAxis.z == 0) {
                upAxis.y = 1;
            } else {
                upAxis.normalize();
            }

            target.subtractToRef(bonePos, yaxis);
            yaxis.normalize();

            Vector3.CrossToRef(yaxis, upAxis, zaxis);
            zaxis.normalize();

            Vector3.CrossToRef(yaxis, zaxis, xaxis);
            xaxis.normalize();

            Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, mat1);

            var a = this._bone1Length;
            var b = this._bone2Length;

            var c = Vector3.Distance(bonePos, target);

            if (this._maxReach > 0) {
                c = Math.min(this._maxReach, c);
            }

            var acosa = (b * b + c * c - a * a) / (2 * b * c);
            var acosb = (c * c + a * a - b * b) / (2 * c * a);

            if (acosa > 1) {
                acosa = 1;
            }

            if (acosb > 1) {
                acosb = 1;
            }

            if (acosa < -1) {
                acosa = -1;
            }

            if (acosb < -1) {
                acosb = -1;
            }

            var angA = Math.acos(acosa);
            var angB = Math.acos(acosb);

            var angC = -angA - angB;

            
            var bendAxis = this._tmpVec1;
            bendAxis.x = 0;
            bendAxis.y = 0;
            bendAxis.z = 0;

            if (this._rightHandedSystem) {

                bendAxis.z = 1;

                Matrix.RotationYawPitchRollToRef(0, 0, angB + Math.PI*.5, mat2);
                mat2.multiplyToRef(mat1, mat1);
                
                Matrix.RotationAxisToRef(yaxis, this.poleAngle + Math.PI, mat2);
                mat1.multiplyToRef(mat2, mat1);

            } else {

                bendAxis.x = 1;

                Matrix.RotationYawPitchRollToRef(0, angB, 0, mat2);
                mat2.multiplyToRef(mat1, mat1);

                if (this.poleAngle) {
                    Matrix.RotationAxisToRef(yaxis, this.poleAngle, mat2);
                    mat1.multiplyToRef(mat2, mat1);
                }

            }

            this._bone1.setRotationMatrix(mat1, Space.WORLD, this.mesh);
            this._bone2.setAxisAngle(bendAxis, angC, Space.LOCAL);

        }

    }
}