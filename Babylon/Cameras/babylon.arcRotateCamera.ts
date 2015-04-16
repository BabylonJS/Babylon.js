﻿module BABYLON {
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
        public pinchPrecision = 2.0;
        public keysUp = [38];
        public keysDown = [40];
        public keysLeft = [37];
        public keysRight = [39];
        public zoomOnFactor = 1;
        public targetScreenOffset = Vector2.Zero();


        private _keys = [];
        private _viewMatrix = new Matrix();
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

        constructor(name: string, public alpha: number, public beta: number, public radius: number, public target: any, scene: Scene) {
            super(name, Vector3.Zero(), scene);

            if (!this.target) {
                this.target = Vector3.Zero();
            }

            this.getViewMatrix();
        }

        public _getTargetPosition(): Vector3 {
            return this.target.position || this.target;
        }

        // Cache
        public _initCache(): void {
            super._initCache();
            this._cache.target = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
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
            var cacheSoloPointer; // cache pointer object for better perf on camera rotation
            var previousPinchDistance = 0;
            var pointers = new SmartCollection();

            if (this._attachedElement) {
                return;
            }
            this._attachedElement = element;

            var engine = this.getEngine();

            if (this._onPointerDown === undefined) {
                this._onPointerDown = evt => {
                    pointers.add(evt.pointerId, { x: evt.clientX, y: evt.clientY, type: evt.pointerType });
                    cacheSoloPointer = pointers.item(evt.pointerId);
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onPointerUp = evt => {
                    cacheSoloPointer = null;
                    previousPinchDistance = 0;
                    pointers.remove(evt.pointerId);
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onPointerMove = evt => {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    switch (pointers.count) {

                        case 1: //normal camera rotation
                            //var offsetX = evt.clientX - pointers.item(evt.pointerId).x;
                            //var offsetY = evt.clientY - pointers.item(evt.pointerId).y;
                            var offsetX = evt.clientX - cacheSoloPointer.x;
                            var offsetY = evt.clientY - cacheSoloPointer.y;
                            this.inertialAlphaOffset -= offsetX / this.angularSensibility;
                            this.inertialBetaOffset -= offsetY / this.angularSensibility;
                            //pointers.item(evt.pointerId).x = evt.clientX;
                            //pointers.item(evt.pointerId).y = evt.clientY;
                            cacheSoloPointer.x = evt.clientX;
                            cacheSoloPointer.y = evt.clientY;
                            break;

                        case 2: //pinch
                            //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be usefull to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                            pointers.item(evt.pointerId).x = evt.clientX;
                            pointers.item(evt.pointerId).y = evt.clientY;
                            var direction = 1;
                            var distX = pointers.getItemByIndex(0).x - pointers.getItemByIndex(1).x;
                            var distY = pointers.getItemByIndex(0).y - pointers.getItemByIndex(1).y;
                            var pinchSquaredDistance = (distX * distX) + (distY * distY);
                            if (previousPinchDistance === 0) {
                                previousPinchDistance = pinchSquaredDistance;
                                return;
                            }

                            if (pinchSquaredDistance !== previousPinchDistance) {
                                if (pinchSquaredDistance > previousPinchDistance) {
                                    direction = -1;
                                }
                                this.inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) / (this.pinchPrecision * this.wheelPrecision * this.angularSensibility);
                                previousPinchDistance = pinchSquaredDistance;
                            }
                            break;

                        default:
                            if (pointers.item(evt.pointerId)) {
                                pointers.item(evt.pointerId).x = evt.clientX;
                                pointers.item(evt.pointerId).y = evt.clientY;
                            }
                    }
                };

                this._onMouseMove = evt => {
                    if (!engine.isPointerLock) {
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
                    pointers.empty();
                    previousPinchDistance = 0;
                    cacheSoloPointer = null;
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
                    pointers.empty();
                    previousPinchDistance = 0;
                    cacheSoloPointer = null;
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

            Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(element: HTMLElement): void {
            if (this._attachedElement !== element) {
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
            if (this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset != 0) {

                this.alpha += this.inertialAlphaOffset;
                this.beta += this.inertialBetaOffset;
                this.radius -= this.inertialRadiusOffset;

                this.inertialAlphaOffset *= this.inertia;
                this.inertialBetaOffset *= this.inertia;
                this.inertialRadiusOffset *= this.inertia;

                if (Math.abs(this.inertialAlphaOffset) < Engine.Epsilon)
                    this.inertialAlphaOffset = 0;

                if (Math.abs(this.inertialBetaOffset) < Engine.Epsilon)
                    this.inertialBetaOffset = 0;

                if (Math.abs(this.inertialRadiusOffset) < Engine.Epsilon)
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

            target.addToRef(new Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this.position);

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

            var minMaxVector = Mesh.MinMax(meshes);
            var distance = Vector3.Distance(minMaxVector.min, minMaxVector.max);

            this.radius = distance * this.zoomOnFactor;

            this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance });
        }

        public focusOn(meshesOrMinMaxVectorAndDistance): void {
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

            this.maxZ = distance * 2;
        }
    }
} 