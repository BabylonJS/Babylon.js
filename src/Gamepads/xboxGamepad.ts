import { Observable } from "../Misc/observable";
import { Gamepad } from "../Gamepads/gamepad";
/**
 * Defines supported buttons for XBox360 compatible gamepads
 */
export enum Xbox360Button {
    /** A */
    A = 0,
    /** B */
    B = 1,
    /** X */
    X = 2,
    /** Y */
    Y = 3,
    /** Left button */
    LB = 4,
    /** Right button */
    RB = 5,
    /** Back */
    Back = 8,
    /** Start */
    Start = 9,
    /** Left stick */
    LeftStick = 10,
    /** Right stick */
    RightStick = 11
}

/** Defines values for XBox360 DPad  */
export enum Xbox360Dpad {
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
 * Defines a XBox360 gamepad
 */
export class Xbox360Pad extends Gamepad {
    private _leftTrigger: number = 0;
    private _rightTrigger: number = 0;

    private _onlefttriggerchanged: (value: number) => void;
    private _onrighttriggerchanged: (value: number) => void;

    private _onbuttondown: (buttonPressed: Xbox360Button) => void;
    private _onbuttonup: (buttonReleased: Xbox360Button) => void;
    private _ondpaddown: (dPadPressed: Xbox360Dpad) => void;
    private _ondpadup: (dPadReleased: Xbox360Dpad) => void;

    /** Observable raised when a button is pressed */
    public onButtonDownObservable = new Observable<Xbox360Button>();
    /** Observable raised when a button is released */
    public onButtonUpObservable = new Observable<Xbox360Button>();
    /** Observable raised when a pad is pressed */
    public onPadDownObservable = new Observable<Xbox360Dpad>();
    /** Observable raised when a pad is released */
    public onPadUpObservable = new Observable<Xbox360Dpad>();

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

    private _isXboxOnePad: boolean = false;

    /**
     * Creates a new XBox360 gamepad object
     * @param id defines the id of this gamepad
     * @param index defines its index
     * @param gamepad defines the internal HTML gamepad object
     * @param xboxOne defines if it is a XBox One gamepad
     */
    constructor(id: string, index: number, gamepad: any, xboxOne: boolean = false) {
        super(id, index, gamepad, 0, 1, 2, 3);
        this.type = Gamepad.XBOX;
        this._isXboxOnePad = xboxOne;
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
    public onbuttondown(callback: (buttonPressed: Xbox360Button) => void) {
        this._onbuttondown = callback;
    }

    /**
     * Defines the callback to call when a button is released
     * @param callback defines the callback to use
     */
    public onbuttonup(callback: (buttonReleased: Xbox360Button) => void) {
        this._onbuttonup = callback;
    }

    /**
     * Defines the callback to call when a pad is pressed
     * @param callback defines the callback to use
     */
    public ondpaddown(callback: (dPadPressed: Xbox360Dpad) => void) {
        this._ondpaddown = callback;
    }

    /**
     * Defines the callback to call when a pad is released
     * @param callback defines the callback to use
     */
    public ondpadup(callback: (dPadReleased: Xbox360Dpad) => void) {
        this._ondpadup = callback;
    }

    private _setButtonValue(newValue: number, currentValue: number, buttonType: Xbox360Button): number {
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

    private _setDPadValue(newValue: number, currentValue: number, buttonType: Xbox360Dpad): number {
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
     * Gets the value of the `A` button
     */
    public get buttonA(): number {
        return this._buttonA;
    }
    /**
     * Sets the value of the `A` button
     */
    public set buttonA(value) {
        this._buttonA = this._setButtonValue(value, this._buttonA, Xbox360Button.A);
    }

    /**
     * Gets the value of the `B` button
     */
    public get buttonB(): number {
        return this._buttonB;
    }
    /**
     * Sets the value of the `B` button
     */
    public set buttonB(value) {
        this._buttonB = this._setButtonValue(value, this._buttonB, Xbox360Button.B);
    }

    /**
     * Gets the value of the `X` button
     */
    public get buttonX(): number {
        return this._buttonX;
    }
    /**
     * Sets the value of the `X` button
     */
    public set buttonX(value) {
        this._buttonX = this._setButtonValue(value, this._buttonX, Xbox360Button.X);
    }

    /**
     * Gets the value of the `Y` button
     */
    public get buttonY(): number {
        return this._buttonY;
    }
    /**
     * Sets the value of the `Y` button
     */
    public set buttonY(value) {
        this._buttonY = this._setButtonValue(value, this._buttonY, Xbox360Button.Y);
    }

    /**
     * Gets the value of the `Start` button
     */
    public get buttonStart(): number {
        return this._buttonStart;
    }
    /**
     * Sets the value of the `Start` button
     */
    public set buttonStart(value) {
        this._buttonStart = this._setButtonValue(value, this._buttonStart, Xbox360Button.Start);
    }

    /**
     * Gets the value of the `Back` button
     */
    public get buttonBack(): number {
        return this._buttonBack;
    }
    /**
     * Sets the value of the `Back` button
     */
    public set buttonBack(value) {
        this._buttonBack = this._setButtonValue(value, this._buttonBack, Xbox360Button.Back);
    }

    /**
     * Gets the value of the `Left` button
     */
    public get buttonLB(): number {
        return this._buttonLB;
    }
    /**
     * Sets the value of the `Left` button
     */
    public set buttonLB(value) {
        this._buttonLB = this._setButtonValue(value, this._buttonLB, Xbox360Button.LB);
    }

    /**
     * Gets the value of the `Right` button
     */
    public get buttonRB(): number {
        return this._buttonRB;
    }
    /**
     * Sets the value of the `Right` button
     */
    public set buttonRB(value) {
        this._buttonRB = this._setButtonValue(value, this._buttonRB, Xbox360Button.RB);
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
        this._buttonLeftStick = this._setButtonValue(value, this._buttonLeftStick, Xbox360Button.LeftStick);
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
        this._buttonRightStick = this._setButtonValue(value, this._buttonRightStick, Xbox360Button.RightStick);
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
        this._dPadUp = this._setDPadValue(value, this._dPadUp, Xbox360Dpad.Up);
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
        this._dPadDown = this._setDPadValue(value, this._dPadDown, Xbox360Dpad.Down);
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
        this._dPadLeft = this._setDPadValue(value, this._dPadLeft, Xbox360Dpad.Left);
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
        this._dPadRight = this._setDPadValue(value, this._dPadRight, Xbox360Dpad.Right);
    }

    /**
     * Force the gamepad to synchronize with device values
     */
    public update() {
        super.update();
        if (this._isXboxOnePad) {
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
        } else {
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
