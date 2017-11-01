module BABYLON {
    export class ArcRotateCamera extends TargetCamera {
        @serialize()
        public alpha: number;

        @serialize()
        public beta: number;

        @serialize()
        public radius: number;

        @serializeAsVector3("target")
        protected _target: Vector3;
        protected _targetHost: Nullable<AbstractMesh>;

        public get target(): Vector3 {
            return this._target;
        }
        public set target(value: Vector3) {
            this.setTarget(value);
        }

        @serialize()
        public inertialAlphaOffset = 0;

        @serialize()
        public inertialBetaOffset = 0;

        @serialize()
        public inertialRadiusOffset = 0;

        @serialize()
        public lowerAlphaLimit: Nullable<number> = null;

        @serialize()
        public upperAlphaLimit: Nullable<number> = null;

        @serialize()
        public lowerBetaLimit = 0.01;

        @serialize()
        public upperBetaLimit = Math.PI;

        @serialize()
        public lowerRadiusLimit: Nullable<number> = null;

        @serialize()
        public upperRadiusLimit: Nullable<number> = null;

        @serialize()
        public inertialPanningX: number = 0;

        @serialize()
        public inertialPanningY: number = 0;

        @serialize()
        public pinchToPanMaxDistance: number = 20;

        @serialize()
        public panningDistanceLimit: Nullable<number> = null;

        @serializeAsVector3()
        public panningOriginTarget: Vector3 = Vector3.Zero();

        @serialize()
        public panningInertia = 0.9;

        //-- begin properties for backward compatibility for inputs
        public get angularSensibilityX(): number {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.angularSensibilityX;

            return 0;
        }

        public set angularSensibilityX(value: number) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.angularSensibilityX = value;
            }
        }

        public get angularSensibilityY(): number {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.angularSensibilityY;

            return 0;
        }

        public set angularSensibilityY(value: number) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.angularSensibilityY = value;
            }
        }

        public get pinchPrecision(): number {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.pinchPrecision;

            return 0;
        }

        public set pinchPrecision(value: number) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.pinchPrecision = value;
            }
        }

        public get pinchDeltaPercentage(): number {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.pinchDeltaPercentage;

            return 0;
        }

        public set pinchDeltaPercentage(value: number) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.pinchDeltaPercentage = value;
            }
        }

        public get panningSensibility(): number {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers)
                return pointers.panningSensibility;

            return 0;
        }

        public set panningSensibility(value: number) {
            var pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
            if (pointers) {
                pointers.panningSensibility = value;
            }
        }

        public get keysUp(): number[] {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysUp;

            return [];
        }

        public set keysUp(value: number[]) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysUp = value;
        }

        public get keysDown(): number[] {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysDown;

            return [];
        }

        public set keysDown(value: number[]) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysDown = value;
        }

        public get keysLeft(): number[] {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysLeft;

            return [];
        }

        public set keysLeft(value: number[]) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysLeft = value;
        }

        public get keysRight(): number[] {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysRight;

            return [];
        }

        public set keysRight(value: number[]) {
            var keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysRight = value;
        }

        public get wheelPrecision(): number {
            var mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                return mousewheel.wheelPrecision;

            return 0;
        }

        public set wheelPrecision(value: number) {
            var mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                mousewheel.wheelPrecision = value;
        }

        public get wheelDeltaPercentage(): number {
            var mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                return mousewheel.wheelDeltaPercentage;

            return 0;
        }

        public set wheelDeltaPercentage(value: number) {
            var mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                mousewheel.wheelDeltaPercentage = value;
        }

        //-- end properties for backward compatibility for inputs

        @serialize()
        public zoomOnFactor = 1;

        public targetScreenOffset = Vector2.Zero();

        @serialize()
        public allowUpsideDown = true;

        public _viewMatrix = new Matrix();
        public _useCtrlForPanning: boolean;
        public _panningMouseButton: number;
        public inputs: ArcRotateCameraInputsManager;

        public _reset: () => void;

        // Panning
        public panningAxis: Vector3 = new Vector3(1, 1, 0);
        protected _localDirection: Vector3;
        protected _transformedDirection: Vector3;

        // Behaviors
        private _bouncingBehavior: Nullable<BouncingBehavior>;

        public get bouncingBehavior(): Nullable<BouncingBehavior> {
            return this._bouncingBehavior;
        }

        public get useBouncingBehavior(): boolean {
            return this._bouncingBehavior != null;
        }

        public set useBouncingBehavior(value: boolean) {
            if (value === this.useBouncingBehavior) {
                return;
            }

            if (value) {
                this._bouncingBehavior = new BouncingBehavior();
                this.addBehavior(this._bouncingBehavior);
            } else if (this._bouncingBehavior) {
                this.removeBehavior(this._bouncingBehavior);
                this._bouncingBehavior = null;
            }
        }

        private _framingBehavior: Nullable<FramingBehavior>;

        public get framingBehavior(): Nullable<FramingBehavior> {
            return this._framingBehavior;
        }

        public get useFramingBehavior(): boolean {
            return this._framingBehavior != null;
        }

        public set useFramingBehavior(value: boolean) {
            if (value === this.useFramingBehavior) {
                return;
            }

            if (value) {
                this._framingBehavior = new FramingBehavior();
                this.addBehavior(this._framingBehavior);
            } else if (this._framingBehavior) {
                this.removeBehavior(this._framingBehavior);
                this._framingBehavior = null;
            }
        }

        private _autoRotationBehavior: Nullable<AutoRotationBehavior>;

        public get autoRotationBehavior(): Nullable<AutoRotationBehavior> {
            return this._autoRotationBehavior;
        }

        public get useAutoRotationBehavior(): boolean {
            return this._autoRotationBehavior != null;
        }

        public set useAutoRotationBehavior(value: boolean) {
            if (value === this.useAutoRotationBehavior) {
                return;
            }

            if (value) {
                this._autoRotationBehavior = new AutoRotationBehavior();
                this.addBehavior(this._autoRotationBehavior);
            } else if (this._autoRotationBehavior) {
                this.removeBehavior(this._autoRotationBehavior);
                this._autoRotationBehavior = null;
            }
        }

        public onMeshTargetChangedObservable = new Observable<AbstractMesh>();

        // Collisions
        public onCollide: (collidedMesh: AbstractMesh) => void;
        public checkCollisions = false;
        public collisionRadius = new Vector3(0.5, 0.5, 0.5);
        protected _collider: Collider;
        protected _previousPosition = Vector3.Zero();
        protected _collisionVelocity = Vector3.Zero();
        protected _newPosition = Vector3.Zero();
        protected _previousAlpha: number;
        protected _previousBeta: number;
        protected _previousRadius: number;
        //due to async collision inspection
        protected _collisionTriggered: boolean;

        protected _targetBoundingCenter: Nullable<Vector3>;

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene) {
            super(name, Vector3.Zero(), scene);

            this._target = Vector3.Zero();
            if (target) {
                this.setTarget(target);
            }

            this.alpha = alpha;
            this.beta = beta;
            this.radius = radius;

            this.getViewMatrix();
            this.inputs = new ArcRotateCameraInputsManager(this);
            this.inputs.addKeyboard().addMouseWheel().addPointers();
        }

        // Cache
        public _initCache(): void {
            super._initCache();
            this._cache._target = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.alpha = undefined;
            this._cache.beta = undefined;
            this._cache.radius = undefined;
            this._cache.targetScreenOffset = Vector2.Zero();
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            this._cache._target.copyFrom(this._getTargetPosition());
            this._cache.alpha = this.alpha;
            this._cache.beta = this.beta;
            this._cache.radius = this.radius;
            this._cache.targetScreenOffset.copyFrom(this.targetScreenOffset);
        }

        protected _getTargetPosition(): Vector3 {
            if (this._targetHost && this._targetHost.getAbsolutePosition) {
                var pos: Vector3 = this._targetHost.getAbsolutePosition();
                if (this._targetBoundingCenter) {
                    pos.addToRef(this._targetBoundingCenter, this._target);
                } else {
                    this._target.copyFrom(pos);
                }
            }

            var lockedTargetPosition = this._getLockedTargetPosition();

            if (lockedTargetPosition) {
                return lockedTargetPosition;
            }

            return this._target;
        }

        // State

        /**
         * Store current camera state (fov, position, etc..)
         */
        private _storedAlpha: number;
        private _storedBeta: number;
        private _storedRadius: number;
        private _storedTarget: Vector3;

        public storeState(): Camera {
            this._storedAlpha = this.alpha;
            this._storedBeta = this.beta;
            this._storedRadius = this.radius;
            this._storedTarget = this._getTargetPosition().clone();

            return super.storeState();
        }

        /**
         * Restored camera state. You must call storeState() first
         */
        public _restoreStateValues(): boolean {
            if (!super._restoreStateValues()) {
                return false;
            }

            this.alpha = this._storedAlpha;
            this.beta = this._storedBeta;
            this.radius = this._storedRadius;
            this.setTarget(this._storedTarget.clone());

            this.inertialAlphaOffset = 0;
            this.inertialBetaOffset = 0;
            this.inertialRadiusOffset = 0;
            this.inertialPanningX = 0;
            this.inertialPanningY = 0;

            return true;
        }

        // Synchronized
        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronizedViewMatrix())
                return false;

            return this._cache._target.equals(this._getTargetPosition())
                && this._cache.alpha === this.alpha
                && this._cache.beta === this.beta
                && this._cache.radius === this.radius
                && this._cache.targetScreenOffset.equals(this.targetScreenOffset);
        }

        // Methods
        public attachControl(element: HTMLElement, noPreventDefault?: boolean, useCtrlForPanning: boolean = true, panningMouseButton: number = 2): void {
            this._useCtrlForPanning = useCtrlForPanning;
            this._panningMouseButton = panningMouseButton;

            this.inputs.attachElement(element, noPreventDefault);

            this._reset = () => {
                this.inertialAlphaOffset = 0;
                this.inertialBetaOffset = 0;
                this.inertialRadiusOffset = 0;
                this.inertialPanningX = 0;
                this.inertialPanningY = 0;
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

                if (this.getScene().useRightHandedSystem) {
                    this.alpha -= this.beta <= 0 ? -this.inertialAlphaOffset : this.inertialAlphaOffset;
                } else {
                    this.alpha += this.beta <= 0 ? -this.inertialAlphaOffset : this.inertialAlphaOffset;
                }

                this.beta += this.inertialBetaOffset;

                this.radius -= this.inertialRadiusOffset;
                this.inertialAlphaOffset *= this.inertia;
                this.inertialBetaOffset *= this.inertia;
                this.inertialRadiusOffset *= this.inertia;
                if (Math.abs(this.inertialAlphaOffset) < Epsilon)
                    this.inertialAlphaOffset = 0;
                if (Math.abs(this.inertialBetaOffset) < Epsilon)
                    this.inertialBetaOffset = 0;
                if (Math.abs(this.inertialRadiusOffset) < this.speed * Epsilon)
                    this.inertialRadiusOffset = 0;
            }

            // Panning inertia
            if (this.inertialPanningX !== 0 || this.inertialPanningY !== 0) {
                if (!this._localDirection) {
                    this._localDirection = Vector3.Zero();
                    this._transformedDirection = Vector3.Zero();
                }

                this._localDirection.copyFromFloats(this.inertialPanningX, this.inertialPanningY, this.inertialPanningY);
                this._localDirection.multiplyInPlace(this.panningAxis);
                this._viewMatrix.invertToRef(this._cameraTransformMatrix);
                Vector3.TransformNormalToRef(this._localDirection, this._cameraTransformMatrix, this._transformedDirection);
                //Eliminate y if map panning is enabled (panningAxis == 1,0,1)
                if (!this.panningAxis.y) {
                    this._transformedDirection.y = 0;
                }

                if (!this._targetHost) {
                    if (this.panningDistanceLimit) {
                        this._transformedDirection.addInPlace(this._target);
                        var distanceSquared = Vector3.DistanceSquared(this._transformedDirection, this.panningOriginTarget);
                        if (distanceSquared <= (this.panningDistanceLimit * this.panningDistanceLimit)) {
                            this._target.copyFrom(this._transformedDirection);
                        }
                    }
                    else {
                        this._target.addInPlace(this._transformedDirection);
                    }
                }

                this.inertialPanningX *= this.panningInertia;
                this.inertialPanningY *= this.panningInertia;

                if (Math.abs(this.inertialPanningX) < this.speed * Epsilon)
                    this.inertialPanningX = 0;
                if (Math.abs(this.inertialPanningY) < this.speed * Epsilon)
                    this.inertialPanningY = 0;
            }

            // Limits
            this._checkLimits();

            super._checkInputs();
        }

        protected _checkLimits() {
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

            if (this.radius === 0) {
                this.radius = 0.0001; // Just to avoid division by zero
            }

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
            this.position.copyFrom(position);

            this.rebuildAnglesAndRadius();
        }

        public setTarget(target: AbstractMesh | Vector3, toBoundingCenter = false, allowSamePosition = false): void {

            if ((<any>target).getBoundingInfo) {
                if (toBoundingCenter) {
                    this._targetBoundingCenter = (<any>target).getBoundingInfo().boundingBox.centerWorld.clone();
                } else {
                    this._targetBoundingCenter = null;
                }
                this._targetHost = <AbstractMesh>target;
                this._target = this._getTargetPosition();

                this.onMeshTargetChangedObservable.notifyObservers(this._targetHost);
            } else {
                var newTarget = <Vector3>target;
                var currentTarget = this._getTargetPosition();
                if (currentTarget && !allowSamePosition && currentTarget.equals(newTarget)) {
                    return;
                }
                this._targetHost = null;
                this._target = newTarget;
                this._targetBoundingCenter = null;
                this.onMeshTargetChangedObservable.notifyObservers(null);
            }

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
                if (!this._collider) {
                    this._collider = new Collider();
                }
                this._collider.radius = this.collisionRadius;
                this._newPosition.subtractToRef(this.position, this._collisionVelocity);
                this._collisionTriggered = true;
                this.getScene().collisionCoordinator.getNewPosition(this.position, this._collisionVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
            } else {
                this.position.copyFrom(this._newPosition);

                var up = this.upVector;
                if (this.allowUpsideDown && sinb < 0) {
                    up = up.clone();
                    up = up.negate();
                }

                if (this.getScene().useRightHandedSystem) {
                    Matrix.LookAtRHToRef(this.position, target, up, this._viewMatrix);
                } else {
                    Matrix.LookAtLHToRef(this.position, target, up, this._viewMatrix);
                }
                this._viewMatrix.m[12] += this.targetScreenOffset.x;
                this._viewMatrix.m[13] += this.targetScreenOffset.y;
            }
            this._currentTarget = target;
            return this._viewMatrix;
        }

        protected _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {

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

        public focusOn(meshesOrMinMaxVectorAndDistance: AbstractMesh[] | { min: Vector3, max: Vector3, distance: number }, doNotUpdateMaxZ = false): void {
            var meshesOrMinMaxVector: { min: Vector3, max: Vector3 };
            var distance: number;

            if ((<any>meshesOrMinMaxVectorAndDistance).min === undefined) { // meshes
                var meshes = (<AbstractMesh[]>meshesOrMinMaxVectorAndDistance) || this.getScene().meshes;
                meshesOrMinMaxVector = Mesh.MinMax(meshes);
                distance = Vector3.Distance(meshesOrMinMaxVector.min, meshesOrMinMaxVector.max);
            }
            else { //minMaxVector and distance
                var minMaxVectorAndDistance = <any>meshesOrMinMaxVectorAndDistance;
                meshesOrMinMaxVector = minMaxVectorAndDistance;
                distance = minMaxVectorAndDistance.distance;
            }

            this._target = Mesh.Center(meshesOrMinMaxVector);

            if (!doNotUpdateMaxZ) {
                this.maxZ = distance * 2;
            }
        }

        /**
         * @override
         * Override Camera.createRigCamera
         */
        public createRigCamera(name: string, cameraIndex: number): Camera {
            var alphaShift: number = 0;
            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case Camera.RIG_MODE_VR:
                    alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? 1 : -1);
                    break;
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                    alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? -1 : 1);
                    break;
            }
            var rigCam = new ArcRotateCamera(name, this.alpha + alphaShift, this.beta, this.radius, this._target, this.getScene());
            rigCam._cameraRigParams = {};
            return rigCam;
        }

        /**
         * @override
         * Override Camera._updateRigCameras
         */
        public _updateRigCameras() {
            var camLeft = <ArcRotateCamera>this._rigCameras[0];
            var camRight = <ArcRotateCamera>this._rigCameras[1];

            camLeft.beta = camRight.beta = this.beta;
            camLeft.radius = camRight.radius = this.radius;

            switch (this.cameraRigMode) {
                case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                case Camera.RIG_MODE_VR:
                    camLeft.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                    camRight.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                    break;
                case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                    camLeft.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                    camRight.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                    break;
            }
            super._updateRigCameras();
        }

        public dispose(): void {
            this.inputs.clear();
            super.dispose();
        }

        public getClassName(): string {
            return "ArcRotateCamera";
        }
    }
}
