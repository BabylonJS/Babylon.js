module BABYLON {
    
    export class GearVRController extends WebVRController {
        public static MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/generic/';
        public static MODEL_FILENAME:string = 'generic.babylon';

        public static readonly GAMEPAD_ID_PREFIX: string = 'Gear VR'; // id is 'Gear VR Controller'

        private readonly _buttonIndexToObservableNameMap = [
            'onTrackpadChangedObservable', // Trackpad
            'onTriggerStateChangedObservable' // Trigger
        ]

        constructor(vrGamepad: any) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.GEAR_VR;
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", GearVRController.MODEL_BASE_URL, GearVRController.MODEL_FILENAME, scene, (newMeshes) => {
                this._defaultModel = newMeshes[1];
                this.attachToMesh(this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
            });
        }

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