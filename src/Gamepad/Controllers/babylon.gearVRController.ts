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

        private _maxRotationDistFromHeadset = Math.PI/5;
        private _draggedRoomRotation = 0;
        private _tmpVector = new BABYLON.Vector3();
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
            // Initial starting position defaults to where hand would be (incase of only 3dof controller)
            this._calculatedPosition = new Vector3(this.hand == "left" ? -0.15 : 0.15,-0.5, 0.25)
        }

        /**
         * Updates the state of the pose enbaled controller based on the raw pose data from the device
         * @param poseData raw pose fromthe device
         */
        public updateFromDevice(poseData: DevicePose) {
            super.updateFromDevice(poseData);
            if(BABYLON.Engine.LastCreatedScene && BABYLON.Engine.LastCreatedScene.activeCamera){
                if((<WebVRFreeCamera>BABYLON.Engine.LastCreatedScene.activeCamera).deviceRotationQuaternion){
                    var camera = (<WebVRFreeCamera>BABYLON.Engine.LastCreatedScene.activeCamera);
                    camera._deviceRoomRotationQuaternion.toEulerAnglesToRef(this._tmpVector);
                    
                    // Find the radian distance away that the headset is from the controllers rotation
                    var distanceAway = Math.atan2(Math.sin(this._tmpVector.y - this._draggedRoomRotation), Math.cos(this._tmpVector.y - this._draggedRoomRotation))
                    if(Math.abs(distanceAway) > this._maxRotationDistFromHeadset){
                        // Only rotate enouph to be within the _maxRotationDistFromHeadset
                        var rotationAmount = distanceAway - (distanceAway < 0 ? -this._maxRotationDistFromHeadset : this._maxRotationDistFromHeadset);
                        this._draggedRoomRotation += rotationAmount;
                        
                        // Rotate controller around headset
                        var sin = Math.sin(-rotationAmount);
                        var cos = Math.cos(-rotationAmount);
                        this._calculatedPosition.x = this._calculatedPosition.x * cos - this._calculatedPosition.z * sin;
                        this._calculatedPosition.z = this._calculatedPosition.x * sin + this._calculatedPosition.z * cos;
                    }                  
                }
            }
        }

        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
            SceneLoader.ImportMesh("", GearVRController.MODEL_BASE_URL, GearVRController.MODEL_FILENAME, scene, (newMeshes) => {
                // Offset the controller so it will rotate around the users wrist
                var mesh = new BABYLON.Mesh("", scene);
                newMeshes[1].parent = mesh;
                newMeshes[1].position.z = -0.15;
                this._defaultModel = mesh;
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