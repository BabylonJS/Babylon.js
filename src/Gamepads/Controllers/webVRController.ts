import { Observable } from "../../Misc/observable";
import { Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { PoseEnabledController, ExtendedGamepadButton, MutableGamepadButton } from "./poseEnabledController";
import { StickValues, GamepadButtonChanges } from "../../Gamepads/gamepad";
import { Nullable } from '../../types';

/**
 * Defines the WebVRController object that represents controllers tracked in 3D space
 */
export abstract class WebVRController extends PoseEnabledController {
    /**
     * Internal, the default controller model for the controller
     */
    protected _defaultModel: Nullable<AbstractMesh>;

    // Observables
    /**
     * Fired when the trigger state has changed
     */
    public onTriggerStateChangedObservable = new Observable<ExtendedGamepadButton>();
    /**
     * Fired when the main button state has changed
     */
    public onMainButtonStateChangedObservable = new Observable<ExtendedGamepadButton>();
    /**
     * Fired when the secondary button state has changed
     */
    public onSecondaryButtonStateChangedObservable = new Observable<ExtendedGamepadButton>();
    /**
     * Fired when the pad state has changed
     */
    public onPadStateChangedObservable = new Observable<ExtendedGamepadButton>();
    /**
     * Fired when controllers stick values have changed
     */
    public onPadValuesChangedObservable = new Observable<StickValues>();

    /**
     * Array of button availible on the controller
     */
    protected _buttons: Array<MutableGamepadButton>;

    private _onButtonStateChange: (controlledIndex: number, buttonIndex: number, state: ExtendedGamepadButton) => void;

    /**
     * Fired when a controller button's state has changed
     * @param callback the callback containing the button that was modified
     */
    public onButtonStateChange(callback: (controlledIndex: number, buttonIndex: number, state: ExtendedGamepadButton) => void) {
        this._onButtonStateChange = callback;
    }

    /**
     * X and Y axis corresponding to the controllers joystick
     */
    public pad: StickValues = { x: 0, y: 0 };

    /**
     * 'left' or 'right', see https://w3c.github.io/gamepad/extensions.html#gamepadhand-enum
     */
    public hand: string;

    /**
     * The default controller model for the controller
     */
    public get defaultModel(): Nullable<AbstractMesh> {
        return this._defaultModel;
    }

    /**
     * Creates a new WebVRController from a gamepad
     * @param vrGamepad the gamepad that the WebVRController should be created from
     */
    constructor(vrGamepad: any) {
        super(vrGamepad);
        this._buttons = new Array<ExtendedGamepadButton>(vrGamepad.buttons.length);
        this.hand = vrGamepad.hand;
    }

    /**
     * Updates the state of the controller and mesh based on the current position and rotation of the controller
     */
    public update() {
        super.update();
        for (var index = 0; index < this._buttons.length; index++) {
            this._setButtonValue(this.browserGamepad.buttons[index], this._buttons[index], index);
        }
        if (this.leftStick.x !== this.pad.x || this.leftStick.y !== this.pad.y) {
            this.pad.x = this.leftStick.x;
            this.pad.y = this.leftStick.y;
            this.onPadValuesChangedObservable.notifyObservers(this.pad);
        }
    }

    /**
     * Function to be called when a button is modified
     */
    protected abstract _handleButtonChange(buttonIdx: number, value: ExtendedGamepadButton, changes: GamepadButtonChanges): void;

    /**
     * Loads a mesh and attaches it to the controller
     * @param scene the scene the mesh should be added to
     * @param meshLoaded callback for when the mesh has been loaded
     */
    public abstract initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void): void;

    private _setButtonValue(newState: ExtendedGamepadButton, currentState: ExtendedGamepadButton, buttonIndex: number) {
        if (!newState) {
            newState = {
                pressed: false,
                touched: false,
                value: 0
            };
        }
        if (!currentState) {
            this._buttons[buttonIndex] = {
                pressed: newState.pressed,
                touched: newState.touched,
                value: newState.value
            };
            return;
        }
        this._checkChanges(newState, currentState);
        if (this._changes.changed) {
            this._onButtonStateChange && this._onButtonStateChange(this.index, buttonIndex, newState);

            this._handleButtonChange(buttonIndex, newState, this._changes);
        }
        this._buttons[buttonIndex].pressed = newState.pressed;
        this._buttons[buttonIndex].touched = newState.touched;
        // oculus triggers are never 0, thou not touched.
        this._buttons[buttonIndex].value = newState.value < 0.00000001 ? 0 : newState.value;
    }

    // avoid GC, store state in a tmp object
    private _changes: GamepadButtonChanges = {
        pressChanged: false,
        touchChanged: false,
        valueChanged: false,
        changed: false
    };

    private _checkChanges(newState: ExtendedGamepadButton, currentState: ExtendedGamepadButton) {
        this._changes.pressChanged = newState.pressed !== currentState.pressed;
        this._changes.touchChanged = newState.touched !== currentState.touched;
        this._changes.valueChanged = newState.value !== currentState.value;
        this._changes.changed = this._changes.pressChanged || this._changes.touchChanged || this._changes.valueChanged;
        return this._changes;
    }

    /**
     * Disposes of th webVRCOntroller
     */
    public dispose(): void {
        super.dispose();

        this._defaultModel = null;

        this.onTriggerStateChangedObservable.clear();
        this.onMainButtonStateChangedObservable.clear();
        this.onSecondaryButtonStateChangedObservable.clear();
        this.onPadStateChangedObservable.clear();
        this.onPadValuesChangedObservable.clear();
    }
}
