// Mainly based on these 2 articles : 
// Creating an universal virtual touch joystick working for all Touch models thanks to Hand.JS : http://blogs.msdn.com/b/davrous/archive/2013/02/22/creating-an-universal-virtual-touch-joystick-working-for-all-touch-models-thanks-to-hand-js.aspx
// & on Seb Lee-Delisle original work: http://seb.ly/2011/04/multi-touch-game-controller-in-javascripthtml5-for-ipad/ 

module BABYLON {
    export enum JoystickAxis {
        X,
        Y,
        Z
    }

    export class VirtualJoystick {
        public reverseLeftRight: boolean;
        public reverseUpDown: boolean;
        public deltaPosition: Vector3;
        public pressed: boolean;

        // Used to draw the virtual joystick inside a 2D canvas on top of the WebGL rendering canvas
        private static _globalJoystickIndex: number = 0;
        private static vjCanvas: HTMLCanvasElement;
        private static vjCanvasContext: CanvasRenderingContext2D;
        private static vjCanvasWidth: number;
        private static vjCanvasHeight: number;
        private static halfWidth: number;
        private static halfHeight: number;

        private _action: () => any;
        private _axisTargetedByLeftAndRight: JoystickAxis;
        private _axisTargetedByUpAndDown: JoystickAxis;
        private _joystickSensibility: number;
        private _inversedSensibility: number;
        private _rotationSpeed: number;
        private _inverseRotationSpeed: number;
        private _rotateOnAxisRelativeToMesh: boolean;
        private _joystickPointerID: number;
        private _joystickColor: string;
        private _joystickPointerPos: Vector2;
        private _joystickPreviousPointerPos: Vector2;
        private _joystickPointerStartPos: Vector2;
        private _deltaJoystickVector: Vector2;
        private _leftJoystick: boolean;
        private _joystickIndex: number;
        private _touches: StringDictionary<{ x: number, y: number, prevX: number, prevY: number } | PointerEvent>;

        private _onPointerDownHandlerRef: (e: PointerEvent) => any;
        private _onPointerMoveHandlerRef: (e: PointerEvent) => any;
        private _onPointerUpHandlerRef: (e: PointerEvent) => any;
        private _onPointerOutHandlerRef: (e: PointerEvent) => any;
        private _onResize: (e: any) => any;

        constructor(leftJoystick?: boolean) {
            if (leftJoystick) {
                this._leftJoystick = true;
            }
            else {
                this._leftJoystick = false;
            }

            this._joystickIndex = VirtualJoystick._globalJoystickIndex;
            VirtualJoystick._globalJoystickIndex++;

            // By default left & right arrow keys are moving the X
            // and up & down keys are moving the Y
            this._axisTargetedByLeftAndRight = JoystickAxis.X;
            this._axisTargetedByUpAndDown = JoystickAxis.Y;

            this.reverseLeftRight = false;
            this.reverseUpDown = false;

            // collections of pointers
            this._touches = new StringDictionary<{ x: number, y: number, prevX: number, prevY: number } | PointerEvent>();
            this.deltaPosition = Vector3.Zero();

            this._joystickSensibility = 25;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
            this._rotationSpeed = 25;
            this._inverseRotationSpeed = 1 / (this._rotationSpeed / 1000);
            this._rotateOnAxisRelativeToMesh = false;

            this._onResize = evt => {
                VirtualJoystick.vjCanvasWidth = window.innerWidth;
                VirtualJoystick.vjCanvasHeight = window.innerHeight;
                VirtualJoystick.vjCanvas.width = VirtualJoystick.vjCanvasWidth;
                VirtualJoystick.vjCanvas.height = VirtualJoystick.vjCanvasHeight;
                VirtualJoystick.halfWidth = VirtualJoystick.vjCanvasWidth / 2;
                VirtualJoystick.halfHeight = VirtualJoystick.vjCanvasHeight / 2;
            }

            // injecting a canvas element on top of the canvas 3D game
            if (!VirtualJoystick.vjCanvas) {
                window.addEventListener("resize", this._onResize, false);
                VirtualJoystick.vjCanvas = document.createElement("canvas");
                VirtualJoystick.vjCanvasWidth = window.innerWidth;
                VirtualJoystick.vjCanvasHeight = window.innerHeight;
                VirtualJoystick.vjCanvas.width = window.innerWidth;
                VirtualJoystick.vjCanvas.height = window.innerHeight;
                VirtualJoystick.vjCanvas.style.width = "100%";
                VirtualJoystick.vjCanvas.style.height = "100%";
                VirtualJoystick.vjCanvas.style.position = "absolute";
                VirtualJoystick.vjCanvas.style.backgroundColor = "transparent";
                VirtualJoystick.vjCanvas.style.top = "0px";
                VirtualJoystick.vjCanvas.style.left = "0px";
                VirtualJoystick.vjCanvas.style.zIndex = "5";
                VirtualJoystick.vjCanvas.style.msTouchAction = "none";
                // Support for jQuery PEP polyfill
                VirtualJoystick.vjCanvas.setAttribute("touch-action", "none");
                VirtualJoystick.vjCanvasContext = VirtualJoystick.vjCanvas.getContext('2d');
                VirtualJoystick.vjCanvasContext.strokeStyle = "#ffffff";
                VirtualJoystick.vjCanvasContext.lineWidth = 2;
                document.body.appendChild(VirtualJoystick.vjCanvas);
            }
            VirtualJoystick.halfWidth = VirtualJoystick.vjCanvas.width / 2;
            VirtualJoystick.halfHeight = VirtualJoystick.vjCanvas.height / 2;
            this.pressed = false;
            // default joystick color
            this._joystickColor = "cyan";

            this._joystickPointerID = -1;
            // current joystick position
            this._joystickPointerPos = new Vector2(0, 0);
            this._joystickPreviousPointerPos = new Vector2(0, 0);
            // origin joystick position
            this._joystickPointerStartPos = new Vector2(0, 0);
            this._deltaJoystickVector = new Vector2(0, 0);
            
            this._onPointerDownHandlerRef = evt => {
                this._onPointerDown(evt);
            }
            this._onPointerMoveHandlerRef = evt => {
                this._onPointerMove(evt);
            }
            this._onPointerOutHandlerRef = evt => {
                this._onPointerUp(evt);
            }
            this._onPointerUpHandlerRef = evt => {
                this._onPointerUp(evt);
            }

            VirtualJoystick.vjCanvas.addEventListener('pointerdown', this._onPointerDownHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener('pointermove', this._onPointerMoveHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener('pointerup', this._onPointerUpHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener('pointerout', this._onPointerUpHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener("contextmenu",(evt) => {
                evt.preventDefault();    // Disables system menu
            }, false);
            requestAnimationFrame(() => { this._drawVirtualJoystick(); });
        }

        public setJoystickSensibility(newJoystickSensibility: number) {
            this._joystickSensibility = newJoystickSensibility;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
        }

        private _onPointerDown(e: PointerEvent) {
            var positionOnScreenCondition: boolean;

            e.preventDefault();

            if (this._leftJoystick === true) {
                positionOnScreenCondition = (e.clientX < VirtualJoystick.halfWidth);
            }
            else {
                positionOnScreenCondition = (e.clientX > VirtualJoystick.halfWidth);
            }

            if (positionOnScreenCondition && this._joystickPointerID < 0) {
                // First contact will be dedicated to the virtual joystick
                this._joystickPointerID = e.pointerId;
                this._joystickPointerStartPos.x = e.clientX;
                this._joystickPointerStartPos.y = e.clientY;
                this._joystickPointerPos = this._joystickPointerStartPos.clone();
                this._joystickPreviousPointerPos = this._joystickPointerStartPos.clone();
                this._deltaJoystickVector.x = 0;
                this._deltaJoystickVector.y = 0;
                this.pressed = true;
                this._touches.add(e.pointerId.toString(), e);
            }
            else {
                // You can only trigger the action buttons with a joystick declared
                if (VirtualJoystick._globalJoystickIndex < 2 && this._action) {
                    this._action();
                    this._touches.add(e.pointerId.toString(), { x: e.clientX, y: e.clientY, prevX: e.clientX, prevY: e.clientY });
                }
            }
        }

        private _onPointerMove(e: PointerEvent) {
            // If the current pointer is the one associated to the joystick (first touch contact)
            if (this._joystickPointerID == e.pointerId) {
                this._joystickPointerPos.x = e.clientX;
                this._joystickPointerPos.y = e.clientY;
                this._deltaJoystickVector = this._joystickPointerPos.clone();
                this._deltaJoystickVector = this._deltaJoystickVector.subtract(this._joystickPointerStartPos);

                var directionLeftRight = this.reverseLeftRight ? -1 : 1;
                var deltaJoystickX = directionLeftRight * this._deltaJoystickVector.x / this._inversedSensibility;
                switch (this._axisTargetedByLeftAndRight) {
                    case JoystickAxis.X:
                        this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickX));
                        break;
                    case JoystickAxis.Y:
                        this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickX));
                        break;
                    case JoystickAxis.Z:
                        this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickX));
                        break;
                }
                var directionUpDown = this.reverseUpDown ? 1 : -1;
                var deltaJoystickY = directionUpDown * this._deltaJoystickVector.y / this._inversedSensibility;
                switch (this._axisTargetedByUpAndDown) {
                    case JoystickAxis.X:
                        this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickY));
                        break;
                    case JoystickAxis.Y:
                        this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickY));
                        break;
                    case JoystickAxis.Z:
                        this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickY));
                        break;
                }
            }
            else {
                let data = this._touches.get(e.pointerId.toString());
                if (data) {
                    (data as any).x = e.clientX;
                    (data as any).y = e.clientY;                     
                }
            }
        }

        private _onPointerUp(e: PointerEvent) {
            if (this._joystickPointerID == e.pointerId) {
                VirtualJoystick.vjCanvasContext.clearRect(this._joystickPointerStartPos.x - 63, this._joystickPointerStartPos.y - 63, 126, 126);
                VirtualJoystick.vjCanvasContext.clearRect(this._joystickPreviousPointerPos.x - 41, this._joystickPreviousPointerPos.y - 41, 82, 82);
                this._joystickPointerID = -1;
                this.pressed = false;
            }
            else {
                var touch = <{ x: number, y: number, prevX: number, prevY: number }>this._touches.get(e.pointerId.toString());
                if (touch) {
                    VirtualJoystick.vjCanvasContext.clearRect(touch.prevX - 43, touch.prevY - 43, 86, 86);
                }
            }
            this._deltaJoystickVector.x = 0;
            this._deltaJoystickVector.y = 0;

            this._touches.remove(e.pointerId.toString());
        }

        /**
        * Change the color of the virtual joystick
        * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
        */
        public setJoystickColor(newColor: string) {
            this._joystickColor = newColor;
        }

        public setActionOnTouch(action: () => any) {
            this._action = action;
        }

        // Define which axis you'd like to control for left & right 
        public setAxisForLeftRight(axis: JoystickAxis) {
            switch (axis) {
                case JoystickAxis.X:
                case JoystickAxis.Y:
                case JoystickAxis.Z:
                    this._axisTargetedByLeftAndRight = axis;
                    break;
                default:
                    this._axisTargetedByLeftAndRight = JoystickAxis.X;
                    break;
            }
        }

        // Define which axis you'd like to control for up & down 
        public setAxisForUpDown(axis: JoystickAxis) {
            switch (axis) {
                case JoystickAxis.X:
                case JoystickAxis.Y:
                case JoystickAxis.Z:
                    this._axisTargetedByUpAndDown = axis;
                    break;
                default:
                    this._axisTargetedByUpAndDown = JoystickAxis.Y;
                    break;
            }
        }

        private _clearCanvas(): void {
            if (this._leftJoystick) {
                VirtualJoystick.vjCanvasContext.clearRect(0, 0, VirtualJoystick.vjCanvasWidth / 2, VirtualJoystick.vjCanvasHeight);
            }
            else {
                VirtualJoystick.vjCanvasContext.clearRect(VirtualJoystick.vjCanvasWidth / 2, 0, VirtualJoystick.vjCanvasWidth, VirtualJoystick.vjCanvasHeight);
            }
        }

        private _drawVirtualJoystick() {
            if (this.pressed) {
                this._touches.forEach((touch: any) => {
                    if (touch.pointerId === this._joystickPointerID) {
                        VirtualJoystick.vjCanvasContext.clearRect(this._joystickPointerStartPos.x - 63, this._joystickPointerStartPos.y - 63, 126, 126);                       
                        VirtualJoystick.vjCanvasContext.clearRect(this._joystickPreviousPointerPos.x - 41, this._joystickPreviousPointerPos.y - 41, 82, 82);
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.lineWidth = 6;
                        VirtualJoystick.vjCanvasContext.strokeStyle = this._joystickColor;
                        VirtualJoystick.vjCanvasContext.arc(this._joystickPointerStartPos.x, this._joystickPointerStartPos.y, 40, 0, Math.PI * 2, true);
                        VirtualJoystick.vjCanvasContext.stroke();
                        VirtualJoystick.vjCanvasContext.closePath();
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.strokeStyle = this._joystickColor;
                        VirtualJoystick.vjCanvasContext.lineWidth = 2;
                        VirtualJoystick.vjCanvasContext.arc(this._joystickPointerStartPos.x, this._joystickPointerStartPos.y, 60, 0, Math.PI * 2, true);
                        VirtualJoystick.vjCanvasContext.stroke();
                        VirtualJoystick.vjCanvasContext.closePath();
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.strokeStyle = this._joystickColor;
                        VirtualJoystick.vjCanvasContext.arc(this._joystickPointerPos.x, this._joystickPointerPos.y, 40, 0, Math.PI * 2, true);
                        VirtualJoystick.vjCanvasContext.stroke();
                        VirtualJoystick.vjCanvasContext.closePath();
                        this._joystickPreviousPointerPos = this._joystickPointerPos.clone();
                    }
                    else {
                        VirtualJoystick.vjCanvasContext.clearRect(touch.prevX - 43, touch.prevY - 43, 86, 86);
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.fillStyle = "white";
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.strokeStyle = "red";
                        VirtualJoystick.vjCanvasContext.lineWidth = 6;
                        VirtualJoystick.vjCanvasContext.arc(touch.x, touch.y, 40, 0, Math.PI * 2, true);
                        VirtualJoystick.vjCanvasContext.stroke();
                        VirtualJoystick.vjCanvasContext.closePath();
                        touch.prevX = touch.x;
                        touch.prevY = touch.y;
                    };
                });
            }
            requestAnimationFrame(() => { this._drawVirtualJoystick(); });
        }

        public releaseCanvas() {
            if (VirtualJoystick.vjCanvas) {
                VirtualJoystick.vjCanvas.removeEventListener('pointerdown', this._onPointerDownHandlerRef);
                VirtualJoystick.vjCanvas.removeEventListener('pointermove', this._onPointerMoveHandlerRef);
                VirtualJoystick.vjCanvas.removeEventListener('pointerup', this._onPointerUpHandlerRef);
                VirtualJoystick.vjCanvas.removeEventListener('pointerout', this._onPointerUpHandlerRef);
                window.removeEventListener("resize", this._onResize);
                document.body.removeChild(VirtualJoystick.vjCanvas);
                VirtualJoystick.vjCanvas = null;
            }
        }
    }
}


