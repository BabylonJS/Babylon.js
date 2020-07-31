import { Observable } from "../Misc/observable";

/**
 * Represents a gamepad control stick position
 */
export class StickValues {
    /**
     * Initializes the gamepad x and y control stick values
     * @param x The x component of the gamepad control stick value
     * @param y The y component of the gamepad control stick value
     */
    constructor(
        /**
         * The x component of the control stick
         */
        public x: number,
        /**
         * The y component of the control stick
         */
        public y: number
    ) {
    }
}

/**
 * An interface which manages callbacks for gamepad button changes
 */
export interface GamepadButtonChanges {
    /**
     * Called when a gamepad has been changed
     */
    changed: boolean;
    /**
     * Called when a gamepad press event has been triggered
     */
    pressChanged: boolean;
    /**
     * Called when a touch event has been triggered
     */
    touchChanged: boolean;
    /**
     * Called when a value has changed
     */
    valueChanged: boolean;
}

/**
 * Represents a gamepad
 */
export class Gamepad {

    /**
     * Specifies what type of gamepad this represents
     */
    public type: number;

    private _leftStick: StickValues = { x: 0, y: 0 };
    private _rightStick: StickValues = { x: 0, y: 0 };

    /** @hidden */
    public _isConnected = true;

    private _leftStickAxisX: number;
    private _leftStickAxisY: number;
    private _rightStickAxisX: number;
    private _rightStickAxisY: number;

    /**
     * Triggered when the left control stick has been changed
     */
    private _onleftstickchanged: (values: StickValues) => void;

    /**
     * Triggered when the right control stick has been changed
     */
    private _onrightstickchanged: (values: StickValues) => void;

    /**
     * Represents a gamepad controller
     */
    public static GAMEPAD = 0;
    /**
     * Represents a generic controller
     */
    public static GENERIC = 1;
    /**
     * Represents an XBox controller
     */
    public static XBOX = 2;
    /**
     * Represents a pose-enabled controller
     */
    public static POSE_ENABLED = 3;
    /**
     * Represents an Dual Shock controller
     */
    public static DUALSHOCK = 4;

    /**
     * Specifies whether the left control stick should be Y-inverted
     */
    protected _invertLeftStickY: boolean = false;

    /**
     * Specifies if the gamepad has been connected
     */
    public get isConnected(): boolean {
        return this._isConnected;
    }

    /**
     * Initializes the gamepad
     * @param id The id of the gamepad
     * @param index The index of the gamepad
     * @param browserGamepad The browser gamepad
     * @param leftStickX The x component of the left joystick
     * @param leftStickY The y component of the left joystick
     * @param rightStickX The x component of the right joystick
     * @param rightStickY The y component of the right joystick
     */
    constructor(
        /**
         * The id of the gamepad
         */
        public id: string,
        /**
         * The index of the gamepad
         */
        public index: number,
        /**
         * The browser gamepad
         */
        public browserGamepad: any,
        leftStickX: number = 0, leftStickY: number = 1, rightStickX: number = 2, rightStickY: number = 3) {
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

    /**
     * Callback triggered when the left joystick has changed
     * @param callback
     */
    public onleftstickchanged(callback: (values: StickValues) => void) {
        this._onleftstickchanged = callback;
    }

    /**
     * Callback triggered when the right joystick has changed
     * @param callback
     */
    public onrightstickchanged(callback: (values: StickValues) => void) {
        this._onrightstickchanged = callback;
    }

    /**
     * Gets the left joystick
     */
    public get leftStick(): StickValues {
        return this._leftStick;
    }
    /**
     * Sets the left joystick values
     */
    public set leftStick(newValues: StickValues) {
        if (this._onleftstickchanged && (this._leftStick.x !== newValues.x || this._leftStick.y !== newValues.y)) {
            this._onleftstickchanged(newValues);
        }
        this._leftStick = newValues;
    }
    /**
     * Gets the right joystick
     */
    public get rightStick(): StickValues {
        return this._rightStick;
    }
    /**
     * Sets the right joystick value
     */
    public set rightStick(newValues: StickValues) {
        if (this._onrightstickchanged && (this._rightStick.x !== newValues.x || this._rightStick.y !== newValues.y)) {
            this._onrightstickchanged(newValues);
        }
        this._rightStick = newValues;
    }

    /**
     * Updates the gamepad joystick positions
     */

    public update() {
        if (this._leftStick) {
            this.leftStick = { x: this.browserGamepad.axes[this._leftStickAxisX], y: this.browserGamepad.axes[this._leftStickAxisY] };
            if (this._invertLeftStickY) {
                this.leftStick.y *= -1;
            }
        }
        if (this._rightStick) {
            this.rightStick = { x: this.browserGamepad.axes[this._rightStickAxisX], y: this.browserGamepad.axes[this._rightStickAxisY] };
        }
    }

    /**
     * Disposes the gamepad
     */
    public dispose() {
    }
}

/**
 * Represents a generic gamepad
 */
export class GenericPad extends Gamepad {
    private _buttons: Array<number>;
    private _onbuttondown: (buttonPressed: number) => void;
    private _onbuttonup: (buttonReleased: number) => void;

    /**
     * Observable triggered when a button has been pressed
     */
    public onButtonDownObservable = new Observable<number>();
    /**
     * Observable triggered when a button has been released
     */
    public onButtonUpObservable = new Observable<number>();

    /**
     * Callback triggered when a button has been pressed
     * @param callback Called when a button has been pressed
     */
    public onbuttondown(callback: (buttonPressed: number) => void) {
        this._onbuttondown = callback;
    }
    /**
     * Callback triggered when a button has been released
     * @param callback Called when a button has been released
     */
    public onbuttonup(callback: (buttonReleased: number) => void) {
        this._onbuttonup = callback;
    }

    /**
     * Initializes the generic gamepad
     * @param id The id of the generic gamepad
     * @param index The index of the generic gamepad
     * @param browserGamepad The browser gamepad
     */
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

    /**
     * Updates the generic gamepad
     */
    public update() {
        super.update();
        for (var index = 0; index < this._buttons.length; index++) {
            this._buttons[index] = this._setButtonValue(this.browserGamepad.buttons[index].value, this._buttons[index], index);
        }
    }

    /**
     * Disposes the generic gamepad
     */
    public dispose() {
        super.dispose();
        this.onButtonDownObservable.clear();
        this.onButtonUpObservable.clear();
    }
}
