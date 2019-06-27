import { Nullable } from "../../types";
import { Observer } from "../../Misc/observable";
import { IDisposable, Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { WebXRExperienceHelper } from "./webXRExperienceHelper";
/**
 * Represents an XR input
 */
export class WebXRController {
    /**
     * Represents the part of the controller that is held. This may not exist if the controller is the head mounted display itself, if thats the case only the pointer from the head will be availible
     */
    public grip?: AbstractMesh;
    /**
     * Pointer which can be used to select objects or attach a visible laser to
     */
    public pointer: AbstractMesh;

    /**
     * Creates the controller
     * @see https://doc.babylonjs.com/how_to/webxr
     * @param scene the scene which the controller should be associated to
     */
    constructor(scene: Scene) {
        this.pointer = new AbstractMesh("controllerPointer", scene);
    }
    /**
     * Disposes of the object
     */
    dispose() {
        if (this.grip) {
            this.grip.dispose();
        }
        this.pointer.dispose();
    }
}

/**
 * XR input used to track XR inputs such as controllers/rays
 */
export class WebXRInput implements IDisposable {
    /**
     * XR controllers being tracked
     */
    public controllers: Array<WebXRController> = [];
    private _frameObserver: Nullable<Observer<any>>;

    /**
     * Initializes the WebXRInput
     * @param helper experience helper which the input should be created for
     */
    public constructor(private helper: WebXRExperienceHelper) {
        
    }
    /**
     * Disposes of the object
     */
    public dispose() {
        this.controllers.forEach((c) => {
            c.dispose();
        });
        this.helper.sessionManager.onXRFrameObservable.remove(this._frameObserver);
    }
}