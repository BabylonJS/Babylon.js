import { Engine } from '../Engines/engine';
import { IDisposable } from '../scene';
import { Nullable } from '../types';

/**
 * POINTER_DEVICE
 * @hidden
 */
export const POINTER_DEVICE: string = "Pointer";
/**
 * KEYBOARD_DEVICE
 * @hidden
 */
export const KEYBOARD_DEVICE: string = "Keyboard";
/**
 * MOUSE_DEVICE
 * @hidden
 */
export const MOUSE_DEVICE: string = "Mouse";

/**
 * This class will take all inputs from Keyboard, Pointer, and
 * any Gamepads and provide a polling system that all devices
 * will use.  This class assumes that there will only be one
 * pointer device and one keyboard.
 */
export class DeviceInputSystem implements IDisposable {
    /**
     * Callback to be triggered when a device is connected
     */
    public onDeviceConnected: (deviceName: string) => void;

    /**
     * Callback to be triggered when a device is disconnected
     */
    public onDeviceDisconnected: (deviceName: string) => void;

    /**
     * Callback to be triggered when event driven input is updated
     */
    public onInputChanged: (deviceName: string, inputIndex: number, previousState: Nullable<number>, currentState: Nullable<number>) => void;

    // Private Members
    private _inputs: { [key: string]: Array<Nullable<number>> } = {};
    private _gamepads: Array<string>;
    private _keyboardActive: boolean = false;
    private _pointerActive: boolean = false;
    private _elementToAttachTo: HTMLElement;

    private _keyboardDownEvent = (evt: any) => { };
    private _keyboardUpEvent = (evt: any) => { };

    private _pointerMoveEvent = (evt: any) => { };
    private _pointerDownEvent = (evt: any) => { };
    private _pointerUpEvent = (evt: any) => { };

    private _gamepadConnectedEvent = (evt: any) => { };
    private _gamepadDisconnectedEvent = (evt: any) => { };

    private static _MAX_KEYCODES: number = 255;
    private static _MAX_POINTER_INPUTS: number = 7;

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
    public pollInput(deviceName: string, inputIndex: number): Nullable<number> {
        const device = this._inputs[deviceName];

        if (!device) {
            return null;
        }

        this._updateDevice(deviceName, inputIndex);

        if (device[inputIndex] === undefined) {
            throw `Unable to find input ${inputIndex} on device ${deviceName}`;
        }

        return device[inputIndex];
    }

    /**
     * Dispose of all the eventlisteners and clears the observables
     */
    public dispose() {
        // Keyboard Events
        if (this._keyboardActive) {
            window.removeEventListener("keydown", this._keyboardDownEvent);
            window.removeEventListener("keyup", this._keyboardUpEvent);
        }

        // Pointer Events
        if (this._pointerActive) {
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
            const device = new Array<Nullable<number>>(numberOfInputs);

            for (let i = 0; i < numberOfInputs; i++) {
                device[i] = null;
            }

            this._inputs[deviceName] = device;
            this.onDeviceConnected(deviceName);
        }
    }

    /**
     * Given a specific device name, remove that device from the device map
     * @param deviceName Name of device to be removed
     */
    private _unregisterDevice(deviceName: string) {
        if (this._inputs[deviceName]) {
            delete this._inputs[deviceName];
            this.onDeviceDisconnected(deviceName);
        }
    }

    /**
     * Handle all actions that come from keyboard interaction
     */
    private _handleKeyActions() {
        this._keyboardDownEvent = ((evt) => {
            if (!this._keyboardActive) {
                this._keyboardActive = true;
                this._registerDevice(KEYBOARD_DEVICE, DeviceInputSystem._MAX_KEYCODES);
            }

            const kbKey = this._inputs[KEYBOARD_DEVICE];
            if (kbKey) {
                if (this.onInputChanged) {
                    this.onInputChanged(KEYBOARD_DEVICE, evt.keyCode, kbKey[evt.keyCode], 1);
                }
                kbKey[evt.keyCode] = 1;
            }
        });

        this._keyboardUpEvent = ((evt) => {
            const kbKey = this._inputs[KEYBOARD_DEVICE];
            if (kbKey) {
                if (this.onInputChanged) {
                    this.onInputChanged(KEYBOARD_DEVICE, evt.keyCode, kbKey[evt.keyCode], 0);
                }
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
            const deviceName = (evt.pointerType == "mouse") ? MOUSE_DEVICE : `${POINTER_DEVICE}-${evt.pointerId}`;

            if (!this._inputs[deviceName]) {
                this._pointerActive = true;
                this._registerDevice(deviceName, DeviceInputSystem._MAX_POINTER_INPUTS);
            }

            const pointer = this._inputs[deviceName];
            if (pointer) {
                if (this.onInputChanged) {
                    this.onInputChanged(deviceName, 0, pointer[0], evt.clientX);
                    this.onInputChanged(deviceName, 1, pointer[1], evt.clientY);
                }
                pointer[0] = evt.clientX;
                pointer[1] = evt.clientY;
            }
        });

        this._pointerDownEvent = ((evt) => {

            const deviceName = (evt.pointerType == "mouse") ? MOUSE_DEVICE : `${POINTER_DEVICE}-${evt.pointerId}`;
            if (!this._inputs[deviceName]) {
                this._pointerActive = true;
                this._registerDevice(deviceName, DeviceInputSystem._MAX_POINTER_INPUTS);
            }

            const pointer = this._inputs[deviceName];
            if (pointer) {
                if (this.onInputChanged) {
                    this.onInputChanged(deviceName, 0, pointer[0], evt.clientX);
                    this.onInputChanged(deviceName, 1, pointer[1], evt.clientY);
                    this.onInputChanged(deviceName, evt.button + 2, pointer[evt.button + 2], 1);
                }
                pointer[0] = evt.clientX;
                pointer[1] = evt.clientY;
                pointer[evt.button + 2] = 1;
            }
        });

        this._pointerUpEvent = ((evt) => {
            const deviceName = (evt.pointerType == "mouse") ? MOUSE_DEVICE : `${POINTER_DEVICE}-${evt.pointerId}`;

            const pointer = this._inputs[deviceName];
            if (pointer) {
                if (this.onInputChanged) {
                    this.onInputChanged(deviceName, evt.button + 2, pointer[evt.button + 2], 0);
                }
                pointer[evt.button + 2] = 0;
            }
            // We don't want to unregister the mouse because we may miss input data when a mouse is moving after a click
            if (evt.pointerType != "mouse")
            {
                this._unregisterDevice(deviceName);
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
            this._gamepads = this._gamepads || new Array<string>(evt.gamepad.index + 1);
            this._gamepads[evt.gamepad.index] = deviceName;
        });

        this._gamepadDisconnectedEvent = ((evt: any) => {
            if (this._gamepads) {
                const deviceName = this._gamepads[evt.gamepad.index];
                this._unregisterDevice(deviceName);
                delete this._gamepads[evt.gamepad.index];
            }
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
        for (const gp of gamepads) {
            if (gp && deviceName == this._gamepads[gp.index]) {
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
