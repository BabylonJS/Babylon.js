module BABYLON {
    export class Gamepads {
        private babylonGamepads: Array<Gamepad> = [];
        private oneGamepadConnected: boolean = false;

        private isMonitoring: boolean = false;
        private gamepadEventSupported: boolean = 'GamepadEvent' in window;
        private gamepadSupportAvailable: boolean = <boolean> (navigator.getGamepads ||
        !!navigator.webkitGetGamepads || !!navigator.msGetGamepads || !!navigator.webkitGamepads);

        private _callbackGamepadConnected: (gamepad: Gamepad) => void;

        private buttonADataURL: string = "data:image/png;base64,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";
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
                if (!this.oneGamepadConnected) {
                    this._insertGamepadDOMInstructions();
                }
            }
            else {
                this._insertGamepadDOMNotSupported();
            }
        }

        private _insertGamepadDOMInstructions() {
            Gamepads.gamepadDOMInfo = <HTMLDivElement>document.createElement("div");
            var buttonAImage = <HTMLImageElement>document.createElement("img");
            buttonAImage.src = this.buttonADataURL;
            var spanMessage = <HTMLSpanElement>document.createElement("span");
            spanMessage.innerHTML = "<strong>to activate gamepad</strong>";

            Gamepads.gamepadDOMInfo.appendChild(buttonAImage);
            Gamepads.gamepadDOMInfo.appendChild(spanMessage);

            Gamepads.gamepadDOMInfo.style.position = "absolute";
            Gamepads.gamepadDOMInfo.style.width = "100%";
            Gamepads.gamepadDOMInfo.style.height = "48px";
            Gamepads.gamepadDOMInfo.style.bottom = "0px";
            Gamepads.gamepadDOMInfo.style.backgroundColor = "rgba(1, 1, 1, 0.15)";
            Gamepads.gamepadDOMInfo.style.textAlign = "center";
            Gamepads.gamepadDOMInfo.style.zIndex = "10";

            buttonAImage.style.position = "relative";
            buttonAImage.style.bottom = "8px";

            spanMessage.style.position = "relative";
            spanMessage.style.fontSize = "32px";
            spanMessage.style.bottom = "32px";
            spanMessage.style.color = "green";

            document.body.appendChild(Gamepads.gamepadDOMInfo);
        }

        private _insertGamepadDOMNotSupported() {
            Gamepads.gamepadDOMInfo = <HTMLDivElement>document.createElement("div");

            var spanMessage = <HTMLSpanElement>document.createElement("span");
            spanMessage.innerHTML = "<strong>gamepad not supported</strong>";

            Gamepads.gamepadDOMInfo.appendChild(spanMessage);

            Gamepads.gamepadDOMInfo.style.position = "absolute";
            Gamepads.gamepadDOMInfo.style.width = "100%";
            Gamepads.gamepadDOMInfo.style.height = "40px";
            Gamepads.gamepadDOMInfo.style.bottom = "0px";
            Gamepads.gamepadDOMInfo.style.backgroundColor = "rgba(1, 1, 1, 0.15)";
            Gamepads.gamepadDOMInfo.style.textAlign = "center";
            Gamepads.gamepadDOMInfo.style.zIndex = "10";

            spanMessage.style.position = "relative";
            spanMessage.style.fontSize = "32px";
            spanMessage.style.color = "red";

            document.body.appendChild(Gamepads.gamepadDOMInfo);
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
                    this.babylonGamepads.splice(i, 1);
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

