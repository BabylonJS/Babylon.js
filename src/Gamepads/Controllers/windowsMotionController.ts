import { Logger } from "../../Misc/logger";
import { Observable } from "../../Misc/observable";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Quaternion, Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";
import { Mesh } from "../../Meshes/mesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { TransformNode } from "../../Meshes/transformNode";
import { Ray } from "../../Culling/ray";
import { SceneLoader } from "../../Loading/sceneLoader";
import { WebVRController } from "./webVRController";
import { GenericController } from "./genericController";
import { PoseEnabledController, PoseEnabledControllerType, ExtendedGamepadButton, PoseEnabledControllerHelper } from "./poseEnabledController";
import { StickValues, GamepadButtonChanges } from "../../Gamepads/gamepad";

/**
 * Defines the LoadedMeshInfo object that describes information about the loaded webVR controller mesh
 */
class LoadedMeshInfo {
    /**
     * Root of the mesh
     */
    public rootNode: AbstractMesh;
    /**
     * Node of the mesh corresponding to the direction the ray should be cast from the controller
     */
    public pointingPoseNode: TransformNode;
    /**
     * Map of the button meshes contained in the controller
     */
    public buttonMeshes: { [id: string]: IButtonMeshInfo; } = {};
    /**
     * Map of the axis meshes contained in the controller
     */
    public axisMeshes: { [id: number]: IAxisMeshInfo; } = {};
}

/**
 * Defines the IMeshInfo object that describes information a webvr controller mesh
 */
interface IMeshInfo {
    /**
     * Index of the mesh inside the root mesh
     */
    index: number;
    /**
     * The mesh
     */
    value: TransformNode;
}

/**
 * Defines the IButtonMeshInfo object that describes a button mesh
 */
interface IButtonMeshInfo extends IMeshInfo {
    /**
     * The mesh that should be displayed when pressed
     */
    pressed: TransformNode;
    /**
     * The mesh that should be displayed when not pressed
     */
    unpressed: TransformNode;
}

/**
 * Defines the IAxisMeshInfo object that describes an axis mesh
 */
interface IAxisMeshInfo extends IMeshInfo {
    /**
     * The mesh that should be set when at its min
     */
    min: TransformNode;
    /**
     * The mesh that should be set when at its max
     */
    max: TransformNode;
}

/**
 * Defines the WindowsMotionController object that the state of the windows motion controller
 */
export class WindowsMotionController extends WebVRController {
    /**
     * The base url used to load the left and right controller models
     */
    public static MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/microsoft/';
    /**
     * The name of the left controller model file
     */
    public static MODEL_LEFT_FILENAME: string = 'left.glb';
    /**
     * The name of the right controller model file
     */
    public static MODEL_RIGHT_FILENAME: string = 'right.glb';

    /**
     * The controller name prefix for this controller type
     */
    public static readonly GAMEPAD_ID_PREFIX: string = 'Spatial Controller (Spatial Interaction Source) ';
    /**
     * The controller id pattern for this controller type
     */
    private static readonly GAMEPAD_ID_PATTERN = /([0-9a-zA-Z]+-[0-9a-zA-Z]+)$/;

    private _loadedMeshInfo: Nullable<LoadedMeshInfo>;
    protected readonly _mapping = {
        // Semantic button names
        buttons: ['thumbstick', 'trigger', 'grip', 'menu', 'trackpad'],
        // trigger, grip, trackpad, thumbstick, menu

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
        // upside down in webxr
        pointingPoseMeshName: PoseEnabledController.POINTING_POSE
    };

    /**
     * Fired when the trackpad on this controller is clicked
     */
    public onTrackpadChangedObservable = new Observable<ExtendedGamepadButton>();
    /**
     * Fired when the trackpad on this controller is modified
     */
    public onTrackpadValuesChangedObservable = new Observable<StickValues>();
    /**
     * The current x and y values of this controller's trackpad
     */
    public trackpad: StickValues = { x: 0, y: 0 };

    /**
     * Creates a new WindowsMotionController from a gamepad
     * @param vrGamepad the gamepad that the controller should be created from
     */
    constructor(vrGamepad: any) {
        super(vrGamepad);
        this.controllerType = PoseEnabledControllerType.WINDOWS;
        this._loadedMeshInfo = null;
    }

    /**
     * Fired when the trigger on this controller is modified
     */
    public get onTriggerButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onTriggerStateChangedObservable;
    }

    /**
     * Fired when the menu button on this controller is modified
     */
    public get onMenuButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onSecondaryButtonStateChangedObservable;
    }

    /**
     * Fired when the grip button on this controller is modified
     */
    public get onGripButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onMainButtonStateChangedObservable;
    }

    /**
     * Fired when the thumbstick button on this controller is modified
     */
    public get onThumbstickButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onPadStateChangedObservable;
    }

    /**
     * Fired when the touchpad button on this controller is modified
     */
    public get onTouchpadButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onTrackpadChangedObservable;
    }

    /**
     * Fired when the touchpad values on this controller are modified
     */
    public get onTouchpadValuesChangedObservable(): Observable<StickValues> {
        return this.onTrackpadValuesChangedObservable;
    }

    protected _updateTrackpad() {
        if (this.browserGamepad.axes && (this.browserGamepad.axes[2] != this.trackpad.x || this.browserGamepad.axes[3] != this.trackpad.y)) {
            this.trackpad.x = this.browserGamepad["axes"][this._mapping.axisMeshNames.indexOf('TOUCHPAD_TOUCH_X')];
            this.trackpad.y = this.browserGamepad["axes"][this._mapping.axisMeshNames.indexOf('TOUCHPAD_TOUCH_Y')];
            this.onTrackpadValuesChangedObservable.notifyObservers(this.trackpad);
        }
    }

    /**
     * Called once per frame by the engine.
     */
    public update() {
        super.update();
        if (this.browserGamepad.axes) {
            this._updateTrackpad();
            // Only need to animate axes if there is a loaded mesh
            if (this._loadedMeshInfo) {
                for (let axis = 0; axis < this._mapping.axisMeshNames.length; axis++) {
                    this._lerpAxisTransform(axis, this.browserGamepad.axes[axis]);
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
    protected _handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
        let buttonName = this._mapping.buttons[buttonIdx];
        if (!buttonName) {
            return;
        }

        // Update the trackpad to ensure trackpad.x/y are accurate during button events between frames
        this._updateTrackpad();

        // Only emit events for buttons that we know how to map from index to name
        let observable = (<any>this)[(<any>(this._mapping.buttonObservableNames))[buttonName]];
        if (observable) {
            observable.notifyObservers(state);
        }

        this._lerpButtonTransform(buttonName, state.value);
    }

    /**
     * Moves the buttons on the controller mesh based on their current state
     * @param buttonName the name of the button to move
     * @param buttonValue the value of the button which determines the buttons new position
     */
    protected _lerpButtonTransform(buttonName: string, buttonValue: number) {

        // If there is no loaded mesh, there is nothing to transform.
        if (!this._loadedMeshInfo) {
            return;
        }

        var meshInfo = this._loadedMeshInfo.buttonMeshes[buttonName];

        if (!meshInfo || !meshInfo.unpressed.rotationQuaternion || !meshInfo.pressed.rotationQuaternion || !meshInfo.value.rotationQuaternion) {
            return;
        }

        Quaternion.SlerpToRef(
            meshInfo.unpressed.rotationQuaternion,
            meshInfo.pressed.rotationQuaternion,
            buttonValue,
            meshInfo.value.rotationQuaternion);
        Vector3.LerpToRef(
            meshInfo.unpressed.position,
            meshInfo.pressed.position,
            buttonValue,
            meshInfo.value.position);
    }

    /**
     * Moves the axis on the controller mesh based on its current state
     * @param axis the index of the axis
     * @param axisValue the value of the axis which determines the meshes new position
     * @hidden
     */
    protected _lerpAxisTransform(axis: number, axisValue: number) {
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
        Quaternion.SlerpToRef(
            meshInfo.min.rotationQuaternion,
            meshInfo.max.rotationQuaternion,
            lerpValue,
            meshInfo.value.rotationQuaternion);
        Vector3.LerpToRef(
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
        if (SceneLoader.IsPluginForExtensionAvailable(".glb")) {
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
            Logger.Warn("You need to reference GLTF loader to load Windows Motion Controllers model. Falling back to generic models");
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
            Logger.Log(message);
            Logger.Warn('Failed to retrieve controller model from the remote server: ' + path + filename);
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
    private processModel(scene: Scene, meshes: AbstractMesh[]): Nullable<LoadedMeshInfo> {
        let loadedMeshInfo = null;

        // Create a new mesh to contain the glTF hierarchy
        let parentMesh = new Mesh(this.id + " " + this.hand, scene);

        // Find the root node in the loaded glTF scene, and attach it as a child of 'parentMesh'
        let childMesh: Nullable<AbstractMesh> = null;
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
            Logger.Warn('Could not find root node in model file.');
        }

        return loadedMeshInfo;
    }

    private createMeshInfo(rootNode: AbstractMesh): LoadedMeshInfo {
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
                Logger.Log('Skipping unknown button at index: ' + i + ' with mapped name: ' + this._mapping.buttons[i]);
                continue;
            }

            var buttonMesh = getChildByName(rootNode, buttonMeshName);
            if (!buttonMesh) {
                Logger.Warn('Missing button mesh with name: ' + buttonMeshName);
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
                Logger.Warn('Missing button submesh under mesh with name: ' + buttonMeshName +
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
                Logger.Log('Skipping unknown axis at index: ' + i);
                continue;
            }

            var axisMesh = getChildByName(rootNode, axisMeshName);
            if (!axisMesh) {
                Logger.Warn('Missing axis mesh with name: ' + axisMeshName);
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
                Logger.Warn('Missing axis submesh under mesh with name: ' + axisMeshName +
                    '(VALUE: ' + !!axisMeshInfo.value +
                    ', MIN: ' + !!axisMeshInfo.min +
                    ', MAX:' + !!axisMeshInfo.max +
                    ')');
            }
        }

        // Pointing Ray
        loadedMeshInfo.pointingPoseNode = getChildByName(rootNode, this._mapping.pointingPoseMeshName);
        if (!loadedMeshInfo.pointingPoseNode) {
            Logger.Warn('Missing pointing pose mesh with name: ' + this._mapping.pointingPoseMeshName);
        } else {
            this._pointingPoseNode = loadedMeshInfo.pointingPoseNode;
        }

        return loadedMeshInfo;

        // Look through all children recursively. This will return null if no mesh exists with the given name.
        function getChildByName(node: Node, name: string) {
            return <TransformNode>node.getChildren((n) => n.name === name, false)[0];
        }
        // Look through only immediate children. This will return null if no mesh exists with the given name.
        function getImmediateChildByName(node: Node, name: string): TransformNode {
            return <TransformNode>node.getChildren((n) => n.name == name, true)[0];
        }
    }

    /**
     * Gets the ray of the controller in the direction the controller is pointing
     * @param length the length the resulting ray should be
     * @returns a ray in the direction the controller is pointing
     */
    public getForwardRay(length = 100): Ray {
        if (!(this._loadedMeshInfo && this._loadedMeshInfo.pointingPoseNode)) {
            return super.getForwardRay(length);
        }

        var m = this._loadedMeshInfo.pointingPoseNode.getWorldMatrix();
        var origin = m.getTranslation();

        var forward = new Vector3(0, 0, -1);
        var forwardWorld = Vector3.TransformNormal(forward, m);

        var direction = Vector3.Normalize(forwardWorld);

        return new Ray(origin, direction, length);
    }

    /**
    * Disposes of the controller
    */
    public dispose(): void {
        super.dispose();

        this.onTrackpadChangedObservable.clear();
        this.onTrackpadValuesChangedObservable.clear();
    }
}

/**
 * This class represents a new windows motion controller in XR.
 */
export class XRWindowsMotionController extends WindowsMotionController {

    /**
     * Changing the original WIndowsMotionController mapping to fir the new mapping
     */
    protected readonly _mapping = {
        // Semantic button names
        buttons: ['trigger', 'grip', 'trackpad', 'thumbstick', 'menu'],
        // trigger, grip, trackpad, thumbstick, menu

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
            'thumbstick': 'onThumbstickStateChangedObservable',
            'trackpad': 'onTrackpadChangedObservable'
        },
        // A mapping of the axis name to glTF model node name
        // that should be transformed by axis value.
        // This array mirrors the browserGamepad.axes array, such that
        // the mesh corresponding to axis 0 is in this array index 0.
        axisMeshNames: [
            'TOUCHPAD_TOUCH_X',
            'TOUCHPAD_TOUCH_Y',
            'THUMBSTICK_X',
            'THUMBSTICK_Y'
        ],
        // upside down in webxr
        pointingPoseMeshName: PoseEnabledController.POINTING_POSE
    };

    /**
     * Construct a new XR-Based windows motion controller
     *
     * @param gamepadInfo the gamepad object from the browser
     */
    constructor(gamepadInfo: any) {
        super(gamepadInfo);
    }

    /**
     * holds the thumbstick values (X,Y)
     */
    public thumbstickValues: StickValues = { x: 0, y: 0 };

    /**
     * Fired when the thumbstick on this controller is clicked
     */
    public onThumbstickStateChangedObservable = new Observable<ExtendedGamepadButton>();
    /**
     * Fired when the thumbstick on this controller is modified
     */
    public onThumbstickValuesChangedObservable = new Observable<StickValues>();

    /**
     * Fired when the touchpad button on this controller is modified
     */
    public onTrackpadChangedObservable = this.onPadStateChangedObservable;

    /**
     * Fired when the touchpad values on this controller are modified
     */
    public onTrackpadValuesChangedObservable = this.onPadValuesChangedObservable;

    /**
     * Fired when the thumbstick button on this controller is modified
     * here to prevent breaking changes
     */
    public get onThumbstickButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onThumbstickStateChangedObservable;
    }

    /**
     * updating the thumbstick(!) and not the trackpad.
     * This is named this way due to the difference between WebVR and XR and to avoid
     * changing the parent class.
     */
    protected _updateTrackpad() {
        if (this.browserGamepad.axes && (this.browserGamepad.axes[2] != this.thumbstickValues.x || this.browserGamepad.axes[3] != this.thumbstickValues.y)) {
            this.trackpad.x = this.browserGamepad["axes"][2];
            this.trackpad.y = this.browserGamepad["axes"][3];
            this.onThumbstickValuesChangedObservable.notifyObservers(this.trackpad);
        }
    }

    /**
     * Disposes the class with joy
     */
    public dispose() {
        super.dispose();
        this.onThumbstickStateChangedObservable.clear();
        this.onThumbstickValuesChangedObservable.clear();
    }

}

PoseEnabledControllerHelper._ControllerFactories.push({
    canCreate: (gamepadInfo) => {
        return gamepadInfo.id.indexOf(WindowsMotionController.GAMEPAD_ID_PREFIX) === 0;
    },
    create: (gamepadInfo) => {
        return new WindowsMotionController(gamepadInfo);
    }
});
