import {
    IMotionControllerLayoutMap,
    IMinimalMotionControllerObject,
    MotionControllerHandness,
    WebXRAbstractMotionController
} from "./webXRAbstractController";
import { Scene } from '../../../scene';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Mesh } from '../../../Meshes/mesh';
import { Quaternion } from '../../../Maths/math.vector';
import { WebXRMotionControllerManager } from './webXRMotionControllerManager';

const HTCViveLayout: IMotionControllerLayoutMap = {
    "left-right-none": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" },
            "xr-standard-squeeze": { "type": "squeeze" },
            "xr-standard-touchpad": { "type": "touchpad" },
            "menu": { "type": "button" }
        },
        "gamepad": {
            "mapping": "xr-standard",
            "buttons": [
                "xr-standard-trigger",
                "xr-standard-squeeze",
                "xr-standard-touchpad",
                null,
                "menu"
            ],
            "axes": [
                { "componentId": "xr-standard-touchpad", "axis": "x-axis" },
                { "componentId": "xr-standard-touchpad", "axis": "y-axis" }
            ]
        }
    }
};

const HTCViveLegacyLayout: IMotionControllerLayoutMap = {
    "left-right-none": {
        "selectComponentId": "xr-standard-trigger",
        "components": {
            "xr-standard-trigger": { "type": "trigger" },
            "xr-standard-squeeze": { "type": "squeeze" },
            "xr-standard-touchpad": { "type": "touchpad" },
            "menu": { "type": "button" }
        },
        "gamepad": {
            "mapping": "",
            "buttons": [
                "xr-standard-touchpad",
                "xr-standard-trigger",
                "xr-standard-squeeze",
                "menu"
            ],
            "axes": [
                { "componentId": "xr-standard-touchpad", "axis": "x-axis" },
                { "componentId": "xr-standard-touchpad", "axis": "y-axis" }
            ]
        }
    }
};

/**
 * The motion controller class for the standard HTC-Vive controllers
 */
export class WebXRHTCViveMotionController extends WebXRAbstractMotionController {
    /**
     * The base url used to load the left and right controller models
     */
    public static MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/vive/';
    /**
     * File name for the controller model.
     */
    public static MODEL_FILENAME: string = 'wand.babylon';

    public profileId = "htc-vive";

    private _modelRootNode: AbstractMesh;

    constructor(scene: Scene,
        gamepadObject: IMinimalMotionControllerObject,
        handness: MotionControllerHandness,
        legacyMapping: boolean = false) {
        super(scene, legacyMapping ? HTCViveLegacyLayout["left-right-none"] : HTCViveLayout["left-right-none"], gamepadObject, handness);
    }

    protected _processLoadedModel(_meshes: AbstractMesh[]): void {
        this.layout.gamepad!.buttons.forEach((buttonName) => {
            const comp = buttonName && this.getComponent(buttonName);
            if (comp) {
                comp.onButtonStateChanged.add((component) => {

                    if (!this.rootMesh) { return; }

                    switch (buttonName) {
                        case "xr-standard-trigger":
                            (<AbstractMesh>(this._modelRootNode.getChildren()[6])).rotation.x = -component.value * 0.15;
                            return;
                        case "xr-standard-touchpad":
                            return;
                        case "xr-standard-squeeze":
                            return;
                        case "menu":
                            if (component.pressed) {
                                (<AbstractMesh>(this._modelRootNode.getChildren()[2])).position.y = -0.001;
                            }
                            else {
                                (<AbstractMesh>(this._modelRootNode.getChildren()[2])).position.y = 0;
                            }
                            return;
                    }
                }, undefined, true);
            }
        });
    }

    protected _getFilenameAndPath(): { filename: string; path: string; } {
        let filename = WebXRHTCViveMotionController.MODEL_FILENAME;
        let path = WebXRHTCViveMotionController.MODEL_BASE_URL;

        return {
            filename,
            path
        };
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
        this._modelRootNode = meshes[1];
        this._modelRootNode.parent = this.rootMesh;
        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
    }

}

// register the profile
WebXRMotionControllerManager.RegisterController("htc-vive", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRHTCViveMotionController(scene, <any>(xrInput.gamepad), xrInput.handedness);
});

WebXRMotionControllerManager.RegisterController("htc-vive-legacy", (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRHTCViveMotionController(scene, <any>(xrInput.gamepad), xrInput.handedness, true);
});