module BABYLON {
    var eventPrefix = Tools.GetPointerPrefix();

    export class ArcRotateCameraPointersInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;

        @serialize()
        public buttons = [0, 1, 2];

        @serialize()
        public angularSensibilityX = 1000.0;

        @serialize()
        public angularSensibilityY = 1000.0;

        @serialize()
        public pinchPrecision = 12.0;

        @serialize()
        public panningSensibility: number = 1000.0;

        @serialize()
        public multiTouchPanning: boolean = true;

        @serialize()
        public multiTouchPanAndZoom: boolean = true;

        private _isPanClick: boolean = false;
        public pinchInwards = true;

        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;
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
            var previousPinchSquaredDistance = 0;
            var initialDistance = 0;
            var twoFingerActivityCount = 0;
            var previousMultiTouchPanPosition: { x: number, y: number, isPaning: boolean, isPinching: boolean } = { x: 0, y:0, isPaning: false, isPinching: false };

            this._pointerInput = (p, s) => {
                var evt = <PointerEvent>p.event;

                if (engine.isInVRExclusivePointerMode) {
                    return;
                }

                if (p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }

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
                } 
                else if (p.type === PointerEventTypes.POINTERDOUBLETAP) {
                    this.camera.restoreState();
                }
                else if (p.type === PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error.
                    }

                    cacheSoloPointer = null;
                    previousPinchSquaredDistance = 0;
                    previousMultiTouchPanPosition.isPaning = false;
                    previousMultiTouchPanPosition.isPinching = false;
                    twoFingerActivityCount = 0;
                    initialDistance = 0;

                    //would be better to use pointers.remove(evt.pointerId) for multitouch gestures, 
                    //but emptying completly pointers collection is required to fix a bug on iPhone : 
                    //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers  
                    //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                    if (engine.badOS) {
                        pointA = pointB = undefined;
                    }
                    else {
                        //only remove the impacted pointer in case of multitouch allowing on most 
                        //platforms switching from rotate to zoom and pan seamlessly.
                        if (pointB && pointA && pointA.pointerId == evt.pointerId) {
                            pointA = pointB;
                            pointB = undefined;
                            cacheSoloPointer = { x: pointA.x, y: pointA.y, pointerId: pointA.pointerId, type: evt.pointerType };
                        }
                        else if (pointA && pointB && pointB.pointerId == evt.pointerId) {
                            pointB = undefined;
                            cacheSoloPointer = { x: pointA.x, y: pointA.y, pointerId: pointA.pointerId, type: evt.pointerType };
                        }
                        else {
                            pointA = pointB = undefined;
                        }
                    }

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
                            ((evt.ctrlKey && this.camera._useCtrlForPanning) || this._isPanClick)) {
                            this.camera.inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / this.panningSensibility;
                            this.camera.inertialPanningY += (evt.clientY - cacheSoloPointer.y) / this.panningSensibility;
                        } else {
                            var offsetX = evt.clientX - cacheSoloPointer.x;
                            var offsetY = evt.clientY - cacheSoloPointer.y;
                            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
                            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
                        }

                        cacheSoloPointer.x = evt.clientX;
                        cacheSoloPointer.y = evt.clientY;
                    }

                    // Two buttons down: pinch/pan
                    else if (pointA && pointB) {
                        //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be useful to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                        var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                        ed.x = evt.clientX;
                        ed.y = evt.clientY;
                        var direction = this.pinchInwards ? 1 : -1;
                        var distX = pointA.x - pointB.x;
                        var distY = pointA.y - pointB.y;
                        var pinchSquaredDistance = (distX * distX) + (distY * distY);
                        var pinchDistance = Math.sqrt(pinchSquaredDistance);

                        if (previousPinchSquaredDistance === 0) {
                            initialDistance = pinchDistance;
                            previousPinchSquaredDistance = pinchSquaredDistance;
                            previousMultiTouchPanPosition.x = (pointA.x + pointB.x) / 2;
                            previousMultiTouchPanPosition.y = (pointA.y + pointB.y) / 2;
                            return;
                        }

                        if (this.multiTouchPanAndZoom) {
                            this.camera
                                .inertialRadiusOffset += (pinchSquaredDistance - previousPinchSquaredDistance) /
                                (this.pinchPrecision *
                                    ((this.angularSensibilityX + this.angularSensibilityY) / 2) *
                                    direction);
                            
                            if (this.panningSensibility !== 0) {
                                var pointersCenterX = (pointA.x + pointB.x) / 2;
                                var pointersCenterY = (pointA.y + pointB.y) / 2;
                                var pointersCenterDistX = pointersCenterX - previousMultiTouchPanPosition.x;
                                var pointersCenterDistY = pointersCenterY - previousMultiTouchPanPosition.y;

                                previousMultiTouchPanPosition.x = pointersCenterX;
                                previousMultiTouchPanPosition.y = pointersCenterY;

                                this.camera.inertialPanningX += -(pointersCenterDistX) / (this.panningSensibility);
                                this.camera.inertialPanningY += (pointersCenterDistY) / (this.panningSensibility);
                            }
                        }
                        else {
                            twoFingerActivityCount++;

                            if (previousMultiTouchPanPosition.isPinching || (twoFingerActivityCount < 20 && Math.abs(pinchDistance - initialDistance) > this.camera.pinchToPanMaxDistance)) {                   
                                this.camera
                                .inertialRadiusOffset += (pinchSquaredDistance - previousPinchSquaredDistance) /
                                (this.pinchPrecision *
                                    ((this.angularSensibilityX + this.angularSensibilityY) / 2) *
                                    direction);
                                previousMultiTouchPanPosition.isPaning = false;
                                previousMultiTouchPanPosition.isPinching = true;
                            }
                            else {
                                if (cacheSoloPointer.pointerId === ed.pointerId && this.panningSensibility !== 0 && this.multiTouchPanning) {
                                    if (!previousMultiTouchPanPosition.isPaning) {
                                        previousMultiTouchPanPosition.isPaning = true;
                                        previousMultiTouchPanPosition.isPinching = false;
                                        previousMultiTouchPanPosition.x = ed.x;
                                        previousMultiTouchPanPosition.y = ed.y;
                                        return;
                                    }

                                    this.camera.inertialPanningX += -(ed.x - previousMultiTouchPanPosition.x) / (this.panningSensibility);
                                    this.camera.inertialPanningY += (ed.y - previousMultiTouchPanPosition.y) / (this.panningSensibility);
                                }
                            }

                            if (cacheSoloPointer.pointerId === evt.pointerId) {
                                previousMultiTouchPanPosition.x = ed.x;
                                previousMultiTouchPanPosition.y = ed.y;
                            }
                        }

                        previousPinchSquaredDistance = pinchSquaredDistance;
                    }
                }
            }

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE | PointerEventTypes._POINTERDOUBLETAP);

            this._onContextMenu = evt => {
                evt.preventDefault();
            };

            if (!this.camera._useCtrlForPanning) {
                element.addEventListener("contextmenu", this._onContextMenu, false);
            }

            this._onLostFocus = () => {
                //this._keys = [];
                pointA = pointB = undefined;
                previousPinchSquaredDistance = 0;
                previousMultiTouchPanPosition.isPaning = false;
                previousMultiTouchPanPosition.isPinching = false;
                twoFingerActivityCount = 0;
                cacheSoloPointer = null;
                initialDistance = 0;
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

            Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(element: HTMLElement) {
            Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);

            if (element && this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;

                element.removeEventListener("contextmenu", this._onContextMenu);
                element.removeEventListener("mousemove", this._onMouseMove);
                element.removeEventListener("MSPointerDown", this._onGestureStart);
                element.removeEventListener("MSGestureChange", this._onGesture);

                this._isPanClick = false;
                this.pinchInwards = true;

                this._onMouseMove = null;
                this._onGestureStart = null;
                this._onGesture = null;
                this._MSGestureHandler = null;
                this._onLostFocus = null;
                this._onContextMenu = null;
            }
        }

        getClassName(): string {
            return "ArcRotateCameraPointersInput";
        }

        getSimpleName() {
            return "pointers";
        }
    }

    CameraInputTypes["ArcRotateCameraPointersInput"] = ArcRotateCameraPointersInput;
}
