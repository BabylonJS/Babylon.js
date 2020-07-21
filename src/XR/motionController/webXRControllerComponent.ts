import { IMinimalMotionControllerObject, MotionControllerComponentType } from './webXRAbstractMotionController';
import { Observable } from '../../Misc/observable';
import { IDisposable } from '../../scene';

/**
 * X-Y values for axes in WebXR
 */
export interface IWebXRMotionControllerAxesValue {
    /**
     * The value of the x axis
     */
    x: number;
    /**
     * The value of the y-axis
     */
    y: number;
}

/**
 * changed / previous values for the values of this component
 */
export interface IWebXRMotionControllerComponentChangesValues<T> {
    /**
     * current (this frame) value
     */
    current: T;
    /**
     * previous (last change) value
     */
    previous: T;
}

/**
 * Represents changes in the component between current frame and last values recorded
 */
export interface IWebXRMotionControllerComponentChanges {
    /**
     * will be populated with previous and current values if axes changed
     */
    axes?: IWebXRMotionControllerComponentChangesValues<IWebXRMotionControllerAxesValue>;
    /**
     * will be populated with previous and current values if pressed changed
     */
    pressed?: IWebXRMotionControllerComponentChangesValues<boolean>;
    /**
     * will be populated with previous and current values if touched changed
     */
    touched?: IWebXRMotionControllerComponentChangesValues<boolean>;
    /**
     * will be populated with previous and current values if value changed
     */
    value?: IWebXRMotionControllerComponentChangesValues<number>;
}
/**
 * This class represents a single component (for example button or thumbstick) of a motion controller
 */
export class WebXRControllerComponent implements IDisposable {
    private _axes: IWebXRMotionControllerAxesValue = {
        x: 0,
        y: 0,
    };
    private _changes: IWebXRMotionControllerComponentChanges = {};
    private _currentValue: number = 0;
    private _hasChanges: boolean = false;
    private _pressed: boolean = false;
    private _touched: boolean = false;

    /**
     * button component type
     */
    public static BUTTON_TYPE: MotionControllerComponentType = 'button';
    /**
     * squeeze component type
     */
    public static SQUEEZE_TYPE: MotionControllerComponentType = 'squeeze';
    /**
     * Thumbstick component type
     */
    public static THUMBSTICK_TYPE: MotionControllerComponentType = 'thumbstick';
    /**
     * Touchpad component type
     */
    public static TOUCHPAD_TYPE: MotionControllerComponentType = 'touchpad';
    /**
     * trigger component type
     */
    public static TRIGGER_TYPE: MotionControllerComponentType = 'trigger';

    /**
     * If axes are available for this component (like a touchpad or thumbstick) the observers will be notified when
     * the axes data changes
     */
    public onAxisValueChangedObservable: Observable<{ x: number; y: number }> = new Observable();
    /**
     * Observers registered here will be triggered when the state of a button changes
     * State change is either pressed / touched / value
     */
    public onButtonStateChangedObservable: Observable<WebXRControllerComponent> = new Observable();

    /**
     * Creates a new component for a motion controller.
     * It is created by the motion controller itself
     *
     * @param id the id of this component
     * @param type the type of the component
     * @param _buttonIndex index in the buttons array of the gamepad
     * @param _axesIndices indices of the values in the axes array of the gamepad
     */
    constructor(
        /**
         * the id of this component
         */
        public id: string,
        /**
         * the type of the component
         */
        public type: MotionControllerComponentType,
        private _buttonIndex: number = -1,
        private _axesIndices: number[] = []
    ) {}

    /**
     * The current axes data. If this component has no axes it will still return an object { x: 0, y: 0 }
     */
    public get axes(): IWebXRMotionControllerAxesValue {
        return this._axes;
    }

    /**
     * Get the changes. Elements will be populated only if they changed with their previous and current value
     */
    public get changes(): IWebXRMotionControllerComponentChanges {
        return this._changes;
    }

    /**
     * Return whether or not the component changed the last frame
     */
    public get hasChanges(): boolean {
        return this._hasChanges;
    }

    /**
     * is the button currently pressed
     */
    public get pressed(): boolean {
        return this._pressed;
    }

    /**
     * is the button currently touched
     */
    public get touched(): boolean {
        return this._touched;
    }

    /**
     * Get the current value of this component
     */
    public get value(): number {
        return this._currentValue;
    }

    /**
     * Dispose this component
     */
    public dispose(): void {
        this.onAxisValueChangedObservable.clear();
        this.onButtonStateChangedObservable.clear();
    }

    /**
     * Are there axes correlating to this component
     * @return true is axes data is available
     */
    public isAxes(): boolean {
        return this._axesIndices.length !== 0;
    }

    /**
     * Is this component a button (hence - pressable)
     * @returns true if can be pressed
     */
    public isButton(): boolean {
        return this._buttonIndex !== -1;
    }

    /**
     * update this component using the gamepad object it is in. Called on every frame
     * @param nativeController the native gamepad controller object
     */
    public update(nativeController: IMinimalMotionControllerObject) {
        let buttonUpdated = false;
        let axesUpdate = false;
        this._hasChanges = false;
        this._changes = {};

        if (this.isButton()) {
            const button = nativeController.buttons[this._buttonIndex];
            // defensive, in case a profile was forced
            if (!button) {
                return;
            }
            if (this._currentValue !== button.value) {
                this.changes.value = {
                    current: button.value,
                    previous: this._currentValue,
                };
                buttonUpdated = true;
                this._currentValue = button.value;
            }
            if (this._touched !== button.touched) {
                this.changes.touched = {
                    current: button.touched,
                    previous: this._touched,
                };
                buttonUpdated = true;
                this._touched = button.touched;
            }
            if (this._pressed !== button.pressed) {
                this.changes.pressed = {
                    current: button.pressed,
                    previous: this._pressed,
                };
                buttonUpdated = true;
                this._pressed = button.pressed;
            }
        }

        if (this.isAxes()) {
            if (this._axes.x !== nativeController.axes[this._axesIndices[0]]) {
                this.changes.axes = {
                    current: {
                        x: nativeController.axes[this._axesIndices[0]],
                        y: this._axes.y,
                    },
                    previous: {
                        x: this._axes.x,
                        y: this._axes.y,
                    },
                };
                this._axes.x = nativeController.axes[this._axesIndices[0]];
                axesUpdate = true;
            }

            if (this._axes.y !== nativeController.axes[this._axesIndices[1]]) {
                if (this.changes.axes) {
                    this.changes.axes.current.y = nativeController.axes[this._axesIndices[1]];
                } else {
                    this.changes.axes = {
                        current: {
                            x: this._axes.x,
                            y: nativeController.axes[this._axesIndices[1]],
                        },
                        previous: {
                            x: this._axes.x,
                            y: this._axes.y,
                        },
                    };
                }
                this._axes.y = nativeController.axes[this._axesIndices[1]];
                axesUpdate = true;
            }
        }

        if (buttonUpdated) {
            this._hasChanges = true;
            this.onButtonStateChangedObservable.notifyObservers(this);
        }
        if (axesUpdate) {
            this._hasChanges = true;
            this.onAxisValueChangedObservable.notifyObservers(this._axes);
        }
    }
}
