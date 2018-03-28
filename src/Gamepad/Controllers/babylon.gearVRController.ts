module BABYLON {
    /**
     * Gear VR Controller
     */
    export class GearVRController extends WebVRController {
        /**
         * Base Url for the controller model.
         */
        public static MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/generic/';
        /**
         * File name for the controller model.
         */
        public static MODEL_FILENAME:string = 'generic.babylon';

        /**
         * Gamepad Id prefix used to identify this controller.
         */
        public static readonly GAMEPAD_ID_PREFIX: string = 'Gear VR'; // id is 'Gear VR Controller'

        private readonly _buttonIndexToObservableNameMap = [
            'onTrackpadChangedObservable', // Trackpad
            'onTriggerStateChangedObservable' // Trigger
        ]

        /**
         * Creates a new GearVRController from a gamepad
         * @param vrGamepad the gamepad that the controller should be created from
         */
        constructor(vrGamepad: any) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.GEAR_VR;
        }

        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", GearVRController.MODEL_BASE_URL, GearVRController.MODEL_FILENAME, scene, (newMeshes) => {
                this._defaultModel = newMeshes[1];
                this.attachToMesh(this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
            });
        }

        /**
         * Called once for each button that changed state since the last frame
         * @param buttonIdx Which button index changed
         * @param state New state of the button
         * @param changes Which properties on the state changed since last frame
         */
        protected _handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
            if (buttonIdx < this._buttonIndexToObservableNameMap.length) {
                const observableName : string = this._buttonIndexToObservableNameMap[buttonIdx];
                
                // Only emit events for buttons that we know how to map from index to observable
                let observable = (<any>this)[observableName];
                if (observable) {
                    observable.notifyObservers(state);
                }
            }
        }
    }
}