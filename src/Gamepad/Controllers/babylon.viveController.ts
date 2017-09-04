module BABYLON {

    export class ViveController extends WebVRController {
        private _defaultModel: BABYLON.AbstractMesh;

        constructor(vrGamepad) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.VIVE;
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", "http://yoda.blob.core.windows.net/models/", "ViveWand.babylon", scene, (newMeshes) => {
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
                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
                this.attachToMesh(this._defaultModel);
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