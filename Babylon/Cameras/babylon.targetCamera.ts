module BABYLON {
    export class TargetCamera extends Camera {

        public cameraDirection = new Vector3(0, 0, 0);
        public cameraRotation = new Vector2(0, 0);
        public rotation = new Vector3(0, 0, 0);

        public speed = 2.0;
        public noRotationConstraint = false;
        public lockedTarget = null;

        public _currentTarget = Vector3.Zero();
        public _viewMatrix = Matrix.Zero();
        public _camMatrix = Matrix.Zero();
        public _cameraTransformMatrix = Matrix.Zero();
        public _cameraRotationMatrix = Matrix.Zero();
        private _subCamTransformMatrix: Matrix;

        public _referencePoint = new Vector3(0, 0, 1);
        public _transformedReferencePoint = Vector3.Zero();
        public _lookAtTemp = Matrix.Zero();
        public _tempMatrix = Matrix.Zero();

        public _reset:() => void;

        public _waitingLockedTargetId:string;

        constructor(name:string, position:Vector3, scene:Scene) {
            super(name, position, scene);
        }

        public _getLockedTargetPosition():Vector3 {
            if (!this.lockedTarget) {
                return null;
            }

            return this.lockedTarget.position || this.lockedTarget;
        }

        // Cache
        public _initCache() {
            super._initCache();
            this._cache.lockedTarget = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.rotation = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        }

        public _updateCache(ignoreParentClass?:boolean):void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            var lockedTargetPosition = this._getLockedTargetPosition();
            if (!lockedTargetPosition) {
                this._cache.lockedTarget = null;
            }
            else {
                if (!this._cache.lockedTarget) {
                    this._cache.lockedTarget = lockedTargetPosition.clone();
                }
                else {
                    this._cache.lockedTarget.copyFrom(lockedTargetPosition);
                }
            }

            this._cache.rotation.copyFrom(this.rotation);
        }

        // Synchronized
        public _isSynchronizedViewMatrix():boolean {
            if (!super._isSynchronizedViewMatrix()) {
                return false;
            }

            var lockedTargetPosition = this._getLockedTargetPosition();

            return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition)
                && this._cache.rotation.equals(this.rotation);
        }

        // Methods
        public _computeLocalCameraSpeed(): number {
            var engine = this.getEngine();
            return this.speed * ((engine.getDeltaTime() / (engine.getFps() * 10.0)));
        }

        // Target
        public setTarget(target:Vector3):void {
            this.upVector.normalize();

            Matrix.LookAtLHToRef(this.position, target, this.upVector, this._camMatrix);
            this._camMatrix.invert();

            this.rotation.x = Math.atan(this._camMatrix.m[6] / this._camMatrix.m[10]);

            var vDir = target.subtract(this.position);

            if (vDir.x >= 0.0) {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) + Math.PI / 2.0);
            } else {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) - Math.PI / 2.0);
            }

            this.rotation.z = -Math.acos(Vector3.Dot(new Vector3(0, 1.0, 0), this.upVector));

            if (isNaN(this.rotation.x)) {
                this.rotation.x = 0;
            }

            if (isNaN(this.rotation.y)) {
                this.rotation.y = 0;
            }

            if (isNaN(this.rotation.z)) {
                this.rotation.z = 0;
            }
        }

        public getTarget():Vector3 {
            return this._currentTarget;
        }


        public _decideIfNeedsToMove():boolean {
            return Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
        }

        public _updatePosition():void{
            this.position.addInPlace(this.cameraDirection);
        }
        public _checkInputs():void {
            var needToMove = this._decideIfNeedsToMove();
            var needToRotate = Math.abs(this.cameraRotation.x) > 0 || Math.abs(this.cameraRotation.y) > 0;

            // Move
            if (needToMove) {
                this._updatePosition();
            }

            // Rotate
            if (needToRotate) {
                this.rotation.x += this.cameraRotation.x;
                this.rotation.y += this.cameraRotation.y;


                if (!this.noRotationConstraint) {
                    var limit = (Math.PI / 2) * 0.95;


                    if (this.rotation.x > limit)
                        this.rotation.x = limit;
                    if (this.rotation.x < -limit)
                        this.rotation.x = -limit;
                }
            }

            // Inertia
            if (needToMove) {
                if (Math.abs(this.cameraDirection.x) < Engine.Epsilon) {
                    this.cameraDirection.x = 0;
                }

                if (Math.abs(this.cameraDirection.y) < Engine.Epsilon) {
                    this.cameraDirection.y = 0;
                }

                if (Math.abs(this.cameraDirection.z) < Engine.Epsilon) {
                    this.cameraDirection.z = 0;
                }

                this.cameraDirection.scaleInPlace(this.inertia);
            }
            if (needToRotate) {
                if (Math.abs(this.cameraRotation.x) < Engine.Epsilon) {
                    this.cameraRotation.x = 0;
                }

                if (Math.abs(this.cameraRotation.y) < Engine.Epsilon) {
                    this.cameraRotation.y = 0;
                }
                this.cameraRotation.scaleInPlace(this.inertia);
            }

            super._checkInputs();
        }


        public _getViewMatrix():Matrix {
            if (!this.lockedTarget) {
                // Compute
                if (this.upVector.x !== 0 || this.upVector.y !== 1.0 || this.upVector.z !== 0) {
                    Matrix.LookAtLHToRef(Vector3.Zero(), this._referencePoint, this.upVector, this._lookAtTemp);
                    Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);


                    this._lookAtTemp.multiplyToRef(this._cameraRotationMatrix, this._tempMatrix);
                    this._lookAtTemp.invert();
                    this._tempMatrix.multiplyToRef(this._lookAtTemp, this._cameraRotationMatrix);
                } else {
                    Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
                }

                Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);

                // Computing target and final matrix
                this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
            } else {
                this._currentTarget.copyFrom(this._getLockedTargetPosition());
            }

            Matrix.LookAtLHToRef(this.position, this._currentTarget, this.upVector, this._viewMatrix);
            return this._viewMatrix;
        }
        
        public _getVRViewMatrix(): Matrix {
            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);

            BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);
            BABYLON.Vector3.TransformNormalToRef(this.upVector, this._cameraRotationMatrix, this._vrActualUp);

            // Computing target and final matrix
            this.position.addToRef(this._transformedReferencePoint, this._currentTarget);

            BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTarget, this._vrActualUp, this._vrWorkMatrix);

            this._vrWorkMatrix.multiplyToRef(this._vrPreViewMatrix, this._viewMatrix);
            return this._viewMatrix;
        }
        
        /**
         * @override
         * needs to be overridden, so sub has required properties to be copied
         */
        public getSubCamera(name : string, isA : boolean) : Camera{
            var subCamera = new BABYLON.TargetCamera(name, this.position.clone(), this.getScene());
            if (this._subCameraMode === Camera.SUB_CAMERA_MODE_VR){
                subCamera._vrActualUp = new Vector3(0, 0, 0);
                subCamera._getViewMatrix = subCamera._getVRViewMatrix;
            }
            return subCamera;
        }
        
        /**
         * @override
         * needs to be overridden, adding copy of position, and rotation for VR, or target for rest
         */
        public _updateSubCameras(){
            var camA = <TargetCamera> this.subCameras[Camera.SUB_CAMERAID_A];
            var camB = <TargetCamera> this.subCameras[Camera.SUB_CAMERAID_B];

            if (this._subCameraMode === Camera.SUB_CAMERA_MODE_VR){
                camA.rotation.x = camB.rotation.x = this.rotation.x;
                camA.rotation.y = camB.rotation.y = this.rotation.y;
                camA.rotation.z = camB.rotation.z = this.rotation.z;
                
                camA.position.copyFrom(this.position);
                camB.position.copyFrom(this.position);
                
            }else{
                camA.setTarget(this.getTarget());
                camB.setTarget(this.getTarget());
                
                this._getSubCamPosition(-this._subCamHalfSpace, camA.position);
                this._getSubCamPosition( this._subCamHalfSpace, camB.position);
            }
            super._updateSubCameras();
        }
        
        private _getSubCamPosition(halfSpace: number, result: Vector3) {
            if (!this._subCamTransformMatrix){
                this._subCamTransformMatrix = new BABYLON.Matrix();
            }
            var target = this.getTarget();
            BABYLON.Matrix.Translation(-target.x, -target.y, -target.z).multiplyToRef(BABYLON.Matrix.RotationY(halfSpace), this._subCamTransformMatrix);

            this._subCamTransformMatrix = this._subCamTransformMatrix.multiply(BABYLON.Matrix.Translation(target.x, target.y, target.z));

            BABYLON.Vector3.TransformCoordinatesToRef(this.position, this._subCamTransformMatrix, result);
        }
    }
} 