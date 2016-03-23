module BABYLON {
    export class ArcRotateCamera extends TargetCamera {
        @serialize()
        public alpha: number;

        @serialize()
        public beta: number;

        @serialize()
        public radius: number;

        @serializeAsVector3()
        public target: Vector3;

        @serialize()
        public inertialAlphaOffset = 0;

        @serialize()
        public inertialBetaOffset = 0;

        @serialize()
        public inertialRadiusOffset = 0;

        @serialize()
        public lowerAlphaLimit = null;

        @serialize()
        public upperAlphaLimit = null;

        @serialize()
        public lowerBetaLimit = 0.01;

        @serialize()
        public upperBetaLimit = Math.PI;

        @serialize()
        public lowerRadiusLimit = null;

        @serialize()
        public upperRadiusLimit = null;

        @serialize()
        public inertialPanningX: number = 0;

        @serialize()
        public inertialPanningY: number = 0;

        //-- begin properties for backward compatibility for inputs       
        public get angularSensibilityX() {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.angularSensibilityX;
        }

        public set angularSensibilityX(value) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.angularSensibilityX = value;
            }
        }

        public get angularSensibilityY() {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.angularSensibilityY;
        }

        public set angularSensibilityY(value) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.angularSensibilityY = value;
            }
        }

        public get pinchPrecision() {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.pinchPrecision;
        }

        public set pinchPrecision(value) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.pinchPrecision = value;
            }
        }

        public get panningSensibility() {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.panningSensibility;
        }

        public set panningSensibility(value) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.panningSensibility = value;
            }
        }

        public get keysUp() {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysUp;
        }

        public set keysUp(value) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysUp = value;
        }

        public get keysDown() {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysDown;
        }

        public set keysDown(value) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysDown = value;
        }

        public get keysLeft() {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysLeft;
        }

        public set keysLeft(value) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysLeft = value;
        }

        public get keysRight() {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysRight;
        }

        public set keysRight(value) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysRight = value;
        }

        public get wheelPrecision() {
            var mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                return mousewheel.wheelPrecision;
        }

        public set wheelPrecision(value) {
            var mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                mousewheel.wheelPrecision = value;
        }
        
        //-- end properties for backward compatibility for inputs        

        @serialize()
        public zoomOnFactor = 1;

        public targetScreenOffset = Vector2.Zero();

        @serialize()
        public allowUpsideDown = true;

        public _viewMatrix = new Matrix();
        public _useCtrlForPanning: boolean;
        public inputs: ArcRotateCameraInputsManager;

        public _reset: () => void;
        
        // Panning
        public panningAxis: Vector3 = new Vector3(1, 1, 0);
        private _localDirection: Vector3;
        private _transformedDirection: Vector3;

        // Collisions
        public onCollide: (collidedMesh: AbstractMesh) => void;
        public checkCollisions = false;
        public collisionRadius = new Vector3(0.5, 0.5, 0.5);
        private _collider = new Collider();
        private _previousPosition = Vector3.Zero();
        private _collisionVelocity = Vector3.Zero();
        private _newPosition = Vector3.Zero();
        private _previousAlpha: number;
        private _previousBeta: number;
        private _previousRadius: number;
        //due to async collision inspection
        private _collisionTriggered: boolean;

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene) {
            super(name, Vector3.Zero(), scene);

            if (!target) {
                this.target = Vector3.Zero();
            } else {
                this.target = target;
            }

            this.alpha = alpha;
            this.beta = beta;
            this.radius = radius;

            this.getViewMatrix();
            this.inputs = new ArcRotateCameraInputsManager(this);
            this.inputs.addKeyboard().addMouseWheel().addPointers().addGamepad();
        }

        // Cache
        public _initCache(): void {
            super._initCache();
            this._cache.target = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.alpha = undefined;
            this._cache.beta = undefined;
            this._cache.radius = undefined;
            this._cache.targetScreenOffset = Vector2.Zero();
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            this._cache.target.copyFrom(this._getTargetPosition());
            this._cache.alpha = this.alpha;
            this._cache.beta = this.beta;
            this._cache.radius = this.radius;
            this._cache.targetScreenOffset.copyFrom(this.targetScreenOffset);
        }

        private _getTargetPosition(): Vector3 {
            if ((<any>this.target).getAbsolutePosition) {
                return (<any>this.target).getAbsolutePosition();
            }

            return this.target;
        }

        // Synchronized
        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronizedViewMatrix())
                return false;

            return this._cache.target.equals(this.target)
                && this._cache.alpha === this.alpha
                && this._cache.beta === this.beta
                && this._cache.radius === this.radius
                && this._cache.targetScreenOffset.equals(this.targetScreenOffset);
        }

        // Methods
        public attachControl(element: HTMLElement, noPreventDefault?: boolean, useCtrlForPanning: boolean = true): void {
            this._useCtrlForPanning = useCtrlForPanning;

            this.inputs.attachElement(element, noPreventDefault);

            this._reset = () => {
                this.inertialAlphaOffset = 0;
                this.inertialBetaOffset = 0;
                this.inertialRadiusOffset = 0;
            };
        }

        public detachControl(element: HTMLElement): void {
            this.inputs.detachElement(element);

            if (this._reset) {
                this._reset();
            }
        }

        public _checkInputs(): void {
            //if (async) collision inspection was triggered, don't update the camera's position - until the collision callback was called.
            if (this._collisionTriggered) {
                return;
            }

            this.inputs.checkInputs();            
			
            // Inertia
            if (this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset !== 0) {
                this.alpha += this.beta <= 0 ? -this.inertialAlphaOffset : this.inertialAlphaOffset;
                this.beta += this.inertialBetaOffset;
                this.radius -= this.inertialRadiusOffset;
                this.inertialAlphaOffset *= this.inertia;
                this.inertialBetaOffset *= this.inertia;
                this.inertialRadiusOffset *= this.inertia;
                if (Math.abs(this.inertialAlphaOffset) < Epsilon)
                    this.inertialAlphaOffset = 0;
                if (Math.abs(this.inertialBetaOffset) < Epsilon)
                    this.inertialBetaOffset = 0;
                if (Math.abs(this.inertialRadiusOffset) < Epsilon)
                    this.inertialRadiusOffset = 0;
            }

            // Panning inertia
            if (this.inertialPanningX !== 0 || this.inertialPanningY !== 0) {
                if (!this._localDirection) {
                    this._localDirection = Vector3.Zero();
                    this._transformedDirection = Vector3.Zero();
                }

                this.inertialPanningX *= this.inertia;
                this.inertialPanningY *= this.inertia;

                if (Math.abs(this.inertialPanningX) < Epsilon)
                    this.inertialPanningX = 0;
                if (Math.abs(this.inertialPanningY) < Epsilon)
                    this.inertialPanningY = 0;

                this._localDirection.copyFromFloats(this.inertialPanningX, this.inertialPanningY, this.inertialPanningY);
                this._localDirection.multiplyInPlace(this.panningAxis);
                this._viewMatrix.invertToRef(this._cameraTransformMatrix);
                Vector3.TransformNormalToRef(this._localDirection, this._cameraTransformMatrix, this._transformedDirection);
                //Eliminate y if map panning is enabled (panningAxis == 1,0,1)
                if (!this.panningAxis.y) {
                    this._transformedDirection.y = 0;
                }
                this.target.addInPlace(this._transformedDirection);
            }

            // Limits
            this._checkLimits();

            super._checkInputs();
        }

        private _checkLimits() {
            if (this.lowerBetaLimit === null || this.lowerBetaLimit === undefined) {
                if (this.allowUpsideDown && this.beta > Math.PI) {
                    this.beta = this.beta - (2 * Math.PI);
                }
            } else {
                if (this.beta < this.lowerBetaLimit) {
                    this.beta = this.lowerBetaLimit;
                }
            }

            if (this.upperBetaLimit === null || this.upperBetaLimit === undefined) {
                if (this.allowUpsideDown && this.beta < -Math.PI) {
                    this.beta = this.beta + (2 * Math.PI);
                }
            } else {
                if (this.beta > this.upperBetaLimit) {
                    this.beta = this.upperBetaLimit;
                }
            }

            if (this.lowerAlphaLimit && this.alpha < this.lowerAlphaLimit) {
                this.alpha = this.lowerAlphaLimit;
            }
            if (this.upperAlphaLimit && this.alpha > this.upperAlphaLimit) {
                this.alpha = this.upperAlphaLimit;
            }

            if (this.lowerRadiusLimit && this.radius < this.lowerRadiusLimit) {
                this.radius = this.lowerRadiusLimit;
            }
            if (this.upperRadiusLimit && this.radius > this.upperRadiusLimit) {
                this.radius = this.upperRadiusLimit;
            }
        }

        public rebuildAnglesAndRadius() {
            var radiusv3 = this.position.subtract(this._getTargetPosition());
            this.radius = radiusv3.length();

            // Alpha
            this.alpha = Math.acos(radiusv3.x / Math.sqrt(Math.pow(radiusv3.x, 2) + Math.pow(radiusv3.z, 2)));

            if (radiusv3.z < 0) {
                this.alpha = 2 * Math.PI - this.alpha;
            }

            // Beta
            this.beta = Math.acos(radiusv3.y / this.radius);

            this._checkLimits();
        }

        public setPosition(position: Vector3): void {
            if (this.position.equals(position)) {
                return;
            }
            this.position = position;

            this.rebuildAnglesAndRadius();
        }

        public setTarget(target: Vector3): void {
            if (this._getTargetPosition().equals(target)) {
                return;
            }
            this.target = target;
            this.rebuildAnglesAndRadius();
        }

        public _getViewMatrix(): Matrix {
            // Compute
            var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);

            if (sinb === 0) {
                sinb = 0.0001;
            }

            var target = this._getTargetPosition();
            target.addToRef(new Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this._newPosition);
            if (this.getScene().collisionsEnabled && this.checkCollisions) {
                this._collider.radius = this.collisionRadius;
                this._newPosition.subtractToRef(this.position, this._collisionVelocity);
                this._collisionTriggered = true;
                this.getScene().collisionCoordinator.getNewPosition(this.position, this._collisionVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
            } else {
                this.position.copyFrom(this._newPosition);

                var up = this.upVector;
                if (this.allowUpsideDown && this.beta < 0) {
                    up = up.clone();
                    up = up.negate();
                }

                Matrix.LookAtLHToRef(this.position, target, up, this._viewMatrix);
                this._viewMatrix.m[12] += this.targetScreenOffset.x;
                this._viewMatrix.m[13] += this.targetScreenOffset.y;
            }
            return this._viewMatrix;
        }

        private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: AbstractMesh = null) => {

            if (this.getScene().workerCollisions && this.checkCollisions) {
                newPosition.multiplyInPlace(this._collider.radius);
            }

            if (!collidedMesh) {
                this._previousPosition.copyFrom(this.position);
            } else {
                this.setPosition(newPosition);

                if (this.onCollide) {
                    this.onCollide(collidedMesh);
                }
            }

            // Recompute because of constraints
            var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);

            if (sinb === 0) {
                sinb = 0.0001;
            }

            var target = this._getTargetPosition();
            target.addToRef(new Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this._newPosition);
            this.position.copyFrom(this._newPosition);

            var up = this.upVector;
            if (this.allowUpsideDown && this.beta < 0) {
                up = up.clone();
                up = up.negate();
            }

            Matrix.LookAtLHToRef(this.position, target, up, this._viewMatrix);
            this._viewMatrix.m[12] += this.targetScreenOffset.x;
            this._viewMatrix.m[13] += this.targetScreenOffset.y;

            this._collisionTriggered = false;
        }

        public zoomOn(meshes?: AbstractMesh[], doNotUpdateMaxZ = false): void {
            meshes = meshes || this.getScene().meshes;

            var minMaxVector = Mesh.MinMax(meshes);
            var distance = Vector3.Distance(minMaxVector.min, minMaxVector.max);

            this.radius = distance * this.zoomOnFactor;

            this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance }, doNotUpdateMaxZ);
        }

        public focusOn(meshesOrMinMaxVectorAndDistance, doNotUpdateMaxZ = false): void {
            var meshesOrMinMaxVector;
            var distance;

            if (meshesOrMinMaxVectorAndDistance.min === undefined) { // meshes
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance || this.getScene().meshes;
                meshesOrMinMaxVector = Mesh.MinMax(meshesOrMinMaxVector);
                distance = Vector3.Distance(meshesOrMinMaxVector.min, meshesOrMinMaxVector.max);
            }
            else { //minMaxVector and distance
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance;
                distance = meshesOrMinMaxVectorAndDistance.distance;
            }

            this.target = Mesh.Center(meshesOrMinMaxVector);

            if (!doNotUpdateMaxZ) {
                this.maxZ = distance * 2;
            }
        }
        
        /**
         * @override
         * Override Camera.createRigCamera
         */
        public createRigCamera(name: string, cameraIndex: number): Camera {
            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case Camera.RIG_MODE_VR:
                    var alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? 1 : -1);
                    var rigCam = new ArcRotateCamera(name, this.alpha + alphaShift, this.beta, this.radius, this.target, this.getScene());
                    rigCam._cameraRigParams = {};
                    return rigCam;
            }
            return null;
        }
        
        /**
         * @override
         * Override Camera._updateRigCameras
         */
        public _updateRigCameras() {
            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case Camera.RIG_MODE_VR:
                    var camLeft = <ArcRotateCamera>this._rigCameras[0];
                    var camRight = <ArcRotateCamera>this._rigCameras[1];
                    camLeft.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                    camRight.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                    camLeft.beta = camRight.beta = this.beta;
                    camLeft.radius = camRight.radius = this.radius;
                    break;
            }
            super._updateRigCameras();
        }

        public dispose(): void {
            this.inputs.clear();
            super.dispose();
        }

        public getTypeName(): string {
            return "ArcRotateCamera";
        }
    }
} 

