import { Engine } from "../../Engines/engine";
import { IEvent } from "../../Events/deviceInputEvents";
import { Observable, Observer } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";
import { DeviceEventFactory } from "../Helpers/eventFactory";
import { DeviceType, PointerInput } from "../InputDevices/deviceEnums";
import { IDeviceEvent, IDeviceInputSystem } from "../Interfaces/inputInterfaces";

/** @hidden */
export class WebDeviceInputSystem implements IDeviceInputSystem {
    /**
     * Observable for devices being connected
     */
    public readonly onDeviceConnectedObservable: Observable<{ deviceType: DeviceType; deviceSlot: number; }>;
    /**
     * Observable for devices being disconnected
     */
    public readonly onDeviceDisconnectedObservable: Observable<{ deviceType: DeviceType; deviceSlot: number; }>;
    /**
     * Observable for changes to device input
     */
    public readonly onInputChangedObservable: Observable<IDeviceEvent>;

    // Private Members
    private _inputs: Array<{ [deviceSlot: number]: Array<number> }> = [];
    private _gamepads: Array<DeviceType>;
    private _keyboardActive: boolean = false;
    private _pointerActive: boolean = false;
    private _elementToAttachTo: HTMLElement;
    private _engine: Engine;

    private _keyboardDownEvent = (evt: any) => { };
    private _keyboardUpEvent = (evt: any) => { };
    private _keyboardBlurEvent = (evt: any) => { };

    private _pointerMoveEvent = (evt: any) => { };
    private _pointerDownEvent = (evt: any) => { };
    private _pointerUpEvent = (evt: any) => { };
    private _pointerWheelEvent = (evt: any) => { };
    private _pointerBlurEvent = (evt: any) => { };
    private _wheelEventName: string;

    private _mouseId = -1;
    private _isUsingFirefox = navigator.userAgent.indexOf("Firefox") !== -1;

    // Array to store active Pointer ID values; prevents issues with negative pointerIds
    private _activeTouchIds: Array<number> = [];
    private _rollingTouchId: number = 0; // Rolling ID number to assign; emulates Chrome assignment

    private _pointerWheelClearObserver: Nullable<Observer<Engine>> = null;

    private _gamepadConnectedEvent = (evt: any) => { };
    private _gamepadDisconnectedEvent = (evt: any) => { };

    /** Max number of keycodes */
    public static MAX_KEYCODES: number = 255;
    /** Max number of pointer inputs */
    public static MAX_POINTER_INPUTS: number = Object.keys(PointerInput).length / 2;

    private _eventPrefix: string;

    constructor(engine: Engine) {
        const inputElement = engine.getInputElement();
        this._eventPrefix = Tools.GetPointerPrefix(engine);
        this._engine = engine;

        this.onDeviceConnectedObservable = new Observable((observer) => {
            // Iterate through each active device and rerun new callback
            for (let deviceType = 0; deviceType < this._inputs.length; deviceType++) {
                const inputs = this._inputs[deviceType];
                if (inputs) {
                    for (const deviceSlotKey in inputs) {
                        const deviceSlot = +deviceSlotKey;
                        if (this._inputs[deviceType][deviceSlot]) {
                            this.onDeviceConnectedObservable.notifyObserver(observer, { deviceType, deviceSlot });
                        }
                    }
                }
            }
        });

        this.onDeviceDisconnectedObservable = new Observable();
        this.onInputChangedObservable = new Observable();

        if (inputElement) {
            this._elementToAttachTo = inputElement;
            // Set tab index for the inputElement to the engine's canvasTabIndex, if and only if the element's tab index is -1
            this._elementToAttachTo.tabIndex = (this._elementToAttachTo.tabIndex !== -1) ? this._elementToAttachTo.tabIndex : engine.canvasTabIndex;
            this._handleKeyActions();
            this._handlePointerActions();
            this._handleGamepadActions();

            // Check for devices that are already connected but aren't registered. Currently, only checks for gamepads and mouse
            this._checkForConnectedDevices();
        }
    }

    // Public functions
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

        if (deviceType >= DeviceType.Xbox && deviceType <= DeviceType.Switch && navigator.getGamepads) {
            this._updateDevice(deviceType, deviceSlot, inputIndex);
        }

        const currentValue = device[inputIndex];
        if (currentValue === undefined) {
            throw `Unable to find input ${inputIndex} for device ${DeviceType[deviceType]} in slot ${deviceSlot}`;
        }

        return currentValue;
    }

    /**
     * Check for a specific device in the DeviceInputSystem
     * @param deviceType Type of device to check for
     * @returns bool with status of device's existence
     */
    public isDeviceAvailable(deviceType: DeviceType) {
        return (this._inputs[deviceType] !== undefined);
    }

    /**
     * Dispose of all the eventlisteners
     */
    public dispose(): void {
        // Observables
        this.onDeviceConnectedObservable.clear();
        this.onDeviceDisconnectedObservable.clear();
        this.onInputChangedObservable.clear();

        if (this._elementToAttachTo) {
            // Blur Events
            this._elementToAttachTo.removeEventListener("blur", this._keyboardBlurEvent);
            this._elementToAttachTo.removeEventListener("blur", this._pointerBlurEvent);

            // Keyboard Events
            if (this._keyboardActive) {
                this._elementToAttachTo.removeEventListener("keydown", this._keyboardDownEvent);
                this._elementToAttachTo.removeEventListener("keyup", this._keyboardUpEvent);
            }

            // Pointer Events
            if (this._pointerActive) {
                this._elementToAttachTo.removeEventListener(this._eventPrefix + "move", this._pointerMoveEvent);
                this._elementToAttachTo.removeEventListener(this._eventPrefix + "down", this._pointerDownEvent);
                this._elementToAttachTo.removeEventListener(this._eventPrefix + "up", this._pointerUpEvent);
                this._elementToAttachTo.removeEventListener(this._wheelEventName, this._pointerWheelEvent);

                if (this._pointerWheelClearObserver) {
                    this._engine.onEndFrameObservable.remove(this._pointerWheelClearObserver);
                }
            }

            // Gamepad Events
            window.removeEventListener("gamepadconnected", this._gamepadConnectedEvent);
            window.removeEventListener("gamepaddisconnected", this._gamepadDisconnectedEvent);
        }
    }

    /**
     * Checks for existing connections to devices and register them, if necessary
     * Currently handles gamepads and mouse
     */
    private _checkForConnectedDevices() {
        if (navigator.getGamepads) {
            const gamepads = navigator.getGamepads();

            for (const gamepad of gamepads) {
                if (gamepad) {
                    this._addGamePad(gamepad);
                }
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
        this._registerDevice(deviceType, deviceSlot, WebDeviceInputSystem.MAX_POINTER_INPUTS);
        const pointer = this._inputs[deviceType][deviceSlot]; /* initialize our pointer position immediately after registration */
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
        if (deviceSlot === undefined) {
            throw `Unable to register device ${DeviceType[deviceType]} to undefined slot.`;
        }

        if (!this._inputs[deviceType]) {
            this._inputs[deviceType] = {};
        }

        if (!this._inputs[deviceType][deviceSlot]) {
            const device = new Array<number>(numberOfInputs);

            for (let i = 0; i < numberOfInputs; i++) {
                device[i] = 0; /* set device input as unpressed */
            }

            this._inputs[deviceType][deviceSlot] = device;
            this.onDeviceConnectedObservable.notifyObservers({ deviceType, deviceSlot });
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
            this.onDeviceDisconnectedObservable.notifyObservers({ deviceType, deviceSlot });
        }
    }

    /**
     * Handle all actions that come from keyboard interaction
     */
    private _handleKeyActions() {
        this._keyboardDownEvent = ((evt) => {
            if (!this._keyboardActive) {
                this._keyboardActive = true;
                this._registerDevice(DeviceType.Keyboard, 0, WebDeviceInputSystem.MAX_KEYCODES);
            }

            const kbKey = this._inputs[DeviceType.Keyboard][0];
            if (kbKey) {
                kbKey[evt.keyCode] = 1;

                let deviceEvent = evt as IDeviceEvent;
                deviceEvent.deviceType = DeviceType.Keyboard;
                deviceEvent.deviceSlot = 0;
                deviceEvent.inputIndex = evt.keyCode;
                deviceEvent.previousState = 0;
                deviceEvent.currentState = kbKey[evt.keyCode];

                this.onInputChangedObservable.notifyObservers(deviceEvent);
            }
        });

        this._keyboardUpEvent = ((evt) => {
            if (!this._keyboardActive) {
                this._keyboardActive = true;
                this._registerDevice(DeviceType.Keyboard, 0, WebDeviceInputSystem.MAX_KEYCODES);
            }

            const kbKey = this._inputs[DeviceType.Keyboard][0];
            if (kbKey) {
                kbKey[evt.keyCode] = 0;

                let deviceEvent = evt as IDeviceEvent;
                deviceEvent.deviceType = DeviceType.Keyboard;
                deviceEvent.deviceSlot = 0;
                deviceEvent.inputIndex = evt.keyCode;
                deviceEvent.previousState = 1;
                deviceEvent.currentState = kbKey[evt.keyCode];

                this.onInputChangedObservable.notifyObservers(deviceEvent);
            }
        });

        this._keyboardBlurEvent = ((evt) => {
            if (this._keyboardActive) {
                const kbKey = this._inputs[DeviceType.Keyboard][0];

                for (let i = 0; i < kbKey.length; i++) {
                    if (kbKey[i] !== 0) {
                        kbKey[i] = 0;

                        const evt: IEvent = DeviceEventFactory.CreateDeviceEvent(DeviceType.Keyboard, 0, i, 1, this, this._elementToAttachTo);
                        const deviceEvent = evt as IDeviceEvent;
                        deviceEvent.deviceType = DeviceType.Keyboard;
                        deviceEvent.deviceSlot = 0;
                        deviceEvent.inputIndex = i;
                        deviceEvent.currentState = 1;
                        deviceEvent.previousState = 1;
                        this.onInputChangedObservable.notifyObservers(deviceEvent);
                    }
                }
            }
        });

        this._elementToAttachTo.addEventListener("keydown", this._keyboardDownEvent);
        this._elementToAttachTo.addEventListener("keyup", this._keyboardUpEvent);
        this._elementToAttachTo.addEventListener("blur", this._keyboardBlurEvent);
    }

    /**
     * Handle all actions that come from pointer interaction
     */
    private _handlePointerActions() {
        this._pointerMoveEvent = ((evt) => {
            const deviceType = this._getPointerType(evt);
            const deviceSlot = (deviceType === DeviceType.Mouse) ? 0 : this._activeTouchIds.indexOf(evt.pointerId);

            if (!this._inputs[deviceType]) {
                this._inputs[deviceType] = {};
            }

            if (!this._inputs[deviceType][deviceSlot]) {
                this._addPointerDevice(deviceType, deviceSlot, evt.clientX, evt.clientY);
            }

            const pointer = this._inputs[deviceType][deviceSlot];
            if (pointer) {
                // Store previous values for event
                const previousHorizontal = pointer[PointerInput.Horizontal];
                const previousVertical = pointer[PointerInput.Vertical];
                const previousDeltaHorizontal = pointer[PointerInput.DeltaHorizontal];
                const previousDeltaVertical = pointer[PointerInput.DeltaVertical];

                pointer[PointerInput.Horizontal] = evt.clientX;
                pointer[PointerInput.Vertical] = evt.clientY;
                pointer[PointerInput.DeltaHorizontal] = evt.movementX;
                pointer[PointerInput.DeltaVertical] = evt.movementY;

                let deviceEvent = evt as IDeviceEvent;
                deviceEvent.deviceType = deviceType;
                deviceEvent.deviceSlot = deviceSlot;

                // The browser might use a move event in case
                // of simultaneous mouse buttons click for instance. So
                // in this case we stil need to propagate it.
                let fireFakeMove = true;
                if (previousHorizontal !== evt.clientX) {
                    deviceEvent.inputIndex = PointerInput.Horizontal;
                    deviceEvent.previousState = previousHorizontal;
                    deviceEvent.currentState = pointer[PointerInput.Horizontal];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                    fireFakeMove = false;
                }
                if (previousVertical !== evt.clientY) {
                    deviceEvent.inputIndex = PointerInput.Vertical;
                    deviceEvent.previousState = previousVertical;
                    deviceEvent.currentState = pointer[PointerInput.Vertical];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                    fireFakeMove = false;
                }
                if (pointer[PointerInput.DeltaHorizontal] !== 0) {
                    deviceEvent.inputIndex = PointerInput.DeltaHorizontal;
                    deviceEvent.previousState = previousDeltaHorizontal;
                    deviceEvent.currentState = pointer[PointerInput.DeltaHorizontal];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                    fireFakeMove = false;
                }
                if (pointer[PointerInput.DeltaVertical] !== 0) {
                    deviceEvent.inputIndex = PointerInput.DeltaVertical;
                    deviceEvent.previousState = previousDeltaVertical;
                    deviceEvent.currentState = pointer[PointerInput.DeltaVertical];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                    fireFakeMove = false;
                }
                // Lets Propagate the event for move with same position.
                if (fireFakeMove) {
                    deviceEvent.inputIndex = PointerInput.FakeMove;
                    deviceEvent.previousState = 0;
                    deviceEvent.currentState = 0;

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }
            }
        });

        this._pointerDownEvent = ((evt) => {
            const deviceType = this._getPointerType(evt);
            let deviceSlot = (deviceType === DeviceType.Mouse) ? 0 : evt.pointerId;

            if (deviceType === DeviceType.Touch) {
                deviceSlot = this._rollingTouchId++;
                this._activeTouchIds[deviceSlot] = evt.pointerId;
            }

            if (!this._inputs[deviceType]) {
                this._inputs[deviceType] = {};
            }

            if (!this._inputs[deviceType][deviceSlot]) {
                this._addPointerDevice(deviceType, deviceSlot, evt.clientX, evt.clientY);
            }

            const pointer = this._inputs[deviceType][deviceSlot];
            if (pointer) {
                const previousHorizontal = pointer[PointerInput.Horizontal];
                const previousVertical = pointer[PointerInput.Vertical];
                const previousButton = pointer[evt.button + 2];

                if (deviceType === DeviceType.Mouse) { // Mouse; Among supported browsers, value is either 1 or 0 for mouse
                    if (this._mouseId === -1) {
                        if (evt.pointerId === undefined) { // If there is no pointerId (eg. manually dispatched MouseEvent)
                            this._mouseId = this._isUsingFirefox ? 0 : 1;
                        }
                        else {
                            this._mouseId = evt.pointerId;
                        }
                    }

                    if (!document.pointerLockElement) {
                        this._elementToAttachTo.setPointerCapture(this._mouseId);
                    }
                }
                else { // Touch; Since touches are dynamically assigned, only set capture if we have an id
                    if (evt.pointerId && !document.pointerLockElement) {
                        this._elementToAttachTo.setPointerCapture(evt.pointerId);
                    }
                }

                pointer[PointerInput.Horizontal] = evt.clientX;
                pointer[PointerInput.Vertical] = evt.clientY;
                pointer[evt.button + 2] = 1;

                let deviceEvent = evt as IDeviceEvent;
                deviceEvent.deviceType = deviceType;
                deviceEvent.deviceSlot = deviceSlot;

                if (previousHorizontal !== evt.clientX) {
                    deviceEvent.inputIndex = PointerInput.Horizontal;
                    deviceEvent.previousState = previousHorizontal;
                    deviceEvent.currentState = pointer[PointerInput.Horizontal];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }
                if (previousVertical !== evt.clientY) {
                    deviceEvent.inputIndex = PointerInput.Vertical;
                    deviceEvent.previousState = previousVertical;
                    deviceEvent.currentState = pointer[PointerInput.Vertical];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }

                deviceEvent.inputIndex = evt.button + 2;
                deviceEvent.previousState = previousButton;
                deviceEvent.currentState = pointer[evt.button + 2];
                this.onInputChangedObservable.notifyObservers(deviceEvent);
            }
        });

        this._pointerUpEvent = ((evt) => {
            const deviceType = this._getPointerType(evt);
            const deviceSlot = (deviceType === DeviceType.Mouse) ? 0 : this._activeTouchIds.indexOf(evt.pointerId);

            const pointer = this._inputs[deviceType]?.[deviceSlot];
            if (pointer && pointer[evt.button + 2] !== 0) {
                const previousHorizontal = pointer[PointerInput.Horizontal];
                const previousVertical = pointer[PointerInput.Vertical];
                const previousButton = pointer[evt.button + 2];

                pointer[PointerInput.Horizontal] = evt.clientX;
                pointer[PointerInput.Vertical] = evt.clientY;
                pointer[evt.button + 2] = 0;

                let deviceEvent = evt as IDeviceEvent;
                deviceEvent.deviceType = deviceType;
                deviceEvent.deviceSlot = deviceSlot;

                if (previousHorizontal !== evt.clientX) {
                    deviceEvent.inputIndex = PointerInput.Horizontal;
                    deviceEvent.previousState = previousHorizontal;
                    deviceEvent.currentState = pointer[PointerInput.Horizontal];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }
                if (previousVertical !== evt.clientY) {
                    deviceEvent.inputIndex = PointerInput.Vertical;
                    deviceEvent.previousState = previousVertical;
                    deviceEvent.currentState = pointer[PointerInput.Vertical];

                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }

                deviceEvent.inputIndex = evt.button + 2;
                deviceEvent.previousState = previousButton;
                deviceEvent.currentState = pointer[evt.button + 2];

                if (deviceType === DeviceType.Mouse && this._mouseId >= 0 && this._elementToAttachTo.hasPointerCapture(this._mouseId)) {
                    this._elementToAttachTo.releasePointerCapture(this._mouseId);
                }
                else if (evt.pointerId && this._elementToAttachTo.hasPointerCapture(evt.pointerId)) {
                    this._elementToAttachTo.releasePointerCapture(evt.pointerId);
                }

                this.onInputChangedObservable.notifyObservers(deviceEvent);

                // We don't want to unregister the mouse because we may miss input data when a mouse is moving after a click
                if (deviceType !== DeviceType.Mouse) {
                    let idToRemove = this._activeTouchIds.indexOf(evt.pointerId);
                    delete this._activeTouchIds[idToRemove];
                    this._unregisterDevice(deviceType, deviceSlot);
                }
            }
        });

        // Set Wheel Event Name, code originally from scene.inputManager
        this._wheelEventName = "onwheel" in document.createElement("div") ? "wheel" :       // Modern browsers support "wheel"
            (<any>document).onmousewheel !== undefined ? "mousewheel" :                     // Webkit and IE support at least "mousewheel"
                "DOMMouseScroll";                                                           // let's assume that remaining browsers are older Firefox

        // Code originally in scene.inputManager.ts
        // Chrome reports warning in console if wheel listener doesn't set an explicit passive option.
        // IE11 only supports captureEvent:boolean, not options:object, and it defaults to false.
        // Feature detection technique copied from: https://github.com/github/eventlistener-polyfill (MIT license)
        let passiveSupported = false;
        const noop = function () { };

        try {
            const options: object = {
                passive: {
                    get: function () {
                        passiveSupported = true;
                    }
                }
            };

            this._elementToAttachTo.addEventListener("test", noop, options);
            this._elementToAttachTo.removeEventListener("test", noop, options);
        }
        catch (e) {
            /* */
        }

        this._pointerBlurEvent = ((evt) => {
            // Handle mouse buttons
            if (this.isDeviceAvailable(DeviceType.Mouse)) {
                const pointer = this._inputs[DeviceType.Mouse][0];

                if (this._mouseId >= 0 && this._elementToAttachTo.hasPointerCapture(this._mouseId)) {
                    this._elementToAttachTo.releasePointerCapture(this._mouseId);
                }

                for (let i = 0; i <= PointerInput.BrowserForward; i++) {
                    if (pointer[i + 2] === 1) {
                        pointer[i + 2] = 0;

                        const evt: IEvent = DeviceEventFactory.CreateDeviceEvent(DeviceType.Mouse, 0, i + 2, 1, this, this._elementToAttachTo);
                        const deviceEvent = evt as IDeviceEvent;
                        deviceEvent.deviceType = DeviceType.Mouse;
                        deviceEvent.deviceSlot = 0;
                        deviceEvent.inputIndex = i + 2;
                        deviceEvent.currentState = pointer[i + 2];
                        deviceEvent.previousState = 1;
                        this.onInputChangedObservable.notifyObservers(deviceEvent);
                    }
                }
            }

            // Handle Active Touches
            if (this.isDeviceAvailable(DeviceType.Touch)) {
                const pointer = this._inputs[DeviceType.Touch];

                // Get list of active touch ids and clear each one in the inputs array
                for (const deviceSlotKey in Object.keys(this._activeTouchIds)) {
                    const deviceSlot = +deviceSlotKey;
                    const pointerId = this._activeTouchIds[deviceSlot];

                    if (this._elementToAttachTo.hasPointerCapture(pointerId)) {
                        this._elementToAttachTo.releasePointerCapture(pointerId);
                    }

                    if (pointer[deviceSlot]?.[PointerInput.LeftClick] === 1) {
                        pointer[deviceSlot][PointerInput.LeftClick] = 0;

                        const evt: IEvent = DeviceEventFactory.CreateDeviceEvent(DeviceType.Touch, pointerId, PointerInput.LeftClick, 1, this, this._elementToAttachTo);
                        const deviceEvent = evt as IDeviceEvent;
                        deviceEvent.deviceType = DeviceType.Mouse;
                        deviceEvent.deviceSlot = deviceSlot;
                        deviceEvent.inputIndex = PointerInput.LeftClick;
                        deviceEvent.currentState = pointer[deviceSlot][PointerInput.LeftClick];
                        deviceEvent.previousState = 1;
                        this.onInputChangedObservable.notifyObservers(deviceEvent);

                        this._unregisterDevice(DeviceType.Touch, deviceSlot);
                    }
                }
                // Clear all active touches
                while (this._activeTouchIds.pop() !== undefined) { }
            }
        });

        this._pointerWheelEvent = ((evt) => {
            const deviceType = DeviceType.Mouse;
            const deviceSlot = 0;

            if (!this._inputs[deviceType]) {
                this._inputs[deviceType] = [];
            }

            if (!this._inputs[deviceType][deviceSlot]) {
                this._pointerActive = true;
                this._registerDevice(deviceType, deviceSlot, WebDeviceInputSystem.MAX_POINTER_INPUTS);
            }

            const pointer = this._inputs[deviceType][deviceSlot];
            if (pointer) {
                // Store previous values for event
                let previousWheelScrollX = pointer[PointerInput.MouseWheelX];
                let previousWheelScrollY = pointer[PointerInput.MouseWheelY];
                let previousWheelScrollZ = pointer[PointerInput.MouseWheelZ];

                pointer[PointerInput.MouseWheelX] = evt.deltaX || 0;
                pointer[PointerInput.MouseWheelY] = evt.deltaY || evt.wheelDelta || 0;
                pointer[PointerInput.MouseWheelZ] = evt.deltaZ || 0;

                let deviceEvent = evt as IDeviceEvent;
                deviceEvent.deviceType = deviceType;
                deviceEvent.deviceSlot = deviceSlot;

                if (pointer[PointerInput.MouseWheelX] !== 0) {
                    deviceEvent.inputIndex = PointerInput.MouseWheelX;
                    deviceEvent.previousState = previousWheelScrollX;
                    deviceEvent.currentState = pointer[PointerInput.MouseWheelX];
                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }
                if (pointer[PointerInput.MouseWheelY] !== 0) {
                    deviceEvent.inputIndex = PointerInput.MouseWheelY;
                    deviceEvent.previousState = previousWheelScrollY;
                    deviceEvent.currentState = pointer[PointerInput.MouseWheelY];
                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }
                if (pointer[PointerInput.MouseWheelZ] !== 0) {
                    deviceEvent.inputIndex = PointerInput.MouseWheelZ;
                    deviceEvent.previousState = previousWheelScrollZ;
                    deviceEvent.currentState = pointer[PointerInput.MouseWheelZ];
                    this.onInputChangedObservable.notifyObservers(deviceEvent);
                }
            }
        });

        this._elementToAttachTo.addEventListener(this._eventPrefix + "move", this._pointerMoveEvent);
        this._elementToAttachTo.addEventListener(this._eventPrefix + "down", this._pointerDownEvent);
        this._elementToAttachTo.addEventListener(this._eventPrefix + "up", this._pointerUpEvent);
        this._elementToAttachTo.addEventListener("blur", this._pointerBlurEvent);
        this._elementToAttachTo.addEventListener(this._wheelEventName, this._pointerWheelEvent, passiveSupported ? { passive: false } : false);

        // Since there's no up or down event for mouse wheel, clear mouse wheel value at end of frame
        this._pointerWheelClearObserver = this._engine.onEndFrameObservable.add(() => {
            if (this.isDeviceAvailable(DeviceType.Mouse)) {
                const pointer = this._inputs[DeviceType.Mouse][0];
                pointer[PointerInput.MouseWheelX] = 0;
                pointer[PointerInput.MouseWheelY] = 0;
                pointer[PointerInput.MouseWheelZ] = 0;
            }
        });
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

        if (gp && deviceType === this._gamepads[deviceSlot]) {
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
        if (deviceName.indexOf("054c") !== -1 && deviceName.indexOf("0ce6") === -1) { // DualShock 4 Gamepad
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

    /**
     * Get DeviceType from a given pointer/mouse/touch event.
     * @param evt PointerEvent to evaluate
     * @returns DeviceType interpreted from event
     */
    private _getPointerType(evt: any): DeviceType {
        let deviceType = DeviceType.Mouse;

        if (evt.pointerType === "touch" || evt.pointerType === "pen" || evt.touches) {
            deviceType = DeviceType.Touch;
        }

        return deviceType;
    }
}
