import { Engine } from '../Engines/engine';
import { IDisposable } from '../scene';
import { Nullable } from '../types';
import { DeviceType } from './InputDevices/deviceEnums';

/** @hidden */
declare const _native: any;

/**
 * This class will take all inputs from Keyboard, Pointer, and
 * any Gamepads and provide a polling system that all devices
 * will use.  This class assumes that there will only be one
 * pointer device and one keyboard.
 */
export class DeviceInputSystem implements IDisposable {

    /**
     * Returns onDeviceConnected callback property
     * @returns Callback with function to execute when a device is connected
     */
    public get onDeviceConnected() { return this._onDeviceConnected; }

    /**
     * Sets callback function when a device is connected and executes against all connected devices
     * @param callback Function to execute when a device is connected
     */
    public set onDeviceConnected(callback) {
        this._onDeviceConnected = callback;

        // Iterate through each active device and rerun new callback
        for (let deviceType = 0; deviceType < this._inputs.length; deviceType++) {
            if (this._inputs[deviceType]) {
                for (let deviceSlot = 0; deviceSlot < this._inputs[deviceType].length; deviceSlot++) {
                    if (this._inputs[deviceType][deviceSlot]) {
                        this._onDeviceConnected(deviceType, deviceSlot);
                    }
                }
            }
        }
    }

    /**
     * Callback to be triggered when a device is disconnected
     */
    public onDeviceDisconnected: (deviceType: DeviceType, deviceSlot: number) => void = () => { };

    /**
     * Callback to be triggered when event driven input is updated
     */
    public onInputChanged: (deviceType: DeviceType, deviceSlot: number, inputIndex: number, previousState: Nullable<number>, currentState: Nullable<number>) => void;

    // Private Members
    private _inputs: Array<Array<Array<number>>> = [];
    private _gamepads: Array<DeviceType>;
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

    private _onDeviceConnected: (deviceType: DeviceType, deviceSlot: number) => void = () => { };

    private static _MAX_KEYCODES: number = 255;
    private static _MAX_POINTER_INPUTS: number = 7;

    private constructor(engine: Engine) {
        const inputElement = engine.getInputElement();

        if (inputElement) {
            this._elementToAttachTo = inputElement;
            this._handleKeyActions();
            this._handlePointerActions();
            this._handleGamepadActions();

            // Check for devices that are already connected but aren't registered. Currently, only checks for gamepads and mouse
            this._checkForConnectedDevices();
        }
    }

    /**
     * Creates a new DeviceInputSystem instance
     * @param engine Engine to pull input element from
     * @returns The new instance
     */
    public static Create(engine: Engine): DeviceInputSystem {
        // If running in Babylon Native, then defer to the native input system, which has the same public contract
        if (typeof _native !== 'undefined' && _native.DeviceInputSystem) {
            return new _native.DeviceInputSystem(engine);
        }

        return new DeviceInputSystem(engine);
    }

    // Public functions
    /**
     * Checks for current device input value, given an id and input index
     * @param deviceName Id of connected device
     * @param inputIndex Index of device input
     * @returns Current value of input
     */

    /**
     * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     * @returns Current value of input
     */
    public pollInput(deviceType: DeviceType, deviceSlot: number, inputIndex: number): number {
        const device = this._inputs[deviceType][deviceSlot];

        if (!device) {
            throw `Unable to find device ${DeviceType[deviceType]}`;
        }

        this._updateDevice(deviceType, deviceSlot, inputIndex);

        if (device[inputIndex] === undefined) {
            throw `Unable to find input ${inputIndex} for device ${DeviceType[deviceType]} in slot ${deviceSlot}`;
        }

        return device[inputIndex];
    }

    /**
     * Dispose of all the eventlisteners
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

    /**
     * Checks for existing connections to devices and register them, if necessary
     * Currently handles gamepads and mouse
     */
    private _checkForConnectedDevices() {
        const gamepads = navigator.getGamepads();

        for (const gamepad of gamepads) {
            if (gamepad) {
                this._addGamePad(gamepad);
            }
        }

        // If the device in use has mouse capabilities, pre-register mouse
        if (matchMedia('(pointer:fine)').matches) {
            // This will provide a dummy value for the cursor position and is expected to be overriden when the first mouse event happens.
            // There isn't any good way to get the current position outside of a pointer event so that's why this was done.
            this._addPointerDevice(DeviceType.Mouse, 0, 0, 0);
        }
    }

    // Private functions
    /**
     * Add a gamepad to the DeviceInputSystem
     * @param gamepad A single DOM Gamepad object
     */
    private _addGamePad(gamepad: any) {
        const deviceType = this._getGamepadDeviceType(gamepad.id);
        const deviceSlot = gamepad.index;

        this._registerDevice(deviceType, deviceSlot, gamepad.buttons.length + gamepad.axes.length);
        this._gamepads = this._gamepads || new Array<DeviceType>(gamepad.index + 1);
        this._gamepads[deviceSlot] = deviceType;
    }

    /**
     * Add pointer device to DeviceInputSystem
     * @param deviceType Type of Pointer to add
     * @param deviceSlot Pointer ID (0 for mouse, pointerId for Touch)
     * @param currentX Current X at point of adding
     * @param currentY Current Y at point of adding
     */
    private _addPointerDevice(deviceType: DeviceType, deviceSlot: number, currentX: number, currentY: number) {
        this._pointerActive = true;
        this._registerDevice(deviceType, deviceSlot, DeviceInputSystem._MAX_POINTER_INPUTS);
        const pointer = this._inputs[deviceType][deviceSlot]; /* initalize our pointer position immediately after registration */
        pointer[0] = currentX;
        pointer[1] = currentY;
    }

    /**
     * Add device and inputs to device array
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param numberOfInputs Number of input entries to create for given device
     */
    private _registerDevice(deviceType: DeviceType, deviceSlot: number, numberOfInputs: number) {
        if (!this._inputs[deviceType]) {
            this._inputs[deviceType] = [];
        }

        if (!this._inputs[deviceType][deviceSlot]) {
            const device = new Array<number>(numberOfInputs);

            for (let i = 0; i < numberOfInputs; i++) {
                device[i] = 0; /* set device input as unpressed */
            }

            this._inputs[deviceType][deviceSlot] = device;
            this.onDeviceConnected(deviceType, deviceSlot);
        }
    }

    /**
     * Given a specific device name, remove that device from the device map
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     */
    private _unregisterDevice(deviceType: DeviceType, deviceSlot: number) {
        if (this._inputs[deviceType][deviceSlot]) {
            delete this._inputs[deviceType][deviceSlot];
            this.onDeviceDisconnected(deviceType, deviceSlot);
        }
    }

    /**
     * Handle all actions that come from keyboard interaction
     */
    private _handleKeyActions() {
        this._keyboardDownEvent = ((evt) => {
            if (!this._keyboardActive) {
                this._keyboardActive = true;
                this._registerDevice(DeviceType.Keyboard, 0, DeviceInputSystem._MAX_KEYCODES);
            }

            const kbKey = this._inputs[DeviceType.Keyboard][0];
            if (kbKey) {
                if (this.onInputChanged) {
                    this.onInputChanged(DeviceType.Keyboard, 0, evt.keyCode, kbKey[evt.keyCode], 1);
                }
                kbKey[evt.keyCode] = 1;
            }
        });

        this._keyboardUpEvent = ((evt) => {
            const kbKey = this._inputs[DeviceType.Keyboard][0];
            if (kbKey) {
                if (this.onInputChanged) {
                    this.onInputChanged(DeviceType.Keyboard, 0, evt.keyCode, kbKey[evt.keyCode], 0);
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
            const deviceType = (evt.pointerType == "mouse") ? DeviceType.Mouse : DeviceType.Touch;
            const deviceSlot = (evt.pointerType == "mouse") ? 0 : evt.pointerId;

            if (!this._inputs[deviceType]) {
                this._inputs[deviceType] = [];
            }

            if (!this._inputs[deviceType][deviceSlot]) {
                this._addPointerDevice(deviceType, deviceSlot, evt.clientX, evt.clientY);
            }

            const pointer = this._inputs[deviceType][deviceSlot];
            if (pointer) {
                if (this.onInputChanged) {
                    this.onInputChanged(deviceType, deviceSlot, 0, pointer[0], evt.clientX);
                    this.onInputChanged(deviceType, deviceSlot, 1, pointer[1], evt.clientY);
                }
                pointer[0] = evt.clientX;
                pointer[1] = evt.clientY;
            }
        });

        this._pointerDownEvent = ((evt) => {
            const deviceType = (evt.pointerType == "mouse") ? DeviceType.Mouse : DeviceType.Touch;
            const deviceSlot = (evt.pointerType == "mouse") ? 0 : evt.pointerId;

            if (!this._inputs[deviceType]) {
                this._inputs[deviceType] = [];
            }

            if (!this._inputs[deviceType][deviceSlot]) {
                this._addPointerDevice(deviceType, deviceSlot, evt.clientX, evt.clientY);
            }

            const pointer = this._inputs[deviceType][deviceSlot];
            if (pointer) {
                if (this.onInputChanged) {
                    this.onInputChanged(deviceType, deviceSlot, 0, pointer[0], evt.clientX);
                    this.onInputChanged(deviceType, deviceSlot, 1, pointer[1], evt.clientY);
                    this.onInputChanged(deviceType, deviceSlot, evt.button + 2, pointer[evt.button + 2], 1);
                }
                pointer[0] = evt.clientX;
                pointer[1] = evt.clientY;
                pointer[evt.button + 2] = 1;
            }
        });

        this._pointerUpEvent = ((evt) => {
            const deviceType = (evt.pointerType == "mouse") ? DeviceType.Mouse : DeviceType.Touch;
            const deviceSlot = (evt.pointerType == "mouse") ? 0 : evt.pointerId;

            const pointer = this._inputs[deviceType][deviceSlot];
            if (pointer) {
                if (this.onInputChanged) {
                    this.onInputChanged(deviceType, deviceSlot, evt.button + 2, pointer[evt.button + 2], 0);
                }

                pointer[0] = evt.clientX;
                pointer[1] = evt.clientY;
                pointer[evt.button + 2] = 0;
            }
            // We don't want to unregister the mouse because we may miss input data when a mouse is moving after a click
            if (evt.pointerType != "mouse") {
                this._unregisterDevice(deviceType, deviceSlot);
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
            this._addGamePad(evt.gamepad);
        });

        this._gamepadDisconnectedEvent = ((evt: any) => {
            if (this._gamepads) {
                const deviceType = this._getGamepadDeviceType(evt.gamepad.id);
                const deviceSlot = evt.gamepad.index;

                this._unregisterDevice(deviceType, deviceSlot);
                delete this._gamepads[deviceSlot];
            }
        });

        window.addEventListener("gamepadconnected", this._gamepadConnectedEvent);
        window.addEventListener("gamepaddisconnected", this._gamepadDisconnectedEvent);
    }

    /**
     * Update all non-event based devices with each frame
     * @param deviceType Enum specifiying device type
     * @param deviceSlot "Slot" or index that device is referenced in
     * @param inputIndex Id of input to be checked
     */
    private _updateDevice(deviceType: DeviceType, deviceSlot: number, inputIndex: number) {
        // Gamepads
        const gp = navigator.getGamepads()[deviceSlot];

        if (gp && deviceType == this._gamepads[deviceSlot]) {
            const device = this._inputs[deviceType][deviceSlot];

            if (inputIndex >= gp.buttons.length) {
                device[inputIndex] = gp.axes[inputIndex - gp.buttons.length].valueOf();
            }
            else {
                device[inputIndex] = gp.buttons[inputIndex].value;
            }
        }
    }

    /**
     * Gets DeviceType from the device name
     * @param deviceName Name of Device from DeviceInputSystem
     * @returns DeviceType enum value
     */
    private _getGamepadDeviceType(deviceName: string): DeviceType {
        if (deviceName.indexOf("054c") !== -1) { // DualShock 4 Gamepad
            return DeviceType.DualShock;
        }
        else if (deviceName.indexOf("Xbox One") !== -1 || deviceName.search("Xbox 360") !== -1 || deviceName.search("xinput") !== -1) { // Xbox Gamepad
            return DeviceType.Xbox;
        }
        else if (deviceName.indexOf("057e") !== -1) { // Switch Gamepad
            return DeviceType.Switch;
        }

        return DeviceType.Generic;
    }
}
