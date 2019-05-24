import { Nullable } from "../../types";
import { Engine, IDisplayChangedEventArgs } from "../../Engines/engine";
import { _TimeToken } from "../../Instrumentation/timeToken";
import { Size } from '../../Maths/math';
import { Observable } from '../../Misc/observable';
import { Tools } from '../../Misc/tools';
import { DomManagement } from '../../Misc/domManagement';

declare module "../../Engines/engine" {
    export interface Engine {
        /** @hidden */
        _vrDisplay: any;
        /** @hidden */
        _vrSupported: boolean;
        /** @hidden */
        _oldSize: Size;
        /** @hidden */
        _oldHardwareScaleFactor: number;
        /** @hidden */
        _vrExclusivePointerMode: boolean;
        /** @hidden */
        _webVRInitPromise: Promise<IDisplayChangedEventArgs>;

        /** @hidden */
        _onVRDisplayPointerRestricted: () => void;
        /** @hidden */
        _onVRDisplayPointerUnrestricted: () => void;

        /** @hidden */
        _onVrDisplayConnect: Nullable<(display: any) => void>;
        /** @hidden */
        _onVrDisplayDisconnect: Nullable<() => void>;
        /** @hidden */
        _onVrDisplayPresentChange: Nullable<() => void>;

        /**
         * Observable signaled when VR display mode changes
         */
        onVRDisplayChangedObservable: Observable<IDisplayChangedEventArgs>;
        /**
         * Observable signaled when VR request present is complete
         */
        onVRRequestPresentComplete: Observable<boolean>;
        /**
         * Observable signaled when VR request present starts
         */
        onVRRequestPresentStart: Observable<Engine>;

        /**
         * Gets a boolean indicating that the engine is currently in VR exclusive mode for the pointers
         * @see https://docs.microsoft.com/en-us/microsoft-edge/webvr/essentials#mouse-input
         */
        isInVRExclusivePointerMode: boolean;

        /**
         * Gets a boolean indicating if a webVR device was detected
         * @returns true if a webVR device was detected
         */
        isVRDevicePresent(): boolean;

        /**
         * Gets the current webVR device
         * @returns the current webVR device (or null)
         */
        getVRDevice(): any;

        /**
         * Initializes a webVR display and starts listening to display change events
         * The onVRDisplayChangedObservable will be notified upon these changes
         * @returns A promise containing a VRDisplay and if vr is supported
         */
        initWebVRAsync(): Promise<IDisplayChangedEventArgs>;

        /** @hidden */
        _getVRDisplaysAsync(): Promise<IDisplayChangedEventArgs>;

        /**
         * Call this function to switch to webVR mode
         * Will do nothing if webVR is not supported or if there is no webVR device
         * @see http://doc.babylonjs.com/how_to/webvr_camera
         */
        enableVR(): void;

        /** @hidden */
        _onVRFullScreenTriggered(): void;
    }
}

Object.defineProperty(Engine.prototype, "isInVRExclusivePointerMode", {
    get: function(this: Engine) {
        return this._vrExclusivePointerMode;
    },
    enumerable: true,
    configurable: true
});

Engine.prototype._prepareVRComponent = function() {
    this._vrSupported = false;
    this._vrExclusivePointerMode = false;
    this.onVRDisplayChangedObservable = new Observable<IDisplayChangedEventArgs>();
    this.onVRRequestPresentComplete = new Observable<boolean>();
    this.onVRRequestPresentStart = new Observable<Engine>();
};

Engine.prototype.isVRDevicePresent = function() {
    return !!this._vrDisplay;
};

Engine.prototype.getVRDevice = function(): any {
    return this._vrDisplay;
};

Engine.prototype.initWebVR = function(): Observable<IDisplayChangedEventArgs> {
    this.initWebVRAsync();
    return this.onVRDisplayChangedObservable;
};

Engine.prototype.initWebVRAsync = function(): Promise<IDisplayChangedEventArgs> {
    var notifyObservers = () => {
        var eventArgs = {
            vrDisplay: this._vrDisplay,
            vrSupported: this._vrSupported
        };
        this.onVRDisplayChangedObservable.notifyObservers(eventArgs);
        this._webVRInitPromise = new Promise((res) => { res(eventArgs); });
    };

    if (!this._onVrDisplayConnect) {
        this._onVrDisplayConnect = (event) => {
            this._vrDisplay = event.display;
            notifyObservers();
        };
        this._onVrDisplayDisconnect = () => {
            this._vrDisplay.cancelAnimationFrame(this._frameHandler);
            this._vrDisplay = undefined;
            this._frameHandler = Tools.QueueNewFrame(this._bindedRenderFunction);
            notifyObservers();
        };
        this._onVrDisplayPresentChange = () => {
            this._vrExclusivePointerMode = this._vrDisplay && this._vrDisplay.isPresenting;
        };
        window.addEventListener('vrdisplayconnect', this._onVrDisplayConnect);
        window.addEventListener('vrdisplaydisconnect', this._onVrDisplayDisconnect);
        window.addEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
    }
    this._webVRInitPromise = this._webVRInitPromise || this._getVRDisplaysAsync();
    this._webVRInitPromise.then(notifyObservers);
    return this._webVRInitPromise;
};

Engine.prototype._getVRDisplaysAsync = function(): Promise<IDisplayChangedEventArgs> {
    return new Promise((res) => {
        if (navigator.getVRDisplays) {
            navigator.getVRDisplays().then((devices: Array<any>) => {
                this._vrSupported = true;
                // note that devices may actually be an empty array. This is fine;
                // we expect this._vrDisplay to be undefined in this case.
                this._vrDisplay = devices[0];
                res({
                    vrDisplay: this._vrDisplay,
                    vrSupported: this._vrSupported
                });
            });
        } else {
            this._vrDisplay = undefined;
            this._vrSupported = false;
            res({
                vrDisplay: this._vrDisplay,
                vrSupported: this._vrSupported
            });
        }
    });
};

Engine.prototype.enableVR = function() {
    if (this._vrDisplay && !this._vrDisplay.isPresenting) {
        var onResolved = () => {
            this.onVRRequestPresentComplete.notifyObservers(true);
            this._onVRFullScreenTriggered();
        };
        var onRejected = () => {
            this.onVRRequestPresentComplete.notifyObservers(false);
        };

        this.onVRRequestPresentStart.notifyObservers(this);
        this._vrDisplay.requestPresent([{ source: this.getRenderingCanvas() }]).then(onResolved).catch(onRejected);
    }
};

Engine.prototype._onVRFullScreenTriggered = function() {
    if (this._vrDisplay && this._vrDisplay.isPresenting) {
        //get the old size before we change
        this._oldSize = new Size(this.getRenderWidth(), this.getRenderHeight());
        this._oldHardwareScaleFactor = this.getHardwareScalingLevel();

        //get the width and height, change the render size
        var leftEye = this._vrDisplay.getEyeParameters('left');
        this.setHardwareScalingLevel(1);
        this.setSize(leftEye.renderWidth * 2, leftEye.renderHeight);
    } else {
        this.setHardwareScalingLevel(this._oldHardwareScaleFactor);
        this.setSize(this._oldSize.width, this._oldSize.height);
    }
};

Engine.prototype.disableVR = function() {
    if (this._vrDisplay && this._vrDisplay.isPresenting) {
        this._vrDisplay.exitPresent()
            .then(() => this._onVRFullScreenTriggered())
            .catch(() => this._onVRFullScreenTriggered());
    }

    if (DomManagement.IsWindowObjectExist()) {
        window.removeEventListener('vrdisplaypointerrestricted', this._onVRDisplayPointerRestricted);
        window.removeEventListener('vrdisplaypointerunrestricted', this._onVRDisplayPointerUnrestricted);

        if (this._onVrDisplayConnect) {
            window.removeEventListener('vrdisplayconnect', this._onVrDisplayConnect);
            if (this._onVrDisplayDisconnect) {
                window.removeEventListener('vrdisplaydisconnect', this._onVrDisplayDisconnect);
            }

            if (this._onVrDisplayPresentChange) {
                window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            }
            this._onVrDisplayConnect = null;
            this._onVrDisplayDisconnect = null;
        }
    }
};

Engine.prototype._connectVREvents = function(canvas: HTMLCanvasElement, document: any) {
    this._onVRDisplayPointerRestricted = () => {
        if (canvas) {
            canvas.requestPointerLock();
        }
    };

    this._onVRDisplayPointerUnrestricted = () => {
        if (!document.exitPointerLock) {
            return;
        }
        document.exitPointerLock();
    };

    if (DomManagement.IsWindowObjectExist()) {
        window.addEventListener('vrdisplaypointerrestricted', this._onVRDisplayPointerRestricted, false);
        window.addEventListener('vrdisplaypointerunrestricted', this._onVRDisplayPointerUnrestricted, false);
    }
};

Engine.prototype._submitVRFrame = function() {
    // Submit frame to the vr device, if enabled
    if (this._vrDisplay && this._vrDisplay.isPresenting) {
        // TODO: We should only submit the frame if we read frameData successfully.
        try {
            this._vrDisplay.submitFrame();
        } catch (e) {
            Tools.Warn("webVR submitFrame has had an unexpected failure: " + e);
        }
    }
};

Engine.prototype.isVRPresenting = function() {
    return this._vrDisplay && this._vrDisplay.isPresenting;
};

Engine.prototype._requestVRFrame = function() {
    this._frameHandler = Tools.QueueNewFrame(this._bindedRenderFunction, this._vrDisplay);
};