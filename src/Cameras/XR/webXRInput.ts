import { Nullable } from "../../types";
import { Observer, Observable } from "../../Misc/observable";
import { IDisposable, Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { WebXRExperienceHelper } from "./webXRExperienceHelper";
import { Matrix, Quaternion } from '../../Maths/math';
/**
 * Represents an XR input
 */
export class WebXRController {
    /**
     * Represents the part of the controller that is held. This may not exist if the controller is the head mounted display itself, if thats the case only the pointer from the head will be availible
     */
    public grip: AbstractMesh;
    /**
     * Pointer which can be used to select objects or attach a visible laser to
     */
    public pointer: AbstractMesh;

    private _tmpMatrix = new Matrix();

    /**
     * Creates the controller
     * @see https://doc.babylonjs.com/how_to/webxr
     * @param scene the scene which the controller should be associated to
     */
    constructor(scene: Scene, public inputSource:XRInputSource, parentContainer:Nullable<AbstractMesh> = null) {
        this.pointer = new AbstractMesh("controllerPointer", scene);
        this.grip = new AbstractMesh("controllerGrip", scene);
        if(parentContainer){
            parentContainer.addChild(this.pointer)
            parentContainer.addChild(this.grip)
        }
    }

    updateFromXRFrame(xrFrame:XRFrame, xrFrameOfReference:XRReferenceSpaceType){
        var pose = xrFrame.getPose(this.inputSource.targetRaySpace, xrFrameOfReference)
        if(pose){
            Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMatrix);
            if (!this.pointer.getScene().useRightHandedSystem) {
                this._tmpMatrix.toggleModelMatrixHandInPlace();
            }
            if (!this.pointer.rotationQuaternion) {
                this.pointer.rotationQuaternion = new Quaternion();
            }
            this._tmpMatrix.decompose(this.pointer.scaling, this.pointer.rotationQuaternion!, this.pointer.position);
        }

        var pose = xrFrame.getPose(this.inputSource.gripSpace, xrFrameOfReference)
        if(pose){
            Matrix.FromFloat32ArrayToRefScaled(pose.transform.matrix, 0, 1, this._tmpMatrix);
            if (!this.pointer.getScene().useRightHandedSystem) {
                this._tmpMatrix.toggleModelMatrixHandInPlace();
            }
            if (!this.grip.rotationQuaternion) {
                this.grip.rotationQuaternion = new Quaternion();
            }
            this._tmpMatrix.decompose(this.grip.scaling, this.grip.rotationQuaternion!, this.grip.position);
        }
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
    public onControllerAddedObservable = new Observable<WebXRController>();
    public onControllerRemovedObservable = new Observable<WebXRController>();

    /**
     * Initializes the WebXRInput
     * @param helper experience helper which the input should be created for
     */
    public constructor(private helper: WebXRExperienceHelper) {
        this._frameObserver = helper.sessionManager.onXRFrameObservable.add(() => {
            if (!helper.sessionManager._currentXRFrame) {
                return;
            }

            // Start listing to input add/remove event
            if(this.controllers.length == 0 && helper.sessionManager._xrSession.inputSources){
                this._addAndRemoveControllers(helper.sessionManager._xrSession.inputSources, []);
                helper.sessionManager._xrSession.addEventListener("inputsourceschange", this._onInputSourcesChange)
            }

            // Update controller pose info
            this.controllers.forEach((controller)=>{
                controller.updateFromXRFrame(helper.sessionManager._currentXRFrame!, helper.sessionManager._frameOfReference)
            })

        })
    }

    private _onInputSourcesChange = (event:XRInputSourceChangeEvent )=>{
        this._addAndRemoveControllers(event.added, event.removed)
    }

    private _addAndRemoveControllers(addInputs:Array<XRInputSource>, removeInputs:Array<XRInputSource>){
        // Add controllers if they don't already exist
        var sources = this.controllers.map((c)=>{return c.inputSource});
        addInputs.forEach((input)=>{
            if(sources.indexOf(input) === -1){
                var controller = new WebXRController(this.helper.camera._scene, input, this.helper.container);
                this.controllers.push(controller)
                this.onControllerAddedObservable.notifyObservers(controller)
            }
        })
        
        // Remove and dispose of controllers to be disposed
        var keepControllers: Array<WebXRController> = []
        var removedControllers: Array<WebXRController> = []
        this.controllers.forEach((c)=>{
            if(removeInputs.indexOf(c.inputSource) === -1){
                keepControllers.push(c)
            }else{
                removedControllers.push(c);
            }
        })
        this.controllers = keepControllers;
        removedControllers.forEach((c)=>{
            this.onControllerRemovedObservable.notifyObservers(c);
            c.dispose()
        })
        
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