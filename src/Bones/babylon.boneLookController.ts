module BABYLON {
    export class BoneLookController {

        public static _tmpVecs: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(),Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
        private static _tmpQuat = Quaternion.Identity();
        private static _tmpMat1 = Matrix.Identity();
        private static _tmpMat2 = Matrix.Identity();

        public target: Vector3;
        public mesh: AbstractMesh;
        public bone: Bone;
        public upAxis: Vector3 = Vector3.Up();

        public adjustYaw = 0;
        public adjustPitch = 0;
        public adjustRoll = 0;

        public slerpAmount = 1;

        private _minYaw:number;
        private _maxYaw:number;
        private _minPitch:number;
        private _maxPitch:number;
        private _minYawSin:number;
        private _minYawCos:number;
        private _maxYawSin:number;
        private _maxYawCos:number;
        private _minPitchTan:number;
        private _maxPitchTan:number;
        
        private _boneQuat:Quaternion = Quaternion.Identity();
        
        private _slerping = false;

        get minYaw():number{
            return this._minYaw;
        }

        set minYaw(value:number){
            this._minYaw = value;
            this._minYawSin = Math.sin(value);
            this._minYawCos = Math.cos(value);
        }

        get maxYaw():number{
            return this._maxYaw;
        }

        set maxYaw(value:number){
            this._maxYaw = value;
            this._maxYawSin = Math.sin(value);
            this._maxYawCos = Math.cos(value);
        }

        get minPitch():number{
            return this._minPitch;
        }

        set minPitch(value:number){
            this._minPitch = value;
            this._minPitchTan = Math.tan(value);
        }

        get maxPitch():number{
            return this._maxPitch;
        }

        set maxPitch(value:number){
            this._maxPitch = value;
            this._maxPitchTan = Math.tan(value);
        }

        constructor(mesh: AbstractMesh, bone: Bone, target: Vector3, options?: {adjustYaw?: number, adjustPitch?: number, adjustRoll?: number, slerpAmount?: number, maxYaw?:number, minYaw?:number, maxPitch?:number, minPitch?:number} ){

            this.mesh = mesh;
            this.bone = bone;
            this.target = target;

            if(options){

                if(options.adjustYaw){
                    this.adjustYaw = options.adjustYaw;
                }

                if(options.adjustPitch){
                    this.adjustPitch = options.adjustPitch;
                }

                if(options.adjustRoll){
                    this.adjustRoll = options.adjustRoll;
                }

                if(options.maxYaw != undefined){
                    this.maxYaw = options.maxYaw;
                }

                if(options.minYaw != undefined){
                    this.minYaw = options.minYaw;
                }

                if(options.maxPitch != undefined){
                    this.maxPitch = options.maxPitch;
                }

                if(options.minPitch != undefined){
                    this.minPitch = options.minPitch;
                }

                if(options.slerpAmount != undefined){
                    this.slerpAmount = options.slerpAmount;
                }

            }

        }

        public update (): void {
                
            var bone = this.bone;
            var target = this.target;
            var mat1 = BoneLookController._tmpMat1;
            var mat2 = BoneLookController._tmpMat2;

            var parentBone = bone.getParent();

            if(parentBone){
                if(this._maxPitch != undefined || this._minPitch != undefined){
                    var localTarget = BoneLookController._tmpVecs[4];
                    var _tmpVec5 = BoneLookController._tmpVecs[5];
                    parentBone.getLocalPositionFromAbsoluteToRef(target, this.mesh, localTarget);
                    bone.getPositionToRef(Space.LOCAL, null, _tmpVec5);
                    localTarget.x -= _tmpVec5.x;
                    localTarget.y -= _tmpVec5.y;
                    localTarget.z -= _tmpVec5.z;
                    var xzlen = Math.sqrt(localTarget.x*localTarget.x + localTarget.z*localTarget.z);
                    var pitch = Math.atan2(localTarget.y, xzlen);

                    if(pitch > this._maxPitch){
                        localTarget.y = this._maxPitchTan*xzlen + _tmpVec5.y;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }else if(pitch < this._minPitch){
                        localTarget.y = this._minPitchTan*xzlen + _tmpVec5.y;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }
                }

                if(this._maxYaw != undefined || this._minYaw != undefined){
                    var localTarget = BoneLookController._tmpVecs[6];
                    var _tmpVec7 = BoneLookController._tmpVecs[7];
                    parentBone.getLocalPositionFromAbsoluteToRef(target, this.mesh, localTarget);
                    bone.getPositionToRef(Space.LOCAL, null, _tmpVec7);
                    localTarget.x -= _tmpVec7.x;
                    localTarget.z -= _tmpVec7.z;
                    var yaw = Math.atan2(localTarget.x, localTarget.z);
                    var xzlen = Math.sqrt(localTarget.x*localTarget.x + localTarget.z*localTarget.z);
                    
                    if(yaw > this._maxYaw){
                        localTarget.z = this._maxYawCos*xzlen;
                        localTarget.x = this._maxYawSin*xzlen;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }else if(yaw < this._minYaw){
                        localTarget.z = this._minYawCos*xzlen;
                        localTarget.x = this._minYawSin*xzlen;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }
                }

            }

            var bonePos = BoneLookController._tmpVecs[0];
            var zaxis = BoneLookController._tmpVecs[1];
            var xaxis = BoneLookController._tmpVecs[2];
            var yaxis = BoneLookController._tmpVecs[3];
            var _tmpQuat = BoneLookController._tmpQuat;

            bone.getAbsolutePositionToRef(this.mesh, bonePos);
            target.subtractToRef(bonePos, zaxis);
            zaxis.normalize();
            Vector3.CrossToRef(this.upAxis, zaxis, xaxis);
            xaxis.normalize();
            Vector3.CrossToRef(zaxis, xaxis, yaxis);
            yaxis.normalize();
            Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, mat1);

            if (this.adjustYaw || this.adjustPitch || this.adjustRoll) {
                Matrix.RotationYawPitchRollToRef(this.adjustYaw, this.adjustPitch, this.adjustRoll, mat2);
                mat2.multiplyToRef(mat1, mat1);
            }

            if (this.slerpAmount < 1) {
                if (!this._slerping) {
                    this.bone.getRotationQuaternionToRef(Space.WORLD, this.mesh, this._boneQuat);
                }
                Quaternion.FromRotationMatrixToRef(mat1, _tmpQuat);
                Quaternion.SlerpToRef(this._boneQuat, _tmpQuat, this.slerpAmount, this._boneQuat);
                this.bone.setRotationQuaternion(this._boneQuat, Space.WORLD, this.mesh);
                this._slerping = true;
            } else {
                this.bone.setRotationMatrix(mat1, Space.WORLD, this.mesh);
                this._slerping = false;
            }

        }

    }
}