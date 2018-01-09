module BABYLON {
    
    export class GearVRController extends WebVRController {
        public static readonly MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/generic/';
        public static readonly MODEL_FILENAME:string = 'generic.babylon';

        public static readonly GAMEPAD_ID_PREFIX: string = 'Gear VR'; // id is 'Gear VR Controller'

        private readonly _mapping = {
            // Semantic button names
            buttons: ['trackpad', 'trigger'],

            // This mapping is used to translate from the controller to Babylon semantics
            buttonObservableNames: {
                'trackpad': 'onTrackpadChangedObservable',
                'trigger': 'onTriggerStateChangedObservable'

            }
        };

        constructor(vrGamepad: any) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.GEAR_VR;
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", GenericController.MODEL_BASE_URL, GenericController.MODEL_FILENAME, scene, (newMeshes) => {
                this._defaultModel = newMeshes[1];
                this.attachToMesh(this._defaultModel);
                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
            });
        }

        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {

            if (buttonIdx < this._mapping.buttons.length) {
                const buttonName : string = this._mapping.buttons[buttonIdx];
                
                // Only emit events for buttons that we know how to map from index to name
                let observable = (<any>this)[(<any>(this._mapping.buttonObservableNames))[buttonName]];
                if (observable) {
                    observable.notifyObservers(state);
                }
            }
        }
    }
}