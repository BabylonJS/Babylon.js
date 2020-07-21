import { IWebXRFeature } from "../webXRFeaturesManager";
import { Observer, Observable, EventState } from "../../Misc/observable";
import { Nullable } from "../../types";
import { WebXRSessionManager } from "../webXRSessionManager";

/**
 * This is the base class for all WebXR features.
 * Since most features require almost the same resources and callbacks, this class can be used to simplify the development
 * Note that since the features manager is using the `IWebXRFeature` you are in no way obligated to use this class
 */
export abstract class WebXRAbstractFeature implements IWebXRFeature {
    private _attached: boolean = false;
    private _removeOnDetach: {
        observer: Nullable<Observer<any>>;
        observable: Observable<any>;
    }[] = [];

    /**
     * Should auto-attach be disabled?
     */
    public disableAutoAttach: boolean = false;

    /**
     * Construct a new (abstract) WebXR feature
     * @param _xrSessionManager the xr session manager for this feature
     */
    constructor(protected _xrSessionManager: WebXRSessionManager) {}

    /**
     * Is this feature attached
     */
    public get attached() {
        return this._attached;
    }

    /**
     * attach this feature
     *
     * @param force should attachment be forced (even when already attached)
     * @returns true if successful, false is failed or already attached
     */
    public attach(force?: boolean): boolean {
        if (!force) {
            if (this.attached) {
                return false;
            }
        } else {
            if (this.attached) {
                // detach first, to be sure
                this.detach();
            }
        }

        this._attached = true;
        this._addNewAttachObserver(this._xrSessionManager.onXRFrameObservable, (frame) => this._onXRFrame(frame));
        return true;
    }

    /**
     * detach this feature.
     *
     * @returns true if successful, false if failed or already detached
     */
    public detach(): boolean {
        if (!this._attached) {
            this.disableAutoAttach = true;
            return false;
        }
        this._attached = false;
        this._removeOnDetach.forEach((toRemove) => {
            toRemove.observable.remove(toRemove.observer);
        });
        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        this.detach();
    }

    /**
     * This is used to register callbacks that will automatically be removed when detach is called.
     * @param observable the observable to which the observer will be attached
     * @param callback the callback to register
     */
    protected _addNewAttachObserver<T>(observable: Observable<T>, callback: (eventData: T, eventState: EventState) => void) {
        this._removeOnDetach.push({
            observable,
            observer: observable.add(callback),
        });
    }

    /**
     * Code in this function will be executed on each xrFrame received from the browser.
     * This function will not execute after the feature is detached.
     * @param _xrFrame the current frame
     */
    protected abstract _onXRFrame(_xrFrame: XRFrame): void;
}
