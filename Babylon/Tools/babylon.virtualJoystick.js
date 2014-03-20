/// <reference path="../../babylon.js" />

// Mainly based on these 2 articles : 
// Creating an universal virtual touch joystick working for all Touch models thanks to Hand.JS : http://blogs.msdn.com/b/davrous/archive/2013/02/22/creating-an-universal-virtual-touch-joystick-working-for-all-touch-models-thanks-to-hand-js.aspx
// & on Seb Lee-Delisle original work: http://seb.ly/2011/04/multi-touch-game-controller-in-javascripthtml5-for-ipad/ 

"use strict";

// shim layer with setTimeout fallback
window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function (callback) {
              window.setTimeout(callback, 1000 / 60);
          };
})();

(function (BABYLON) {
    var VirtualJoystick = (function () {
        var vjCanvas, vjCanvasContext, vjCanvasWidth, vjCanvasHeight, halfWidth, halfHeight;
        var globalJoystickIndex = 0;

        function VirtualJoystick(leftJoystick) {
            if (leftJoystick) {
                this._leftJoystick = true;
            }
            else {
                this._leftJoystick = false;
            }

            this.joystickIndex = globalJoystickIndex;
            globalJoystickIndex++;

            // By default left & right arrow keys are moving the X
            // and up & down keys are moving the Y
            this._axisTargetedByLeftAndRight = "X";
            this._axisTargetedByUpAndDown = "Y";

            this.reverseLeftRight = false;
            this.reverseUpDown = false;

            // collections of pointers
            this._touches = new BABYLON.VirtualJoystick.Collection();
            this.deltaPosition = BABYLON.Vector3.Zero();

            this._joystickSensibility = 25;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
            this._rotationSpeed = 25;
            this._inverseRotationSpeed = 1 / (this._rotationSpeed / 1000);
            this._rotateOnAxisRelativeToMesh = false;

            var that = this;

            // injecting a canvas element on top of the canvas 3D game
            if (!vjCanvas) {
                window.addEventListener("resize", function () {
                    vjCanvasWidth = window.innerWidth;
                    vjCanvasHeight = window.innerHeight;
                    vjCanvas.width = vjCanvasWidth;
                    vjCanvas.height = vjCanvasHeight;
                    halfWidth = vjCanvasWidth / 2;
                    halfHeight = vjCanvasHeight / 2;
                }, false);
                vjCanvas = document.createElement("canvas");
                vjCanvasWidth = window.innerWidth;
                vjCanvasHeight = window.innerHeight;
                vjCanvas.width = window.innerWidth;
                vjCanvas.height = window.innerHeight;
                vjCanvas.style.width = "100%";
                vjCanvas.style.height = "100%";
                vjCanvas.style.position = "absolute";
                vjCanvas.style.backgroundColor = "transparent";
                vjCanvas.style.top = "0px";
                vjCanvas.style.left = "0px";
                vjCanvas.style.zIndex = 5;
                vjCanvas.style.msTouchAction = "none";
                vjCanvasContext = vjCanvas.getContext('2d');
                vjCanvasContext.strokeStyle = "#ffffff";
                vjCanvasContext.lineWidth = 2;
                document.body.appendChild(vjCanvas);
            }
            halfWidth = vjCanvas.width / 2;
            halfHeight = vjCanvas.height / 2;
            this.pressed = false;
            // default joystick color
            this._joystickColor = "cyan";

            this.joystickPointerID = -1;
            // current joystick position
            this.joystickPointerPos = new BABYLON.Vector2(0, 0);
            // origin joystick position
            this.joystickPointerStartPos = new BABYLON.Vector2(0, 0);
            this.deltaJoystickVector = new BABYLON.Vector2(0, 0);

            vjCanvas.addEventListener('pointerdown', function (evt) {
                that.onPointerDown(evt);
            }, false);
            vjCanvas.addEventListener('pointermove', function (evt) {
                that.onPointerMove(evt);
            }, false);
            vjCanvas.addEventListener('pointerup', function (evt) {
                that.onPointerUp(evt);
            }, false);
            vjCanvas.addEventListener('pointerout', function (evt) {
                that.onPointerUp(evt);
            }, false);
            vjCanvas.addEventListener("contextmenu", function (e) {
                e.preventDefault();    // Disables system menu
            }, false);
            requestAnimationFrame(function () {
                that.drawVirtualJoystick();
            });
        }

        VirtualJoystick.prototype.setJoystickSensibility = function (newJoystickSensibility) {
            this._joystickSensibility = newJoystickSensibility;
            this._inversedSensibility = 1 / (this._joystickSensibility / 1000);
        };

        VirtualJoystick.prototype.onPointerDown = function (e) {
            e.preventDefault();
            var newPointer = { identifier: e.pointerId, x: e.clientX, y: e.clientY, type: this.givePointerType(e) };
            var positionOnScreenCondition;
            if (this._leftJoystick === true) {
                positionOnScreenCondition = (e.clientX < halfWidth);
            }
            else {
                positionOnScreenCondition = (e.clientX > halfWidth);
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
                this._touches.add(e.pointerId, newPointer);
            }
            else {
                // You can only trigger the action buttons with a joystick declared
                if (globalJoystickIndex < 2 && this._action) {
                    this._action();
                    this._touches.add(e.pointerId, newPointer);
                }
            }
        };

        VirtualJoystick.prototype.onPointerMove = function (e) {
            // If the current pointer is the one associated to the joystick (first touch contact)
            if (this.joystickPointerID == e.pointerId) {
                this.joystickPointerPos.x = e.clientX;
                this.joystickPointerPos.y = e.clientY;
                this.deltaJoystickVector = this.joystickPointerPos.clone();
                this.deltaJoystickVector = this.deltaJoystickVector.subtract(this.joystickPointerStartPos);

                var directionLeftRight = this.reverseLeftRight ? -1 : 1;
                var deltaJoystickX = directionLeftRight * this.deltaJoystickVector.x / this._inversedSensibility;
                switch (this._axisTargetedByLeftAndRight) {
                    case "X":
                        this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickX));
                        break;
                    case "Y":
                        this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickX));
                        break;
                    case "Z":
                        this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickX));
                        break;
                }
                var directionUpDown = this.reverseUpDown ? 1 : -1;
                var deltaJoystickY = directionUpDown * this.deltaJoystickVector.y / this._inversedSensibility;
                switch (this._axisTargetedByUpAndDown) {
                    case "X":
                        this.deltaPosition.x = Math.min(1, Math.max(-1, deltaJoystickY));
                        break;
                    case "Y":
                        this.deltaPosition.y = Math.min(1, Math.max(-1, deltaJoystickY));
                        break;
                    case "Z":
                        this.deltaPosition.z = Math.min(1, Math.max(-1, deltaJoystickY));
                        break;
                }
            }
            else {
                if (this._touches.item(e.pointerId)) {
                    this._touches.item(e.pointerId).x = e.clientX;
                    this._touches.item(e.pointerId).y = e.clientY;
                }
            }
        };

        VirtualJoystick.prototype.onPointerUp = function (e) {
            if (this.joystickPointerID == e.pointerId) {
                this.joystickPointerID = -1;
                this.pressed = false;
            }
            this.deltaJoystickVector.x = 0;
            this.deltaJoystickVector.y = 0;

            this._touches.remove(e.pointerId);
        };

        VirtualJoystick.prototype.setJoystickColor = function (newColor) {
            this._joystickColor = newColor;
        };

        VirtualJoystick.prototype.setActionOnTouch = function (action) {
            this._action = action;
        };

        // Define which axis you'd like to control for left & right 
        VirtualJoystick.prototype.setAxisForLR = function (axisLetter) {
            switch (axisLetter) {
                case "X":
                case "Y":
                case "Z":
                    this._axisTargetedByLeftAndRight = axisLetter;
                    break;
                default:
                    this._axisTargetedByLeftAndRight = "X";
                    break;
            }
        };

        // Define which axis you'd like to control for up & down 
        VirtualJoystick.prototype.setAxisForUD = function (axisLetter) {
            switch (axisLetter) {
                case "X":
                case "Y":
                case "Z":
                    this._axisTargetedByUpAndDown = axisLetter;
                    break;
                default:
                    this._axisTargetedByUpAndDown = "Y";
                    break;
            }
        };

        VirtualJoystick.prototype.drawVirtualJoystick = function () {
            var that = this;

            if (that._leftJoystick) {
                vjCanvasContext.clearRect(0, 0, vjCanvasWidth / 2, vjCanvasHeight);
            }
            else {
                vjCanvasContext.clearRect(vjCanvasWidth / 2, 0, vjCanvasWidth, vjCanvasHeight);
            }
            this._touches.forEach(function (touch) {
                if (touch.identifier === that.joystickPointerID) {
                    vjCanvasContext.beginPath();
                    vjCanvasContext.strokeStyle = that._joystickColor;
                    vjCanvasContext.lineWidth = 6;
                    vjCanvasContext.arc(that.joystickPointerStartPos.x, that.joystickPointerStartPos.y, 40, 0, Math.PI * 2, true);
                    vjCanvasContext.stroke();
                    vjCanvasContext.beginPath();
                    vjCanvasContext.strokeStyle = that._joystickColor;
                    vjCanvasContext.lineWidth = 2;
                    vjCanvasContext.arc(that.joystickPointerStartPos.x, that.joystickPointerStartPos.y, 60, 0, Math.PI * 2, true);
                    vjCanvasContext.stroke();
                    vjCanvasContext.beginPath();
                    vjCanvasContext.strokeStyle = that._joystickColor;
                    vjCanvasContext.arc(that.joystickPointerPos.x, that.joystickPointerPos.y, 40, 0, Math.PI * 2, true);
                    vjCanvasContext.stroke();
                }
                else {
                    vjCanvasContext.beginPath();
                    vjCanvasContext.fillStyle = "white";
                    vjCanvasContext.beginPath();
                    vjCanvasContext.strokeStyle = "red";
                    vjCanvasContext.lineWidth = "6";
                    vjCanvasContext.arc(touch.x, touch.y, 40, 0, Math.PI * 2, true);
                    vjCanvasContext.stroke();
                };
            });
            requestAnimationFrame(function () {
                that.drawVirtualJoystick();
            });
        };

        VirtualJoystick.prototype.givePointerType = function (event) {
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
        };

        VirtualJoystick.prototype.releaseCanvas = function () {
            if (vjCanvas) {
                document.body.removeChild(vjCanvas);
                vjCanvas = null;
            };
        };

        return VirtualJoystick;
    })();
    BABYLON.VirtualJoystick = VirtualJoystick;

    var Collection = (function () {
        function Collection() {
            this.count = 0;
            this.collection = {};
        };
        Collection.prototype.add = function (key, item) {
            if (this.collection[key] != undefined) {
                return undefined;
            }
            this.collection[key] = item;
            return ++this.count;
        };
        Collection.prototype.remove = function (key) {
            if (this.collection[key] == undefined) {
                return undefined;
            }
            delete this.collection[key];
            return --this.count;
        };
        Collection.prototype.item = function (key) {
            return this.collection[key];
        };
        Collection.prototype.forEach = function (block) {
            var key;
            for (key in this.collection) {
                if (this.collection.hasOwnProperty(key)) {
                    block(this.collection[key]);
                }
            }
        };
        return Collection;
    })();
    BABYLON.VirtualJoystick.Collection = Collection;
})(BABYLON || (BABYLON = {}));