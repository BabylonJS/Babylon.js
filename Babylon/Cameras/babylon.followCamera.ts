﻿module BABYLON {
    export class FollowCamera extends TargetCamera {

        public radius:number = 12;
        public rotationOffset:number = 0;
        public heightOffset:number = 4;
        public cameraAcceleration:number = 0.05;
        public maxCameraSpeed:number = 20;
        public target:AbstractMesh;

        constructor(name:string, position:Vector3, scene:Scene) {
            super(name, position, scene);
        }

        private getRadians(degrees):number {
            return degrees * Math.PI / 180;
        }

        private follow(cameraTarget:AbstractMesh) {
            if (!cameraTarget)
                return;
            
            var yRotation;
            if (cameraTarget.rotationQuaternion) {
                var rotMatrix = new Matrix();
                cameraTarget.rotationQuaternion.toRotationMatrix(rotMatrix);
                yRotation = Math.atan2(rotMatrix.m[8], rotMatrix.m[10]);
            } else {
                yRotation = cameraTarget.rotation.y;
            }
            var radians = this.getRadians(this.rotationOffset) + yRotation;
            var targetX:number = cameraTarget.position.x + Math.sin(radians) * this.radius;

            var targetZ:number = cameraTarget.position.z + Math.cos(radians) * this.radius;
            var dx:number = targetX - this.position.x;
            var dy:number = (cameraTarget.position.y + this.heightOffset) - this.position.y;
            var dz:number = (targetZ) - this.position.z;
            var vx:number = dx * this.cameraAcceleration * 2;//this is set to .05
            var vy:number = dy * this.cameraAcceleration;
            var vz:number = dz * this.cameraAcceleration * 2;

            if (vx > this.maxCameraSpeed || vx < -this.maxCameraSpeed) {
                vx = vx < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }

            if (vy > this.maxCameraSpeed || vy < -this.maxCameraSpeed) {
                vy = vy < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }

            if (vz > this.maxCameraSpeed || vz < -this.maxCameraSpeed) {
                vz = vz < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }

            this.position = new Vector3(this.position.x + vx, this.position.y + vy, this.position.z + vz);
            this.setTarget(cameraTarget.position);
        }

        public _update():void {
            super._update();
            this.follow(this.target);
        }
    }
} 