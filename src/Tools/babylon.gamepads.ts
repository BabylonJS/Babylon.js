module BABYLON {
    export class Gamepads {
        private babylonGamepads: Array<Gamepad> = [];
        private oneGamepadConnected: boolean = false;

        private isMonitoring: boolean = false;
        private gamepadEventSupported: boolean = 'GamepadEvent' in window;
        private gamepadSupportAvailable: boolean = <boolean> (navigator.getGamepads ||
        !!navigator.webkitGetGamepads || !!navigator.msGetGamepads || !!navigator.webkitGamepads);

        private _callbackGamepadConnected: (gamepad: Gamepad) => void;

        private static gamepadDOMInfo: HTMLElement;

        constructor(ongamedpadconnected: (gamepad: Gamepad) => void) {
            this._callbackGamepadConnected = ongamedpadconnected;
            if (this.gamepadSupportAvailable) {
                // Checking if the gamepad connected event is supported (like in Firefox)
                if (this.gamepadEventSupported) {
                    window.addEventListener('gamepadconnected', (evt) => {
                        this._onGamepadConnected(evt);
                    }, false);
                    window.addEventListener('gamepaddisconnected',
                        (evt) => {
                            this._onGamepadDisconnected(evt);
                        }, false);
                }
                else {
                    this._startMonitoringGamepads();
                }
            }
        }

        public dispose() {
            if (Gamepads.gamepadDOMInfo) {
                document.body.removeChild(Gamepads.gamepadDOMInfo);
            }
        }

        private _onGamepadConnected(evt) {
            var newGamepad = this._addNewGamepad(evt.gamepad);
            if (this._callbackGamepadConnected) this._callbackGamepadConnected(newGamepad);
            this._startMonitoringGamepads();
        }

        private _addNewGamepad(gamepad): Gamepad {
            if (!this.oneGamepadConnected) {
                this.oneGamepadConnected = true;
                if (Gamepads.gamepadDOMInfo) {
                    document.body.removeChild(Gamepads.gamepadDOMInfo);
                    Gamepads.gamepadDOMInfo = null;
                }
            }

            var newGamepad;

            if ((<string>gamepad.id).search("Xbox 360") !== -1 || (<string>gamepad.id).search("xinput") !== -1) {
                newGamepad = new Xbox360Pad(gamepad.id, gamepad.index, gamepad);
            }
            else {
                newGamepad = new GenericPad(gamepad.id, gamepad.index, gamepad);
            }
            this.babylonGamepads.push(newGamepad);
            return newGamepad;
        }

        private _onGamepadDisconnected(evt) {
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
        }

        private _startMonitoringGamepads() {
            if (!this.isMonitoring) {
                this.isMonitoring = true;
                this._checkGamepadsStatus();
            }
        }

        private _stopMonitoringGamepads() {
            this.isMonitoring = false;
        }

        private _checkGamepadsStatus() {
            // updating gamepad objects
            this._updateGamepadObjects();

            for (var i in this.babylonGamepads) {
                this.babylonGamepads[i].update();
            }

            if (this.isMonitoring) {
                if (window.requestAnimationFrame) {
                    window.requestAnimationFrame(() => { this._checkGamepadsStatus(); });
                } else if (window.mozRequestAnimationFrame) {
                    window.mozRequestAnimationFrame(() => { this._checkGamepadsStatus(); });
                } else if (window.webkitRequestAnimationFrame) {
                    window.webkitRequestAnimationFrame(() => { this._checkGamepadsStatus(); });
                }
            }
        }

        // This function is called only on Chrome, which does not yet support
        // connection/disconnection events, but requires you to monitor
        // an array for changes.
        private _updateGamepadObjects() {
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
        }
    }
    export class StickValues {
        constructor(public x, public y) {
        }
    }
    export class Gamepad {
        private _leftStick: StickValues;
        private _rightStick: StickValues;

        private _onleftstickchanged: (values: StickValues) => void;
        private _onrightstickchanged: (values: StickValues) => void;

        constructor(public id: string, public index: number, public browserGamepad) {
            if (this.browserGamepad.axes.length >= 2) {
                this._leftStick = { x: this.browserGamepad.axes[0], y: this.browserGamepad.axes[1] };
            }
            if (this.browserGamepad.axes.length >= 4) {
                this._rightStick = { x: this.browserGamepad.axes[2], y: this.browserGamepad.axes[3] };
            }
        }

        public onleftstickchanged(callback: (values: StickValues) => void) {
            this._onleftstickchanged = callback;
        }

        public onrightstickchanged(callback: (values: StickValues) => void) {
            this._onrightstickchanged = callback;
        }

        public get leftStick(): StickValues {
            return this._leftStick;
        }
        public set leftStick(newValues: StickValues) {
            if (this._onleftstickchanged && (this._leftStick.x !== newValues.x || this._leftStick.y !== newValues.y)) {
                this._onleftstickchanged(newValues);
            }
            this._leftStick = newValues;
        }
        public get rightStick(): StickValues {
            return this._rightStick;
        }
        public set rightStick(newValues: StickValues) {
            if (this._onrightstickchanged && (this._rightStick.x !== newValues.x || this._rightStick.y !== newValues.y)) {
                this._onrightstickchanged(newValues);
            }
            this._rightStick = newValues;
        }

        public update() {
            if (this._leftStick) {
                this.leftStick = { x: this.browserGamepad.axes[0], y: this.browserGamepad.axes[1] };
            }
            if (this._rightStick) {
                this.rightStick = { x: this.browserGamepad.axes[2], y: this.browserGamepad.axes[3] };
            }
        }
    }

    export class GenericPad extends Gamepad {
        private _buttons: Array<number>; 
        private _onbuttondown: (buttonPressed: number) => void;
        private _onbuttonup: (buttonReleased: number) => void;

        public onbuttondown(callback: (buttonPressed: number) => void) {
            this._onbuttondown = callback;
        }
        public onbuttonup(callback: (buttonReleased: number) => void) {
            this._onbuttonup = callback;
        }

        constructor(public id: string, public index: number, public gamepad) {
            super(id, index, gamepad);
            this._buttons = new Array(gamepad.buttons.length);
        }

        private _setButtonValue(newValue: number, currentValue: number, buttonIndex: number): number {
            if (newValue !== currentValue) {
                if (this._onbuttondown && newValue === 1) {
                    this._onbuttondown(buttonIndex);
                }
                if (this._onbuttonup && newValue === 0) {
                    this._onbuttonup(buttonIndex);
                }
            }
            return newValue;
        }

        public update() {
            super.update();
            for (var index = 0; index < this._buttons.length; index++) {
                this._buttons[index] = this._setButtonValue(this.gamepad.buttons[index].value, this._buttons[index], index);
            }
        }
    }

    export enum Xbox360Button {
        A,
        B,
        X,
        Y,
        Start,
        Back,
        LB,
        RB,
        LeftStick,
        RightStick
    }

    export enum Xbox360Dpad {
        Up,
        Down,
        Left,
        Right
    }

    export class Xbox360Pad extends Gamepad {
        private _leftTrigger: number = 0;
        private _rightTrigger: number = 0;

        private _onlefttriggerchanged: (value: number) => void;
        private _onrighttriggerchanged: (value: number) => void;

        private _onbuttondown: (buttonPressed: Xbox360Button) => void;
        private _onbuttonup: (buttonReleased: Xbox360Button) => void;
        private _ondpaddown: (dPadPressed: Xbox360Dpad) => void;
        private _ondpadup: (dPadReleased: Xbox360Dpad) => void;

        private _buttonA: number = 0;
        private _buttonB: number = 0;
        private _buttonX: number = 0;
        private _buttonY: number = 0;
        private _buttonBack: number = 0;
        private _buttonStart: number = 0;
        private _buttonLB: number = 0;
        private _buttonRB: number = 0;

        private _buttonLeftStick: number = 0;
        private _buttonRightStick: number = 0;
        private _dPadUp: number = 0;
        private _dPadDown: number = 0;
        private _dPadLeft: number = 0;
        private _dPadRight: number = 0;

        public onlefttriggerchanged(callback: (value: number) => void) {
            this._onlefttriggerchanged = callback;
        }

        public onrighttriggerchanged(callback: (value: number) => void) {
            this._onrighttriggerchanged = callback;
        }

        public get leftTrigger(): number {
            return this._leftTrigger;
        }
        public set leftTrigger(newValue: number) {
            if (this._onlefttriggerchanged && this._leftTrigger !== newValue) {
                this._onlefttriggerchanged(newValue);
            }
            this._leftTrigger = newValue;
        }

        public get rightTrigger(): number {
            return this._rightTrigger;
        }
        public set rightTrigger(newValue: number) {
            if (this._onrighttriggerchanged && this._rightTrigger !== newValue) {
                this._onrighttriggerchanged(newValue);
            }
            this._rightTrigger = newValue;
        }

        public onbuttondown(callback: (buttonPressed: Xbox360Button) => void) {
            this._onbuttondown = callback;
        }
        public onbuttonup(callback: (buttonReleased: Xbox360Button) => void) {
            this._onbuttonup = callback;
        }
        public ondpaddown(callback: (dPadPressed: Xbox360Dpad) => void) {
            this._ondpaddown = callback;
        }
        public ondpadup(callback: (dPadReleased: Xbox360Dpad) => void) {
            this._ondpadup = callback;
        }

        private _setButtonValue(newValue: number, currentValue: number, buttonType: Xbox360Button): number {
            if (newValue !== currentValue) {
                if (this._onbuttondown && newValue === 1) {
                    this._onbuttondown(buttonType);
                }
                if (this._onbuttonup && newValue === 0) {
                    this._onbuttonup(buttonType);
                }
            }
            return newValue;
        }

        private _setDPadValue(newValue: number, currentValue: number, buttonType: Xbox360Dpad): number {
            if (newValue !== currentValue) {
                if (this._ondpaddown && newValue === 1) {
                    this._ondpaddown(buttonType);
                }
                if (this._ondpadup && newValue === 0) {
                    this._ondpadup(buttonType);
                }
            }
            return newValue;
        }

        public get buttonA(): number {
            return this._buttonA;
        }
        public set buttonA(value) {
            this._buttonA = this._setButtonValue(value, this._buttonA, Xbox360Button.A);
        }
        public get buttonB(): number {
            return this._buttonB;
        }
        public set buttonB(value) {
            this._buttonB = this._setButtonValue(value, this._buttonB, Xbox360Button.B);
        }
        public get buttonX(): number {
            return this._buttonX;
        }
        public set buttonX(value) {
            this._buttonX = this._setButtonValue(value, this._buttonX, Xbox360Button.X);
        }
        public get buttonY(): number {
            return this._buttonY;
        }
        public set buttonY(value) {
            this._buttonY = this._setButtonValue(value, this._buttonY, Xbox360Button.Y);
        }
        public get buttonStart(): number {
            return this._buttonStart;
        }
        public set buttonStart(value) {
            this._buttonStart = this._setButtonValue(value, this._buttonStart, Xbox360Button.Start);
        }
        public get buttonBack(): number {
            return this._buttonBack;
        }
        public set buttonBack(value) {
            this._buttonBack = this._setButtonValue(value, this._buttonBack, Xbox360Button.Back);
        }
        public get buttonLB(): number {
            return this._buttonLB;
        }
        public set buttonLB(value) {
            this._buttonLB = this._setButtonValue(value, this._buttonLB, Xbox360Button.LB);
        }
        public get buttonRB(): number {
            return this._buttonRB;
        }
        public set buttonRB(value) {
            this._buttonRB = this._setButtonValue(value, this._buttonRB, Xbox360Button.RB);
        }
        public get buttonLeftStick(): number {
            return this._buttonLeftStick;
        }
        public set buttonLeftStick(value) {
            this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, Xbox360Button.LeftStick);
        }
        public get buttonRightStick(): number {
            return this._buttonRightStick;
        }
        public set buttonRightStick(value) {
            this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, Xbox360Button.RightStick);
        }
        public get dPadUp(): number {
            return this._dPadUp;
        }
        public set dPadUp(value) {
            this._dPadUp = this._setDPadValue(value, this._dPadUp, Xbox360Dpad.Up);
        }
        public get dPadDown(): number {
            return this._dPadDown;
        }
        public set dPadDown(value) {
            this._dPadDown = this._setDPadValue(value, this._dPadDown, Xbox360Dpad.Down);
        }
        public get dPadLeft(): number {
            return this._dPadLeft;
        }
        public set dPadLeft(value) {
            this._dPadLeft = this._setDPadValue(value, this._dPadLeft, Xbox360Dpad.Left);
        }
        public get dPadRight(): number {
            return this._dPadRight;
        }
        public set dPadRight(value) {
            this._dPadRight = this._setDPadValue(value, this._dPadRight, Xbox360Dpad.Right);
        }
        public update() {
            super.update();
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
        }
    }
}

// Mixins
//interface Window {
//    webkitRequestAnimationFrame(func: any): any;
//    mozRequestAnimationFrame(func: any): any;
//    oRequestAnimationFrame(func: any): any;
//    WebGLRenderingContext: WebGLRenderingContext;
//    MSGesture: MSGesture;
//    ongamepadconnected(func?: any): any;
//}

interface Navigator {
    getGamepads(func?: any): any;
    webkitGetGamepads(func?: any): any
    msGetGamepads(func?: any): any;
    webkitGamepads(func?: any): any;
}

