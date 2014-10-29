module BABYLON {
    var eventPrefix = Tools.GetPointerPrefix();

    export class ArcRotateCamera extends Camera {
        public inertialAlphaOffset = 0;
        public inertialBetaOffset = 0;
        public inertialRadiusOffset = 0;
        public lowerAlphaLimit = null;
        public upperAlphaLimit = null;
        public lowerBetaLimit = 0.01;
        public upperBetaLimit = Math.PI;
        public lowerRadiusLimit = null;
        public upperRadiusLimit = null;
        public angularSensibility = 1000.0;
        public wheelPrecision = 3.0;
        public keysUp = [38];
        public keysDown = [40];
        public keysLeft = [37];
        public keysRight = [39];
        public zoomOnFactor = 1;
		public targetScreenOffset = Vector2.Zero();
		
		
        private _keys = [];
        private _viewMatrix = new BABYLON.Matrix();
        private _attachedElement: HTMLElement;

        private _onPointerDown: (e: PointerEvent) => void;
        private _onPointerUp: (e: PointerEvent) => void;
        private _onPointerMove: (e: PointerEvent) => void;
        private _wheel: (e: MouseWheelEvent) => void;
        private _onMouseMove: (e: MouseEvent) => any;
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onLostFocus: (e: FocusEvent) => any;
        private _reset: () => void;
        private _onGestureStart: (e: PointerEvent) => void;
        private _onGesture: (e: MSGestureEvent) => void;
        private _MSGestureHandler: MSGesture;

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

        // Pinch
        // value for pinch step scaling
        // set to 20 by default
        public pinchPrecision = 20;
        // Event for pinch
        private _touchStart: (e: any) => void;
        private _touchMove: (e: any) => void;
        private _touchEnd: (e: any) => void;
        // Method for pinch
        private _pinchStart: (e: any) => void;
        private _pinchMove: (e: any) => void;
        private _pinchEnd: (e: any) => void;

        constructor(name: string, public alpha: number, public beta: number, public radius: number, public target: any, scene: Scene) {
            super(name, BABYLON.Vector3.Zero(), scene);

            this.getViewMatrix();
        }

        public _getTargetPosition(): Vector3 {
            return this.target.position || this.target;
        }

        // Cache
        public _initCache(): void {
            super._initCache();
            this._cache.target = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.alpha = undefined;
            this._cache.beta = undefined;
            this._cache.radius = undefined;
			this._cache.targetScreenOffset = undefined;
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            this._cache.target.copyFrom(this._getTargetPosition());
            this._cache.alpha = this.alpha;
            this._cache.beta = this.beta;
            this._cache.radius = this.radius;
			this._cache.targetScreenOffset = this.targetScreenOffset.clone();
        }

        // Synchronized
        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronizedViewMatrix())
                return false;

            return this._cache.target.equals(this._getTargetPosition())
                && this._cache.alpha === this.alpha
                && this._cache.beta === this.beta
                && this._cache.radius === this.radius
				&& this._cache.targetScreenOffset.equals(this.targetScreenOffset);
        }

        // Methods
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            var previousPosition;
            var pointerId;
            // to know if pinch started
            var pinchStarted = false;
            // two pinch point on X
            // that will use for find if user action is pinch open or pinch close
            var pinchPointX1, pinchPointX2;

            if (this._attachedElement) {
                return;
            }
            this._attachedElement = element;

            var engine = this.getEngine();

            if (this._onPointerDown === undefined) {
                this._onPointerDown = evt => {

                    if (pointerId) {
                        return;
                    }

                    pointerId = evt.pointerId;

                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onPointerUp = evt => {
                    previousPosition = null;
                    pointerId = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };


                this._onPointerMove = evt => {
                    if (!previousPosition) {
                        return;
                    }

                    if (pointerId !== evt.pointerId) {
                        return;
                    }

                    // return pinch is started
                    if (pinchStarted) {
                        return;
                    }

                    var offsetX = evt.clientX - previousPosition.x;
                    var offsetY = evt.clientY - previousPosition.y;

                    this.inertialAlphaOffset -= offsetX / this.angularSensibility;
                    this.inertialBetaOffset -= offsetY / this.angularSensibility;

                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onMouseMove = evt => {
                    if (!engine.isPointerLock) {
                        return;
                    }

                    // return pinch is started
                    if (pinchStarted) {
                        return;
                    }

                    var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                    var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;

                    this.inertialAlphaOffset -= offsetX / this.angularSensibility;
                    this.inertialBetaOffset -= offsetY / this.angularSensibility;

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._wheel = event => {
                    var delta = 0;
                    if (event.wheelDelta) {
                        delta = event.wheelDelta / (this.wheelPrecision * 40);
                    } else if (event.detail) {
                        delta = -event.detail / this.wheelPrecision;
                    }

                    if (delta)
                        this.inertialRadiusOffset += delta;

                    if (event.preventDefault) {
                        if (!noPreventDefault) {
                            event.preventDefault();
                        }
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

                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
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

                        if (evt.preventDefault) {
                            if (!noPreventDefault) {
                                evt.preventDefault();
                            }
                        }
                    }
                };

                this._onLostFocus = () => {
                    this._keys = [];
                    pointerId = null;
                };

                this._onGestureStart = e => {
                    if (window.MSGesture === undefined) {
                        return;
                    }

                    if (!this._MSGestureHandler) {
                        this._MSGestureHandler = new MSGesture();
                        this._MSGestureHandler.target = element;
                    }

                    this._MSGestureHandler.addPointer(e.pointerId);
                };

                this._onGesture = e => {
                    this.radius *= e.scale;


                    if (e.preventDefault) {
                        if (!noPreventDefault) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                };

                this._reset = () => {
                    this._keys = [];
                    this.inertialAlphaOffset = 0;
                    this.inertialBetaOffset = 0;
                    this.inertialRadiusOffset = 0;
                    previousPosition = null;
                    pointerId = null;
                };

                this._touchStart = event => {
                    if (event.touches.length == 2) {
                        //-- start pinch if two fingers on the screen
                        pinchStarted = true;
                        this._pinchStart(event);
                    }
                };
                this._touchMove = event => {
                    if (pinchStarted) {
                        //-- make scaling
                        this._pinchMove(event);
                    }
                };
                this._touchEnd = event => {
                    if (pinchStarted) {
                        //-- end of pinch
                        this._pinchEnd(event);
                    }
                };

                this._pinchStart = event => {
                    // save origin touch point
                    pinchPointX1 = event.touches[0].clientX;
                    pinchPointX2 = event.touches[1].clientX;
                    // block the camera 
                    // if not it rotate around target during pinch
                    pinchStarted = true;
                };
                this._pinchMove = event => {
                    // variable for new camera's radius
                    var delta = 0;
                    // variables to know if pinch open or pinch close
                    var direction = 1;
                    var distanceXOrigine, distanceXNow;

                    if (event.touches.length != 2)
                        return;
                    // calculate absolute distances of the two fingers
                    distanceXOrigine = Math.abs(pinchPointX1 - pinchPointX2);
                    distanceXNow = Math.abs(event.touches[0].clientX - event.touches[1].clientX);

                    // if distanceXNow < distanceXOrigine -> pinch close so direction = -1
                    if (distanceXNow < distanceXOrigine) {
                        direction = -1;
                    }
                    // calculate new radius
                    delta = (this.pinchPrecision / (this.wheelPrecision * 40)) * direction;
                    // set new radius
                    this.inertialRadiusOffset += delta;
                    // save origin touch point
                    pinchPointX1 = event.touches[0].clientX;
                    pinchPointX2 = event.touches[1].clientX;
                };
                this._pinchEnd = event => {
                    // cancel pinch and deblock camera rotation
                    pinchStarted = false;
                };
            }

            element.addEventListener(eventPrefix + "down", this._onPointerDown, false);
            element.addEventListener(eventPrefix + "up", this._onPointerUp, false);
            element.addEventListener(eventPrefix + "out", this._onPointerUp, false);
            element.addEventListener(eventPrefix + "move", this._onPointerMove, false);
            element.addEventListener("mousemove", this._onMouseMove, false);
            element.addEventListener("MSPointerDown", this._onGestureStart, false);
            element.addEventListener("MSGestureChange", this._onGesture, false);
            element.addEventListener('mousewheel', this._wheel, false);
            element.addEventListener('DOMMouseScroll', this._wheel, false);
            // pinch
            element.addEventListener('touchstart', this._touchStart, false);
            element.addEventListener('touchmove', this._touchMove, false);
            element.addEventListener('touchend', this._touchEnd, false);

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

            element.removeEventListener(eventPrefix + "down", this._onPointerDown);
            element.removeEventListener(eventPrefix + "up", this._onPointerUp);
            element.removeEventListener(eventPrefix + "out", this._onPointerUp);
            element.removeEventListener(eventPrefix + "move", this._onPointerMove);
            element.removeEventListener("mousemove", this._onMouseMove);
            element.removeEventListener("MSPointerDown", this._onGestureStart);
            element.removeEventListener("MSGestureChange", this._onGesture);
            element.removeEventListener('mousewheel', this._wheel);
            element.removeEventListener('DOMMouseScroll', this._wheel);
            // pinch
            element.removeEventListener('touchstart', this._touchStart);
            element.removeEventListener('touchmove', this._touchMove);
            element.removeEventListener('touchend', this._touchEnd);

            Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);

            this._MSGestureHandler = null;
            this._attachedElement = null;

            if (this._reset) {
                this._reset();
            }
        }

        public _update(): void {
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];

                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    this.inertialAlphaOffset -= 0.01;
                } else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this.inertialBetaOffset -= 0.01;
                } else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this.inertialAlphaOffset += 0.01;
                } else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this.inertialBetaOffset += 0.01;
                }
            }

            // Inertia
            if (this.inertialAlphaOffset != 0 || this.inertialBetaOffset != 0 || this.inertialRadiusOffset != 0) {

                this.alpha += this.inertialAlphaOffset;
                this.beta += this.inertialBetaOffset;
                this.radius -= this.inertialRadiusOffset;

                this.inertialAlphaOffset *= this.inertia;
                this.inertialBetaOffset *= this.inertia;
                this.inertialRadiusOffset *= this.inertia;

                if (Math.abs(this.inertialAlphaOffset) < BABYLON.Engine.Epsilon)
                    this.inertialAlphaOffset = 0;

                if (Math.abs(this.inertialBetaOffset) < BABYLON.Engine.Epsilon)
                    this.inertialBetaOffset = 0;

                if (Math.abs(this.inertialRadiusOffset) < BABYLON.Engine.Epsilon)
                    this.inertialRadiusOffset = 0;
            }

            // Limits
            if (this.lowerAlphaLimit && this.alpha < this.lowerAlphaLimit) {
                this.alpha = this.lowerAlphaLimit;
            }
            if (this.upperAlphaLimit && this.alpha > this.upperAlphaLimit) {
                this.alpha = this.upperAlphaLimit;
            }
            if (this.lowerBetaLimit && this.beta < this.lowerBetaLimit) {
                this.beta = this.lowerBetaLimit;
            }
            if (this.upperBetaLimit && this.beta > this.upperBetaLimit) {
                this.beta = this.upperBetaLimit;
            }
            if (this.lowerRadiusLimit && this.radius < this.lowerRadiusLimit) {
                this.radius = this.lowerRadiusLimit;
            }
            if (this.upperRadiusLimit && this.radius > this.upperRadiusLimit) {
                this.radius = this.upperRadiusLimit;
            }
        }

        public setPosition(position: Vector3): void {
            var radiusv3 = position.subtract(this._getTargetPosition());
            this.radius = radiusv3.length();

            // Alpha
            this.alpha = Math.acos(radiusv3.x / Math.sqrt(Math.pow(radiusv3.x, 2) + Math.pow(radiusv3.z, 2)));

            if (radiusv3.z < 0) {
                this.alpha = 2 * Math.PI - this.alpha;
            }

            // Beta
            this.beta = Math.acos(radiusv3.y / this.radius);
        }

        public _getViewMatrix(): Matrix {
            // Compute
            var cosa = Math.cos(this.alpha);
            var sina = Math.sin(this.alpha);
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);

            var target = this._getTargetPosition();

            target.addToRef(new BABYLON.Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this.position);

            if (this.checkCollisions) {
                this._collider.radius = this.collisionRadius;
                this.position.subtractToRef(this._previousPosition, this._collisionVelocity);

                this.getScene()._getNewPosition(this._previousPosition, this._collisionVelocity, this._collider, 3, this._newPosition);

                if (!this._newPosition.equalsWithEpsilon(this.position)) {
                    this.position.copyFrom(this._previousPosition);

                    this.alpha = this._previousAlpha;
                    this.beta = this._previousBeta;
                    this.radius = this._previousRadius;

                    if (this.onCollide) {
                        this.onCollide(this._collider.collidedMesh);
                    }
                }
            }

            Matrix.LookAtLHToRef(this.position, target, this.upVector, this._viewMatrix);

            this._previousAlpha = this.alpha;
            this._previousBeta = this.beta;
            this._previousRadius = this.radius;
            this._previousPosition.copyFrom(this.position);

			this._viewMatrix.m[12] += this.targetScreenOffset.x;
			this._viewMatrix.m[13] += this.targetScreenOffset.y;
						
            return this._viewMatrix;
        }

        public zoomOn(meshes?: AbstractMesh[]): void {
            meshes = meshes || this.getScene().meshes;

            var minMaxVector = BABYLON.Mesh.MinMax(meshes);
            var distance = BABYLON.Vector3.Distance(minMaxVector.min, minMaxVector.max);

            this.radius = distance * this.zoomOnFactor;

            this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance });
        }

        public focusOn(meshesOrMinMaxVectorAndDistance): void {
            var meshesOrMinMaxVector;
            var distance;

            if (meshesOrMinMaxVectorAndDistance.min === undefined) { // meshes
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance || this.getScene().meshes;
                meshesOrMinMaxVector = BABYLON.Mesh.MinMax(meshesOrMinMaxVector);
                distance = BABYLON.Vector3.Distance(meshesOrMinMaxVector.min, meshesOrMinMaxVector.max);
            }
            else { //minMaxVector and distance
                meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance;
                distance = meshesOrMinMaxVectorAndDistance.distance;
            }

            this.target = Mesh.Center(meshesOrMinMaxVector);

            this.maxZ = distance * 2;
        }
    }
} 
