module BABYLON {

    export class OculusTouchController extends WebVRController {
        private static readonly MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/oculus/';
        private static readonly MODEL_LEFT_FILENAME:string = 'left.babylon';
        private static readonly MODEL_RIGHT_FILENAME:string = 'right.babylon';

        public onSecondaryTriggerStateChangedObservable = new Observable<ExtendedGamepadButton>();

        public onThumbRestChangedObservable = new Observable<ExtendedGamepadButton>();

        constructor(vrGamepad: any) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.OCULUS;
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            let meshName;

            // Hand
            if (this.hand === 'left') {
                meshName = OculusTouchController.MODEL_LEFT_FILENAME;
            }
            else { // Right is the default if no hand is specified
                meshName = OculusTouchController.MODEL_RIGHT_FILENAME;
            }

            SceneLoader.ImportMesh("", OculusTouchController.MODEL_BASE_URL, meshName, scene, (newMeshes) => {
                /*
                Parent Mesh name: oculus_touch_left
                - body
                - trigger
                - thumbstick
                - grip
                - button_y 
                - button_x
                - button_enter
                */

                this._defaultModel = newMeshes[1];
                this.attachToMesh(this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
            });
        }


        // helper getters for left and right hand.
        public get onAButtonStateChangedObservable() {
            if (this.hand === 'right') {
                return this.onMainButtonStateChangedObservable;
            } else {
                throw new Error('No A button on left hand');
            }
        }

        public get onBButtonStateChangedObservable() {
            if (this.hand === 'right') {
                return this.onSecondaryButtonStateChangedObservable;
            } else {
                throw new Error('No B button on left hand');
            }
        }

        public get onXButtonStateChangedObservable() {
            if (this.hand === 'left') {
                return this.onMainButtonStateChangedObservable;
            } else {
                throw new Error('No X button on right hand');
            }
        }

        public get onYButtonStateChangedObservable() {
            if (this.hand === 'left') {
                return this.onSecondaryButtonStateChangedObservable;
            } else {
                throw new Error('No Y button on right hand');
            }
        }

        /*
         0) thumb stick (touch, press, value = pressed (0,1)). value is in this.leftStick
         1) index trigger (touch (?), press (only when value > 0.1), value 0 to 1)
         2) secondary trigger (same)
         3) A (right) X (left), touch, pressed = value
         4) B / Y 
         5) thumb rest
        */
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
            let notifyObject = state; //{ state: state, changes: changes };
            let triggerDirection = this.hand === 'right' ? -1 : 1;
            switch (buttonIdx) {
                case 0:
                    this.onPadStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 1: // index trigger
                    if (this._defaultModel) {
                        (<AbstractMesh>(this._defaultModel.getChildren()[3])).rotation.x = -notifyObject.value * 0.20;
                        (<AbstractMesh>(this._defaultModel.getChildren()[3])).position.y = -notifyObject.value * 0.005;
                        (<AbstractMesh>(this._defaultModel.getChildren()[3])).position.z = -notifyObject.value * 0.005;
                    }
                    this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 2:  // secondary trigger
                    if (this._defaultModel) {
                        (<AbstractMesh>(this._defaultModel.getChildren()[4])).position.x = triggerDirection * notifyObject.value * 0.0035;
                    }
                    this.onSecondaryTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 3:
                    if (this._defaultModel) {
                        if (notifyObject.pressed) {
                            (<AbstractMesh>(this._defaultModel.getChildren()[1])).position.y = -0.001;
                        }
                        else {
                            (<AbstractMesh>(this._defaultModel.getChildren()[1])).position.y = 0;
                        }
                    }
                    this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 4:
                    if (this._defaultModel) {
                        if (notifyObject.pressed) {
                            (<AbstractMesh>(this._defaultModel.getChildren()[2])).position.y = -0.001;
                        }
                        else {
                            (<AbstractMesh>(this._defaultModel.getChildren()[2])).position.y = 0;
                        }
                    }
                    this.onSecondaryButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 5:
                    this.onThumbRestChangedObservable.notifyObservers(notifyObject);
                    return;
            }
        }

    }

}