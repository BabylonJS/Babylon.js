module BABYLON {

    export abstract class WebVRController extends PoseEnabledController {

        protected _defaultModel: AbstractMesh;

        // Observables
        public onTriggerStateChangedObservable = new Observable<ExtendedGamepadButton>();
        public onMainButtonStateChangedObservable = new Observable<ExtendedGamepadButton>();
        public onSecondaryButtonStateChangedObservable = new Observable<ExtendedGamepadButton>();
        public onPadStateChangedObservable = new Observable<ExtendedGamepadButton>();
        public onPadValuesChangedObservable = new Observable<StickValues>();

        protected _buttons: Array<MutableGamepadButton>;

        private _onButtonStateChange: (controlledIndex: number, buttonIndex: number, state: ExtendedGamepadButton) => void;

        public onButtonStateChange(callback: (controlledIndex: number, buttonIndex: number, state: ExtendedGamepadButton) => void) {
            this._onButtonStateChange = callback;
        }

        public pad: StickValues = { x: 0, y: 0 };

        public hand: string; // 'left' or 'right', see https://w3c.github.io/gamepad/extensions.html#gamepadhand-enum

        public get defaultModel(): AbstractMesh {
            return this._defaultModel;
        }

        constructor(vrGamepad: any) {
            super(vrGamepad);
            this._buttons = new Array<ExtendedGamepadButton>(vrGamepad.buttons.length);
            this.hand = vrGamepad.hand;
        }

        public update() {
            super.update();
            for (var index = 0; index < this._buttons.length; index++) {
                this._setButtonValue(this.browserGamepad.buttons[index], this._buttons[index], index);
            };
            if (this.leftStick.x !== this.pad.x || this.leftStick.y !== this.pad.y) {
                this.pad.x = this.leftStick.x;
                this.pad.y = this.leftStick.y;
                this.onPadValuesChangedObservable.notifyObservers(this.pad);
            }
        }

        protected abstract handleButtonChange(buttonIdx: number, value: ExtendedGamepadButton, changes: GamepadButtonChanges): void;

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
                }
                return;
            }
            this._checkChanges(newState, currentState);
            if (this._changes.changed) {
                this._onButtonStateChange && this._onButtonStateChange(this.index, buttonIndex, newState);

                this.handleButtonChange(buttonIndex, newState, this._changes);
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

        public dispose(): void {
            super.dispose();

            this.onTriggerStateChangedObservable.clear();
            this.onMainButtonStateChangedObservable.clear();
            this.onSecondaryButtonStateChangedObservable.clear();
            this.onPadStateChangedObservable.clear();
            this.onPadValuesChangedObservable.clear();
        }
    }
        
}
