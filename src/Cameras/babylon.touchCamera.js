var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var TouchCamera = (function (_super) {
        __extends(TouchCamera, _super);
        //         private _offsetX: number = null;
        //         private _offsetY: number = null;
        //         private _pointerCount:number = 0;
        //         private _pointerPressed = [];
        //         private _attachedCanvas: HTMLCanvasElement;
        //         private _onPointerDown: (e: PointerEvent) => any;
        //         private _onPointerUp: (e: PointerEvent) => any;
        //         private _onPointerMove: (e: PointerEvent) => any;
        // 
        //         @serialize()
        //         public touchAngularSensibility: number = 200000.0;
        // 
        //         @serialize()
        //         public touchMoveSensibility: number = 250.0;
        function TouchCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addTouch();
        }
        // public _onLostFocus(e: FocusEvent): void {
        //     this._offsetX = null;
        //     this._offsetY = null;
        //     super._onLostFocus(e);
        // }
        //         public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void {
        //             var previousPosition;
        // 
        //             if (this._attachedCanvas) {
        //                 return;
        //             }
        // 
        //             if (this._onPointerDown === undefined) {
        // 
        //                 this._onPointerDown = (evt) => {
        // 
        //                     if (evt.pointerType === "mouse") {
        //                         return;
        //                     }
        // 
        //                     if (!noPreventDefault) {
        //                         evt.preventDefault();
        //                     }
        // 
        //                     this._pointerPressed.push(evt.pointerId);
        // 
        //                     if (this._pointerPressed.length !== 1) {
        //                         return;
        //                     }
        // 
        //                     previousPosition = {
        //                         x: evt.clientX,
        //                         y: evt.clientY
        //                     };
        //                 };
        // 
        //                 this._onPointerUp = (evt) => {
        // 
        //                     if (evt.pointerType === "mouse") {
        //                         return;
        //                     }
        // 
        //                     if (!noPreventDefault) {
        //                         evt.preventDefault();
        //                     }
        // 
        //                     var index: number = this._pointerPressed.indexOf(evt.pointerId);
        // 
        //                     if (index === -1) {
        //                         return;
        //                     }
        //                     this._pointerPressed.splice(index, 1);
        // 
        //                     if (index != 0) {
        //                         return;
        //                     }
        //                     previousPosition = null;
        //                     this._offsetX = null;
        //                     this._offsetY = null;
        //                 };
        // 
        //                 this._onPointerMove = (evt) => {
        // 
        //                     if (evt.pointerType === "mouse") {
        //                         return;
        //                     }
        // 
        //                     if (!noPreventDefault) {
        //                         evt.preventDefault();
        //                     }
        // 
        //                     if (!previousPosition) {
        //                         return;
        //                     }
        // 
        //                     var index: number = this._pointerPressed.indexOf(evt.pointerId);
        // 
        //                     if (index != 0) {
        //                         return;
        //                     }
        // 
        //                     this._offsetX = evt.clientX - previousPosition.x;
        //                     this._offsetY = -(evt.clientY - previousPosition.y);
        //                 };
        // 
        //                 
        //             }
        // 
        //             canvas.addEventListener("pointerdown", this._onPointerDown);
        //             canvas.addEventListener("pointerup", this._onPointerUp);
        //             canvas.addEventListener("pointerout", this._onPointerUp);
        //             canvas.addEventListener("pointermove", this._onPointerMove);
        // 
        //             super.attachControl(canvas);
        //         }
        // 
        //         public detachControl(canvas: HTMLCanvasElement): void {
        //             if (this._attachedCanvas !== canvas) {
        //                 return;
        //             }
        // 
        //             canvas.removeEventListener("pointerdown", this._onPointerDown);
        //             canvas.removeEventListener("pointerup", this._onPointerUp);
        //             canvas.removeEventListener("pointerout", this._onPointerUp);
        //             canvas.removeEventListener("pointermove", this._onPointerMove);
        //             
        //             super.detachControl(canvas);
        //         }
        // 
        //         public _checkInputs(): void {
        //             if (this._offsetX) {
        // 
        //                 this.cameraRotation.y += this._offsetX / this.touchAngularSensibility;
        // 
        //                 if (this._pointerPressed.length > 1) {
        //                     this.cameraRotation.x += -this._offsetY / this.touchAngularSensibility;
        //                 } else {
        //                     var speed = this._computeLocalCameraSpeed();
        //                     var direction = new Vector3(0, 0, speed * this._offsetY / this.touchMoveSensibility);
        // 
        //                     Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
        //                     this.cameraDirection.addInPlace(Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
        //                 }
        //             }
        // 
        //             super._checkInputs();
        //         }
        TouchCamera.prototype.getTypeName = function () {
            return "TouchCamera";
        };
        return TouchCamera;
    }(BABYLON.FreeCamera));
    BABYLON.TouchCamera = TouchCamera;
})(BABYLON || (BABYLON = {}));
