module BABYLON {
    var eventPrefix = Tools.GetPointerPrefix();

    export class MapPanCamera extends TargetCamera {
        public inertialRadiusOffset = 0;
        public lowerRadiusLimit = null;
        public upperRadiusLimit = null;
        public wheelPrecision = 3.0;
        public pinchPrecision = 2.0;
        public panningSensibility: number = 50.0;
        public inertialPanningX: number = 0;
        public inertialPanningZ: number = 0;
        public keysUp = [38];
        public keysDown = [40];
        public keysLeft = [37];
        public keysRight = [39];
        public zoomOnFactor = 1;

        private _keys = [];
        public _viewMatrix = new Matrix();
        private _attachedElement: HTMLElement;

        private _onPointerDown: (e: PointerEvent) => void;
        private _onPointerUp: (e: PointerEvent) => void;
        private _onPointerMove: (e: PointerEvent) => void;
        private _wheel: (e: MouseWheelEvent) => void;
        private _onMouseMove: (e: MouseEvent) => any;
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onLostFocus: (e: FocusEvent) => any;
        public _reset: () => void;
        private _onGestureStart: (e: PointerEvent) => void;
        private _onGesture: (e: MSGestureEvent) => void;
        private _MSGestureHandler: MSGesture;

        // Panning
        private _localDirection: Vector3;

        constructor(name: string, public beta: number, public radius: number, public target: any, scene: Scene) {
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
            this._cache.radius = undefined;
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            this._cache.target.copyFrom(this._getTargetPosition());
            this._cache.radius = this.radius;
        }

        // Synchronized
        public _isSynchronizedViewMatrix(): boolean {
            if (!super._isSynchronizedViewMatrix())
                return false;

            return this._cache.target.equals(this._getTargetPosition())
                && this._cache.radius === this.radius
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
                    // manage pointers
                    pointers.add(evt.pointerId, { x: evt.clientX, y: evt.clientY, type: evt.pointerType });
                    cacheSoloPointer = pointers.item(evt.pointerId);
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onPointerUp = evt => {
                    cacheSoloPointer = null;
                    previousPinchDistance = 0;

                    //would be better to use pointers.remove(evt.pointerId) for multitouch gestures,
                    //but emptying completly pointers collection is required to fix a bug on iPhone :
                    //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers
                    //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                    pointers.empty();

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };

                this._onPointerMove = evt => {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    switch (pointers.count) {

                        case 1: //normal camera panning
                            this.inertialPanningX -= -(evt.clientX - cacheSoloPointer.x) / this.panningSensibility;
                            this.inertialPanningZ -= (evt.clientY - cacheSoloPointer.y) / this.panningSensibility;
                            cacheSoloPointer.x = evt.clientX;
                            cacheSoloPointer.y = evt.clientY;
                            break;

                        case 2: //pinch
                            //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be usefull to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                            pointers.item(evt.pointerId).x = evt.clientX;
                            pointers.item(evt.pointerId).y = evt.clientY;

                            var distX = pointers.getItemByIndex(0).x - pointers.getItemByIndex(1).x;
                            var distY = pointers.getItemByIndex(0).y - pointers.getItemByIndex(1).y;
                            var pinchSquaredDistance = (distX * distX) + (distY * distY);
                            if (previousPinchDistance === 0) {
                                previousPinchDistance = pinchSquaredDistance;
                                return;
                            }

                            if (pinchSquaredDistance !== previousPinchDistance) {
                                this.inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) / (this.pinchPrecision * this.wheelPrecision * 1000);
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

                    this.inertialPanningX -= offsetX / this.panningSensibility;
                    this.inertialPanningZ -= offsetY / this.panningSensibility;

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
                    this.inertialRadiusOffset = 0;
                    this.inertialPanningX = 0;
                    this.inertialPanningZ = 0;
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

        public _checkInputs(): void {
            // Keyboard
            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    this.inertialPanningX += 0.01;
                } else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this.inertialPanningZ -= 0.01;
                } else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this.inertialPanningX -= 0.01;
                } else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this.inertialPanningZ += 0.01;
                }
            }

            // Radius Inertia
            if (this.inertialRadiusOffset !== 0) {
                this.radius -= this.inertialRadiusOffset;
                this.inertialRadiusOffset *= this.inertia;
                if (Math.abs(this.inertialRadiusOffset) < Engine.Epsilon)
                    this.inertialRadiusOffset = 0;
            }

            // Panning inertia
            if (this.inertialPanningX !== 0 || this.inertialPanningZ !== 0) {
                if (!this._localDirection) {
                    this._localDirection = Vector3.Zero();
                }

                this.inertialPanningX *= this.inertia;
                this.inertialPanningZ *= this.inertia;

                if (Math.abs(this.inertialPanningX) < Engine.Epsilon)
                    this.inertialPanningX = 0;
                if (Math.abs(this.inertialPanningZ) < Engine.Epsilon)
                    this.inertialPanningZ = 0;


                this._localDirection.copyFromFloats(this.inertialPanningX, 0, this.inertialPanningZ);
                this.target.addInPlace(this._localDirection);
            }

            // Limits
            this._checkLimits();

            super._checkInputs();
        }

        private _checkLimits() {
            if (this.beta > Math.PI) {
                this.beta = this.beta - (2 * Math.PI);
            }

            if (this.beta < 0) {
                this.beta = 0;
            }

            if (this.lowerRadiusLimit && this.radius < this.lowerRadiusLimit) {
                this.radius = this.lowerRadiusLimit;
            }
            if (this.upperRadiusLimit && this.radius > this.upperRadiusLimit) {
                this.radius = this.upperRadiusLimit;
            }
        }

        public setTarget(target: Vector3): void {
            this.target = target;
        }

        public _getViewMatrix(): Matrix {
            // Compute
            var cosb = Math.cos(this.beta);
            var sinb = Math.sin(this.beta);

            var target = this._getTargetPosition();
            target.subtractFromFloatsToRef(0, -this.radius * cosb, -this.radius * sinb, this.position);

            Matrix.LookAtLHToRef(this.position, target, this.upVector, this._viewMatrix);
            return this._viewMatrix;
        }
    }
}
