import { Observable } from "../Misc/observable";
import { Engine } from '../Engines/engine';

/**
 * This class will take all inputs from Keyboard, Pointer, and
 * any Gamepads and provide a polling system that all devices
 * will use.  This class assumes that there will only be one
 * pointer device and one keyboard.
 */
export class DeviceInputSystem {
    // Static
    /** MOUSE_DEVICE */
    public static readonly MOUSE_DEVICE: string = "Mouse";
    /** TOUCH_DEVICE */
    public static readonly TOUCH_DEVICE: string = "Touch";
    /** KEYBOARD_DEVICE */
    public static readonly KEYBOARD_DEVICE: string = "Keyboard";

    /**
     * Observable to be triggered when a device is connected
     */
    public onDeviceConnectedObservable = new Observable<string>();

    /**
     * Observable to be triggered when a device is disconnected
     */
    public onDeviceDisconnectedObservable = new Observable<string>();

    // Private Members
    private _inputs: { [key: string]: Array<number> } = {};
    private _pointerIds: Array<number> = [];
    private _activeTouchNumber: number = 0;
    private _keyboardActive: boolean = false;
    private _mouseActive: boolean = false;
    private _touchActive: boolean = false;
    private _elementToAttachTo: HTMLElement;

    private _keyboardDownEvent = (evt: any) => { };
    private _keyboardUpEvent = (evt: any) => { };

    private _pointerMoveEvent = (evt: any) => { };
    private _pointerDownEvent = (evt: any) => { };
    private _pointerUpEvent = (evt: any) => { };

    private _gamepadConnectedEvent = (evt: any) => { };
    private _gamepadDisconnectedEvent = (evt: any) => { };

    private static _MAX_KEYCODES: number = 222;
    private static _MAX_MOUSE_INPUTS: number = 7;
    private static _MAX_TOUCH_INPUTS: number = 3;

    /**
     * Default Constructor
     * @param engine - engine to pull input element from
     */
    constructor(engine: Engine) {
        const inputElement = engine.getInputElement();
        if (inputElement) {
            this._elementToAttachTo = inputElement;
            this._handleKeyActions();
            this._handlePointerActions();
            this._handleGamepadActions();
        }
    }

    // Public functions
    /**
     * Checks for current device input value, given an id and input index
     * @param deviceName Id of connected device
     * @param inputIndex Index of device input
     * @returns Current value of input
     */
    public pollInput(deviceName: string, inputIndex: number): number | undefined {
        const device = this._inputs[deviceName];

        if (!device) {
            throw `Unable to find device ${deviceName}`;
        }
        if (device[inputIndex] === undefined) {
            throw `Unable to find input ${inputIndex} on device ${deviceName}`;
        }
        this._updateDevice(deviceName, inputIndex);
        return device[inputIndex];
    }

    /**
     * Dispose of all the eventlisteners and clears the observables
     */
    public dispose() {
        this.onDeviceConnectedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();

        // Keyboard Events
        if (this._keyboardActive) {
            window.removeEventListener("keydown", this._keyboardDownEvent);
            window.removeEventListener("keyup", this._keyboardUpEvent);
        }

        // Pointer Events
        if (this._mouseActive || this._touchActive) {
            this._elementToAttachTo.removeEventListener("pointermove", this._pointerMoveEvent);
            this._elementToAttachTo.removeEventListener("pointerdown", this._pointerDownEvent);
            this._elementToAttachTo.removeEventListener("pointerup", this._pointerUpEvent);
        }

        // Gamepad Events
        window.removeEventListener("gamepadconnected", this._gamepadConnectedEvent);
        window.removeEventListener("gamepaddisconnected", this._gamepadDisconnectedEvent);
    }

    // Private functions
    /**
     * Add device and inputs to device map
     * @param deviceName Assigned name of device (may be SN)
     * @param numberOfInputs Number of input entries to create for given device
     */
    private _registerDevice(deviceName: string, numberOfInputs: number) {
        if (!this._inputs[deviceName]) {
            const device = new Array<number>(numberOfInputs);

            for (let i = 0; i < numberOfInputs; i++) {
                device[i] = 0;
            }

            this._inputs[deviceName] = device;
            this.onDeviceConnectedObservable.notifyObservers(deviceName);
        }
    }

    /**
     * Given a specific device name, remove that device from the device map
     * @param deviceName Name of device to be removed
     */
    private _unregisterDevice(deviceName: string) {
        if (this._inputs[deviceName]) {
            delete this._inputs[deviceName];
            this.onDeviceDisconnectedObservable.notifyObservers(deviceName);
        }
    }

    /**
     * Handle all actions that come from keyboard interaction
     */
    private _handleKeyActions() {
        this._keyboardDownEvent = ((evt) => {
            if (!this._keyboardActive) {
                this._keyboardActive = true;
                this._registerDevice(DeviceInputSystem.KEYBOARD_DEVICE, DeviceInputSystem._MAX_KEYCODES);
            }

            const kbKey = this._inputs[DeviceInputSystem.KEYBOARD_DEVICE];
            if (kbKey) {
                kbKey[evt.keyCode] = 1;
            }
        });

        this._keyboardUpEvent = ((evt) => {
            const kbKey = this._inputs[DeviceInputSystem.KEYBOARD_DEVICE];
            if (kbKey) {
                kbKey[evt.keyCode] = 0;
            }
        });

        window.addEventListener("keydown", this._keyboardDownEvent);
        window.addEventListener("keyup", this._keyboardUpEvent);
    }

    /**
     * Handle all actions that come from pointer interaction
     */
    private _handlePointerActions() {
        this._pointerMoveEvent = ((evt) => {
            if (evt.pointerType == "mouse") {
                if (!this._mouseActive) {
                    this._mouseActive = true;
                    this._registerDevice(DeviceInputSystem.MOUSE_DEVICE, DeviceInputSystem._MAX_MOUSE_INPUTS);
                }

                const pointer = this._inputs[DeviceInputSystem.MOUSE_DEVICE];
                if (pointer) {
                    pointer[0] = evt.clientX;
                    pointer[1] = evt.clientY;
                }
            }
            else if (evt.pointerType == "touch") {
                const touchIndex = this._pointerIds.lastIndexOf(evt.pointerId);
                const pointer = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${touchIndex}`];
                if (pointer) {
                    pointer[0] = evt.clientX;
                    pointer[1] = evt.clientY;
                }
            }
        });

        this._pointerDownEvent = ((evt) => {
            if (evt.pointerType == "mouse") {
                if (!this._mouseActive) {
                    this._mouseActive = true;
                    this._registerDevice(DeviceInputSystem.MOUSE_DEVICE, DeviceInputSystem._MAX_MOUSE_INPUTS);
                }

                const mouseButton = this._inputs[DeviceInputSystem.MOUSE_DEVICE];
                if (mouseButton) {
                    mouseButton[0] = evt.clientX;
                    mouseButton[1] = evt.clientY;
                    mouseButton[evt.button + 2] = 1;
                }
            }
            else if (evt.pointerType == "touch" && this._activeTouchNumber < DeviceInputSystem._MAX_TOUCH_INPUTS) {
                this._pointerIds.push(evt.pointerId);
                if (!this._touchActive) {
                    this._touchActive = true;

                    // Initialize all potential touch inputs
                    for (let i = 0; i < DeviceInputSystem._MAX_TOUCH_INPUTS; i++) {
                        this._registerDevice(`${DeviceInputSystem.TOUCH_DEVICE}-${i}`, DeviceInputSystem._MAX_TOUCH_INPUTS);
                    }
                }

                const touchButton = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${this._pointerIds.lastIndexOf(evt.pointerId)}`];
                if (touchButton) {
                    touchButton[0] = evt.clientX;
                    touchButton[1] = evt.clientY;
                    touchButton[2] = 1;
                    this._activeTouchNumber++;
                }
            }
        });

        this._pointerUpEvent = ((evt) => {
            if (evt.pointerType == "mouse") {
                const mouseButton = this._inputs[DeviceInputSystem.MOUSE_DEVICE];
                if (mouseButton) {
                    mouseButton[evt.button + 2] = 0;
                }
            }
            else if (evt.pointerType == "touch") {
                const touchIndex = this._pointerIds.lastIndexOf(evt.pointerId);
                const touchButton = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${touchIndex}`];
                if (touchButton) {
                    this._pointerIds.splice(touchIndex, 1);

                    // Push values of touch inputs down
                    for (let i = touchIndex; i < this._activeTouchNumber; i++) {
                        const nextTouch = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${i + 1}`];
                        const currentTouch = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${i}`];

                        if (currentTouch && nextTouch) {
                            currentTouch[0] = nextTouch[0];
                            currentTouch[1] = nextTouch[1];
                            currentTouch[2] = nextTouch[2];
                        }
                        else if (currentTouch) {
                            currentTouch[0] = 0;
                            currentTouch[1] = 0;
                            currentTouch[2] = 0;
                        }
                    }

                    --this._activeTouchNumber;
                }
            }
        });

        this._elementToAttachTo.addEventListener("pointermove", this._pointerMoveEvent);
        this._elementToAttachTo.addEventListener("pointerdown", this._pointerDownEvent);
        this._elementToAttachTo.addEventListener("pointerup", this._pointerUpEvent);
    }

    /**
     * Handle all actions that come from gamepad interaction
     */
    private _handleGamepadActions() {
        this._gamepadConnectedEvent = ((evt: any) => {
            const deviceName = `${evt.gamepad.id}-${evt.gamepad.index}`;
            this._registerDevice(deviceName, evt.gamepad.buttons.length + evt.gamepad.axes.length);
        });

        this._gamepadDisconnectedEvent = ((evt: any) => {
            const deviceName = `${evt.gamepad.id}-${evt.gamepad.index}`;
            this._unregisterDevice(deviceName);
        });

        window.addEventListener("gamepadconnected", this._gamepadConnectedEvent);
        window.addEventListener("gamepaddisconnected", this._gamepadDisconnectedEvent);
    }

    /**
     * Update all non-event based devices with each frame
     */
    private _updateDevice(deviceName: string, inputIndex: number) {
        // Gamepads
        const gamepads = navigator.getGamepads();

        // Look for current gamepad and get updated values
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp && deviceName == `${gp.id}-${gp.index}`) {
                const device = this._inputs[deviceName];

                if (inputIndex >= gp.buttons.length) {
                    device[inputIndex] = gp.axes[inputIndex - gp.buttons.length].valueOf();
                }
                else {
                    device[inputIndex] = gp.buttons[inputIndex].value;
                }
            }
        }
    }
}