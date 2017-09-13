module BABYLON {
    
    export class GenericController extends WebVRController {
        public static readonly MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/generic/';
        public static readonly MODEL_FILENAME:string = 'generic.babylon';

        constructor(vrGamepad) {
            super(vrGamepad);
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", GenericController.MODEL_BASE_URL, GenericController.MODEL_FILENAME, scene, (newMeshes) => {
                this._defaultModel = newMeshes[1];
                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
                this.attachToMesh(this._defaultModel);
            });
        }

        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
            console.log("Button id: " + buttonIdx + "state: ");
            console.dir(state);
        }
    }

}