import {
    WebXRAbstractMotionController,
    IMinimalMotionControllerObject,
    MotionControllerHandness,
    IMotionControllerLayoutMap
} from "./webXRAbstractController";
import { WebXRMotionControllerManager } from './webXRMotionControllerManager';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Scene } from '../../../scene';
import { Mesh } from '../../../Meshes/mesh';
import { Quaternion } from '../../../Maths/math.vector';

// https://github.com/immersive-web/webxr-input-profiles/blob/master/packages/registry/profiles/microsoft/microsoft-mixed-reality.json
const OculusTouchLayouts: IMotionControllerLayoutMap = {
    "left": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" },
            "xr-standard-squeeze": { "type": "squeeze" },
            "xr-standard-thumbstick": { "type": "thumbstick" },
            "a-button": { "type": "button" },
            "b-button": { "type": "button" },
            "thumbrest": { "type": "button" }
        },
        "gamepad": {
            "mapping": "xr-standard",
            "buttons": [
                "xr-standard-trigger",
                "xr-standard-squeeze",
                null,
                "xr-standard-thumbstick",
                "a-button",
                "b-button",
                "thumbrest"
            ],
            "axes": [
                null,
                null,
                { "componentId": "xr-standard-thumbstick", "axis": "x-axis" },
                { "componentId": "xr-standard-thumbstick", "axis": "y-axis" }
            ]
        }
    },
    "right": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" },
            "xr-standard-squeeze": { "type": "squeeze" },
            "xr-standard-thumbstick": { "type": "thumbstick" },
            "x-button": { "type": "button" },
            "y-button": { "type": "button" },
            "thumbrest": { "type": "button" }
        },
        "gamepad": {
            "mapping": "xr-standard",
            "buttons": [
                "xr-standard-trigger",
                "xr-standard-squeeze",
                null,
                "xr-standard-thumbstick",
                "x-button",
                "y-button",
                "thumbrest"
            ],
            "axes": [
                null,
                null,
                { "componentId": "xr-standard-thumbstick", "axis": "x-axis" },
                { "componentId": "xr-standard-thumbstick", "axis": "y-axis" }
            ]
        }
    }
};

const OculusTouchLegacyLayouts: IMotionControllerLayoutMap = {
    "left": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" },
            "xr-standard-squeeze": { "type": "squeeze" },
            "xr-standard-thumbstick": { "type": "thumbstick" },
            "a-button": { "type": "button" },
            "b-button": { "type": "button" },
            "thumbrest": { "type": "button" }
        },
        "gamepad": {
            "mapping": "",
            "buttons": [
                "xr-standard-thumbstick",
                "xr-standard-trigger",
                "xr-standard-squeeze",
                "a-button",
                "b-button",
                "thumbrest"
            ],
            "axes": [
                { "componentId": "xr-standard-thumbstick", "axis": "x-axis" },
                { "componentId": "xr-standard-thumbstick", "axis": "y-axis" }
            ]
        }
    },
    "right": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" },
            "xr-standard-squeeze": { "type": "squeeze" },
            "xr-standard-thumbstick": { "type": "thumbstick" },
            "x-button": { "type": "button" },
            "y-button": { "type": "button" },
            "thumbrest": { "type": "button" }
        },
        "gamepad": {
            "mapping": "",
            "buttons": [
                "xr-standard-thumbstick",
                "xr-standard-trigger",
                "xr-standard-squeeze",
                "x-button",
                "y-button",
                "thumbrest"
            ],
            "axes": [
                { "componentId": "xr-standard-thumbstick", "axis": "x-axis" },
                { "componentId": "xr-standard-thumbstick", "axis": "y-axis" }
            ]
        }
    }
};

export class WebXROculusTouchMotionController extends WebXRAbstractMotionController {
    /**
     * The base url used to load the left and right controller models
     */
    public static MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/oculus/';
    /**
     * The name of the left controller model file
     */
    public static MODEL_LEFT_FILENAME: string = 'left.babylon';
    /**
     * The name of the right controller model file
     */
    public static MODEL_RIGHT_FILENAME: string = 'right.babylon';

    /**
     * Base Url for the Quest controller model.
     */
    public static QUEST_MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/oculusQuest/';

    public profileId = "oculus-touch";

    private _modelRootNode: AbstractMesh;

    constructor(scene: Scene,
        gamepadObject: IMinimalMotionControllerObject,
        handness: MotionControllerHandness,
        legacyMapping: boolean = false,
        private _forceLegacyControllers: boolean = false) {
        super(scene, legacyMapping ? OculusTouchLegacyLayouts[handness] : OculusTouchLayouts[handness], gamepadObject, handness);
    }

    protected _processLoadedModel(_meshes: AbstractMesh[]): void {

        const isQuest = this._isQuest();
        const triggerDirection = this.handness === 'right' ? -1 : 1;

        this.layout.gamepad!.buttons.forEach((buttonName) => {
            const comp = buttonName && this.getComponent(buttonName);
            if (comp) {
                comp.onButtonStateChanged.add((component) => {

                    if (!this.rootMesh) { return; }

                    switch (buttonName) {
                        case "xr-standard-trigger": // index trigger
                            if (!isQuest) {
                                (<AbstractMesh>(this._modelRootNode.getChildren()[3])).rotation.x = -component.value * 0.20;
                                (<AbstractMesh>(this._modelRootNode.getChildren()[3])).position.y = -component.value * 0.005;
                                (<AbstractMesh>(this._modelRootNode.getChildren()[3])).position.z = -component.value * 0.005;
                            }
                            return;
                        case "xr-standard-squeeze":  // secondary trigger
                            if (!isQuest) {
                                (<AbstractMesh>(this._modelRootNode.getChildren()[4])).position.x = triggerDirection * component.value * 0.0035;
                            }
                            return;
                        case "xr-standard-thumbstick": // thumbstick
                            return;
                        case "a-button":
                        case "x-button":
                            if (!isQuest) {
                                if (component.pressed) {
                                    (<AbstractMesh>(this._modelRootNode.getChildren()[1])).position.y = -0.001;
                                }
                                else {
                                    (<AbstractMesh>(this._modelRootNode.getChildren()[1])).position.y = 0;
                                }
                            }
                            return;
                        case "b-button":
                        case "y-button":
                            if (!isQuest) {
                                if (component.pressed) {
                                    (<AbstractMesh>(this._modelRootNode.getChildren()[2])).position.y = -0.001;
                                }
                                else {
                                    (<AbstractMesh>(this._modelRootNode.getChildren()[2])).position.y = 0;
                                }
                            }
                            return;
                    }
                }, undefined, true);
            }
        });
    }

    protected _getFilenameAndPath(): { filename: string; path: string; } {
        let filename = "";
        if (this.handness === 'left') {
            filename = WebXROculusTouchMotionController.MODEL_LEFT_FILENAME;
        }
        else { // Right is the default if no hand is specified
            filename = WebXROculusTouchMotionController.MODEL_RIGHT_FILENAME;
        }

        let path = this._isQuest() ? WebXROculusTouchMotionController.QUEST_MODEL_BASE_URL : WebXROculusTouchMotionController.MODEL_BASE_URL;
        return {
            filename,
            path
        };
    }

    /**
     * Is this the new type of oculus touch. At the moment both have the same profile and it is impossible to differentiate
     * between the touch and touch 2.
     */
    private _isQuest() {
        // this is SADLY the only way to currently check. Until proper profiles will be available.
        return !!navigator.userAgent.match(/Quest/gi) && !this._forceLegacyControllers;
    }

    protected _updateModel(): void {
        // no-op. model is updated using observables.
    }

    protected _getModelLoadingConstraints(): boolean {
        return true;
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + " " + this.handness, this.scene);

        meshes.forEach((mesh) => { mesh.isPickable = false; });
        if (this._isQuest()) {
            this._modelRootNode = meshes[0];
            this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
            this.rootMesh.position.y = 0.034;
            this.rootMesh.position.z = 0.052;
        } else {
            this._modelRootNode = meshes[1];
            this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / -4, Math.PI, 0);
        }
        this._modelRootNode.parent = this.rootMesh;
    }

}

// register the profile
WebXRMotionControllerManager.RegisterController("oculus-touch", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>(xrInput.gamepad), xrInput.handedness);
});

WebXRMotionControllerManager.RegisterController("oculus-touch-legacy", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>(xrInput.gamepad), xrInput.handedness, true);
});