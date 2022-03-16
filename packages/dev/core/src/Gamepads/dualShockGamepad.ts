import { Observable } from "../Misc/observable";
import { Gamepad } from "./gamepad";

/**
 * Defines supported buttons for DualShock compatible gamepads
 */
export enum DualShockButton {
    /** Cross */
    Cross = 0,
    /** Circle */
    Circle = 1,
    /** Square */
    Square = 2,
    /** Triangle */
    Triangle = 3,
    /** L1 */
    L1 = 4,
    /** R1 */
    R1 = 5,
    /** Share */
    Share = 8,
    /** Options */
    Options = 9,
    /** Left stick */
    LeftStick = 10,
    /** Right stick */
    RightStick = 11
}

/** Defines values for DualShock DPad  */
export enum DualShockDpad {
    /** Up */
    Up = 12,
    /** Down */
    Down = 13,
    /** Left */
    Left = 14,
    /** Right */
    Right = 15
}

/**
 * Defines a DualShock gamepad
 */
export class DualShockPad extends Gamepad {
    private _leftTrigger: number = 0;
    private _rightTrigger: number = 0;

    private _onlefttriggerchanged: (value: number) => void;
    private _onrighttriggerchanged: (value: number) => void;

    private _onbuttondown: (buttonPressed: DualShockButton) => void;
    private _onbuttonup: (buttonReleased: DualShockButton) => void;
    private _ondpaddown: (dPadPressed: DualShockDpad) => void;
    private _ondpadup: (dPadReleased: DualShockDpad) => void;

    /** Observable raised when a button is pressed */
    public onButtonDownObservable = new Observable<DualShockButton>();
    /** Observable raised when a button is released */
    public onButtonUpObservable = new Observable<DualShockButton>();
    /** Observable raised when a pad is pressed */
    public onPadDownObservable = new Observable<DualShockDpad>();
    /** Observable raised when a pad is released */
    public onPadUpObservable = new Observable<DualShockDpad>();

    private _buttonCross: number = 0;
    private _buttonCircle: number = 0;
    private _buttonSquare: number = 0;
    private _buttonTriangle: number = 0;
    private _buttonShare: number = 0;
    private _buttonOptions: number = 0;
    private _buttonL1: number = 0;
    private _buttonR1: number = 0;

    private _buttonLeftStick: number = 0;
    private _buttonRightStick: number = 0;
    private _dPadUp: number = 0;
    private _dPadDown: number = 0;
    private _dPadLeft: number = 0;
    private _dPadRight: number = 0;

    /**
     * Creates a new DualShock gamepad object
     * @param id defines the id of this gamepad
     * @param index defines its index
     * @param gamepad defines the internal HTML gamepad object
     */
    constructor(id: string, index: number, gamepad: any) {
        super(id.replace("STANDARD GAMEPAD", "SONY PLAYSTATION DUALSHOCK"), index, gamepad, 0, 1, 2, 3);
        this.type = Gamepad.DUALSHOCK;
    }

    /**
     * Defines the callback to call when left trigger is pressed
     * @param callback defines the callback to use
     */
    public onlefttriggerchanged(callback: (value: number) => void) {
        this._onlefttriggerchanged = callback;
    }

    /**
     * Defines the callback to call when right trigger is pressed
     * @param callback defines the callback to use
     */
    public onrighttriggerchanged(callback: (value: number) => void) {
        this._onrighttriggerchanged = callback;
    }

    /**
     * Gets the left trigger value
     */
    public get leftTrigger(): number {
        return this._leftTrigger;
    }
    /**
     * Sets the left trigger value
     */
    public set leftTrigger(newValue: number) {
        if (this._onlefttriggerchanged && this._leftTrigger !== newValue) {
            this._onlefttriggerchanged(newValue);
        }
        this._leftTrigger = newValue;
    }

    /**
     * Gets the right trigger value
     */
    public get rightTrigger(): number {
        return this._rightTrigger;
    }
    /**
     * Sets the right trigger value
     */
    public set rightTrigger(newValue: number) {
        if (this._onrighttriggerchanged && this._rightTrigger !== newValue) {
            this._onrighttriggerchanged(newValue);
        }
        this._rightTrigger = newValue;
    }

    /**
     * Defines the callback to call when a button is pressed
     * @param callback defines the callback to use
     */
    public onbuttondown(callback: (buttonPressed: DualShockButton) => void) {
        this._onbuttondown = callback;
    }

    /**
     * Defines the callback to call when a button is released
     * @param callback defines the callback to use
     */
    public onbuttonup(callback: (buttonReleased: DualShockButton) => void) {
        this._onbuttonup = callback;
    }

    /**
     * Defines the callback to call when a pad is pressed
     * @param callback defines the callback to use
     */
    public ondpaddown(callback: (dPadPressed: DualShockDpad) => void) {
        this._ondpaddown = callback;
    }

    /**
     * Defines the callback to call when a pad is released
     * @param callback defines the callback to use
     */
    public ondpadup(callback: (dPadReleased: DualShockDpad) => void) {
        this._ondpadup = callback;
    }

    private _setButtonValue(newValue: number, currentValue: number, buttonType: DualShockButton): number {
        if (newValue !== currentValue) {
            if (newValue === 1) {
                if (this._onbuttondown) {
                    this._onbuttondown(buttonType);
                }

                this.onButtonDownObservable.notifyObservers(buttonType);
            }
            if (newValue === 0) {

                if (this._onbuttonup) {
                    this._onbuttonup(buttonType);
                }

                this.onButtonUpObservable.notifyObservers(buttonType);
            }
        }
        return newValue;
    }

    private _setDPadValue(newValue: number, currentValue: number, buttonType: DualShockDpad): number {
        if (newValue !== currentValue) {
            if (newValue === 1) {
                if (this._ondpaddown) {
                    this._ondpaddown(buttonType);
                }

                this.onPadDownObservable.notifyObservers(buttonType);
            }
            if (newValue === 0) {
                if (this._ondpadup) {
                    this._ondpadup(buttonType);
                }

                this.onPadUpObservable.notifyObservers(buttonType);
            }
        }
        return newValue;
    }

    /**
     * Gets the value of the `Cross` button
     */
    public get buttonCross(): number {
        return this._buttonCross;
    }
    /**
     * Sets the value of the `Cross` button
     */
    public set buttonCross(value) {
        this._buttonCross = this._setButtonValue(value, this._buttonCross, DualShockButton.Cross);
    }

    /**
     * Gets the value of the `Circle` button
     */
    public get buttonCircle(): number {
        return this._buttonCircle;
    }
    /**
     * Sets the value of the `Circle` button
     */
    public set buttonCircle(value) {
        this._buttonCircle = this._setButtonValue(value, this._buttonCircle, DualShockButton.Circle);
    }

    /**
     * Gets the value of the `Square` button
     */
    public get buttonSquare(): number {
        return this._buttonSquare;
    }
    /**
     * Sets the value of the `Square` button
     */
    public set buttonSquare(value) {
        this._buttonSquare = this._setButtonValue(value, this._buttonSquare, DualShockButton.Square);
    }

    /**
     * Gets the value of the `Triangle` button
     */
    public get buttonTriangle(): number {
        return this._buttonTriangle;
    }
    /**
     * Sets the value of the `Triangle` button
     */
    public set buttonTriangle(value) {
        this._buttonTriangle = this._setButtonValue(value, this._buttonTriangle, DualShockButton.Triangle);
    }

    /**
     * Gets the value of the `Options` button
     */
    public get buttonOptions(): number {
        return this._buttonOptions;
    }
    /**
     * Sets the value of the `Options` button
     */
    public set buttonOptions(value) {
        this._buttonOptions = this._setButtonValue(value, this._buttonOptions, DualShockButton.Options);
    }

    /**
     * Gets the value of the `Share` button
     */
    public get buttonShare(): number {
        return this._buttonShare;
    }
    /**
     * Sets the value of the `Share` button
     */
    public set buttonShare(value) {
        this._buttonShare = this._setButtonValue(value, this._buttonShare, DualShockButton.Share);
    }

    /**
     * Gets the value of the `L1` button
     */
    public get buttonL1(): number {
        return this._buttonL1;
    }
    /**
     * Sets the value of the `L1` button
     */
    public set buttonL1(value) {
        this._buttonL1 = this._setButtonValue(value, this._buttonL1, DualShockButton.L1);
    }

    /**
     * Gets the value of the `R1` button
     */
    public get buttonR1(): number {
        return this._buttonR1;
    }
    /**
     * Sets the value of the `R1` button
     */
    public set buttonR1(value) {
        this._buttonR1 = this._setButtonValue(value, this._buttonR1, DualShockButton.R1);
    }

    /**
     * Gets the value of the Left joystick
     */
    public get buttonLeftStick(): number {
        return this._buttonLeftStick;
    }
    /**
     * Sets the value of the Left joystick
     */
    public set buttonLeftStick(value) {
        this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, DualShockButton.LeftStick);
    }

    /**
     * Gets the value of the Right joystick
     */
    public get buttonRightStick(): number {
        return this._buttonRightStick;
    }
    /**
     * Sets the value of the Right joystick
     */
    public set buttonRightStick(value) {
        this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, DualShockButton.RightStick);
    }

    /**
     * Gets the value of D-pad up
     */
    public get dPadUp(): number {
        return this._dPadUp;
    }
    /**
     * Sets the value of D-pad up
     */
    public set dPadUp(value) {
        this._dPadUp = this._setDPadValue(value, this._dPadUp, DualShockDpad.Up);
    }

    /**
     * Gets the value of D-pad down
     */
    public get dPadDown(): number {
        return this._dPadDown;
    }
    /**
     * Sets the value of D-pad down
     */
    public set dPadDown(value) {
        this._dPadDown = this._setDPadValue(value, this._dPadDown, DualShockDpad.Down);
    }

    /**
     * Gets the value of D-pad left
     */
    public get dPadLeft(): number {
        return this._dPadLeft;
    }
    /**
     * Sets the value of D-pad left
     */
    public set dPadLeft(value) {
        this._dPadLeft = this._setDPadValue(value, this._dPadLeft, DualShockDpad.Left);
    }

    /**
     * Gets the value of D-pad right
     */
    public get dPadRight(): number {
        return this._dPadRight;
    }
    /**
     * Sets the value of D-pad right
     */
    public set dPadRight(value) {
        this._dPadRight = this._setDPadValue(value, this._dPadRight, DualShockDpad.Right);
    }

    /**
     * Force the gamepad to synchronize with device values
     */
    public update() {
        super.update();
        this.buttonCross = this.browserGamepad.buttons[0].value;
        this.buttonCircle = this.browserGamepad.buttons[1].value;
        this.buttonSquare = this.browserGamepad.buttons[2].value;
        this.buttonTriangle = this.browserGamepad.buttons[3].value;
        this.buttonL1 = this.browserGamepad.buttons[4].value;
        this.buttonR1 = this.browserGamepad.buttons[5].value;
        this.leftTrigger = this.browserGamepad.buttons[6].value;
        this.rightTrigger = this.browserGamepad.buttons[7].value;
        this.buttonShare = this.browserGamepad.buttons[8].value;
        this.buttonOptions = this.browserGamepad.buttons[9].value;
        this.buttonLeftStick = this.browserGamepad.buttons[10].value;
        this.buttonRightStick = this.browserGamepad.buttons[11].value;
        this.dPadUp = this.browserGamepad.buttons[12].value;
        this.dPadDown = this.browserGamepad.buttons[13].value;
        this.dPadLeft = this.browserGamepad.buttons[14].value;
        this.dPadRight = this.browserGamepad.buttons[15].value;
    }

    /**
     * Disposes the gamepad
     */
    public dispose() {
        super.dispose();
        this.onButtonDownObservable.clear();
        this.onButtonUpObservable.clear();
        this.onPadDownObservable.clear();
        this.onPadUpObservable.clear();
    }
}
