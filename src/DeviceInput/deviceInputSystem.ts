import { Engine } from '../Engines/engine';
import { Nullable } from '../types';

/**
 * This class will take all inputs from Keyboard, Pointer, and
 * any Gamepads and provide a polling system that all devices
 * will use.  This class assumes that there will only be one
 * pointer device and one keyboard.
 */
export class DeviceInputSystem {
    // Private Members
    private _inputs: Map<string, Array<number>> = new Map();
    private _onDeviceConnected: (deviceName: string) => void = () => { };
    private _onDeviceDisconnected: (deviceName: string) => void = () => { };
    private _pointerIds: Array<number> = [];
    private _activeTouchNumber: number = 0;
    private _keyboardActive: boolean = false;
    private _mouseActive: boolean = false;
    private _touchActive: boolean = false;
    private _elementToAttachTo: Nullable<HTMLElement>;
    private _maxKeyCodes: number = 222;
    private _maxMouseInputs: number = 7;
    private _maxTouchInputs: number = 3;

    /**
     * Default Constructor
     * @param elementToAttachTo - element to attach events to (usually canvas)
     */
    constructor(elementToAttachTo: Nullable<HTMLElement>) {
        this._elementToAttachTo = elementToAttachTo;
        this.handleKeyActions();
        this.handlePointerActions();
        this.handleGamepadActions();
        this.updateDevices();
    }

    // Public functions
    /**
     * Checks for current device input value, given an id and input index
     * @param deviceName Id of connected device
     * @param inputIndex Index of device input
     * @returns Current value of input
     */
    public pollInput(deviceName: string, inputIndex: number): number {
        if (this._inputs.has(deviceName)) {
            var device = this._inputs.get(deviceName);

            if (device![inputIndex] != undefined) {
                return device![inputIndex];
            }
            else {
                throw `Unable to find input ${inputIndex} on device ${deviceName}`;
            }
        }
        else {
            throw `Unable to find device ${deviceName}`;
        }
    }

    /**
     * When a device is connected, perform user specified function
     * @param callback Callback function to use when a device is connected
     */
    public onDeviceConnected(callback: (deviceName: string) => void): void {
        this._onDeviceConnected = callback;
    }

    /**
     * When a device is disconnected, perform user specified function
     * @param callback Callback function to use when a device is disconnected
     */
    public onDeviceDisconnected(callback: (deviceName: string) => void): void {
        this._onDeviceDisconnected = callback;
    }

    // Private functions
    /**
     * Add device and inputs to device map
     * @param deviceName Assigned name of device (may be SN)
     * @param numberOfInputs Number of input entries to create for given device
     */
    private registerDevice(deviceName: string, numberOfInputs: number) {
        if (!this._inputs.has(deviceName)) {
            var device: Array<number> = [];
            for (var i = 0; i < numberOfInputs; i++) {
                device.push(0);
            }

            this._inputs.set(deviceName, device);
        }
    }

    /**
     * Given a specific device name, remove that device from the device map
     * @param deviceName Name of device to be removed
     */
    private deregisterDevice(deviceName: string) {
        this._inputs.delete(deviceName);
    }

    /**
     * Handle all actions that come from keyboard interaction
     */
    private handleKeyActions() {
        window.addEventListener("keydown", (evt) => {
            if (!this._keyboardActive) {
                this._keyboardActive = true;
                this.registerDevice(DeviceInputSystem.KEYBOARD_DEVICE, this._maxKeyCodes);
                this._onDeviceConnected(DeviceInputSystem.KEYBOARD_DEVICE);
            }

            let kbKey = this._inputs.get(DeviceInputSystem.KEYBOARD_DEVICE);
            if (kbKey) {
                kbKey[evt.keyCode] = 1;
            }
        });

        window.addEventListener("keyup", (evt) => {
            let kbKey = this._inputs.get(DeviceInputSystem.KEYBOARD_DEVICE);
            if (kbKey) {
                kbKey[evt.keyCode] = 0;
            }
        });
    }

    /**
     * Handle all actions that come from pointer interaction
     */
    private handlePointerActions() {
        this._elementToAttachTo?.addEventListener("pointermove", (evt) => {
            if (evt.pointerType == "mouse") {
                if (!this._mouseActive) {
                    this._mouseActive = true;
                    this.registerDevice(DeviceInputSystem.MOUSE_DEVICE, this._maxMouseInputs);
                    this._onDeviceConnected(DeviceInputSystem.MOUSE_DEVICE);
                }

                let pointerX = this._inputs.get(DeviceInputSystem.MOUSE_DEVICE);
                if (pointerX) {
                    pointerX[0] = evt.clientX;
                }

                let pointerY = this._inputs.get(DeviceInputSystem.MOUSE_DEVICE);
                if (pointerY) {
                    pointerY[1] = evt.clientY;
                }
            }
            else if (evt.pointerType == "touch") {
                let touchIndex = this._pointerIds.lastIndexOf(evt.pointerId);
                let pointerX = this._inputs.get(`${DeviceInputSystem.TOUCH_DEVICE}-${touchIndex}`);
                if (pointerX) {
                    pointerX[0] = evt.clientX;
                }

                let pointerY = this._inputs.get(`${DeviceInputSystem.TOUCH_DEVICE}-${touchIndex}`);
                if (pointerY) {
                    pointerY[1] = evt.clientY;
                }
            }
        });

        this._elementToAttachTo?.addEventListener("pointerdown", (evt) => {
            if (evt.pointerType == "mouse") {
                if (!this._mouseActive) {
                    this._mouseActive = true;
                    this.registerDevice(DeviceInputSystem.MOUSE_DEVICE, this._maxMouseInputs);
                    this._onDeviceConnected(DeviceInputSystem.MOUSE_DEVICE);
                }

                let mouseButton = this._inputs.get(DeviceInputSystem.MOUSE_DEVICE);
                if (mouseButton) {
                    mouseButton[evt.button + 2] = 1;
                }
            }
            else if (evt.pointerType == "touch" && this._activeTouchNumber < this._maxTouchInputs) {
                if (!this._touchActive) {
                    this._touchActive = true;
                    this._pointerIds.push(evt.pointerId);

                    // Initialize all potential touch inputs
                    for (var i = 0; i < this._maxTouchInputs; i++) {
                        this.registerDevice(`${DeviceInputSystem.TOUCH_DEVICE}-${i}`, this._maxTouchInputs);
                        this._onDeviceConnected(`${DeviceInputSystem.TOUCH_DEVICE}-${i}`);
                    }
                }

                let touchButton = this._inputs.get(`${DeviceInputSystem.TOUCH_DEVICE}-${this._pointerIds.lastIndexOf(evt.pointerId)}`);
                if (touchButton) {
                    touchButton[this._activeTouchNumber++] = 1;
                }
            }
        });

        this._elementToAttachTo?.addEventListener("pointerup", (evt) => {
            if (evt.pointerType == "mouse") {
                let mouseButton = this._inputs.get(DeviceInputSystem.MOUSE_DEVICE);
                if (mouseButton) {
                    mouseButton[evt.button + 2] = 0;
                }
            }
            else if (evt.pointerType == "touch") {
                let touchIndex = this._pointerIds.lastIndexOf(evt.pointerId);
                let touchButton = this._inputs.get(`${DeviceInputSystem.TOUCH_DEVICE}-${touchIndex}`);
                if (touchButton) {
                    this._pointerIds.splice(touchIndex, 1);
                    touchButton[--this._activeTouchNumber] = 0;
                }
            }
        });
    }

    /**
     * Handle all actions that come from gamepad interaction
     */
    private handleGamepadActions() {
        window.addEventListener("gamepadconnected", (evt: any) => {
            var deviceName = `${evt.gamepad.id}-${evt.gamepad.index}`;
            this.registerDevice(deviceName, evt.gamepad.buttons.length + evt.gamepad.axes.length);
            this._onDeviceConnected(deviceName);
        });

        window.addEventListener("gamepaddisconnected", (evt: any) => {
            var deviceName = `${evt.gamepad.id}-${evt.gamepad.index}`;
            this.deregisterDevice(deviceName);
            this._onDeviceDisconnected(deviceName);
        });
    }

    /**
     * Update all non-event based devices with each frame
     */
    private updateDevices() {
        // Gamepads
        var gamepads = this.getGamePads();

        for (var j = 0; j < gamepads.length; j++) {
            let gp = gamepads[j];

            if (gp) {
                for (var i = 0; i < gp.buttons.length; i++) {
                    let button = this._inputs.get(`${gp.id}-${gp.index}`);
                    if (button) {
                        button[i] = gp.buttons[i].value;
                    }
                }

                for (var i = 0; i < gp.axes.length; i++) {
                    let axis = this._inputs.get(`${gp.id}-${gp.index}`);
                    if (axis) {
                        axis[i + gp.buttons.length] = gp.axes[i].valueOf();
                    }
                }
            }
        }

        Engine.QueueNewFrame(() => { this.updateDevices(); });
    }

    /**
     * getGamePads: returns all gamepads
     * @returns array with active gamepads
     */
    private getGamePads(): (Gamepad | null)[] {
        return navigator.getGamepads();
    }

    // Static
    /** MOUSE_DEVICE */
    public static readonly MOUSE_DEVICE: string = "Mouse";
    /** TOUCH_DEVICE */
    public static readonly TOUCH_DEVICE: string = "Touch";
    /** KEYBOARD_DEVICE */
    public static readonly KEYBOARD_DEVICE: string = "Keyboard";
}