// Mainly based on these 2 articles : 
// Creating an universal virtual touch joystick working for all Touch models thanks to Hand.JS : http://blogs.msdn.com/b/davrous/archive/2013/02/22/creating-an-universal-virtual-touch-joystick-working-for-all-touch-models-thanks-to-hand-js.aspx
// & on Seb Lee-Delisle original work: http://seb.ly/2011/04/multi-touch-game-controller-in-javascripthtml5-for-ipad/ 
var BABYLON;
(function (BABYLON) {
    (function (JoystickAxis) {
        JoystickAxis[JoystickAxis["X"] = 0] = "X";
        JoystickAxis[JoystickAxis["Y"] = 1] = "Y";
        JoystickAxis[JoystickAxis["Z"] = 2] = "Z";
    })(BABYLON.JoystickAxis || (BABYLON.JoystickAxis = {}));
    var JoystickAxis = BABYLON.JoystickAxis;
    var VirtualJoystick = (function () {
        function VirtualJoystick(leftJoystick) {
            var _this = this;
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
            this._touches = new BABYLON.SmartCollection();
            this.deltaPosition = BABYLON.Vector3.Zero();
            this._joystickSensibility = 25;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
            this._rotationSpeed = 25;
            this._inverseRotationSpeed = 1 / (this._rotationSpeed / 1000);
            this._rotateOnAxisRelativeToMesh = false;
            this._onResize = function (evt) {
                VirtualJoystick.vjCanvasWidth = window.innerWidth;
                VirtualJoystick.vjCanvasHeight = window.innerHeight;
                VirtualJoystick.vjCanvas.width = VirtualJoystick.vjCanvasWidth;
                VirtualJoystick.vjCanvas.height = VirtualJoystick.vjCanvasHeight;
                VirtualJoystick.halfWidth = VirtualJoystick.vjCanvasWidth / 2;
                VirtualJoystick.halfHeight = VirtualJoystick.vjCanvasHeight / 2;
            };
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
            this._joystickPointerPos = new BABYLON.Vector2(0, 0);
            this._joystickPreviousPointerPos = new BABYLON.Vector2(0, 0);
            // origin joystick position
            this._joystickPointerStartPos = new BABYLON.Vector2(0, 0);
            this._deltaJoystickVector = new BABYLON.Vector2(0, 0);
            this._onPointerDownHandlerRef = function (evt) {
                _this._onPointerDown(evt);
            };
            this._onPointerMoveHandlerRef = function (evt) {
                _this._onPointerMove(evt);
            };
            this._onPointerOutHandlerRef = function (evt) {
                _this._onPointerUp(evt);
            };
            this._onPointerUpHandlerRef = function (evt) {
                _this._onPointerUp(evt);
            };
            VirtualJoystick.vjCanvas.addEventListener('pointerdown', this._onPointerDownHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener('pointermove', this._onPointerMoveHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener('pointerup', this._onPointerUpHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener('pointerout', this._onPointerUpHandlerRef, false);
            VirtualJoystick.vjCanvas.addEventListener("contextmenu", function (evt) {
                evt.preventDefault(); // Disables system menu
            }, false);
            requestAnimationFrame(function () { _this._drawVirtualJoystick(); });
        }
        VirtualJoystick.prototype.setJoystickSensibility = function (newJoystickSensibility) {
            this._joystickSensibility = newJoystickSensibility;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
        };
        VirtualJoystick.prototype._onPointerDown = function (e) {
            var positionOnScreenCondition;
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
        };
        VirtualJoystick.prototype._onPointerMove = function (e) {
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
                if (this._touches.item(e.pointerId.toString())) {
                    this._touches.item(e.pointerId.toString()).x = e.clientX;
                    this._touches.item(e.pointerId.toString()).y = e.clientY;
                }
            }
        };
        VirtualJoystick.prototype._onPointerUp = function (e) {
            if (this._joystickPointerID == e.pointerId) {
                VirtualJoystick.vjCanvasContext.clearRect(this._joystickPointerStartPos.x - 63, this._joystickPointerStartPos.y - 63, 126, 126);
                VirtualJoystick.vjCanvasContext.clearRect(this._joystickPreviousPointerPos.x - 41, this._joystickPreviousPointerPos.y - 41, 82, 82);
                this._joystickPointerID = -1;
                this.pressed = false;
            }
            else {
                var touch = this._touches.item(e.pointerId.toString());
                if (touch) {
                    VirtualJoystick.vjCanvasContext.clearRect(touch.prevX - 43, touch.prevY - 43, 86, 86);
                }
            }
            this._deltaJoystickVector.x = 0;
            this._deltaJoystickVector.y = 0;
            this._touches.remove(e.pointerId.toString());
        };
        /**
        * Change the color of the virtual joystick
        * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
        */
        VirtualJoystick.prototype.setJoystickColor = function (newColor) {
            this._joystickColor = newColor;
        };
        VirtualJoystick.prototype.setActionOnTouch = function (action) {
            this._action = action;
        };
        // Define which axis you'd like to control for left & right 
        VirtualJoystick.prototype.setAxisForLeftRight = function (axis) {
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
        };
        // Define which axis you'd like to control for up & down 
        VirtualJoystick.prototype.setAxisForUpDown = function (axis) {
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
        };
        VirtualJoystick.prototype._clearCanvas = function () {
            if (this._leftJoystick) {
                VirtualJoystick.vjCanvasContext.clearRect(0, 0, VirtualJoystick.vjCanvasWidth / 2, VirtualJoystick.vjCanvasHeight);
            }
            else {
                VirtualJoystick.vjCanvasContext.clearRect(VirtualJoystick.vjCanvasWidth / 2, 0, VirtualJoystick.vjCanvasWidth, VirtualJoystick.vjCanvasHeight);
            }
        };
        VirtualJoystick.prototype._drawVirtualJoystick = function () {
            var _this = this;
            if (this.pressed) {
                this._touches.forEach(function (touch) {
                    if (touch.pointerId === _this._joystickPointerID) {
                        VirtualJoystick.vjCanvasContext.clearRect(_this._joystickPointerStartPos.x - 63, _this._joystickPointerStartPos.y - 63, 126, 126);
                        VirtualJoystick.vjCanvasContext.clearRect(_this._joystickPreviousPointerPos.x - 41, _this._joystickPreviousPointerPos.y - 41, 82, 82);
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.lineWidth = 6;
                        VirtualJoystick.vjCanvasContext.strokeStyle = _this._joystickColor;
                        VirtualJoystick.vjCanvasContext.arc(_this._joystickPointerStartPos.x, _this._joystickPointerStartPos.y, 40, 0, Math.PI * 2, true);
                        VirtualJoystick.vjCanvasContext.stroke();
                        VirtualJoystick.vjCanvasContext.closePath();
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.strokeStyle = _this._joystickColor;
                        VirtualJoystick.vjCanvasContext.lineWidth = 2;
                        VirtualJoystick.vjCanvasContext.arc(_this._joystickPointerStartPos.x, _this._joystickPointerStartPos.y, 60, 0, Math.PI * 2, true);
                        VirtualJoystick.vjCanvasContext.stroke();
                        VirtualJoystick.vjCanvasContext.closePath();
                        VirtualJoystick.vjCanvasContext.beginPath();
                        VirtualJoystick.vjCanvasContext.strokeStyle = _this._joystickColor;
                        VirtualJoystick.vjCanvasContext.arc(_this._joystickPointerPos.x, _this._joystickPointerPos.y, 40, 0, Math.PI * 2, true);
                        VirtualJoystick.vjCanvasContext.stroke();
                        VirtualJoystick.vjCanvasContext.closePath();
                        _this._joystickPreviousPointerPos = _this._joystickPointerPos.clone();
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
                    }
                    ;
                });
            }
            requestAnimationFrame(function () { _this._drawVirtualJoystick(); });
        };
        VirtualJoystick.prototype.releaseCanvas = function () {
            if (VirtualJoystick.vjCanvas) {
                VirtualJoystick.vjCanvas.removeEventListener('pointerdown', this._onPointerDownHandlerRef);
                VirtualJoystick.vjCanvas.removeEventListener('pointermove', this._onPointerMoveHandlerRef);
                VirtualJoystick.vjCanvas.removeEventListener('pointerup', this._onPointerUpHandlerRef);
                VirtualJoystick.vjCanvas.removeEventListener('pointerout', this._onPointerUpHandlerRef);
                window.removeEventListener("resize", this._onResize);
                document.body.removeChild(VirtualJoystick.vjCanvas);
                VirtualJoystick.vjCanvas = null;
            }
        };
        // Used to draw the virtual joystick inside a 2D canvas on top of the WebGL rendering canvas
        VirtualJoystick._globalJoystickIndex = 0;
        return VirtualJoystick;
    })();
    BABYLON.VirtualJoystick = VirtualJoystick;
})(BABYLON || (BABYLON = {}));
