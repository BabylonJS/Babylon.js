/* eslint-disable @typescript-eslint/no-unused-vars */
import type { IMotionControllerLayoutMap, IMinimalMotionControllerObject, MotionControllerHandedness } from "./webXRAbstractMotionController";
import { WebXRAbstractMotionController } from "./webXRAbstractMotionController";
import type { Scene } from "../../scene";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { WebXRMotionControllerManager } from "./webXRMotionControllerManager";

/**
 * Oculus hand controller class that supports microgestures
 */
export class WebXROculusHandController extends WebXRAbstractMotionController {
    public profileId = "oculus-hand";

    /**
     * Create a new hand controller object, without loading a controller model
     * @param scene the scene to use to create this controller
     * @param gamepadObject the corresponding gamepad object
     * @param handedness the handedness of the controller
     */
    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handedness: MotionControllerHandedness) {
        // Don't load the controller model - for now, hands have no real model.
        super(scene, OculusHandProfile[handedness], gamepadObject, handedness, true);
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
WebXRMotionControllerManager.RegisterController("oculus-hand", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXROculusHandController(scene, <any>xrInput.gamepad, xrInput.handedness);
});

// https://github.com/immersive-web/webxr-input-profiles/blob/main/packages/registry/profiles/oculus/oculus-hand.json
const OculusHandProfile: IMotionControllerLayoutMap = {
    left: {
        selectComponentId: "xr-standard-trigger",
        components: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr-standard-trigger",
                visualResponses: {},
            },
            menu: {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "menu",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-left": {
                type: "button",
                gamepadIndices: {
                    button: 5,
                },
                rootNodeName: "swipe-left",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-right": {
                type: "button",
                gamepadIndices: {
                    button: 6,
                },
                rootNodeName: "swipe-right",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-forward": {
                type: "button",
                gamepadIndices: {
                    button: 7,
                },
                rootNodeName: "swipe-forward",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-backward": {
                type: "button",
                gamepadIndices: {
                    button: 8,
                },
                rootNodeName: "swipe-backward",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "tap-thumb": {
                type: "button",
                gamepadIndices: {
                    button: 9,
                },
                rootNodeName: "tap-thumb",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "oculus-hand-left",
        assetPath: "left.glb",
    },
    right: {
        selectComponentId: "xr-standard-trigger",
        components: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr-standard-trigger",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-left": {
                type: "button",
                gamepadIndices: {
                    button: 5,
                },
                rootNodeName: "swipe-left",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-right": {
                type: "button",
                gamepadIndices: {
                    button: 6,
                },
                rootNodeName: "swipe-right",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-forward": {
                type: "button",
                gamepadIndices: {
                    button: 7,
                },
                rootNodeName: "swipe-forward",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-backward": {
                type: "button",
                gamepadIndices: {
                    button: 8,
                },
                rootNodeName: "swipe-backward",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "tap-thumb": {
                type: "button",
                gamepadIndices: {
                    button: 9,
                },
                rootNodeName: "tap-thumb",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "oculus-hand-right",
        assetPath: "right.glb",
    },
    none: {
        selectComponentId: "xr-standard-trigger",
        components: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "xr-standard-trigger": {
                type: "trigger",
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: "xr-standard-trigger",
                visualResponses: {},
            },
            menu: {
                type: "button",
                gamepadIndices: {
                    button: 4,
                },
                rootNodeName: "menu",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-left": {
                type: "button",
                gamepadIndices: {
                    button: 5,
                },
                rootNodeName: "swipe-left",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-right": {
                type: "button",
                gamepadIndices: {
                    button: 6,
                },
                rootNodeName: "swipe-right",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-forward": {
                type: "button",
                gamepadIndices: {
                    button: 7,
                },
                rootNodeName: "swipe-forward",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "swipe-backward": {
                type: "button",
                gamepadIndices: {
                    button: 8,
                },
                rootNodeName: "swipe-backward",
                visualResponses: {},
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "tap-thumb": {
                type: "button",
                gamepadIndices: {
                    button: 9,
                },
                rootNodeName: "tap-thumb",
                visualResponses: {},
            },
        },
        gamepadMapping: "xr-standard",
        rootNodeName: "oculus-hand-none",
        assetPath: "none.glb",
    },
};
