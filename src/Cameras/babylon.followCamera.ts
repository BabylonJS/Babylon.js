module BABYLON {
    export class FollowCamera extends TargetCamera {
        @serialize()
        public radius: number = 12;

        @serialize()
        public rotationOffset: number = 0;

        @serialize()
        public heightOffset: number = 4;

        @serialize()
        public cameraAcceleration: number = 0.05;

        @serialize()
        public maxCameraSpeed: number = 20;

        @serializeAsMeshReference("lockedTargetId")
        public lockedTarget: Nullable<AbstractMesh>;

        constructor(name: string, position: Vector3, scene: Scene, lockedTarget: Nullable<AbstractMesh> = null) {
            super(name, position, scene);

            this.lockedTarget = lockedTarget;
        }

        private getRadians(degrees: number): number {
            return degrees * Math.PI / 180;
        }

        private follow(cameraTarget: AbstractMesh) {
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
            var targetPosition = cameraTarget.getAbsolutePosition();
            var targetX: number = targetPosition.x + Math.sin(radians) * this.radius;

            var targetZ: number = targetPosition.z + Math.cos(radians) * this.radius;
            var dx: number = targetX - this.position.x;
            var dy: number = (targetPosition.y + this.heightOffset) - this.position.y;
            var dz: number = (targetZ) - this.position.z;
            var vx: number = dx * this.cameraAcceleration * 2;//this is set to .05
            var vy: number = dy * this.cameraAcceleration;
            var vz: number = dz * this.cameraAcceleration * 2;

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
            this.setTarget(targetPosition);
        }

        public _checkInputs(): void {
            super._checkInputs();
            if (this.lockedTarget) {
                this.follow(this.lockedTarget);
            }
        }

        public getClassName(): string {
            return "FollowCamera";
        }
    }

    export class ArcFollowCamera extends TargetCamera {

        private _cartesianCoordinates: Vector3 = Vector3.Zero();

        constructor(name: string, public alpha: number, public beta: number, public radius: number, public target: Nullable<AbstractMesh>, scene: Scene) {
            super(name, Vector3.Zero(), scene);
            this.follow();
        }

        private follow(): void {
            if (!this.target) {
                return;
            }
            this._cartesianCoordinates.x = this.radius * Math.cos(this.alpha) * Math.cos(this.beta);
            this._cartesianCoordinates.y = this.radius * Math.sin(this.beta);
            this._cartesianCoordinates.z = this.radius * Math.sin(this.alpha) * Math.cos(this.beta);

            var targetPosition = this.target.getAbsolutePosition();
            this.position = targetPosition.add(this._cartesianCoordinates);
            this.setTarget(targetPosition);
        }

        public _checkInputs(): void {
            super._checkInputs();
            this.follow();
        }

        public getClassName(): string {
            return "ArcFollowCamera";
        }
    }
}


