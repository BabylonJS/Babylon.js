module BABYLON {

    export class ViveController extends WebVRController {
        private static readonly MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/vive/';
        private static readonly MODEL_FILENAME:string = 'wand.babylon';

        constructor(vrGamepad: any) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.VIVE;
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", ViveController.MODEL_BASE_URL, ViveController.MODEL_FILENAME, scene, (newMeshes) => {
                /*
                Parent Mesh name: ViveWand
                - body
                - r_gripper
                - l_gripper
                - menu_button
                - system_button
                - trackpad
                - trigger
                - LED
                */
                this._defaultModel = newMeshes[1];
                this.attachToMesh(this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
            });
        }

        public get onLeftButtonStateChangedObservable() {
            return this.onMainButtonStateChangedObservable;
        }

        public get onRightButtonStateChangedObservable() {
            return this.onMainButtonStateChangedObservable;
        }

        public get onMenuButtonStateChangedObservable() {
            return this.onSecondaryButtonStateChangedObservable;
        }

        /**
         * Vive mapping:
         * 0: touchpad
         * 1: trigger
         * 2: left AND right buttons
         * 3: menu button
         */
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
            let notifyObject = state; //{ state: state, changes: changes };
            switch (buttonIdx) {
                case 0:
                    this.onPadStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 1: // index trigger
                    if (this._defaultModel) {
                        (<AbstractMesh>(this._defaultModel.getChildren()[6])).rotation.x = -notifyObject.value * 0.15;
                    }
                    this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 2:  // left AND right button
                    this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                    return;
                case 3:
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
            }
        }
    }

}