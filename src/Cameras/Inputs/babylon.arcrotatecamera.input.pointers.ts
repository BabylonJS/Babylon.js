module BABYLON {
    var eventPrefix = Tools.GetPointerPrefix();

    export class ArcRotateCameraPointersInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        attachedElement: HTMLElement;
        private _isRightClick: boolean = false;
        private _isCtrlPushed: boolean = false;
        public pinchInwards = true;
        
        @serialize()
        public angularSensibilityX = 1000.0;

        @serialize()
        public angularSensibilityY = 1000.0;

        @serialize()
        public pinchPrecision = 6.0;

        @serialize()
        public panningSensibility: number = 50.0;       

        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onPointerDown: (e: PointerEvent) => void;
        private _onPointerUp: (e: PointerEvent) => void;
        private _onPointerMove: (e: PointerEvent) => void;
        private _onMouseMove: (e: MouseEvent) => any;
        private _onGestureStart: (e: PointerEvent) => void;
        private _onGesture: (e: MSGestureEvent) => void;
        private _MSGestureHandler: MSGesture;
        private _onLostFocus: (e: FocusEvent) => any;
        private _onContextMenu: (e: PointerEvent) => void;
        
        public attachCamera(camera: ArcRotateCamera) {
            this.camera = camera;

        }

        public attachElement(element: HTMLElement, noPreventDefault?: boolean) {
            this.attachedElement = element;

            var engine = this.camera.getEngine();
            var cacheSoloPointer; // cache pointer object for better perf on camera rotation
            var pointers = new SmartCollection();
            var previousPinchDistance = 0;

            if (this._onPointerDown === undefined) {
                if (!this.camera._useCtrlForPanning) {
                    element.addEventListener("contextmenu", this._onContextMenu, false);
                }
                
                this._onLostFocus = () => {
                    //this._keys = [];
                    pointers.empty();
                    previousPinchDistance = 0;
                    cacheSoloPointer = null;
                };

                this._onKeyDown = evt => {
                    this._isCtrlPushed = evt.ctrlKey;
                };

                this._onKeyUp = evt => {
                    this._isCtrlPushed = evt.ctrlKey;
                };

                this._onPointerDown = evt => {
                    // Manage panning with right click
                    this._isRightClick = evt.button === 2;

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

                this._onContextMenu = evt => {
                    evt.preventDefault();
                };

                this._onPointerMove = evt => {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    switch (pointers.count) {

                        case 1: //normal camera rotation
                            if (this.panningSensibility !== 0 && ((this._isCtrlPushed && this.camera._useCtrlForPanning) || (!this.camera._useCtrlForPanning && this._isRightClick))) {
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
                            break;

                        case 2: //pinch
                            //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be usefull to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                            pointers.item(evt.pointerId).x = evt.clientX;
                            pointers.item(evt.pointerId).y = evt.clientY;
                            var direction = this.pinchInwards ? 1 : -1;
                            var distX = pointers.getItemByIndex(0).x - pointers.getItemByIndex(1).x;
                            var distY = pointers.getItemByIndex(0).y - pointers.getItemByIndex(1).y;
                            var pinchSquaredDistance = (distX * distX) + (distY * distY);
                            if (previousPinchDistance === 0) {
                                previousPinchDistance = pinchSquaredDistance;
                                return;
                            }

                            if (pinchSquaredDistance !== previousPinchDistance) {
                                this.camera.inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) / (this.pinchPrecision * ((this.angularSensibilityX + this.angularSensibilityY) / 2) * direction);
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
            }

            this.attachedElement.addEventListener(eventPrefix + "down", this._onPointerDown, false);
            this.attachedElement.addEventListener(eventPrefix + "up", this._onPointerUp, false);
            this.attachedElement.addEventListener(eventPrefix + "out", this._onPointerUp, false);
            this.attachedElement.addEventListener(eventPrefix + "move", this._onPointerMove, false);
            this.attachedElement.addEventListener("mousemove", this._onMouseMove, false);
            this.attachedElement.addEventListener("MSPointerDown", this._onGestureStart, false);
            this.attachedElement.addEventListener("MSGestureChange", this._onGesture, false);

            Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detach() {
            this._MSGestureHandler = null;

            this.attachedElement.removeEventListener("contextmenu", this._onContextMenu);
            this.attachedElement.removeEventListener(eventPrefix + "down", this._onPointerDown);
            this.attachedElement.removeEventListener(eventPrefix + "up", this._onPointerUp);
            this.attachedElement.removeEventListener(eventPrefix + "out", this._onPointerUp);
            this.attachedElement.removeEventListener(eventPrefix + "move", this._onPointerMove);
            this.attachedElement.removeEventListener("mousemove", this._onMouseMove);
            this.attachedElement.removeEventListener("MSPointerDown", this._onGestureStart);
            this.attachedElement.removeEventListener("MSGestureChange", this._onGesture);

            Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }        

        getTypeName(): string {
            return "arcrotate.pointers";
        }
    }
    
    CameraInputTypes["arcrotate.pointers"] = ArcRotateCameraPointersInput;
}