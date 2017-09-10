module BABYLON {
    export class GamepadManager {
        private _babylonGamepads: Array<Gamepad> = [];
        private _oneGamepadConnected: boolean = false;

        private _isMonitoring: boolean = false;
        private _gamepadEventSupported: boolean = 'GamepadEvent' in window;
        private _gamepadSupport: () => Array<any> = (navigator.getGamepads ||
            navigator.webkitGetGamepads || navigator.msGetGamepads || navigator.webkitGamepads);

        public onGamepadConnectedObservable = new Observable<Gamepad>();
        public onGamepadDisconnectedObservable = new Observable<Gamepad>();

        private _onGamepadConnectedEvent: (evt) => void;
        private _onGamepadDisconnectedEvent: (evt) => void;

        constructor() {
            this._onGamepadConnectedEvent = (evt) => {
                let gamepad = evt.gamepad;

                // Protection code for Chrome which has a very buggy gamepad implementation...
                // And raises a connected event on disconnection for instance
                if (gamepad.index in this._babylonGamepads) {
                    return;
                }

                var newGamepad = this._addNewGamepad(gamepad);
                this.onGamepadConnectedObservable.notifyObservers(newGamepad);
                this._startMonitoringGamepads();                
            };

            this._onGamepadDisconnectedEvent  = (evt) => {
                let gamepad = evt.gamepad;

                // Remove the gamepad from the list of gamepads to monitor.
                for (var i in this._babylonGamepads) {
                    if (this._babylonGamepads[i].index === gamepad.index) {
                        let gamepadToRemove = this._babylonGamepads[i];
                        this._babylonGamepads[i] = null;
                        
                        this.onGamepadDisconnectedObservable.notifyObservers(gamepadToRemove);

                        gamepadToRemove.dispose();
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
                    window.addEventListener('gamepadconnected', this._onGamepadConnectedEvent, false);
                    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnectedEvent, false);
                }
                else {
                    this._startMonitoringGamepads();
                }
            }
        }

        public getGamepadByType(type: number = Gamepad.XBOX) {
            for (var gamepad of this._babylonGamepads) {
                if (gamepad && gamepad.type === type) {
                    return gamepad;
                }
            }

            return null;
        }

        public dispose() {
            if (this._gamepadEventSupported) {
                window.removeEventListener('gamepadconnected', this._onGamepadConnectedEvent);
                window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnectedEvent);
                this._onGamepadConnectedEvent = null;
                this._onGamepadDisconnectedEvent = null;
            }
            this._oneGamepadConnected = false;
            this._stopMonitoringGamepads();
            this._babylonGamepads = [];
        }

        private _addNewGamepad(gamepad): Gamepad {
            if (!this._oneGamepadConnected) {
                this._oneGamepadConnected = true;
            }

            var newGamepad;
            var xboxOne: boolean = ((<string>gamepad.id).search("Xbox One") !== -1);
            if (xboxOne || (<string>gamepad.id).search("Xbox 360") !== -1 || (<string>gamepad.id).search("xinput") !== -1) {
                newGamepad = new Xbox360Pad(gamepad.id, gamepad.index, gamepad, xboxOne);
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
                this._checkGamepadsStatus();
            }
        }

        private _stopMonitoringGamepads() {
            this._isMonitoring = false;
        }

        private _checkGamepadsStatus() {
            // Hack to be compatible Chrome
            this._updateGamepadObjects();

            for (var i in this._babylonGamepads) {
                let gamepad = this._babylonGamepads[i];
                if (!gamepad) {
                    continue;
                }
                gamepad.update();
            }

            if (this._isMonitoring) {
                Tools.QueueNewFrame(() => { this._checkGamepadsStatus(); });
            }
        }

        // This function is called only on Chrome, which does not properly support
        // connection/disconnection events and forces you to recopy again the gamepad object
        private _updateGamepadObjects() {
            var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
            for (var i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    if (!this._babylonGamepads[gamepads[i].index]) {
                        var newGamepad = this._addNewGamepad(gamepads[i]);
                        this.onGamepadConnectedObservable.notifyObservers(newGamepad);
                    }
                    else {
                        // Forced to copy again this object for Chrome for unknown reason
                        this._babylonGamepads[i].browserGamepad = gamepads[i];
                    }
                }
            }
        }
    }
}