import {
    WebXRAbstractMotionController,
    IMinimalMotionControllerObject,
    MotionControllerHandness,
    IMotionControllerLayoutMap
} from "./webXRAbstractController";
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Scene } from '../../../scene';
import { Mesh } from '../../../Meshes/mesh';
import { Quaternion } from '../../../Maths/math.vector';

// https://github.com/immersive-web/webxr-input-profiles/blob/master/packages/registry/profiles/generic/generic-trigger-touchpad-thumbstick.json
const GenericTriggerLayout: IMotionControllerLayoutMap = {
    "left-right-none": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" }
        },
        "gamepad": {
            "mapping": "xr-standard",
            "buttons": [
                "xr-standard-trigger"
            ],
            "axes": []
        }
    }

};

// TODO support all generic models with xr-standard mapping at:
// https://github.com/immersive-web/webxr-input-profiles/tree/master/packages/registry/profiles/generic

export class WebXRGenericTriggerMotionController extends WebXRAbstractMotionController {
    public static ProfileId = "generic-trigger";
    public profileId = "generic-trigger";

    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handness: MotionControllerHandness) {
        super(scene, GenericTriggerLayout["left-right-none"], gamepadObject, handness);
    }

    protected _processLoadedModel(meshes: AbstractMesh[]): void {
        // nothing to do
    }

    protected _updateModel(): void {
        // no-op
    }

    protected _getFilenameAndPath(): { filename: string; path: string; } {
        return {
            filename: "generic.babylon",
            path: "https://controllers.babylonjs.com/generic/"
        };
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + " " + this.handness, this.scene);

        meshes.forEach((mesh) => {
            mesh.isPickable = false;
            if (!mesh.parent) {
                mesh.setParent(this.rootMesh);
            }
        });

        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
    }

    protected _getModelLoadingConstraints(): boolean {
        return true;
    }

}