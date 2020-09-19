import { Observable } from "../Misc/observable";
import { DomManagement } from "../Misc/domManagement";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { PoseEnabledControllerHelper } from "../Gamepads/Controllers/poseEnabledController";
import { Xbox360Pad } from "./xboxGamepad";
import { Gamepad, GenericPad } from "./gamepad";
import { Engine } from '../Engines/engine';
import { DualShockPad } from './dualShockGamepad';
/**
 * Manager for handling gamepads
 */
export class GamepadManager {
    private _babylonGamepads: Array<Gamepad> = [];
    private _oneGamepadConnected: boolean = false;

    /** @hidden */
    public _isMonitoring: boolean = false;
    private _gamepadEventSupported: boolean;
    private _gamepadSupport?: () => Array<any>;

    /**
     * observable to be triggered when the gamepad controller has been connected
     */
    public onGamepadConnectedObservable: Observable<Gamepad>;

    /**
     * observable to be triggered when the gamepad controller has been disconnected
     */
    public onGamepadDisconnectedObservable = new Observable<Gamepad>();

    private _onGamepadConnectedEvent: Nullable<(evt: any) => void>;
    private _onGamepadDisconnectedEvent: Nullable<(evt: any) => void>;

    /**
     * Initializes the gamepad manager
     * @param _scene BabylonJS scene
     */
    constructor(private _scene?: Scene) {
        if (!DomManagement.IsWindowObjectExist()) {
            this._gamepadEventSupported = false;
        } else {
            this._gamepadEventSupported = 'GamepadEvent' in window;
            this._gamepadSupport = (navigator.getGamepads ||
                navigator.webkitGetGamepads || navigator.msGetGamepads || navigator.webkitGamepads);
        }

        this.onGamepadConnectedObservable = new Observable<Gamepad>((observer) => {
            // This will be used to raise the onGamepadConnected for all gamepads ALREADY connected
            for (var i in this._babylonGamepads) {
                let gamepad = this._babylonGamepads[i];
                if (gamepad && gamepad._isConnected) {
                    this.onGamepadConnectedObservable.notifyObserver(observer, gamepad);
                }
            }
        });

        this._onGamepadConnectedEvent = (evt) => {
            let gamepad = evt.gamepad;

            if (gamepad.index in this._babylonGamepads) {
                if (this._babylonGamepads[gamepad.index].isConnected) {
                    return;
                }
            }

            let newGamepad: Gamepad;

            if (this._babylonGamepads[gamepad.index]) {
                newGamepad = this._babylonGamepads[gamepad.index];
                newGamepad.browserGamepad = gamepad;
                newGamepad._isConnected = true;
            } else {
                newGamepad = this._addNewGamepad(gamepad);
            }
            this.onGamepadConnectedObservable.notifyObservers(newGamepad);
            this._startMonitoringGamepads();
        };

        this._onGamepadDisconnectedEvent = (evt) => {
            let gamepad = evt.gamepad;

            // Remove the gamepad from the list of gamepads to monitor.
            for (var i in this._babylonGamepads) {
                if (this._babylonGamepads[i].index === gamepad.index) {
                    let disconnectedGamepad = this._babylonGamepads[i];
                    disconnectedGamepad._isConnected = false;

                    this.onGamepadDisconnectedObservable.notifyObservers(disconnectedGamepad);
                    disconnectedGamepad.dispose && disconnectedGamepad.dispose();
                    break;
                }
            }
        };

        if (this._gamepadSupport) {
            //first add already-connected gamepads
            this._updateGamepadObjects();
            if (this._babylonGamepads.length) {
                this._startMonitoringGamepads();
            }
            // Checking if the gamepad connected event is supported (like in Firefox)
            if (this._gamepadEventSupported) {
                let hostWindow = this._scene ? this._scene.getEngine().getHostWindow() : window;

                if (hostWindow) {
                    hostWindow.addEventListener('gamepadconnected', this._onGamepadConnectedEvent, false);
                    hostWindow.addEventListener('gamepaddisconnected', this._onGamepadDisconnectedEvent, false);
                }
            }
            else {
                this._startMonitoringGamepads();
            }
        }
    }

    /**
     * The gamepads in the game pad manager
     */
    public get gamepads(): Gamepad[] {
        return this._babylonGamepads;
    }

    /**
     * Get the gamepad controllers based on type
     * @param type The type of gamepad controller
     * @returns Nullable gamepad
     */
    public getGamepadByType(type: number = Gamepad.XBOX): Nullable<Gamepad> {
        for (var gamepad of this._babylonGamepads) {
            if (gamepad && gamepad.type === type) {
                return gamepad;
            }
        }

        return null;
    }

    /**
     * Disposes the gamepad manager
     */
    public dispose() {
        if (this._gamepadEventSupported) {
            if (this._onGamepadConnectedEvent) {
                window.removeEventListener('gamepadconnected', this._onGamepadConnectedEvent);
            }

            if (this._onGamepadDisconnectedEvent) {
                window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnectedEvent);
            }
            this._onGamepadConnectedEvent = null;
            this._onGamepadDisconnectedEvent = null;
        }

        this._babylonGamepads.forEach((gamepad) => {
            gamepad.dispose();
        });

        this.onGamepadConnectedObservable.clear();
        this.onGamepadDisconnectedObservable.clear();

        this._oneGamepadConnected = false;
        this._stopMonitoringGamepads();
        this._babylonGamepads = [];
    }

    private _addNewGamepad(gamepad: any): Gamepad {
        if (!this._oneGamepadConnected) {
            this._oneGamepadConnected = true;
        }

        var newGamepad;
        var dualShock: boolean = ((<string>gamepad.id).search("054c") !== -1);
        var xboxOne: boolean = ((<string>gamepad.id).search("Xbox One") !== -1);
        if (xboxOne || (<string>gamepad.id).search("Xbox 360") !== -1 || (<string>gamepad.id).search("xinput") !== -1) {
            newGamepad = new Xbox360Pad(gamepad.id, gamepad.index, gamepad, xboxOne);
        }
        else if (dualShock) {
            newGamepad = new DualShockPad(gamepad.id, gamepad.index, gamepad);
        }
        // if pose is supported, use the (WebVR) pose enabled controller
        else if (gamepad.pose) {
            newGamepad = PoseEnabledControllerHelper.InitiateController(gamepad);
        }
        else {
            newGamepad = new GenericPad(gamepad.id, gamepad.index, gamepad);
        }
        this._babylonGamepads[newGamepad.index] = newGamepad;
        return newGamepad;
    }

    private _startMonitoringGamepads() {
        if (!this._isMonitoring) {
            this._isMonitoring = true;
            //back-comp
            if (!this._scene) {
                this._checkGamepadsStatus();
            }
        }
    }

    private _stopMonitoringGamepads() {
        this._isMonitoring = false;
    }

    /** @hidden */
    public _checkGamepadsStatus() {
        // Hack to be compatible Chrome
        this._updateGamepadObjects();

        for (var i in this._babylonGamepads) {
            let gamepad = this._babylonGamepads[i];
            if (!gamepad || !gamepad.isConnected) {
                continue;
            }
            gamepad.update();
        }

        if (this._isMonitoring && !this._scene) {
            Engine.QueueNewFrame(() => { this._checkGamepadsStatus(); });
        }
    }

    // This function is called only on Chrome, which does not properly support
    // connection/disconnection events and forces you to recopy again the gamepad object
    private _updateGamepadObjects() {
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (var i = 0; i < gamepads.length; i++) {
            let gamepad = gamepads[i];
            if (gamepad) {
                if (!this._babylonGamepads[gamepad.index]) {
                    var newGamepad = this._addNewGamepad(gamepad);
                    this.onGamepadConnectedObservable.notifyObservers(newGamepad);
                }
                else {
                    // Forced to copy again this object for Chrome for unknown reason
                    this._babylonGamepads[i].browserGamepad = gamepad;

                    if (!this._babylonGamepads[i].isConnected) {
                        this._babylonGamepads[i]._isConnected = true;
                        this.onGamepadConnectedObservable.notifyObservers(this._babylonGamepads[i]);
                    }
                }
            }
        }
    }
}
