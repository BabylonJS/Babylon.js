var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var Gamepads = (function () {
        function Gamepads(ongamedpadconnected) {
            var _this = this;
            this.babylonGamepads = [];
            this.oneGamepadConnected = false;
            this.isMonitoring = false;
            this.gamepadEventSupported = 'GamepadEvent' in window;
            this.gamepadSupportAvailable = (navigator.getGamepads ||
                !!navigator.webkitGetGamepads || !!navigator.msGetGamepads || !!navigator.webkitGamepads);
            this._callbackGamepadConnected = ongamedpadconnected;
            if (this.gamepadSupportAvailable) {
                // Checking if the gamepad connected event is supported (like in Firefox)
                if (this.gamepadEventSupported) {
                    this._onGamepadConnectedEvent = function (evt) {
                        _this._onGamepadConnected(evt);
                    };
                    this._onGamepadDisonnectedEvent = function (evt) {
                        _this._onGamepadDisconnected(evt);
                    };
                    window.addEventListener('gamepadconnected', this._onGamepadConnectedEvent, false);
                    window.addEventListener('gamepaddisconnected', this._onGamepadDisonnectedEvent, false);
                }
                else {
                    this._startMonitoringGamepads();
                }
            }
        }
        Gamepads.prototype.dispose = function () {
            if (Gamepads.gamepadDOMInfo) {
                document.body.removeChild(Gamepads.gamepadDOMInfo);
            }
            if (this._onGamepadConnectedEvent) {
                window.removeEventListener('gamepadconnected', this._onGamepadConnectedEvent, false);
                window.removeEventListener('gamepaddisconnected', this._onGamepadDisonnectedEvent, false);
                this._onGamepadConnectedEvent = null;
                this._onGamepadDisonnectedEvent = null;
            }
        };
        Gamepads.prototype._onGamepadConnected = function (evt) {
            var newGamepad = this._addNewGamepad(evt.gamepad);
            if (this._callbackGamepadConnected)
                this._callbackGamepadConnected(newGamepad);
            this._startMonitoringGamepads();
        };
        Gamepads.prototype._addNewGamepad = function (gamepad) {
            if (!this.oneGamepadConnected) {
                this.oneGamepadConnected = true;
                if (Gamepads.gamepadDOMInfo) {
                    document.body.removeChild(Gamepads.gamepadDOMInfo);
                    Gamepads.gamepadDOMInfo = null;
                }
            }
            var newGamepad;
            if (gamepad.id.search("Xbox 360") !== -1 || gamepad.id.search("xinput") !== -1) {
                newGamepad = new Xbox360Pad(gamepad.id, gamepad.index, gamepad);
            }
            else {
                newGamepad = new GenericPad(gamepad.id, gamepad.index, gamepad);
            }
            this.babylonGamepads.push(newGamepad);
            return newGamepad;
        };
        Gamepads.prototype._onGamepadDisconnected = function (evt) {
            // Remove the gamepad from the list of gamepads to monitor.
            for (var i in this.babylonGamepads) {
                if (this.babylonGamepads[i].index == evt.gamepad.index) {
                    this.babylonGamepads.splice(+i, 1);
                    break;
                }
            }
            // If no gamepads are left, stop the polling loop.
            if (this.babylonGamepads.length == 0) {
                this._stopMonitoringGamepads();
            }
        };
        Gamepads.prototype._startMonitoringGamepads = function () {
            if (!this.isMonitoring) {
                this.isMonitoring = true;
                this._checkGamepadsStatus();
            }
        };
        Gamepads.prototype._stopMonitoringGamepads = function () {
            this.isMonitoring = false;
        };
        Gamepads.prototype._checkGamepadsStatus = function () {
            var _this = this;
            // updating gamepad objects
            this._updateGamepadObjects();
            for (var i in this.babylonGamepads) {
                this.babylonGamepads[i].update();
            }
            if (this.isMonitoring) {
                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(function () { _this._checkGamepadsStatus(); });
                }
                else if (window.mozRequestAnimationFrame) {
                    window.mozRequestAnimationFrame(function () { _this._checkGamepadsStatus(); });
                }
                else if (window.webkitRequestAnimationFrame) {
                    window.webkitRequestAnimationFrame(function () { _this._checkGamepadsStatus(); });
                }
            }
        };
        // This function is called only on Chrome, which does not yet support
        // connection/disconnection events, but requires you to monitor
        // an array for changes.
        Gamepads.prototype._updateGamepadObjects = function () {
            var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
            for (var i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    if (!(gamepads[i].index in this.babylonGamepads)) {
                        var newGamepad = this._addNewGamepad(gamepads[i]);
                        if (this._callbackGamepadConnected) {
                            this._callbackGamepadConnected(newGamepad);
                        }
                    }
                    else {
                        this.babylonGamepads[i].browserGamepad = gamepads[i];
                    }
                }
            }
        };
        return Gamepads;
    })();
    BABYLON.Gamepads = Gamepads;
    var StickValues = (function () {
        function StickValues(x, y) {
            this.x = x;
            this.y = y;
        }
        return StickValues;
    })();
    BABYLON.StickValues = StickValues;
    var Gamepad = (function () {
        function Gamepad(id, index, browserGamepad) {
            this.id = id;
            this.index = index;
            this.browserGamepad = browserGamepad;
            if (this.browserGamepad.axes.length >= 2) {
                this._leftStick = { x: this.browserGamepad.axes[0], y: this.browserGamepad.axes[1] };
            }
            if (this.browserGamepad.axes.length >= 4) {
                this._rightStick = { x: this.browserGamepad.axes[2], y: this.browserGamepad.axes[3] };
            }
        }
        Gamepad.prototype.onleftstickchanged = function (callback) {
            this._onleftstickchanged = callback;
        };
        Gamepad.prototype.onrightstickchanged = function (callback) {
            this._onrightstickchanged = callback;
        };
        Object.defineProperty(Gamepad.prototype, "leftStick", {
            get: function () {
                return this._leftStick;
            },
            set: function (newValues) {
                if (this._onleftstickchanged && (this._leftStick.x !== newValues.x || this._leftStick.y !== newValues.y)) {
                    this._onleftstickchanged(newValues);
                }
                this._leftStick = newValues;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Gamepad.prototype, "rightStick", {
            get: function () {
                return this._rightStick;
            },
            set: function (newValues) {
                if (this._onrightstickchanged && (this._rightStick.x !== newValues.x || this._rightStick.y !== newValues.y)) {
                    this._onrightstickchanged(newValues);
                }
                this._rightStick = newValues;
            },
            enumerable: true,
            configurable: true
        });
        Gamepad.prototype.update = function () {
            if (this._leftStick) {
                this.leftStick = { x: this.browserGamepad.axes[0], y: this.browserGamepad.axes[1] };
            }
            if (this._rightStick) {
                this.rightStick = { x: this.browserGamepad.axes[2], y: this.browserGamepad.axes[3] };
            }
        };
        return Gamepad;
    })();
    BABYLON.Gamepad = Gamepad;
    var GenericPad = (function (_super) {
        __extends(GenericPad, _super);
        function GenericPad(id, index, gamepad) {
            _super.call(this, id, index, gamepad);
            this.id = id;
            this.index = index;
            this.gamepad = gamepad;
            this._buttons = new Array(gamepad.buttons.length);
        }
        GenericPad.prototype.onbuttondown = function (callback) {
            this._onbuttondown = callback;
        };
        GenericPad.prototype.onbuttonup = function (callback) {
            this._onbuttonup = callback;
        };
        GenericPad.prototype._setButtonValue = function (newValue, currentValue, buttonIndex) {
            if (newValue !== currentValue) {
                if (this._onbuttondown && newValue === 1) {
                    this._onbuttondown(buttonIndex);
                }
                if (this._onbuttonup && newValue === 0) {
                    this._onbuttonup(buttonIndex);
                }
            }
            return newValue;
        };
        GenericPad.prototype.update = function () {
            _super.prototype.update.call(this);
            for (var index = 0; index < this._buttons.length; index++) {
                this._buttons[index] = this._setButtonValue(this.gamepad.buttons[index].value, this._buttons[index], index);
            }
        };
        return GenericPad;
    })(Gamepad);
    BABYLON.GenericPad = GenericPad;
    (function (Xbox360Button) {
        Xbox360Button[Xbox360Button["A"] = 0] = "A";
        Xbox360Button[Xbox360Button["B"] = 1] = "B";
        Xbox360Button[Xbox360Button["X"] = 2] = "X";
        Xbox360Button[Xbox360Button["Y"] = 3] = "Y";
        Xbox360Button[Xbox360Button["Start"] = 4] = "Start";
        Xbox360Button[Xbox360Button["Back"] = 5] = "Back";
        Xbox360Button[Xbox360Button["LB"] = 6] = "LB";
        Xbox360Button[Xbox360Button["RB"] = 7] = "RB";
        Xbox360Button[Xbox360Button["LeftStick"] = 8] = "LeftStick";
        Xbox360Button[Xbox360Button["RightStick"] = 9] = "RightStick";
    })(BABYLON.Xbox360Button || (BABYLON.Xbox360Button = {}));
    var Xbox360Button = BABYLON.Xbox360Button;
    (function (Xbox360Dpad) {
        Xbox360Dpad[Xbox360Dpad["Up"] = 0] = "Up";
        Xbox360Dpad[Xbox360Dpad["Down"] = 1] = "Down";
        Xbox360Dpad[Xbox360Dpad["Left"] = 2] = "Left";
        Xbox360Dpad[Xbox360Dpad["Right"] = 3] = "Right";
    })(BABYLON.Xbox360Dpad || (BABYLON.Xbox360Dpad = {}));
    var Xbox360Dpad = BABYLON.Xbox360Dpad;
    var Xbox360Pad = (function (_super) {
        __extends(Xbox360Pad, _super);
        function Xbox360Pad() {
            _super.apply(this, arguments);
            this._leftTrigger = 0;
            this._rightTrigger = 0;
            this._buttonA = 0;
            this._buttonB = 0;
            this._buttonX = 0;
            this._buttonY = 0;
            this._buttonBack = 0;
            this._buttonStart = 0;
            this._buttonLB = 0;
            this._buttonRB = 0;
            this._buttonLeftStick = 0;
            this._buttonRightStick = 0;
            this._dPadUp = 0;
            this._dPadDown = 0;
            this._dPadLeft = 0;
            this._dPadRight = 0;
        }
        Xbox360Pad.prototype.onlefttriggerchanged = function (callback) {
            this._onlefttriggerchanged = callback;
        };
        Xbox360Pad.prototype.onrighttriggerchanged = function (callback) {
            this._onrighttriggerchanged = callback;
        };
        Object.defineProperty(Xbox360Pad.prototype, "leftTrigger", {
            get: function () {
                return this._leftTrigger;
            },
            set: function (newValue) {
                if (this._onlefttriggerchanged && this._leftTrigger !== newValue) {
                    this._onlefttriggerchanged(newValue);
                }
                this._leftTrigger = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "rightTrigger", {
            get: function () {
                return this._rightTrigger;
            },
            set: function (newValue) {
                if (this._onrighttriggerchanged && this._rightTrigger !== newValue) {
                    this._onrighttriggerchanged(newValue);
                }
                this._rightTrigger = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Xbox360Pad.prototype.onbuttondown = function (callback) {
            this._onbuttondown = callback;
        };
        Xbox360Pad.prototype.onbuttonup = function (callback) {
            this._onbuttonup = callback;
        };
        Xbox360Pad.prototype.ondpaddown = function (callback) {
            this._ondpaddown = callback;
        };
        Xbox360Pad.prototype.ondpadup = function (callback) {
            this._ondpadup = callback;
        };
        Xbox360Pad.prototype._setButtonValue = function (newValue, currentValue, buttonType) {
            if (newValue !== currentValue) {
                if (this._onbuttondown && newValue === 1) {
                    this._onbuttondown(buttonType);
                }
                if (this._onbuttonup && newValue === 0) {
                    this._onbuttonup(buttonType);
                }
            }
            return newValue;
        };
        Xbox360Pad.prototype._setDPadValue = function (newValue, currentValue, buttonType) {
            if (newValue !== currentValue) {
                if (this._ondpaddown && newValue === 1) {
                    this._ondpaddown(buttonType);
                }
                if (this._ondpadup && newValue === 0) {
                    this._ondpadup(buttonType);
                }
            }
            return newValue;
        };
        Object.defineProperty(Xbox360Pad.prototype, "buttonA", {
            get: function () {
                return this._buttonA;
            },
            set: function (value) {
                this._buttonA = this._setButtonValue(value, this._buttonA, Xbox360Button.A);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonB", {
            get: function () {
                return this._buttonB;
            },
            set: function (value) {
                this._buttonB = this._setButtonValue(value, this._buttonB, Xbox360Button.B);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonX", {
            get: function () {
                return this._buttonX;
            },
            set: function (value) {
                this._buttonX = this._setButtonValue(value, this._buttonX, Xbox360Button.X);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonY", {
            get: function () {
                return this._buttonY;
            },
            set: function (value) {
                this._buttonY = this._setButtonValue(value, this._buttonY, Xbox360Button.Y);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonStart", {
            get: function () {
                return this._buttonStart;
            },
            set: function (value) {
                this._buttonStart = this._setButtonValue(value, this._buttonStart, Xbox360Button.Start);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonBack", {
            get: function () {
                return this._buttonBack;
            },
            set: function (value) {
                this._buttonBack = this._setButtonValue(value, this._buttonBack, Xbox360Button.Back);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonLB", {
            get: function () {
                return this._buttonLB;
            },
            set: function (value) {
                this._buttonLB = this._setButtonValue(value, this._buttonLB, Xbox360Button.LB);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonRB", {
            get: function () {
                return this._buttonRB;
            },
            set: function (value) {
                this._buttonRB = this._setButtonValue(value, this._buttonRB, Xbox360Button.RB);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonLeftStick", {
            get: function () {
                return this._buttonLeftStick;
            },
            set: function (value) {
                this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, Xbox360Button.LeftStick);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "buttonRightStick", {
            get: function () {
                return this._buttonRightStick;
            },
            set: function (value) {
                this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, Xbox360Button.RightStick);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadUp", {
            get: function () {
                return this._dPadUp;
            },
            set: function (value) {
                this._dPadUp = this._setDPadValue(value, this._dPadUp, Xbox360Dpad.Up);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadDown", {
            get: function () {
                return this._dPadDown;
            },
            set: function (value) {
                this._dPadDown = this._setDPadValue(value, this._dPadDown, Xbox360Dpad.Down);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadLeft", {
            get: function () {
                return this._dPadLeft;
            },
            set: function (value) {
                this._dPadLeft = this._setDPadValue(value, this._dPadLeft, Xbox360Dpad.Left);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Xbox360Pad.prototype, "dPadRight", {
            get: function () {
                return this._dPadRight;
            },
            set: function (value) {
                this._dPadRight = this._setDPadValue(value, this._dPadRight, Xbox360Dpad.Right);
            },
            enumerable: true,
            configurable: true
        });
        Xbox360Pad.prototype.update = function () {
            _super.prototype.update.call(this);
            this.buttonA = this.browserGamepad.buttons[0].value;
            this.buttonB = this.browserGamepad.buttons[1].value;
            this.buttonX = this.browserGamepad.buttons[2].value;
            this.buttonY = this.browserGamepad.buttons[3].value;
            this.buttonLB = this.browserGamepad.buttons[4].value;
            this.buttonRB = this.browserGamepad.buttons[5].value;
            this.leftTrigger = this.browserGamepad.buttons[6].value;
            this.rightTrigger = this.browserGamepad.buttons[7].value;
            this.buttonBack = this.browserGamepad.buttons[8].value;
            this.buttonStart = this.browserGamepad.buttons[9].value;
            this.buttonLeftStick = this.browserGamepad.buttons[10].value;
            this.buttonRightStick = this.browserGamepad.buttons[11].value;
            this.dPadUp = this.browserGamepad.buttons[12].value;
            this.dPadDown = this.browserGamepad.buttons[13].value;
            this.dPadLeft = this.browserGamepad.buttons[14].value;
            this.dPadRight = this.browserGamepad.buttons[15].value;
        };
        return Xbox360Pad;
    })(Gamepad);
    BABYLON.Xbox360Pad = Xbox360Pad;
})(BABYLON || (BABYLON = {}));
