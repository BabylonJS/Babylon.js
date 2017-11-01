module BABYLON {
    export class StickValues {
        constructor(public x: number, public y: number) {
        }
    }

    export interface GamepadButtonChanges {
        changed: boolean;
        pressChanged: boolean;
        touchChanged: boolean;
        valueChanged: boolean;
    }
    
    export class Gamepad {

        public type: number;

        private _leftStick: StickValues;
        private _rightStick: StickValues;

        public _isConnected = true;

        private _leftStickAxisX: number;
        private _leftStickAxisY: number;
        private _rightStickAxisX: number;
        private _rightStickAxisY: number;

        private _onleftstickchanged: (values: StickValues) => void;
        private _onrightstickchanged: (values: StickValues) => void;

        public static GAMEPAD = 0;
        public static GENERIC = 1;
        public static XBOX = 2;
        public static POSE_ENABLED = 3;

        public get isConnected(): boolean {
            return this._isConnected;
        }

        constructor(public id: string, public index: number, public browserGamepad: any, leftStickX: number = 0, leftStickY: number = 1, rightStickX: number = 2, rightStickY: number = 3) {
            this.type = Gamepad.GAMEPAD;
            this._leftStickAxisX = leftStickX;
            this._leftStickAxisY = leftStickY;
            this._rightStickAxisX = rightStickX;
            this._rightStickAxisY = rightStickY;
            if (this.browserGamepad.axes.length >= 2) {
                this._leftStick = { x: this.browserGamepad.axes[this._leftStickAxisX], y: this.browserGamepad.axes[this._leftStickAxisY] };
            }
            if (this.browserGamepad.axes.length >= 4) {
                this._rightStick = { x: this.browserGamepad.axes[this._rightStickAxisX], y: this.browserGamepad.axes[this._rightStickAxisY] };
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
                this.leftStick = { x: this.browserGamepad.axes[this._leftStickAxisX], y: this.browserGamepad.axes[this._leftStickAxisY] };
            }
            if (this._rightStick) {
                this.rightStick = { x: this.browserGamepad.axes[this._rightStickAxisX], y: this.browserGamepad.axes[this._rightStickAxisY] };
            }
        }

        public dispose() {            
        }
    }

    export class GenericPad extends Gamepad {
        private _buttons: Array<number>;
        private _onbuttondown: (buttonPressed: number) => void;
        private _onbuttonup: (buttonReleased: number) => void;        

        public onButtonDownObservable = new Observable<number>();
        public onButtonUpObservable = new Observable<number>();

        public onbuttondown(callback: (buttonPressed: number) => void) {
            this._onbuttondown = callback;
        }
        public onbuttonup(callback: (buttonReleased: number) => void) {
            this._onbuttonup = callback;
        }

        constructor(id: string, index: number, browserGamepad: any) {
            super(id, index, browserGamepad);
            this.type = Gamepad.GENERIC;
            this._buttons = new Array(browserGamepad.buttons.length);
        }

        private _setButtonValue(newValue: number, currentValue: number, buttonIndex: number): number {
            if (newValue !== currentValue) {
                if (newValue === 1) {
                    if (this._onbuttondown) {
                        this._onbuttondown(buttonIndex);
                    }

                    this.onButtonDownObservable.notifyObservers(buttonIndex);
                }
                if (newValue === 0) {
                    if (this._onbuttonup) {
                        this._onbuttonup(buttonIndex);
                    }

                    this.onButtonUpObservable.notifyObservers(buttonIndex);
                }
            }
            return newValue;
        }

        public update() {
            super.update();
            for (var index = 0; index < this._buttons.length; index++) {
                this._buttons[index] = this._setButtonValue(this.browserGamepad.buttons[index].value, this._buttons[index], index);
            }
        }
    }
}
