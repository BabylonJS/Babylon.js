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
        private static _globalJoystickIndex: number = 0;
        private static vjCanvas: HTMLCanvasElement;
        private static vjCanvasContext: CanvasRenderingContext2D;
        private static vjCanvasWidth: number;
        private static vjCanvasHeight: number; 
        private static halfWidth: number; 
        private static halfHeight: number;

        private _leftJoystick: boolean;
        private joystickIndex: number;
        public reverseLeftRight: boolean;
        public reverseUpDown: boolean;
        private _touches: BABYLON.VirtualJoystick.Collection<any>;
        public deltaPosition: Vector3;
        private _axisTargetedByLeftAndRight: JoystickAxis;
        private _axisTargetedByUpAndDown: JoystickAxis; 
        private _joystickSensibility: number;
        private _inversedSensibility: number;
        private _rotationSpeed: number;
        private _inverseRotationSpeed: number;
        private _rotateOnAxisRelativeToMesh: boolean;
        private joystickPointerID: number;
        private _joystickColor: string;
        private joystickPointerPos: Vector2;
        private joystickPointerStartPos: Vector2;
        private deltaJoystickVector: Vector2;
        public pressed: boolean;
        private _action: () => any;

        constructor(leftJoystick?: boolean) {
            if (leftJoystick) {
                this._leftJoystick = true;
            }
            else {
                this._leftJoystick = false;
            }

            this.joystickIndex = VirtualJoystick._globalJoystickIndex;
            VirtualJoystick._globalJoystickIndex++;

            // By default left & right arrow keys are moving the X
            // and up & down keys are moving the Y
            this._axisTargetedByLeftAndRight = JoystickAxis.X;
            this._axisTargetedByUpAndDown = JoystickAxis.Y;

            this.reverseLeftRight = false;
            this.reverseUpDown = false;

            // collections of pointers
            this._touches = new BABYLON.VirtualJoystick.Collection<any>();
            this.deltaPosition = BABYLON.Vector3.Zero();

            this._joystickSensibility = 25;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
            this._rotationSpeed = 25;
            this._inverseRotationSpeed = 1 / (this._rotationSpeed / 1000);
            this._rotateOnAxisRelativeToMesh = false;

            // injecting a canvas element on top of the canvas 3D game
            if (!VirtualJoystick.vjCanvas) {
                window.addEventListener("resize", function () {
                    VirtualJoystick.vjCanvasWidth = window.innerWidth;
                    VirtualJoystick.vjCanvasHeight = window.innerHeight;
                    VirtualJoystick.vjCanvas.width = VirtualJoystick.vjCanvasWidth;
                    VirtualJoystick.vjCanvas.height = VirtualJoystick.vjCanvasHeight;
                    VirtualJoystick.halfWidth = VirtualJoystick.vjCanvasWidth / 2;
                    VirtualJoystick.halfHeight = VirtualJoystick.vjCanvasHeight / 2;
                }, false);
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

            this.joystickPointerID = -1;
            // current joystick position
            this.joystickPointerPos = new BABYLON.Vector2(0, 0);
            // origin joystick position
            this.joystickPointerStartPos = new BABYLON.Vector2(0, 0);
            this.deltaJoystickVector = new BABYLON.Vector2(0, 0);

            VirtualJoystick.vjCanvas.addEventListener('pointerdown', (evt) => {
                this.onPointerDown(evt);
            }, false);
            VirtualJoystick.vjCanvas.addEventListener('pointermove', (evt) => {
                this.onPointerMove(evt);
            }, false);
            VirtualJoystick.vjCanvas.addEventListener('pointerup',  (evt) => {
                this.onPointerUp(evt);
            }, false);
            VirtualJoystick.vjCanvas.addEventListener('pointerout', (evt) => {
                this.onPointerUp(evt);
            }, false);
            VirtualJoystick.vjCanvas.addEventListener("contextmenu", (evt) => {
                evt.preventDefault();    // Disables system menu
            }, false);
            requestAnimationFrame(() => { this.drawVirtualJoystick(); });
        }

        public setJoystickSensibility (newJoystickSensibility: number) {
            this._joystickSensibility = newJoystickSensibility;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
        }

        private onPointerDown (e: PointerEvent) {
            e.preventDefault();
            var newPointer = { identifier: e.pointerId, x: e.clientX, y: e.clientY, type: this.givePointerType(e) };
            var positionOnScreenCondition: boolean;
            if (this._leftJoystick === true) {
                positionOnScreenCondition = (e.clientX < VirtualJoystick.halfWidth);
            }
            else {
                positionOnScreenCondition = (e.clientX > VirtualJoystick.halfWidth);
            }

            if (positionOnScreenCondition && this.joystickPointerID < 0) {
                // First contact will be dedicated to the virtual joystick
                this.joystickPointerID = e.pointerId;
                this.joystickPointerStartPos.x = e.clientX;
                this.joystickPointerStartPos.y = e.clientY;
                this.joystickPointerPos = this.joystickPointerStartPos.clone();
                this.deltaJoystickVector.x = 0;
                this.deltaJoystickVector.y = 0;
                this.pressed = true;
                this._touches.add(e.pointerId.toString(), newPointer);
            }
            else {
                // You can only trigger the action buttons with a joystick declared
                if (VirtualJoystick._globalJoystickIndex < 2 && this._action) {
                    this._action();
                    this._touches.add(e.pointerId.toString(), newPointer);
                }
            }
        }

        private onPointerMove (e: PointerEvent) {
            // If the current pointer is the one associated to the joystick (first touch contact)
            if (this.joystickPointerID == e.pointerId) {
                this.joystickPointerPos.x = e.clientX;
                this.joystickPointerPos.y = e.clientY;
                this.deltaJoystickVector = this.joystickPointerPos.clone();
                this.deltaJoystickVector = this.deltaJoystickVector.subtract(this.joystickPointerStartPos);

                var directionLeftRight = this.reverseLeftRight ? -1 : 1;
                var deltaJoystickX = directionLeftRight * this.deltaJoystickVector.x / this._inversedSensibility;
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
                var deltaJoystickY = directionUpDown * this.deltaJoystickVector.y / this._inversedSensibility;
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
                if (this._touches.item(e.pointerId.toString())) {
                    this._touches.item(e.pointerId.toString()).x = e.clientX;
                    this._touches.item(e.pointerId.toString()).y = e.clientY;
                }
            }
        }

       private onPointerUp (e: PointerEvent) {
            if (this.joystickPointerID == e.pointerId) {
                this.joystickPointerID = -1;
                this.pressed = false;
            }
            this.deltaJoystickVector.x = 0;
            this.deltaJoystickVector.y = 0;

           this._touches.remove(e.pointerId.toString());
        }

        public setJoystickColor (newColor: string) {
            this._joystickColor = newColor;
        }

        public setActionOnTouch (action: () => any) {
            this._action = action;
        }

        // Define which axis you'd like to control for left & right 
        public setAxisForLR(axis: JoystickAxis) {
            switch (axis) {
                case JoystickAxis.X:
                case JoystickAxis.Y:
                case JoystickAxis.Z:
                    this._axisTargetedByLeftAndRight = axis;
                    break;
                    this._axisTargetedByLeftAndRight = axis;
                    break;
                default:
                    this._axisTargetedByLeftAndRight = JoystickAxis.X;
                    break;
            }
        }

        // Define which axis you'd like to control for up & down 
        public setAxisForUD(axis: JoystickAxis) {
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

        private drawVirtualJoystick () {
            if (this._leftJoystick) {
                VirtualJoystick.vjCanvasContext.clearRect(0, 0, VirtualJoystick.vjCanvasWidth / 2, VirtualJoystick.vjCanvasHeight);
            }
            else {
                VirtualJoystick.vjCanvasContext.clearRect(VirtualJoystick.vjCanvasWidth / 2, 0, VirtualJoystick.vjCanvasWidth, VirtualJoystick.vjCanvasHeight);
            }
            this._touches.forEach((touch) => {
                if (touch.identifier === this.joystickPointerID) {
                    VirtualJoystick.vjCanvasContext.beginPath();
                    VirtualJoystick.vjCanvasContext.strokeStyle = this._joystickColor;
                    VirtualJoystick.vjCanvasContext.lineWidth = 6;
                    VirtualJoystick.vjCanvasContext.arc(this.joystickPointerStartPos.x, this.joystickPointerStartPos.y, 40, 0, Math.PI * 2, true);
                    VirtualJoystick.vjCanvasContext.stroke();
                    VirtualJoystick.vjCanvasContext.beginPath();
                    VirtualJoystick.vjCanvasContext.strokeStyle = this._joystickColor;
                    VirtualJoystick.vjCanvasContext.lineWidth = 2;
                    VirtualJoystick.vjCanvasContext.arc(this.joystickPointerStartPos.x, this.joystickPointerStartPos.y, 60, 0, Math.PI * 2, true);
                    VirtualJoystick.vjCanvasContext.stroke();
                    VirtualJoystick.vjCanvasContext.beginPath();
                    VirtualJoystick.vjCanvasContext.strokeStyle = this._joystickColor;
                    VirtualJoystick.vjCanvasContext.arc(this.joystickPointerPos.x, this.joystickPointerPos.y, 40, 0, Math.PI * 2, true);
                    VirtualJoystick.vjCanvasContext.stroke();
                }
                else {
                    VirtualJoystick.vjCanvasContext.beginPath();
                    VirtualJoystick.vjCanvasContext.fillStyle = "white";
                    VirtualJoystick.vjCanvasContext.beginPath();
                    VirtualJoystick.vjCanvasContext.strokeStyle = "red";
                    VirtualJoystick.vjCanvasContext.lineWidth = 6;
                    VirtualJoystick.vjCanvasContext.arc(touch.x, touch.y, 40, 0, Math.PI * 2, true);
                    VirtualJoystick.vjCanvasContext.stroke();
                };
            });
            requestAnimationFrame(() => { this.drawVirtualJoystick(); });
        }

        private givePointerType (event) {
            switch (event.pointerType) {
                case event.POINTER_TYPE_MOUSE:
                    return "MOUSE";
                    break;
                case event.POINTER_TYPE_PEN:
                    return "PEN";
                    break;
                case event.POINTER_TYPE_TOUCH:
                    return "TOUCH";
                    break;
            }
        }

        public releaseCanvas () {
            if (VirtualJoystick.vjCanvas) {
                document.body.removeChild(VirtualJoystick.vjCanvas);
                VirtualJoystick.vjCanvas = null;
            }
        }
    }
}

module BABYLON.VirtualJoystick {
    export class Collection<T> {
        private count: number;
        private collection: Array<T>;

        constructor() {
            this.count = 0;
            this.collection = new Array<T>();
        }

        public add<T>(key: string, item: T): number {
            if (this.collection[key] != undefined) {
                return undefined;
            }
            this.collection[key] = item;
            return ++this.count;
        }

        public remove(key: string): number {
            if (this.collection[key] == undefined) {
                return undefined;
            }
            delete this.collection[key];
            return --this.count;
        }

        public item(key: string) {
            return this.collection[key];
        }

        public forEach<T>(block: (T) => any) {
            var key: string;
            for (key in this.collection) {
                if (this.collection.hasOwnProperty(key)) {
                    block(this.collection[key]);
                }
            }
        }
    }
}



