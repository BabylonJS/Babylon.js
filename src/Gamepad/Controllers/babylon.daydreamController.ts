module BABYLON {
    /**
     * Google Daydream controller
     */
    export class DaydreamController extends WebVRController {
        public static MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/generic/';
        public static MODEL_FILENAME:string = 'generic.babylon';

        public static readonly GAMEPAD_ID_PREFIX: string = 'Daydream'; // id is 'Daydream Controller'

        constructor(vrGamepad: any) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.DAYDREAM;
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", DaydreamController.MODEL_BASE_URL, DaydreamController.MODEL_FILENAME, scene, (newMeshes) => {
                this._defaultModel = newMeshes[1];
                this.attachToMesh(this._defaultModel);

                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
            });
        }

        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
            // Daydream controller only has 1 GamepadButton (on the trackpad).
            if (buttonIdx === 0) {
                let observable = this.onTriggerStateChangedObservable;
                if (observable) {
                    observable.notifyObservers(state);
                }
            } else {
                // If the app or home buttons are ever made available
                Tools.Warn(`Unrecognized Daydream button index: ${buttonIdx}`)
            }
        }
    }
}