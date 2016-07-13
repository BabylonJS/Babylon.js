module BABYLON {
    var eventPrefix = Tools.GetPointerPrefix();

    export class ArcRotateCameraPointersInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;

        @serialize()
        public angularSensibilityX = 1000.0;

        @serialize()
        public angularSensibilityY = 1000.0;

        @serialize()
        public pinchPrecision = 6.0;

        @serialize()
        public panningSensibility: number = 50.0;

        private _isPanClick: boolean = false;
        private _isCtrlPushed: boolean = false;
        public pinchInwards = true;

        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onMouseMove: (e: MouseEvent) => any;
        private _onGestureStart: (e: PointerEvent) => void;
        private _onGesture: (e: MSGestureEvent) => void;
        private _MSGestureHandler: MSGesture;
        private _onLostFocus: (e: FocusEvent) => any;
        private _onContextMenu: (e: PointerEvent) => void;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            var engine = this.camera.getEngine();
            var cacheSoloPointer: { x: number, y: number, pointerId: number, type: any }; // cache pointer object for better perf on camera rotation
            var pointA: { x: number, y: number, pointerId: number, type: any }, pointB: { x: number, y: number, pointerId: number, type: any };
            var previousPinchDistance = 0;

            this._pointerInput = (p, s) => {
                var evt = <PointerEvent>p.event;
                if (p.type === PointerEventTypes.POINTERDOWN) {
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }


                    // Manage panning with pan button click
                    this._isPanClick = evt.button === this.camera._panningMouseButton;

                    // manage pointers
                    cacheSoloPointer = { x: evt.clientX, y: evt.clientY, pointerId: evt.pointerId, type: evt.pointerType };
                    if (pointA === undefined) {
                        pointA = cacheSoloPointer;
                    }
                    else if (pointB === undefined) {
                        pointB = cacheSoloPointer;
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element.focus();
                    }
                } else if (p.type === PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error.
                    }

                    cacheSoloPointer = null;
                    previousPinchDistance = 0;

                    //would be better to use pointers.remove(evt.pointerId) for multitouch gestures, 
                    //but emptying completly pointers collection is required to fix a bug on iPhone : 
                    //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers  
                    //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                    pointA = pointB = undefined;

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                } else if (p.type === PointerEventTypes.POINTERMOVE) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    // One button down
                    if (pointA && pointB === undefined) {
                        if (this.panningSensibility !== 0 &&
                            ((this._isCtrlPushed && this.camera._useCtrlForPanning) ||
                                (!this.camera._useCtrlForPanning && this._isPanClick))) {
                            this.camera
                                .inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / this.panningSensibility;
                            this.camera
                                .inertialPanningY += (evt.clientY - cacheSoloPointer.y) / this.panningSensibility;
                        } else {
                            var offsetX = evt.clientX - cacheSoloPointer.x;
                            var offsetY = evt.clientY - cacheSoloPointer.y;
                            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
                            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
                        }

                        console.log(this.camera.name);
                        console.log(this.camera.inertialAlphaOffset);

                        cacheSoloPointer.x = evt.clientX;
                        cacheSoloPointer.y = evt.clientY;
                    }

                    // Two buttons down: pinch
                    else if (pointA && pointB) {
                        //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be useful to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                        var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                        ed.x = evt.clientX;
                        ed.y = evt.clientY;
                        var direction = this.pinchInwards ? 1 : -1;
                        var distX = pointA.x - pointB.x;
                        var distY = pointA.y - pointB.y;
                        var pinchSquaredDistance = (distX * distX) + (distY * distY);
                        if (previousPinchDistance === 0) {
                            previousPinchDistance = pinchSquaredDistance;
                            return;
                        }

                        if (pinchSquaredDistance !== previousPinchDistance) {
                            this.camera
                                .inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) /
                                (this.pinchPrecision *
                                    ((this.angularSensibilityX + this.angularSensibilityY) / 2) *
                                    direction);
                            previousPinchDistance = pinchSquaredDistance;
                        }
                    }
                }
            }

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);

            this._onContextMenu = evt => {
                evt.preventDefault();
            };

            if (!this.camera._useCtrlForPanning) {
                element.addEventListener("contextmenu", this._onContextMenu, false);
            }

            this._onLostFocus = () => {
                //this._keys = [];
                pointA = pointB = undefined;
                previousPinchDistance = 0;
                cacheSoloPointer = null;
            };

            this._onKeyDown = evt => {
                this._isCtrlPushed = evt.ctrlKey;
            };

            this._onKeyUp = evt => {
                this._isCtrlPushed = evt.ctrlKey;
            };

            this._onMouseMove = evt => {
                if (!engine.isPointerLock) {
                    return;
                }

                var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;

                this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
                this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
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
                this.camera.radius *= e.scale;


                if (e.preventDefault) {
                    if (!noPreventDefault) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }
            };

            element.addEventListener("mousemove", this._onMouseMove, false);
            element.addEventListener("MSPointerDown", this._onGestureStart, false);
            element.addEventListener("MSGestureChange", this._onGesture, false);

            element.addEventListener("keydown", this._onKeyDown, false);
            element.addEventListener("keyup", this._onKeyUp, false);

            Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(element: HTMLElement) {
            if (element && this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;

                element.removeEventListener("contextmenu", this._onContextMenu);
                element.removeEventListener("mousemove", this._onMouseMove);
                element.removeEventListener("MSPointerDown", this._onGestureStart);
                element.removeEventListener("MSGestureChange", this._onGesture);

                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);

                this._isPanClick = false;
                this._isCtrlPushed = false;
                this.pinchInwards = true;

                this._onKeyDown = null;
                this._onKeyUp = null;
                this._onMouseMove = null;
                this._onGestureStart = null;
                this._onGesture = null;
                this._MSGestureHandler = null;
                this._onLostFocus = null;
                this._onContextMenu = null;
            }

            Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        getTypeName(): string {
            return "ArcRotateCameraPointersInput";
        }

        getSimpleName() {
            return "pointers";
        }
    }

    CameraInputTypes["ArcRotateCameraPointersInput"] = ArcRotateCameraPointersInput;
}
