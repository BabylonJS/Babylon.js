module BABYLON {
    export class BoneLookController {

        private static _tmpVecs: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(),Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
        private static _tmpQuat = Quaternion.Identity();
        private static _tmpMat1 = Matrix.Identity();
        private static _tmpMat2 = Matrix.Identity();

        public target: Vector3;
        public mesh: AbstractMesh;
        public bone: Bone;
        public upAxis: Vector3 = Vector3.Up();
        public slerpAmount = 1;

        private _adjustRotY = 0;
        private _adjustRotX = 0;
        private _adjustRotZ = 0;
        private _minRotY:number;
        private _maxRotY:number;
        private _minRotX:number;
        private _maxRotX:number;
        private _minRotYSin:number;
        private _minRotYCos:number;
        private _maxRotYSin:number;
        private _maxRotYCos:number;
        private _minRotXTan:number;
        private _maxRotXTan:number;
        private _minRotZ:number;
        private _maxRotZ:number;
        private _minRotZSin:number;
        private _minRotZCos:number;
        private _maxRotZSin:number;
        private _maxRotZCos:number;
        private _boneQuat:Quaternion = Quaternion.Identity();
        private _slerping = false;

        get minRotationY():number{
            return this._minRotY - this._adjustRotY;
        }

        set minRotationY(value:number){
            this._minRotY = value + this._adjustRotY;
            this._minRotYSin = Math.sin(this._minRotY);
            this._minRotYCos = Math.cos(this._minRotY);
        }

        get maxRoationY():number{
            return this._maxRotY - this._adjustRotY;
        }

        set maxRotationY(value:number){
            this._maxRotY = value + this._adjustRotY;
            this._maxRotYSin = Math.sin(this._maxRotY);
            this._maxRotYCos = Math.cos(this._maxRotY);
        }

        get minRotationX():number{
            return this._minRotX - this._adjustRotX;
        }

        set minRotationX(value:number){
            this._minRotX = value + this._adjustRotX;
            this._minRotXTan = Math.tan(this._minRotX);
        }

        get maxRotationX():number{
            return this._maxRotX - this._adjustRotX;
        }

        set maxRotationX(value:number){
            this._maxRotX = value + this._adjustRotX;
            this._maxRotXTan = Math.tan(this._maxRotX);
        }

        get minRotationZ():number{
            return this._minRotZ - this._adjustRotZ;
        }

        set minRotationZ(value:number){
            this._minRotZ = value + this._adjustRotZ;
            this._minRotZSin = Math.sin(this._minRotZ);
            this._minRotZCos = Math.cos(this._minRotZ);
        }

        get maxRotationZ():number{
            return this._maxRotZ - this._adjustRotZ;
        }

        set maxRotationZ(value:number){
            this._maxRotZ = value + this._adjustRotZ;
            this._maxRotZSin = Math.sin(this._maxRotZ);
            this._maxRotZCos = Math.cos(this._maxRotZ);
        }

        constructor(mesh: AbstractMesh, 
                    bone: Bone, 
                    target: Vector3, 
                    options?: { 
                        adjustRotationX?: number, 
                        adjustRotationY?: number, 
                        adjustRotationZ?: number, 
                        slerpAmount?: number, 
                        maxRotationY?:number, 
                        minRotationY?:number,
                        maxRotationX?:number, 
                        minRotationX?:number,
                        maxRotationZ?:number, 
                        minRotationZ?:number,
                        adjustYaw?: number, 
                        adjustPitch?: number, 
                        adjustRoll?: number 
                    } 
                    ){

            this.mesh = mesh;
            this.bone = bone;
            this.target = target;

            if(options){

                if(options.adjustYaw){
                    this._adjustRotY = options.adjustYaw;
                }

                if(options.adjustPitch){
                    this._adjustRotX = options.adjustPitch;
                }

                if(options.adjustRoll){
                    this._adjustRotZ = options.adjustRoll;
                }

                if(options.adjustRotationY){
                    this._adjustRotY = options.adjustRotationY;
                }

                if(options.adjustRotationX){
                    this._adjustRotX = options.adjustRotationX;
                }

                if(options.adjustRotationZ){
                    this._adjustRotZ = options.adjustRotationZ;
                }

                if(options.maxRotationY != undefined){
                    this.maxRotationY = options.maxRotationY;
                }

                if(options.minRotationY != undefined){
                    this.minRotationY = options.minRotationY;
                }

                if(options.maxRotationX != undefined){
                    this.maxRotationX = options.maxRotationX;
                }

                if(options.minRotationX != undefined){
                    this.minRotationX = options.minRotationX;
                }

                if(options.maxRotationZ != undefined){
                    this.maxRotationZ = options.maxRotationZ;
                }

                if(options.minRotationZ != undefined){
                    this.minRotationZ = options.minRotationZ;
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
                if(this._maxRotX != undefined || this._minRotX != undefined){
                    var localTarget = BoneLookController._tmpVecs[4];
                    var _tmpVec5 = BoneLookController._tmpVecs[5];
                    parentBone.getLocalPositionFromAbsoluteToRef(target, this.mesh, localTarget);
                    bone.getPositionToRef(Space.LOCAL, null, _tmpVec5);
                    localTarget.x -= _tmpVec5.x;
                    localTarget.y -= _tmpVec5.y;
                    localTarget.z -= _tmpVec5.z;
                    var xzlen = Math.sqrt(localTarget.x*localTarget.x + localTarget.z*localTarget.z);
                    var rotX = Math.atan2(localTarget.y, xzlen);

                    if(rotX > this._maxRotX){
                        localTarget.y = this._maxRotXTan*xzlen + _tmpVec5.y;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }else if(rotX < this._minRotX){
                        localTarget.y = this._minRotXTan*xzlen + _tmpVec5.y;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }
                }

                if(this._maxRotY != undefined || this._minRotY != undefined){
                    var localTarget = BoneLookController._tmpVecs[6];
                    var _tmpVec7 = BoneLookController._tmpVecs[7];
                    parentBone.getLocalPositionFromAbsoluteToRef(target, this.mesh, localTarget);
                    bone.getPositionToRef(Space.LOCAL, null, _tmpVec7);
                    localTarget.x -= _tmpVec7.x;
                    localTarget.z -= _tmpVec7.z;
                    var rotY = Math.atan2(localTarget.x, localTarget.z);
                    
                    if(rotY > this._maxRotY){
                        var xzlen = Math.sqrt(localTarget.x*localTarget.x + localTarget.z*localTarget.z);
                        localTarget.z = this._maxRotYCos*xzlen;
                        localTarget.x = this._maxRotYSin*xzlen;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }else if(rotY < this._minRotY){
                        var xzlen = Math.sqrt(localTarget.x*localTarget.x + localTarget.z*localTarget.z);
                        localTarget.z = this._minRotYCos*xzlen;
                        localTarget.x = this._minRotYSin*xzlen;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }
                }

                if(this._maxRotZ != undefined || this._minRotZ != undefined){
                    var localTarget = BoneLookController._tmpVecs[8];
                    var _tmpVec9 = BoneLookController._tmpVecs[9];
                    parentBone.getLocalPositionFromAbsoluteToRef(target, this.mesh, localTarget);
                    bone.getPositionToRef(Space.LOCAL, null, _tmpVec9);
                    localTarget.x -= _tmpVec9.x;
                    localTarget.y -= _tmpVec9.y;
                    var rotZ = Math.atan2(localTarget.y, localTarget.x);
                    
                    if(rotZ > this._maxRotZ){
                        var xylen = Math.sqrt(localTarget.x*localTarget.x + localTarget.y*localTarget.y);
                        localTarget.x = this._maxRotZCos*xylen;
                        localTarget.y = this._maxRotZSin*xylen;
                        parentBone.getAbsolutePositionFromLocalToRef(localTarget, this.mesh, localTarget);
                        target = localTarget;
                    }else if(rotZ < this._minRotZ){
                        var xylen = Math.sqrt(localTarget.x*localTarget.x + localTarget.y*localTarget.y);
                        localTarget.x = this._minRotZCos*xylen;
                        localTarget.y = this._minRotZSin*xylen;
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

            if(xaxis.x === 0 && xaxis.y === 0 && xaxis.z === 0){
                return;
            }

            if(yaxis.x === 0 && yaxis.y === 0 && yaxis.z === 0){
                return;
            }

            if(zaxis.x === 0 && zaxis.y === 0 && zaxis.z === 0){
                return;
            }

            if (this._adjustRotY || this._adjustRotX || this._adjustRotZ) {
                Matrix.RotationYawPitchRollToRef(this._adjustRotY, this._adjustRotX, this._adjustRotZ, mat2);
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