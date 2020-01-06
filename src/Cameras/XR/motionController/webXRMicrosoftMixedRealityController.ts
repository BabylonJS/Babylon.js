import {
    WebXRAbstractMotionController,
    IMinimalMotionControllerObject,
    MotionControllerHandness,
    IMotionControllerLayoutMap
} from "./webXRAbstractController";
import { WebXRMotionControllerManager } from './webXRMotionControllerManager';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Scene } from '../../../scene';
import { Logger } from '../../../Misc/logger';
import { Mesh } from '../../../Meshes/mesh';
import { Quaternion } from '../../../Maths/math.vector';
import { SceneLoader } from '../../../Loading/sceneLoader';

// https://github.com/immersive-web/webxr-input-profiles/blob/master/packages/registry/profiles/microsoft/microsoft-mixed-reality.json
const MixedRealityProfile: IMotionControllerLayoutMap = {
    "left-right": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" },
            "xr-standard-squeeze": { "type": "squeeze" },
            "xr-standard-touchpad": { "type": "touchpad" },
            "xr-standard-thumbstick": { "type": "thumbstick" }
        },
        "gamepad": {
            "mapping": "xr-standard",
            "buttons": [
                "xr-standard-trigger",
                "xr-standard-squeeze",
                "xr-standard-touchpad",
                "xr-standard-thumbstick"
            ],
            "axes": [
                { "componentId": "xr-standard-touchpad", "axis": "x-axis" },
                { "componentId": "xr-standard-touchpad", "axis": "y-axis" },
                { "componentId": "xr-standard-thumbstick", "axis": "x-axis" },
                { "componentId": "xr-standard-thumbstick", "axis": "y-axis" }
            ]
        }
    }
};

/**
 * The motion controller class for all microsoft mixed reality controllers
 */
export class WebXRMicrosoftMixedRealityController extends WebXRAbstractMotionController {
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

    public profileId = "microsoft-mixed-reality";

    // use this in the future - https://github.com/immersive-web/webxr-input-profiles/tree/master/packages/assets/profiles/microsoft
    protected readonly _mapping = {
        defaultButton: {
            "valueNodeName": "VALUE",
            "unpressedNodeName": "UNPRESSED",
            "pressedNodeName": "PRESSED"
        },
        defaultAxis: {
            "valueNodeName": "VALUE",
            "minNodeName": "MIN",
            "maxNodeName": "MAX"
        },
        buttons: {
            "xr-standard-trigger": {
                "rootNodeName": "SELECT",
                "componentProperty": "button",
                "states": ["default", "touched", "pressed"]
            },
            "xr-standard-squeeze": {
                "rootNodeName": "GRASP",
                "componentProperty": "state",
                "states": ["pressed"]
            },
            "xr-standard-touchpad": {
                "rootNodeName": "TOUCHPAD_PRESS",
                "labelAnchorNodeName": "squeeze-label",
                "touchPointNodeName": "TOUCH" // TODO - use this for visual feedback
            },
            "xr-standard-thumbstick": {
                "rootNodeName": "THUMBSTICK_PRESS",
                "componentProperty": "state",
                "states": ["pressed"],
            }
        },
        axes: {
            "xr-standard-touchpad": {
                "x-axis": {
                    "rootNodeName": "TOUCHPAD_TOUCH_X"
                },
                "y-axis": {
                    "rootNodeName": "TOUCHPAD_TOUCH_Y"
                }
            },
            "xr-standard-thumbstick": {
                "x-axis": {
                    "rootNodeName": "THUMBSTICK_X"
                },
                "y-axis": {
                    "rootNodeName": "THUMBSTICK_Y"
                }
            }
        }
    };

    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handness: MotionControllerHandness) {
        super(scene, MixedRealityProfile["left-right"], gamepadObject, handness);
    }

    protected _processLoadedModel(_meshes: AbstractMesh[]): void {
        if (!this.rootMesh) { return; }

        // Button Meshes
        for (let i = 0; i < this.layout.gamepad!.buttons.length; i++) {
            const buttonName = this.layout.gamepad!.buttons[i];
            if (buttonName) {
                const buttonMap = (<any>this._mapping.buttons)[buttonName];
                const buttonMeshName = buttonMap.rootNodeName;
                if (!buttonMeshName) {
                    Logger.Log('Skipping unknown button at index: ' + i + ' with mapped name: ' + buttonName);
                    continue;
                }

                var buttonMesh = this._getChildByName(this.rootMesh, buttonMeshName);
                if (!buttonMesh) {
                    Logger.Warn('Missing button mesh with name: ' + buttonMeshName);
                    continue;
                }

                buttonMap.valueMesh = this._getImmediateChildByName(buttonMesh, this._mapping.defaultButton.valueNodeName);
                buttonMap.pressedMesh = this._getImmediateChildByName(buttonMesh, this._mapping.defaultButton.pressedNodeName);
                buttonMap.unpressedMesh = this._getImmediateChildByName(buttonMesh, this._mapping.defaultButton.unpressedNodeName);

                if (buttonMap.valueMesh && buttonMap.pressedMesh && buttonMap.unpressedMesh) {
                    const comp = this.getComponent(buttonName);
                    if (comp) {
                        comp.onButtonStateChanged.add((component) => {
                            this._lerpButtonTransform(buttonMap, component.value);
                        }, undefined, true);
                    }
                } else {
                    // If we didn't find the mesh, it simply means this button won't have transforms applied as mapped button value changes.
                    Logger.Warn('Missing button submesh under mesh with name: ' + buttonMeshName);
                }
            }

        }

        // Axis Meshes
        for (let i = 0; i < this.layout.gamepad!.axes.length; ++i) {
            const axisData = this.layout.gamepad!.axes[i];
            if (!axisData) {
                Logger.Log('Skipping unknown axis at index: ' + i);
                continue;
            }

            const axisMap = (<any>this._mapping.axes)[axisData.componentId][axisData.axis];

            var axisMesh = this._getChildByName(this.rootMesh, axisMap.rootNodeName);
            if (!axisMesh) {
                Logger.Warn('Missing axis mesh with name: ' + axisMap.rootNodeName);
                continue;
            }

            axisMap.valueMesh = this._getImmediateChildByName(axisMesh, this._mapping.defaultAxis.valueNodeName);
            axisMap.minMesh = this._getImmediateChildByName(axisMesh, this._mapping.defaultAxis.minNodeName);
            axisMap.maxMesh = this._getImmediateChildByName(axisMesh, this._mapping.defaultAxis.maxNodeName);

            if (axisMap.valueMesh && axisMap.minMesh && axisMap.maxMesh) {
                const comp = this.getComponent(axisData.componentId);
                if (comp) {
                    comp.onAxisValueChanged.add((axisValues) => {
                        const value = axisData.axis === "x-axis" ? axisValues.x : axisValues.y;
                        this._lerpAxisTransform(axisMap, value);
                    }, undefined, true);
                }

            } else {
                // If we didn't find the mesh, it simply means this button won't have transforms applied as mapped button value changes.
                Logger.Warn('Missing axis submesh under mesh with name: ' + axisMap.rootNodeName);
            }
        }
    }

    // Look through all children recursively. This will return null if no mesh exists with the given name.
    private _getChildByName(node: AbstractMesh, name: string): AbstractMesh {
        return <AbstractMesh>node.getChildren((n) => n.name === name, false)[0];
    }
    // Look through only immediate children. This will return null if no mesh exists with the given name.
    private _getImmediateChildByName(node: AbstractMesh, name: string): AbstractMesh {
        return <AbstractMesh>node.getChildren((n) => n.name == name, true)[0];
    }

    protected _getFilenameAndPath(): { filename: string; path: string; } {
        let filename = "";
        if (this.handness === 'left') {
            filename = WebXRMicrosoftMixedRealityController.MODEL_LEFT_FILENAME;
        }
        else { // Right is the default if no hand is specified
            filename = WebXRMicrosoftMixedRealityController.MODEL_RIGHT_FILENAME;
        }

        const device = 'default';
        let path = WebXRMicrosoftMixedRealityController.MODEL_BASE_URL + device + '/';
        return {
            filename,
            path
        };
    }

    protected _updateModel(): void {
        // no-op. model is updated using observables.
    }

    protected _getModelLoadingConstraints(): boolean {
        return SceneLoader.IsPluginForExtensionAvailable(".glb");
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + " " + this.handness, this.scene);
        this.rootMesh.isPickable = false;
        let rootMesh;
        // Find the root node in the loaded glTF scene, and attach it as a child of 'parentMesh'
        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];

            mesh.isPickable = false;

            if (!mesh.parent) {
                // Handle root node, attach to the new parentMesh
                rootMesh = mesh;
            }
        }

        if (rootMesh) {
            rootMesh.setParent(this.rootMesh);
        }

        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
    }

}

// register the profile
WebXRMotionControllerManager.RegisterController("windows-mixed-reality", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRMicrosoftMixedRealityController(scene, <any>(xrInput.gamepad), xrInput.handedness);
});