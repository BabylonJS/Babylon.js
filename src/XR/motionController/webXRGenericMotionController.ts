import {
    WebXRAbstractMotionController,
    IMinimalMotionControllerObject,
    MotionControllerHandedness,
    IMotionControllerLayoutMap
} from "./webXRAbstractMotionController";
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Scene } from '../../scene';
import { Mesh } from '../../Meshes/mesh';
import { Quaternion } from '../../Maths/math.vector';

/**
 * A generic trigger-only motion controller for WebXR
 */
export class WebXRGenericTriggerMotionController extends WebXRAbstractMotionController {
    /**
     * Static version of the profile id of this controller
     */
    public static ProfileId = "generic-trigger";

    public profileId = WebXRGenericTriggerMotionController.ProfileId;

    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handedness: MotionControllerHandedness) {
        super(scene, GenericTriggerLayout[handedness], gamepadObject, handedness);
    }

    protected _getFilenameAndPath(): { filename: string; path: string; } {
        return {
            filename: "generic.babylon",
            path: "https://controllers.babylonjs.com/generic/"
        };
    }

    protected _getModelLoadingConstraints(): boolean {
        return true;
    }

    protected _processLoadedModel(meshes: AbstractMesh[]): void {
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

// https://github.com/immersive-web/webxr-input-profiles/blob/master/packages/registry/profiles/generic/generic-trigger-touchpad-thumbstick.json
const GenericTriggerLayout: IMotionControllerLayoutMap = {
    "left": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": {
                "type": "trigger",
                "gamepadIndices": {
                    "button": 0
                },
                "rootNodeName": "xr_standard_trigger",
                "visualResponses": {}
            }
        },
        "gamepadMapping": "xr-standard",
        "rootNodeName": "generic-trigger-left",
        "assetPath": "left.glb"
    },
    "right": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": {
                "type": "trigger",
                "gamepadIndices": {
                    "button": 0
                },
                "rootNodeName": "xr_standard_trigger",
                "visualResponses": {}
            }
        },
        "gamepadMapping": "xr-standard",
        "rootNodeName": "generic-trigger-right",
        "assetPath": "right.glb"
    },
    "none": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": {
                "type": "trigger",
                "gamepadIndices": {
                    "button": 0
                },
                "rootNodeName": "xr_standard_trigger",
                "visualResponses": {}
            }
        },
        "gamepadMapping": "xr-standard",
        "rootNodeName": "generic-trigger-none",
        "assetPath": "none.glb"
    }
};