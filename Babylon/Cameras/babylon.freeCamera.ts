module BABYLON {
    export class FreeCamera extends Camera {
        public cameraDirection = new BABYLON.Vector3(0, 0, 0);
        public cameraRotation = new BABYLON.Vector2(0, 0);
        public rotation = new BABYLON.Vector3(0, 0, 0);
        public ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
        public keysUp = [38];
        public keysDown = [40];
        public keysLeft = [37];
        public keysRight = [39];
        public speed = 2.0;
        public checkCollisions = false;
        public applyGravity = false;
        public noRotationConstraint = false;
        public angularSensibility = 2000.0;
        public lockedTarget = null;
        public onCollide = null;

        private _keys = [];
        private _collider = new Collider();
        private _needMoveForGravity = true;
        private _currentTarget = BABYLON.Vector3.Zero();
        private _viewMatrix = BABYLON.Matrix.Zero();
        private _camMatrix = BABYLON.Matrix.Zero();
        private _cameraTransformMatrix = BABYLON.Matrix.Zero();
        private _cameraRotationMatrix = BABYLON.Matrix.Zero();
        private _referencePoint = BABYLON.Vector3.Zero();
        private _transformedReferencePoint = BABYLON.Vector3.Zero();
        private _oldPosition = BABYLON.Vector3.Zero();
        private _diffPosition = BABYLON.Vector3.Zero();
        private _newPosition = BABYLON.Vector3.Zero();
        private _lookAtTemp = BABYLON.Matrix.Zero();
        private _tempMatrix = BABYLON.Matrix.Zero();
        private _attachedElement: HTMLElement;
        private _localDirection: Vector3;
        private _transformedDirection: Vector3;

        private _onMouseDown: (e: MouseEvent) => any;
        private _onMouseUp: (e: MouseEvent) => any;
        private _onMouseOut: (e: MouseEvent) => any;
        private _onMouseMove: (e: MouseEvent) => any;
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onLostFocus: (e: FocusEvent) => any;
        private _reset: () => void;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
        }

        public _getLockedTargetPosition(): Vector3 {
            if (!this.lockedTarget) {
                return null;
            }

            return this.lockedTarget.position || this.lockedTarget;
        }

        // Cache
        public _initCache() {
            super._initCache();
            this._cache.lockedTarget = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.rotation = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        }

        public _updateCache(ignoreParentClass?: boolean): void {
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
        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronizedViewMatrix()) {
                return false;
            }

            var lockedTargetPosition = this._getLockedTargetPosition();

            return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition)
                && this._cache.rotation.equals(this.rotation);
        }

        // Methods
        private _computeLocalCameraSpeed(): number {
            return this.speed * ((BABYLON.Tools.GetDeltaTime() / (BABYLON.Tools.GetFps() * 10.0)));
        }

        // Target
        public setTarget(target: Vector3): void {
            this.upVector.normalize();

            BABYLON.Matrix.LookAtLHToRef(this.position, target, this.upVector, this._camMatrix);
            this._camMatrix.invert();

            this.rotation.x = Math.atan(this._camMatrix.m[6] / this._camMatrix.m[10]);

            var vDir = target.subtract(this.position);

            if (vDir.x >= 0.0) {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) + Math.PI / 2.0);
            } else {
                this.rotation.y = (-Math.atan(vDir.z / vDir.x) - Math.PI / 2.0);
            }

            this.rotation.z = -Math.acos(BABYLON.Vector3.Dot(new BABYLON.Vector3(0, 1.0, 0), this.upVector));

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

        public getTarget(): Vector3 {
            return this._currentTarget;
        }

        // Controls
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            var previousPosition;
            var engine = this.getEngine();

            if (this._attachedElement) {
                return;
            }
            this._attachedElement = element;

            if (this._onMouseDown === undefined) {
                this._onMouseDown = evt => {
                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onMouseUp = evt => {
                    previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onMouseOut = evt => {
                    previousPosition = null;
                    this._keys = [];
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onMouseMove = evt => {
                    if (!previousPosition && !engine.isPointerLock) {
                        return;
                    }

                    var offsetX;
                    var offsetY;

                    if (!engine.isPointerLock) {
                        offsetX = evt.clientX - previousPosition.x;
                        offsetY = evt.clientY - previousPosition.y;
                    } else {
                        offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                        offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                    }

                    this.cameraRotation.y += offsetX / this.angularSensibility;
                    this.cameraRotation.x += offsetY / this.angularSensibility;

                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onKeyDown = evt => {
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index === -1) {
                            this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                this._onKeyUp = evt => {
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index >= 0) {
                            this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                this._onLostFocus = () => {
                    this._keys = [];
                };

                this._reset = () => {
                    this._keys = [];
                    previousPosition = null;
                    this.cameraDirection = new BABYLON.Vector3(0, 0, 0);
                    this.cameraRotation = new BABYLON.Vector2(0, 0);
                };
            }

            element.addEventListener("mousedown", this._onMouseDown, false);
            element.addEventListener("mouseup", this._onMouseUp, false);
            element.addEventListener("mouseout", this._onMouseOut, false);
            element.addEventListener("mousemove", this._onMouseMove, false);

            Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(element: HTMLElement): void {
            if (this._attachedElement != element) {
                return;
            }

            element.removeEventListener("mousedown", this._onMouseDown);
            element.removeEventListener("mouseup", this._onMouseUp);
            element.removeEventListener("mouseout", this._onMouseOut);
            element.removeEventListener("mousemove", this._onMouseMove);

            Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);

            this._attachedElement = null;
            if (this._reset) {
                this._reset();
            }
        }

        public _collideWithWorld(velocity: Vector3): void {
            var globalPosition: Vector3;

            if (this.parent) {
                globalPosition = BABYLON.Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
            } else {
                globalPosition = this.position;
            }

            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
            this._collider.radius = this.ellipsoid;

            this.getScene()._getNewPosition(this._oldPosition, velocity, this._collider, 3, this._newPosition);
            this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

            if (this._diffPosition.length() > Engine.CollisionsEpsilon) {
                this.position.addInPlace(this._diffPosition);
                if (this.onCollide) {
                    this.onCollide(this._collider.collidedMesh);
                }
            }
        }

        public _checkInputs(): void {
            if (!this._localDirection) {
                this._localDirection = BABYLON.Vector3.Zero();
                this._transformedDirection = BABYLON.Vector3.Zero();
            }

            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                var speed = this._computeLocalCameraSpeed();

                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(-speed, 0, 0);
                } else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(0, 0, speed);
                } else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(speed, 0, 0);
                } else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this._localDirection.copyFromFloats(0, 0, -speed);
                }

                this.getViewMatrix().invertToRef(this._cameraTransformMatrix);
                BABYLON.Vector3.TransformNormalToRef(this._localDirection, this._cameraTransformMatrix, this._transformedDirection);
                this.cameraDirection.addInPlace(this._transformedDirection);
            }
        }

        public _update(): void {
            this._checkInputs();

            var needToMove = this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
            var needToRotate = Math.abs(this.cameraRotation.x) > 0 || Math.abs(this.cameraRotation.y) > 0;

            // Move
            if (needToMove) {
                if (this.checkCollisions && this.getScene().collisionsEnabled) {
                    this._collideWithWorld(this.cameraDirection);


                    if (this.applyGravity) {
                        var oldPosition = this.position;
                        this._collideWithWorld(this.getScene().gravity);
                        this._needMoveForGravity = (BABYLON.Vector3.DistanceSquared(oldPosition, this.position) != 0);
                    }
                } else {
                    this.position.addInPlace(this.cameraDirection);
                }
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
                if (Math.abs(this.cameraDirection.x) < BABYLON.Engine.Epsilon) {
                    this.cameraDirection.x = 0;
                }

                if (Math.abs(this.cameraDirection.y) < BABYLON.Engine.Epsilon) {
                    this.cameraDirection.y = 0;
                }

                if (Math.abs(this.cameraDirection.z) < BABYLON.Engine.Epsilon) {
                    this.cameraDirection.z = 0;
                }

                this.cameraDirection.scaleInPlace(this.inertia);
            }
            if (needToRotate) {
                if (Math.abs(this.cameraRotation.x) < BABYLON.Engine.Epsilon) {
                    this.cameraRotation.x = 0;
                }

                if (Math.abs(this.cameraRotation.y) < BABYLON.Engine.Epsilon) {
                    this.cameraRotation.y = 0;
                }
                this.cameraRotation.scaleInPlace(this.inertia);
            }
        }

        public _getViewMatrix(): Matrix {
            BABYLON.Vector3.FromFloatsToRef(0, 0, 1, this._referencePoint);

            if (!this.lockedTarget) {
                // Compute
                if (this.upVector.x != 0 || this.upVector.y != 1.0 || this.upVector.z != 0) {
                    BABYLON.Matrix.LookAtLHToRef(BABYLON.Vector3.Zero(), this._referencePoint, this.upVector, this._lookAtTemp);
                    BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);


                    this._lookAtTemp.multiplyToRef(this._cameraRotationMatrix, this._tempMatrix);
                    this._lookAtTemp.invert();
                    this._tempMatrix.multiplyToRef(this._lookAtTemp, this._cameraRotationMatrix);
                } else {
                    BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
                }

                BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);

                // Computing target and final matrix
                this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
            } else {
                this._currentTarget.copyFrom(this._getLockedTargetPosition());
            }

            BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTarget, this.upVector, this._viewMatrix);
            return this._viewMatrix;
        }
    }
} 