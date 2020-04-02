import { Scene } from '../scene';
import { Nullable } from '../types';
import { Observable } from "../Misc/observable";

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
    private _elementToAttachTo: Nullable<HTMLElement>;
    private _maxKeyCodes: number = 222;
    private _maxMouseInputs: number = 7;
    private _maxTouchInputs: number = 3;

    /**
     * Default Constructor
     * @param scene - scene object to check for canvas
     */
    constructor(scene: Scene) {
        this._elementToAttachTo = scene.getEngine().getInputElement();
        this.handleKeyActions();
        this.handlePointerActions();
        this.handleGamepadActions();
    }

    // Public functions
    /**
     * Checks for current device input value, given an id and input index
     * @param deviceName Id of connected device
     * @param inputIndex Index of device input
     * @returns Current value of input
     */
    public pollInput(deviceName: string, inputIndex: number): number {
        const device = this._inputs[deviceName];

        if (device && device![inputIndex] != undefined) {
            this.updateDevices();
            return device![inputIndex];
        }
        else if (device) {
            throw `Unable to find input ${inputIndex} on device ${deviceName}`;
        }
        else {
            throw `Unable to find device ${deviceName}`;
        }
    }

    // Private functions
    /**
     * Add device and inputs to device map
     * @param deviceName Assigned name of device (may be SN)
     * @param numberOfInputs Number of input entries to create for given device
     */
    private registerDevice(deviceName: string, numberOfInputs: number) {
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
    private unregisterDevice(deviceName: string) {
        if (this._inputs[deviceName]) {
            delete this._inputs[deviceName];
            this.onDeviceDisconnectedObservable.notifyObservers(deviceName);
        }
    }

    /**
     * Handle all actions that come from keyboard interaction
     */
    private handleKeyActions() {
        window.addEventListener("keydown", (evt) => {
            if (!this._keyboardActive) {
                this._keyboardActive = true;
                this.registerDevice(DeviceInputSystem.KEYBOARD_DEVICE, this._maxKeyCodes);
            }

            let kbKey = this._inputs[DeviceInputSystem.KEYBOARD_DEVICE];
            if (kbKey) {
                kbKey[evt.keyCode] = 1;
            }
        });

        window.addEventListener("keyup", (evt) => {
            let kbKey = this._inputs[DeviceInputSystem.KEYBOARD_DEVICE];
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
                }

                let pointer = this._inputs[DeviceInputSystem.MOUSE_DEVICE];
                if (pointer) {
                    pointer[0] = evt.clientX;
                    pointer[1] = evt.clientY;
                }
            }
            else if (evt.pointerType == "touch") {
                let touchIndex = this._pointerIds.lastIndexOf(evt.pointerId);
                let pointer = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${touchIndex}`];
                if (pointer) {
                    pointer[0] = evt.clientX;
                    pointer[1] = evt.clientY;
                }
            }
        });

        this._elementToAttachTo?.addEventListener("pointerdown", (evt) => {
            if (evt.pointerType == "mouse") {
                if (!this._mouseActive) {
                    this._mouseActive = true;
                    this.registerDevice(DeviceInputSystem.MOUSE_DEVICE, this._maxMouseInputs);
                }

                let mouseButton = this._inputs[DeviceInputSystem.MOUSE_DEVICE];
                if (mouseButton) {
                    mouseButton[0] = evt.clientX;
                    mouseButton[1] = evt.clientY;
                    mouseButton[evt.button + 2] = 1;
                }
            }
            else if (evt.pointerType == "touch" && this._activeTouchNumber < this._maxTouchInputs) {
                this._pointerIds.push(evt.pointerId);
                if (!this._touchActive) {
                    this._touchActive = true;

                    // Initialize all potential touch inputs
                    for (let i = 0; i < this._maxTouchInputs; i++) {
                        this.registerDevice(`${DeviceInputSystem.TOUCH_DEVICE}-${i}`, this._maxTouchInputs);
                    }
                }

                let touchButton = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${this._pointerIds.lastIndexOf(evt.pointerId)}`];
                if (touchButton) {
                    touchButton[0] = evt.clientX;
                    touchButton[1] = evt.clientY;
                    touchButton[2] = 1;
                    this._activeTouchNumber++;
                }
            }
        });

        this._elementToAttachTo?.addEventListener("pointerup", (evt) => {
            if (evt.pointerType == "mouse") {
                let mouseButton = this._inputs[DeviceInputSystem.MOUSE_DEVICE];
                if (mouseButton) {
                    mouseButton[evt.button + 2] = 0;
                }
            }
            else if (evt.pointerType == "touch") {
                let touchIndex = this._pointerIds.lastIndexOf(evt.pointerId);
                let touchButton = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${touchIndex}`];
                if (touchButton) {
                    this._pointerIds.splice(touchIndex, 1);

                    // Push values of touch inputs down
                    for (let i = touchIndex; i < this._activeTouchNumber; i++) {
                        let nextTouch = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${i + 1}`];
                        let currentTouch = this._inputs[`${DeviceInputSystem.TOUCH_DEVICE}-${i}`];

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
    }

    /**
     * Handle all actions that come from gamepad interaction
     */
    private handleGamepadActions() {
        window.addEventListener("gamepadconnected", (evt: any) => {
            const deviceName = `${evt.gamepad.id}-${evt.gamepad.index}`;
            this.registerDevice(deviceName, evt.gamepad.buttons.length + evt.gamepad.axes.length);
        });

        window.addEventListener("gamepaddisconnected", (evt: any) => {
            const deviceName = `${evt.gamepad.id}-${evt.gamepad.index}`;
            this.unregisterDevice(deviceName);
        });
    }

    /**
     * Update all non-event based devices with each frame
     */
    private updateDevices() {
        // Gamepads
        const gamepads = navigator.getGamepads();

        for (let j = 0; j < gamepads.length; j++) {
            let gp = gamepads[j];

            if (gp) {
                for (let i = 0; i < gp.buttons.length; i++) {
                    let button = this._inputs[`${gp.id}-${gp.index}`];
                    if (button) {
                        button[i] = gp.buttons[i].value;
                    }
                }

                for (let i = 0; i < gp.axes.length; i++) {
                    let axis = this._inputs[`${gp.id}-${gp.index}`];
                    if (axis) {
                        axis[i + gp.buttons.length] = gp.axes[i].valueOf();
                    }
                }
            }
        }
    }
}