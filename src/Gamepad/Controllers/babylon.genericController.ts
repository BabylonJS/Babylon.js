module BABYLON {
    
    export class GenericController extends WebVRController {
        private _defaultModel: BABYLON.AbstractMesh;

        constructor(vrGamepad) {
            super(vrGamepad);
        }

        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", "http://yoda.blob.core.windows.net/models/", "genericvrcontroller.babylon", scene, (newMeshes) => {
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