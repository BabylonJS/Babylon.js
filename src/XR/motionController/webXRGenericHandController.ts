import { IMotionControllerLayoutMap, IMinimalMotionControllerObject, MotionControllerHandedness, WebXRAbstractMotionController } from "./webXRAbstractMotionController";
import { Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { Quaternion } from "../../Maths/math.vector";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";

/**
 * The motion controller class for the standard HTC-Vive controllers
 */
export class WebXRGenericHandController extends WebXRAbstractMotionController {

    public static ProfileId = "generic-hand-select-grasp";

    public profileId = WebXRGenericHandController.ProfileId;

    /**
     * Create a new Vive motion controller object
     * @param scene the scene to use to create this controller
     * @param gamepadObject the corresponding gamepad object
     * @param handedness the handedness of the controller
     */
    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handedness: MotionControllerHandedness) {
        super(scene, GenericHandSelectGraspProfile[handedness], gamepadObject, handedness);
    }

    protected _getFilenameAndPath(): { filename: string; path: string } {
        return {
            filename: "generic.babylon",
            path: "https://controllers.babylonjs.com/generic/",
        };
    }

    protected _getModelLoadingConstraints(): boolean {
        return true;
    }

    protected _processLoadedModel(_meshes: AbstractMesh[]): void {
        // nothing to do
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + " " + this.handedness, this.scene);

        meshes.forEach((mesh) => {
            mesh.isPickable = false;
            if (!mesh.parent) {
                mesh.setParent(this.rootMesh);
            }
        });

        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
    }

    protected _updateModel(): void {
        // no-op
    }
}

// register the profiles
WebXRMotionControllerManager.RegisterController("generic-hand-select", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRGenericHandController(scene, <any>xrInput.gamepad, xrInput.handedness);
});

// https://github.com/immersive-web/webxr-input-profiles/blob/main/packages/registry/profiles/generic/generic-hand-select-grasp.json
const GenericHandSelectGraspProfile: IMotionControllerLayoutMap = {
    left: {
        selectComponentId: "xr-standard-trigger",
        components: {
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr-standard-trigger",
                visualResponses: {},
            },
            "grasp": {
                type: "trigger",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "grasp",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "generic-hand-select-grasp-left",
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
                rootNodeName: "xr-standard-trigger",
                visualResponses: {},
            },
            "grasp": {
                type: "trigger",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "grasp",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "generic-hand-select-grasp-right",
        assetPath: "right.glb",
    },
    none: {
        selectComponentId: "xr-standard-trigger",
        components: {
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr-standard-trigger",
                visualResponses: {},
            },
            "grasp": {
                type: "trigger",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "grasp",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "generic-hand-select-grasp-none",
        assetPath: "none.glb",
    },
};
