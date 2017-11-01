module BABYLON {

    class LoadedMeshInfo {
        public rootNode: AbstractMesh;
        public pointingPoseNode: AbstractMesh;
        public buttonMeshes: { [id: string] : IButtonMeshInfo; } = {};
        public axisMeshes: { [id: number] : IAxisMeshInfo; } = {};
    }

    interface IMeshInfo {
        index: number;
        value: AbstractMesh;
    }

    interface IButtonMeshInfo extends IMeshInfo {
        pressed: AbstractMesh;
        unpressed: AbstractMesh;
    }

    interface IAxisMeshInfo extends IMeshInfo {
        min: AbstractMesh;
        max: AbstractMesh;
    }

    export class WindowsMotionController extends WebVRController {
        private static readonly MODEL_BASE_URL:string = 'https://controllers.babylonjs.com/microsoft/';
        private static readonly MODEL_LEFT_FILENAME:string = 'left.glb';
        private static readonly MODEL_RIGHT_FILENAME:string = 'right.glb';

        public static readonly GAMEPAD_ID_PREFIX:string = 'Spatial Controller (Spatial Interaction Source) ';
        private static readonly GAMEPAD_ID_PATTERN = /([0-9a-zA-Z]+-[0-9a-zA-Z]+)$/;

        private _loadedMeshInfo: Nullable<LoadedMeshInfo>;
        private readonly _mapping = {
            // Semantic button names
            buttons: ['thumbstick', 'trigger', 'grip', 'menu', 'trackpad'],
            
            // A mapping of the button name to glTF model node name
            // that should be transformed by button value.
            buttonMeshNames: {
                'trigger': 'SELECT',
                'menu': 'MENU',
                'grip': 'GRASP',
                'thumbstick': 'THUMBSTICK_PRESS',
                'trackpad': 'TOUCHPAD_PRESS'
            },
            // This mapping is used to translate from the Motion Controller to Babylon semantics
            buttonObservableNames: {
                'trigger': 'onTriggerStateChangedObservable',
                'menu': 'onSecondaryButtonStateChangedObservable',
                'grip': 'onMainButtonStateChangedObservable',
                'thumbstick': 'onPadStateChangedObservable',
                'trackpad': 'onTrackpadChangedObservable'
            },
            // A mapping of the axis name to glTF model node name
            // that should be transformed by axis value.
            // This array mirrors the browserGamepad.axes array, such that 
            // the mesh corresponding to axis 0 is in this array index 0.
            axisMeshNames: [
                'THUMBSTICK_X',
                'THUMBSTICK_Y',
                'TOUCHPAD_TOUCH_X',
                'TOUCHPAD_TOUCH_Y'
            ],
            pointingPoseMeshName: 'POINTING_POSE'
        };

        public onTrackpadChangedObservable = new Observable<ExtendedGamepadButton>();

        constructor(vrGamepad: any) {
            super(vrGamepad);
            this.controllerType = PoseEnabledControllerType.WINDOWS;
            this._loadedMeshInfo = null;
        }
        
        public get onTriggerButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
            return this.onTriggerStateChangedObservable;
        }

        public get onMenuButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
            return this.onSecondaryButtonStateChangedObservable;
        }

        public get onGripButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
            return this.onMainButtonStateChangedObservable;
        }

        public get onThumbstickButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
            return this.onPadStateChangedObservable;
        }    

        public get onTouchpadButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
            return this.onTrackpadChangedObservable;
        }
        
        /**
         * Called once per frame by the engine.
         */
        public update() {
            super.update();
            
            // Only need to animate axes if there is a loaded mesh
            if (this._loadedMeshInfo) {
                if (this.browserGamepad.axes) {
                    for (let axis = 0; axis < this._mapping.axisMeshNames.length; axis++) {
                        this.lerpAxisTransform(axis, this.browserGamepad.axes[axis]);
                    }
                }
            }
        }
        
        /**
         * Called once for each button that changed state since the last frame
         * @param buttonIdx Which button index changed
         * @param state New state of the button
         * @param changes Which properties on the state changed since last frame
         */
        protected handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
            let buttonName = this._mapping.buttons[buttonIdx];
            if (!buttonName) {
                return; 
            }

            // Only emit events for buttons that we know how to map from index to name
            let observable = (<any>this)[(<any>(this._mapping.buttonObservableNames))[buttonName]];
            if (observable) {
                observable.notifyObservers(state);
            }

            this.lerpButtonTransform(buttonName, state.value);
        }
        
        protected lerpButtonTransform(buttonName: string, buttonValue: number) {
            
            // If there is no loaded mesh, there is nothing to transform.
            if (!this._loadedMeshInfo) {
                return;
            }

            var meshInfo = this._loadedMeshInfo.buttonMeshes[buttonName];

            if (!meshInfo.unpressed.rotationQuaternion || !meshInfo.pressed.rotationQuaternion || !meshInfo.value.rotationQuaternion) {
                return;
            }

            BABYLON.Quaternion.SlerpToRef(
                meshInfo.unpressed.rotationQuaternion, 
                meshInfo.pressed.rotationQuaternion, 
                buttonValue,
                meshInfo.value.rotationQuaternion);
            BABYLON.Vector3.LerpToRef(
                meshInfo.unpressed.position, 
                meshInfo.pressed.position,
                buttonValue,
                meshInfo.value.position);
        }
        
        protected lerpAxisTransform(axis:number, axisValue: number) {
            if (!this._loadedMeshInfo) {
                return;
            }

            let meshInfo = this._loadedMeshInfo.axisMeshes[axis];
            if (!meshInfo) {
                return;
            }

            if (!meshInfo.min.rotationQuaternion || !meshInfo.max.rotationQuaternion || !meshInfo.value.rotationQuaternion) {
                return;
            }            

            // Convert from gamepad value range (-1 to +1) to lerp range (0 to 1)
            let lerpValue = axisValue * 0.5 + 0.5;
            BABYLON.Quaternion.SlerpToRef(
                meshInfo.min.rotationQuaternion, 
                meshInfo.max.rotationQuaternion, 
                lerpValue,
                meshInfo.value.rotationQuaternion);
            BABYLON.Vector3.LerpToRef(
                meshInfo.min.position, 
                meshInfo.max.position,
                lerpValue,
                meshInfo.value.position);
        }
        
        /**
         * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
         * @param scene scene in which to add meshes
         * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
         */
        public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void, forceDefault = false) {
            let path: string;        
            let filename: string;

            // Checking if GLB loader is present
            if (SceneLoader.GetPluginForExtension("glb")) {
                // Determine the device specific folder based on the ID suffix
                let device = 'default';
                if (this.id && !forceDefault) {
                    let match = this.id.match(WindowsMotionController.GAMEPAD_ID_PATTERN);
                    device = ((match && match[0]) || device);
                }

                // Hand
                if (this.hand === 'left') {
                    filename = WindowsMotionController.MODEL_LEFT_FILENAME;
                }
                else { // Right is the default if no hand is specified
                    filename = WindowsMotionController.MODEL_RIGHT_FILENAME;
                }

                path = WindowsMotionController.MODEL_BASE_URL + device + '/';
            } else {
                Tools.Warn("You need to reference GLTF loader to load Windows Motion Controllers model. Falling back to generic models");
                path = GenericController.MODEL_BASE_URL;
                filename = GenericController.MODEL_FILENAME;
            }


            SceneLoader.ImportMesh("", path, filename, scene, (meshes: AbstractMesh[]) => {
                // glTF files successfully loaded from the remote server, now process them to ensure they are in the right format.
                this._loadedMeshInfo = this.processModel(scene, meshes);

                if (!this._loadedMeshInfo) {
                    return;
                }

                this._defaultModel = this._loadedMeshInfo.rootNode;
                this.attachToMesh(this._defaultModel);

                if (meshLoaded) {
                    meshLoaded(this._defaultModel);
                }
            }, null, (scene: Scene, message: string) => {
                Tools.Log(message);
                Tools.Warn('Failed to retrieve controller model from the remote server: ' + path + filename);
                if (!forceDefault) {
                    this.initControllerMesh(scene, meshLoaded, true);
                }
            });
        }

        /**
         * Takes a list of meshes (as loaded from the glTF file) and finds the root node, as well as nodes that 
         * can be transformed by button presses and axes values, based on this._mapping.
         * 
         * @param scene scene in which the meshes exist
         * @param meshes list of meshes that make up the controller model to process
         * @return structured view of the given meshes, with mapping of buttons and axes to meshes that can be transformed.
         */
        private processModel(scene: Scene, meshes: AbstractMesh[]) : Nullable<LoadedMeshInfo> {
            let loadedMeshInfo = null;

            // Create a new mesh to contain the glTF hierarchy
            let parentMesh = new BABYLON.Mesh(this.id + " " + this.hand, scene);

            // Find the root node in the loaded glTF scene, and attach it as a child of 'parentMesh'
            let childMesh : Nullable<AbstractMesh> = null;
            for (let i = 0; i < meshes.length; i++) {
                let mesh = meshes[i];

                if (!mesh.parent) {
                    // Exclude controller meshes from picking results
                    mesh.isPickable = false;
                    
                    // Handle root node, attach to the new parentMesh
                    childMesh = mesh;
                    break;
                }
            }

            if (childMesh) {
                childMesh.setParent(parentMesh);

                // Create our mesh info. Note that this method will always return non-null.
                loadedMeshInfo = this.createMeshInfo(parentMesh);
            } else {
                Tools.Warn('Could not find root node in model file.');
            }

            return loadedMeshInfo;
        }
        
        private createMeshInfo(rootNode: AbstractMesh) : LoadedMeshInfo {
            let loadedMeshInfo = new LoadedMeshInfo();
            var i;
            loadedMeshInfo.rootNode = rootNode;

            // Reset the caches
            loadedMeshInfo.buttonMeshes = {};
            loadedMeshInfo.axisMeshes = {};

            // Button Meshes
            for (i = 0; i < this._mapping.buttons.length; i++) {
                var buttonMeshName = (<any>this._mapping.buttonMeshNames)[this._mapping.buttons[i]];
                if (!buttonMeshName) {
                    Tools.Log('Skipping unknown button at index: ' + i + ' with mapped name: ' + this._mapping.buttons[i]);
                    continue;
                }

                var buttonMesh = getChildByName(rootNode, buttonMeshName);
                if (!buttonMesh) {
                    Tools.Warn('Missing button mesh with name: ' + buttonMeshName);
                    continue;
                }

                var buttonMeshInfo = {
                    index: i,
                    value: getImmediateChildByName(buttonMesh, 'VALUE'),
                    pressed: getImmediateChildByName(buttonMesh, 'PRESSED'),
                    unpressed: getImmediateChildByName(buttonMesh, 'UNPRESSED')
                };
                if (buttonMeshInfo.value && buttonMeshInfo.pressed && buttonMeshInfo.unpressed) {
                    loadedMeshInfo.buttonMeshes[this._mapping.buttons[i]] = buttonMeshInfo;
                } else {
                    // If we didn't find the mesh, it simply means this button won't have transforms applied as mapped button value changes.
                    Tools.Warn('Missing button submesh under mesh with name: ' + buttonMeshName +
                        '(VALUE: ' + !!buttonMeshInfo.value +
                        ', PRESSED: ' + !!buttonMeshInfo.pressed +
                        ', UNPRESSED:' + !!buttonMeshInfo.unpressed +
                        ')');
                }
            }

            // Axis Meshes
            for (i = 0; i < this._mapping.axisMeshNames.length; i++) {
                var axisMeshName = this._mapping.axisMeshNames[i];
                if (!axisMeshName) {
                    Tools.Log('Skipping unknown axis at index: ' + i);
                    continue;
                }

                var axisMesh = getChildByName(rootNode, axisMeshName);
                if (!axisMesh) {
                    Tools.Warn('Missing axis mesh with name: ' + axisMeshName);
                    continue;
                }

                var axisMeshInfo = {
                    index: i,
                    value: getImmediateChildByName(axisMesh, 'VALUE'),
                    min: getImmediateChildByName(axisMesh, 'MIN'),
                    max: getImmediateChildByName(axisMesh, 'MAX')
                };
                if (axisMeshInfo.value && axisMeshInfo.min && axisMeshInfo.max) {
                    loadedMeshInfo.axisMeshes[i] = axisMeshInfo;
                } else {
                    // If we didn't find the mesh, it simply means thit axis won't have transforms applied as mapped axis values change.
                    Tools.Warn('Missing axis submesh under mesh with name: ' + axisMeshName +
                        '(VALUE: ' + !!axisMeshInfo.value +
                        ', MIN: ' + !!axisMeshInfo.min +
                        ', MAX:' + !!axisMeshInfo.max +
                        ')');
                }
            }

            // Pointing Ray
            loadedMeshInfo.pointingPoseNode = getChildByName(rootNode, this._mapping.pointingPoseMeshName);
            if (!loadedMeshInfo.pointingPoseNode) {                
                Tools.Warn('Missing pointing pose mesh with name: ' + this._mapping.pointingPoseMeshName);
            }

            return loadedMeshInfo;
            
            // Look through all children recursively. This will return null if no mesh exists with the given name.
            function getChildByName(node: Node, name: string) {
                return node.getChildMeshes(false, n => n.name === name)[0];
            }
            // Look through only immediate children. This will return null if no mesh exists with the given name.
            function getImmediateChildByName (node: Node, name: string) : AbstractMesh {
                return node.getChildMeshes(true, n => n.name == name)[0];
            }
        }

        public getForwardRay(length = 100): Ray {
            if (!(this._loadedMeshInfo && this._loadedMeshInfo.pointingPoseNode)) {
                return super.getForwardRay(length);
            }

            var m = this._loadedMeshInfo.pointingPoseNode.getWorldMatrix();
            var origin = m.getTranslation();

            var forward = new BABYLON.Vector3(0, 0, -1);
            var forwardWorld = BABYLON.Vector3.TransformNormal(forward, m);

            var direction = BABYLON.Vector3.Normalize(forwardWorld);            

            return new Ray(origin, direction, length);
        }

        public dispose(): void {
            super.dispose();

            this.onTrackpadChangedObservable.clear();
        }
    }
}
