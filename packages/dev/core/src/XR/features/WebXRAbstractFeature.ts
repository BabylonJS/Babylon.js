import type { IWebXRFeature } from "../webXRFeaturesManager";
import type { Observer, EventState } from "../../Misc/observable";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { Logger } from "core/Misc/logger";

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
     * Is this feature disposed?
     */
    public isDisposed: boolean = false;

    /**
     * Should auto-attach be disabled?
     */
    public disableAutoAttach: boolean = false;

    protected _xrNativeFeatureName: string = "";

    /**
     * The name of the native xr feature name (like anchor, hit-test, or hand-tracking)
     */
    public get xrNativeFeatureName() {
        return this._xrNativeFeatureName;
    }

    public set xrNativeFeatureName(name: string) {
        // check if feature was initialized while in session but needs to be initialized before the session starts
        if (!this._xrSessionManager.isNative && name && this._xrSessionManager.inXRSession && this._xrSessionManager.enabledFeatures?.indexOf(name) === -1) {
            Logger.Warn(`The feature ${name} needs to be enabled before starting the XR session. Note - It is still possible it is not supported.`);
        }
        this._xrNativeFeatureName = name;
    }

    /**
     * Observers registered here will be executed when the feature is attached
     */
    public onFeatureAttachObservable: Observable<IWebXRFeature> = new Observable();
    /**
     * Observers registered here will be executed when the feature is detached
     */
    public onFeatureDetachObservable: Observable<IWebXRFeature> = new Observable();

    /**
     * The dependencies of this feature, if any
     */
    public dependsOn?: string[];

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
        // do not attach a disposed feature
        if (this.isDisposed) {
            return false;
        }
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

        // if this is a native WebXR feature, check if it is enabled on the session
        // For now only check if not using babylon native
        // vision OS doesn't support the enabledFeatures array, so just warn instead of failing
        if (!this._xrSessionManager.enabledFeatures) {
            Logger.Warn("session.enabledFeatures is not available on this device. It is possible that this feature is not supported.");
        } else if (!this._xrSessionManager.isNative && this.xrNativeFeatureName && this._xrSessionManager.enabledFeatures.indexOf(this.xrNativeFeatureName) === -1) {
            return false;
        }

        this._attached = true;
        this._addNewAttachObserver(this._xrSessionManager.onXRFrameObservable, (frame) => this._onXRFrame(frame));
        this.onFeatureAttachObservable.notifyObservers(this);
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
        this.onFeatureDetachObservable.notifyObservers(this);
        return true;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        this.detach();
        this.isDisposed = true;
        this.onFeatureAttachObservable.clear();
        this.onFeatureDetachObservable.clear();
    }

    /**
     * This function will be executed during before enabling the feature and can be used to not-allow enabling it.
     * Note that at this point the session has NOT started, so this is purely checking if the browser supports it
     *
     * @returns whether or not the feature is compatible in this environment
     */
    public isCompatible(): boolean {
        return true;
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
