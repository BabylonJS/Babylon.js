import { IMotionControllerLayoutMap, IMinimalMotionControllerObject, MotionControllerHandedness, WebXRAbstractMotionController } from "./webXRAbstractMotionController";
import { Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";

/**
 * A generic hand controller class that supports select and a secondary grasp
 */
export class WebXRGenericHandController extends WebXRAbstractMotionController {

    public profileId = "generic-hand-select-grasp";

    /**
     * Create a new hand controller object, without loading a controller model
     * @param scene the scene to use to create this controller
     * @param gamepadObject the corresponding gamepad object
     * @param handedness the handedness of the controller
     */
    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handedness: MotionControllerHandedness) {
        // Don't load the controller model - for now, hands have no real model.
        super(scene, GenericHandSelectGraspProfile[handedness], gamepadObject, handedness, true);
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
        // no-op
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        // no-op
    }

    protected _updateModel(): void {
        // no-op
    }
}

// register the profiles
WebXRMotionControllerManager.RegisterController("generic-hand-select-grasp", (xrInput: XRInputSource, scene: Scene) => {
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
