/** This file must only contain pure code and pure imports */

import { Observable } from "../../Misc/observable.pure";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { type WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

interface IWebXRTrackedSourcesSession extends XRSession {
    readonly trackedSources: XRInputSourceArray;
}

function IsTrackedSourcesSession(session: XRSession): session is IWebXRTrackedSourcesSession {
    return "trackedSources" in session;
}

/**
 * Exposes input sources that the XR runtime continues tracking while they are not active input sources.
 *
 * Tracked sources are intentionally kept separate from `XRSession.inputSources` and Babylon's normal
 * WebXR input/controller pipeline.
 * @see https://immersive-web.github.io/webxr/#dom-xrsession-trackedsources
 * @see https://playground.babylonjs.com/#JRBQVL#0
 */
export class WebXRTrackedSources extends WebXRAbstractFeature {
    private readonly _trackedSources: XRInputSource[] = [];
    private _trackedSourcesSession: IWebXRTrackedSourcesSession | null = null;

    /**
     * The module's name.
     */
    public static readonly Name = WebXRFeatureName.TRACKED_SOURCES;

    /**
     * The Babylon version of this module.
     *
     * This number does not correspond to the WebXR specification version.
     */
    public static readonly Version = 1;

    /**
     * Notifies observers when a source enters the feature's current tracked source set.
     */
    public readonly onTrackedSourceAddedObservable: Observable<XRInputSource> = new Observable();

    /**
     * Notifies observers when a source leaves the feature's current tracked source set, including on detach.
     */
    public readonly onTrackedSourceRemovedObservable: Observable<XRInputSource> = new Observable();

    /**
     * Creates a WebXR tracked sources feature.
     * @param _xrSessionManager The WebXR session manager.
     */
    constructor(_xrSessionManager: WebXRSessionManager) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "tracked-sources";
    }

    /**
     * Gets a copy of the sources currently reported by `XRSession.trackedSources`.
     *
     * These sources are not added to `XRSession.inputSources` or Babylon's controller collection.
     */
    public get trackedSources(): ReadonlyArray<XRInputSource> {
        return this._trackedSources.slice();
    }

    /**
     * Attaches the feature to the active XR session.
     * @param force Whether to reattach when the feature is already attached.
     * @returns `true` when attachment succeeds; otherwise `false`.
     */
    public override attach(force?: boolean): boolean {
        const session = this._xrSessionManager.session;
        if (!session || !IsTrackedSourcesSession(session)) {
            return this._disableAutoAttach("XRSession.trackedSources is not supported by this XR runtime.");
        }

        if (!super.attach(force)) {
            return false;
        }

        this._trackedSourcesSession = session;
        session.addEventListener("trackedsourceschange", this._onTrackedSourcesChanged);
        this._synchronizeTrackedSources();
        return true;
    }

    /**
     * Detaches the feature and clears its tracked source state.
     * @returns `true` when detachment succeeds; otherwise `false`.
     */
    public override detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        this._trackedSourcesSession?.removeEventListener("trackedsourceschange", this._onTrackedSourcesChanged);
        this._trackedSourcesSession = null;
        this._clearTrackedSources();
        return true;
    }

    /**
     * Disposes the feature and clears its observables.
     */
    public override dispose(): void {
        super.dispose();
        this.onTrackedSourceAddedObservable.clear();
        this.onTrackedSourceRemovedObservable.clear();
    }

    protected override _onXRFrame(): void {}

    private _onTrackedSourcesChanged = (): void => {
        this._synchronizeTrackedSources();
    };

    private _synchronizeTrackedSources(): void {
        const session = this._trackedSourcesSession;
        if (!this.attached || !session) {
            return;
        }

        for (let index = 0; index < this._trackedSources.length;) {
            const trackedSource = this._trackedSources[index];
            let isStillTracked = false;
            for (const nativeTrackedSource of session.trackedSources) {
                if (nativeTrackedSource === trackedSource) {
                    isStillTracked = true;
                    break;
                }
            }

            if (isStillTracked) {
                index++;
            } else {
                this._trackedSources.splice(index, 1);
                this.onTrackedSourceRemovedObservable.notifyObservers(trackedSource);
            }
        }

        for (const trackedSource of session.trackedSources) {
            if (this._trackedSources.indexOf(trackedSource) === -1) {
                this._trackedSources.push(trackedSource);
                this.onTrackedSourceAddedObservable.notifyObservers(trackedSource);
            }
        }
    }

    private _clearTrackedSources(): void {
        while (this._trackedSources.length > 0) {
            const trackedSource = this._trackedSources.shift();
            if (trackedSource) {
                this.onTrackedSourceRemovedObservable.notifyObservers(trackedSource);
            }
        }
    }
}

let _Registered = false;

/**
 * Registers the WebXR tracked sources feature.
 *
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterWebXRTrackedSources(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    WebXRFeaturesManager.AddWebXRFeature(
        WebXRTrackedSources.Name,
        (xrSessionManager) => {
            return () => new WebXRTrackedSources(xrSessionManager);
        },
        WebXRTrackedSources.Version
    );
}
