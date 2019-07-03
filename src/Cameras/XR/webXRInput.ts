import { Nullable } from "../../types";
import { Observer, Observable } from "../../Misc/observable";
import { IDisposable } from "../../scene";
import { WebXRExperienceHelper, WebXRState } from "./webXRExperienceHelper";
import { WebXRController } from './webXRController';

/**
 * XR input used to track XR inputs such as controllers/rays
 */
export class WebXRInput implements IDisposable {
    /**
     * XR controllers being tracked
     */
    public controllers: Array<WebXRController> = [];
    private _frameObserver: Nullable<Observer<any>>;
    private _stateObserver: Nullable<Observer<any>>;
    /**
     * Event when a controller has been connected/added
     */
    public onControllerAddedObservable = new Observable<WebXRController>();
    /**
     * Event when a controller has been removed/disconnected
     */
    public onControllerRemovedObservable = new Observable<WebXRController>();

    /**
     * Initializes the WebXRInput
     * @param xrExperienceHelper experience helper which the input should be created for
     */
    public constructor(public xrExperienceHelper: WebXRExperienceHelper) {
        // Remove controllers when exiting XR
        this._stateObserver = xrExperienceHelper.onStateChangedObservable.add((s)=>{
            if(s === WebXRState.NOT_IN_XR){
                this._addAndRemoveControllers([], this.controllers.map((c)=>{return c.inputSource}));
            }
        })
        
        this._frameObserver = xrExperienceHelper.sessionManager.onXRFrameObservable.add(() => {
            if (!xrExperienceHelper.sessionManager.currentFrame) {
                return;
            }

            // Start listing to input add/remove event
            if (this.controllers.length == 0 && xrExperienceHelper.sessionManager.session.inputSources) {
                this._addAndRemoveControllers(xrExperienceHelper.sessionManager.session.inputSources, []);
                xrExperienceHelper.sessionManager.session.addEventListener("inputsourceschange", this._onInputSourcesChange);
            }

            // Update controller pose info
            this.controllers.forEach((controller) => {
                controller.updateFromXRFrame(xrExperienceHelper.sessionManager.currentFrame!, xrExperienceHelper.sessionManager.referenceSpace);
            });

        });
    }

    private _onInputSourcesChange = (event: XRInputSourceChangeEvent) => {
        this._addAndRemoveControllers(event.added, event.removed);
    }

    private _addAndRemoveControllers(addInputs: Array<XRInputSource>, removeInputs: Array<XRInputSource>) {
        // Add controllers if they don't already exist
        let sources = this.controllers.map((c) => {return c.inputSource; });
        for(let input of addInputs){
            if (sources.indexOf(input) === -1) {
                let controller = new WebXRController(this.xrExperienceHelper.camera._scene, input, this.xrExperienceHelper.container);
                this.controllers.push(controller);
                this.onControllerAddedObservable.notifyObservers(controller);
            }
        }

        // Remove and dispose of controllers to be disposed
        let keepControllers: Array<WebXRController> = [];
        let removedControllers: Array<WebXRController> = [];
        this.controllers.forEach((c) => {
            if (removeInputs.indexOf(c.inputSource) === -1) {
                keepControllers.push(c);
            }else {
                removedControllers.push(c);
            }
        });
        this.controllers = keepControllers;
        removedControllers.forEach((c) => {
            this.onControllerRemovedObservable.notifyObservers(c);
            c.dispose();
        });

    }

    /**
     * Disposes of the object
     */
    public dispose() {
        this.controllers.forEach((c) => {
            c.dispose();
        });
        this.xrExperienceHelper.sessionManager.onXRFrameObservable.remove(this._frameObserver);
        this.xrExperienceHelper.onStateChangedObservable.remove(this._stateObserver);
    }
}