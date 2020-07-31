import { WebXRAbstractMotionController, IMinimalMotionControllerObject, MotionControllerHandedness, IMotionControllerLayoutMap } from "./webXRAbstractMotionController";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Scene } from "../../scene";
import { Mesh } from "../../Meshes/mesh";
import { Quaternion } from "../../Maths/math.vector";

/**
 * The motion controller class for oculus touch (quest, rift).
 * This class supports legacy mapping as well the standard xr mapping
 */
export class WebXROculusTouchMotionController extends WebXRAbstractMotionController {
    private _modelRootNode: AbstractMesh;

    /**
     * The base url used to load the left and right controller models
     */
    public static MODEL_BASE_URL: string = "https://controllers.babylonjs.com/oculus/";
    /**
     * The name of the left controller model file
     */
    public static MODEL_LEFT_FILENAME: string = "left.babylon";
    /**
     * The name of the right controller model file
     */
    public static MODEL_RIGHT_FILENAME: string = "right.babylon";
    /**
     * Base Url for the Quest controller model.
     */
    public static QUEST_MODEL_BASE_URL: string = "https://controllers.babylonjs.com/oculusQuest/";

    public profileId = "oculus-touch";

    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handedness: MotionControllerHandedness, legacyMapping: boolean = false, private _forceLegacyControllers: boolean = false) {
        super(scene, OculusTouchLayouts[handedness], gamepadObject, handedness);
    }

    protected _getFilenameAndPath(): { filename: string; path: string } {
        let filename = "";
        if (this.handedness === "left") {
            filename = WebXROculusTouchMotionController.MODEL_LEFT_FILENAME;
        } else {
            // Right is the default if no hand is specified
            filename = WebXROculusTouchMotionController.MODEL_RIGHT_FILENAME;
        }

        let path = this._isQuest() ? WebXROculusTouchMotionController.QUEST_MODEL_BASE_URL : WebXROculusTouchMotionController.MODEL_BASE_URL;
        return {
            filename,
            path,
        };
    }

    protected _getModelLoadingConstraints(): boolean {
        return true;
    }

    protected _processLoadedModel(_meshes: AbstractMesh[]): void {
        const isQuest = this._isQuest();
        const triggerDirection = this.handedness === "right" ? -1 : 1;

        this.getComponentIds().forEach((id) => {
            const comp = id && this.getComponent(id);
            if (comp) {
                comp.onButtonStateChangedObservable.add(
                    (component) => {
                        if (!this.rootMesh || this.disableAnimation) {
                            return;
                        }

                        switch (id) {
                            case "xr-standard-trigger": // index trigger
                                if (!isQuest) {
                                    (<AbstractMesh>this._modelRootNode.getChildren()[3]).rotation.x = -component.value * 0.2;
                                    (<AbstractMesh>this._modelRootNode.getChildren()[3]).position.y = -component.value * 0.005;
                                    (<AbstractMesh>this._modelRootNode.getChildren()[3]).position.z = -component.value * 0.005;
                                }
                                return;
                            case "xr-standard-squeeze": // secondary trigger
                                if (!isQuest) {
                                    (<AbstractMesh>this._modelRootNode.getChildren()[4]).position.x = triggerDirection * component.value * 0.0035;
                                }
                                return;
                            case "xr-standard-thumbstick": // thumbstick
                                return;
                            case "a-button":
                            case "x-button":
                                if (!isQuest) {
                                    if (component.pressed) {
                                        (<AbstractMesh>this._modelRootNode.getChildren()[1]).position.y = -0.001;
                                    } else {
                                        (<AbstractMesh>this._modelRootNode.getChildren()[1]).position.y = 0;
                                    }
                                }
                                return;
                            case "b-button":
                            case "y-button":
                                if (!isQuest) {
                                    if (component.pressed) {
                                        (<AbstractMesh>this._modelRootNode.getChildren()[2]).position.y = -0.001;
                                    } else {
                                        (<AbstractMesh>this._modelRootNode.getChildren()[2]).position.y = 0;
                                    }
                                }
                                return;
                        }
                    },
                    undefined,
                    true
                );
            }
        });
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + " " + this.handedness, this.scene);
        if (!this.scene.useRightHandedSystem) {
            this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
        }

        meshes.forEach((mesh) => {
            mesh.isPickable = false;
        });
        if (this._isQuest()) {
            this._modelRootNode = meshes[0];
        } else {
            this._modelRootNode = meshes[1];
            this.rootMesh.position.y = 0.034;
            this.rootMesh.position.z = 0.052;
        }
        this._modelRootNode.parent = this.rootMesh;
    }

    protected _updateModel(): void {
        // no-op. model is updated using observables.
    }

    /**
     * Is this the new type of oculus touch. At the moment both have the same profile and it is impossible to differentiate
     * between the touch and touch 2.
     */
    private _isQuest() {
        // this is SADLY the only way to currently check. Until proper profiles will be available.
        return !!navigator.userAgent.match(/Quest/gi) && !this._forceLegacyControllers;
    }
}

// register the profile
WebXRMotionControllerManager.RegisterController("oculus-touch", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>xrInput.gamepad, xrInput.handedness);
});

WebXRMotionControllerManager.RegisterController("oculus-touch-legacy", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusTouchMotionController(scene, <any>xrInput.gamepad, xrInput.handedness, true);
});

const OculusTouchLayouts: IMotionControllerLayoutMap = {
    left: {
        selectComponentId: "xr-standard-trigger",
        components: {
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr_standard_trigger",
                visualResponses: {},
            },
            "xr-standard-squeeze": {
                type: "squeeze",
                gamepadIndices: {
                    button: 1,
                },
                rootNodeName: "xr_standard_squeeze",
                visualResponses: {},
            },
            "xr-standard-thumbstick": {
                type: "thumbstick",
                gamepadIndices: {
                    button: 3,
                    xAxis: 2,
                    yAxis: 3,
                },
                rootNodeName: "xr_standard_thumbstick",
                visualResponses: {},
            },
            "x-button": {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "x_button",
                visualResponses: {},
            },
            "y-button": {
                type: "button",
                gamepadIndices: {
                    button: 5,
                },
                rootNodeName: "y_button",
                visualResponses: {},
            },
            thumbrest: {
                type: "button",
                gamepadIndices: {
                    button: 6,
                },
                rootNodeName: "thumbrest",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "oculus-touch-v2-left",
        assetPath: "left.glb",
    },
    right: {
        selectComponentId: "xr-standard-trigger",
        components: {
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr_standard_trigger",
                visualResponses: {},
            },
            "xr-standard-squeeze": {
                type: "squeeze",
                gamepadIndices: {
                    button: 1,
                },
                rootNodeName: "xr_standard_squeeze",
                visualResponses: {},
            },
            "xr-standard-thumbstick": {
                type: "thumbstick",
                gamepadIndices: {
                    button: 3,
                    xAxis: 2,
                    yAxis: 3,
                },
                rootNodeName: "xr_standard_thumbstick",
                visualResponses: {},
            },
            "a-button": {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "a_button",
                visualResponses: {},
            },
            "b-button": {
                type: "button",
                gamepadIndices: {
                    button: 5,
                },
                rootNodeName: "b_button",
                visualResponses: {},
            },
            thumbrest: {
                type: "button",
                gamepadIndices: {
                    button: 6,
                },
                rootNodeName: "thumbrest",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "oculus-touch-v2-right",
        assetPath: "right.glb",
    },
};
