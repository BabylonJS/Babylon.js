"use strict";

var BABYLON = BABYLON || {};

(function () {
    var eventPrefix = BABYLON.Tools.GetPointerPrefix();

    BABYLON.ArcRotateCamera = function (name, alpha, beta, radius, target, scene) {
        BABYLON.Camera.call(this, name, BABYLON.Vector3.Zero(), scene);
        
        this.alpha = alpha;
        this.beta = beta;
        this.radius = radius;
        this.target = target;
        
        this._keys = [];
        this.keysUp = [38];
        this.keysDown = [40];
        this.keysLeft = [37];
        this.keysRight = [39];

        this._viewMatrix = new BABYLON.Matrix();

        this.getViewMatrix();
    };
    
    BABYLON.ArcRotateCamera.prototype = Object.create(BABYLON.Camera.prototype);

    // Members
    BABYLON.ArcRotateCamera.prototype.inertialAlphaOffset = 0;
    BABYLON.ArcRotateCamera.prototype.inertialBetaOffset = 0;
    BABYLON.ArcRotateCamera.prototype.lowerAlphaLimit = null;
    BABYLON.ArcRotateCamera.prototype.upperAlphaLimit = null;
    BABYLON.ArcRotateCamera.prototype.lowerBetaLimit = null;
    BABYLON.ArcRotateCamera.prototype.upperBetaLimit = null;
    BABYLON.ArcRotateCamera.prototype.lowerRadiusLimit = null;
    BABYLON.ArcRotateCamera.prototype.upperRadiusLimit = null;
    BABYLON.ArcRotateCamera.prototype.angularSensibility = 1000.0;

    // Methods
    BABYLON.ArcRotateCamera.prototype.attachControl = function(canvas, noPreventDefault) {
        var previousPosition;
        var that = this;
        var pointerId;
        
        if (this._attachedCanvas) {
            return;
        }
        this._attachedCanvas = canvas;

        var engine = this._scene.getEngine();

        if (this._onPointerDown === undefined) {
            this._onPointerDown = function(evt) {

                if (pointerId) {
                    return;
                }

                pointerId = evt.pointerId;

                previousPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._onPointerUp = function(evt) {
                previousPosition = null;
                pointerId = null;
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._onPointerMove = function(evt) {
                if (!previousPosition) {
                    return;
                }

                if (pointerId !== evt.pointerId) {
                    return;
                }

                var offsetX = evt.clientX - previousPosition.x;
                var offsetY = evt.clientY - previousPosition.y;

                that.inertialAlphaOffset -= offsetX / that.angularSensibility;
                that.inertialBetaOffset -= offsetY / that.angularSensibility;

                previousPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._onMouseMove = function(evt) {
                if (!engine.isPointerLock) {
                    return;
                }

                var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;

                that.inertialAlphaOffset -= offsetX / that.angularSensibility;
                that.inertialBetaOffset -= offsetY / that.angularSensibility;

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._wheel = function(event) {
                var delta = 0;
                if (event.wheelDelta) {
                    delta = event.wheelDelta / 120;
                } else if (event.detail) {
                    delta = -event.detail / 3;
                }

                if (delta)
                    that.radius -= delta;

                if (event.preventDefault) {
                    if (!noPreventDefault) {
                        event.preventDefault();
                    }
                }
            };

            this._onKeyDown = function(evt) {
                if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
                    that.keysDown.indexOf(evt.keyCode) !== -1 ||
                    that.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    that.keysRight.indexOf(evt.keyCode) !== -1) {
                    var index = that._keys.indexOf(evt.keyCode);

                    if (index === -1) {
                        that._keys.push(evt.keyCode);
                    }

                    if (evt.preventDefault) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            };

            this._onKeyUp = function(evt) {
                if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
                    that.keysDown.indexOf(evt.keyCode) !== -1 ||
                    that.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    that.keysRight.indexOf(evt.keyCode) !== -1) {
                    var index = that._keys.indexOf(evt.keyCode);

                    if (index >= 0) {
                        that._keys.splice(index, 1);
                    }

                    if (evt.preventDefault) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            };

            this._onLostFocus = function() {
                that._keys = [];
                pointerId = null;
            };

            this._onGestureStart = function(e) {
                if (!that._MSGestureHandler) {
                    that._MSGestureHandler = new MSGesture();
                    that._MSGestureHandler.target = canvas;
                }

                that._MSGestureHandler.addPointer(e.pointerId);
            };

            this._onGesture = function(e) {
                that.radius *= e.scale;

                if (e.preventDefault) {
                    if (!noPreventDefault) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }
            };

            this._reset = function() {
                that._keys = [];
                that.inertialAlphaOffset = 0;
                that.inertialBetaOffset = 0;
                previousPosition = null;
                pointerId = null;
            };
        }

        canvas.addEventListener(eventPrefix + "down", this._onPointerDown, false);
        canvas.addEventListener(eventPrefix + "up", this._onPointerUp, false);
        canvas.addEventListener(eventPrefix + "out", this._onPointerUp, false);
        canvas.addEventListener(eventPrefix + "move", this._onPointerMove, false);
        canvas.addEventListener("mousemove", this._onMouseMove, false);
        canvas.addEventListener("MSPointerDown", this._onGestureStart, false);
        canvas.addEventListener("MSGestureChange", this._onGesture, false);
        window.addEventListener("keydown", this._onKeyDown, false);
        window.addEventListener("keyup", this._onKeyUp, false);
        window.addEventListener('mousewheel', this._wheel, false);
        window.addEventListener("blur", this._onLostFocus, false);
    };
    
    BABYLON.ArcRotateCamera.prototype.detachControl = function (canvas) {
        if (this._attachedCanvas != canvas) {
            return;
        }

        canvas.removeEventListener(eventPrefix + "down", this._onPointerDown);
        canvas.removeEventListener(eventPrefix + "up", this._onPointerUp);
        canvas.removeEventListener(eventPrefix + "out", this._onPointerUp);
        canvas.removeEventListener(eventPrefix + "move", this._onPointerMove);
        canvas.removeEventListener("mousemove", this._onMouseMove);
        canvas.removeEventListener("MSPointerDown", this._onGestureStart);
        canvas.removeEventListener("MSGestureChange", this._onGesture);
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
        window.removeEventListener('mousewheel', this._wheel);
        window.removeEventListener("blur", this._onLostFocus);

        this._MSGestureHandler = null;
        this._attachedCanvas = null;

        if (this._reset) {
            this._reset();
        }
    };

    BABYLON.ArcRotateCamera.prototype._update = function () {
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
        if (this.inertialAlphaOffset != 0 || this.inertialBetaOffset != 0) {

            this.alpha += this.inertialAlphaOffset;
            this.beta += this.inertialBetaOffset;

            this.inertialAlphaOffset *= this.inertia;
            this.inertialBetaOffset *= this.inertia;

            if (Math.abs(this.inertialAlphaOffset) < BABYLON.Engine.epsilon)
                this.inertialAlphaOffset = 0;

            if (Math.abs(this.inertialBetaOffset) < BABYLON.Engine.epsilon)
                this.inertialBetaOffset = 0;
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
    };

    BABYLON.ArcRotateCamera.prototype.setPosition = function(position) {
        var radiusv3 = position.subtract(this.target.position ? this.target.position : this.target);
        this.radius = radiusv3.length();

        this.alpha = Math.atan(radiusv3.z / radiusv3.x);
        this.beta = Math.acos(radiusv3.y / this.radius);
    };

    BABYLON.ArcRotateCamera.prototype._getViewMatrix = function () {
        // Compute
        if (this.beta > Math.PI)
            this.beta = Math.PI;

        if (this.beta <= 0)
            this.beta = 0.01;

        var cosa = Math.cos(this.alpha);
        var sina = Math.sin(this.alpha);
        var cosb = Math.cos(this.beta);
        var sinb = Math.sin(this.beta);

        this.target.addToRef(new BABYLON.Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb), this.position);
        BABYLON.Matrix.LookAtLHToRef(this.position, this.target, this.upVector, this._viewMatrix);

        return this._viewMatrix;
    };
})();