import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

/**
 * Options for DOM Overlay feature
 */
export interface IWebXRDOMOverlayOptions {
    /**
     * Fail the Web XR Session if DOM overlay isn't available (TODO: would like to mark optional as a feature parameter)
     */
    // required?: boolean;

    /**
     * DOM Element for overlay into WebXR scene.
     *
     * NOTE: UA may make this element background transparent in XR.
     */
    element: Element;
    /**
     * Supress XR Select events on container element (DOM blocks interaction to scene).
     */
    supressXRSelectEvents?: boolean
}

/**
 * DOM Overlay Feature
 * 
 * @since 5.0.0
 */
export class WebXRDOMOverlay extends WebXRAbstractFeature {

    private xrDOMOverlayType: XRDOMOverlayType | null;

    private beforeXRSelectListener: Nullable<EventListenerOrEventListenerObject> = null;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.DOM_OVERLAY;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
    * Creates a new instance of the dom-overlay feature
    * @param _xrSessionManager an instance of WebXRSessionManager
    * @param options options to use when constructing this feature
    */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        /**
         * options to use when constructing this feature
         */
        public readonly options: IWebXRDOMOverlayOptions
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "dom-overlay";

        // https://immersive-web.github.io/dom-overlays/
        Tools.Warn("dom-overlay is an experimental and unstable feature.");
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        // Feature enabled, but not available
        if (!this._xrSessionManager.session.domOverlayState || this._xrSessionManager.session.domOverlayState.type === null) {
            Tools.Warn(`DOM overlay state not found on session (dom-overlay unavailable)`);
            return false;
        }

        this.xrDOMOverlayType = this._xrSessionManager.session.domOverlayState.type;

        if (this.options.supressXRSelectEvents === true) {
            this.beforeXRSelectListener = (ev) => {
                ev.preventDefault();
            };
            this.options.element.addEventListener('beforexrselect', this.beforeXRSelectListener);
        }

        return true;
    }

    /**
     * The type of DOM overlay (null when not supported)
     */
    public get XRDOMOverlayType() : Nullable<XRDOMOverlayType> {
        return this.xrDOMOverlayType;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        if (this.beforeXRSelectListener) {
            this.options.element.removeEventListener('beforexrselect', this.beforeXRSelectListener);
        }
    }

    protected _onXRFrame(_xrFrame: XRFrame): void { /* empty */ }

    /**
     * Extends the session init object if needed
     * @returns augmentation object for the xr session init object.
     */
    public async getXRSessionInitExtension(): Promise<Partial<XRSessionInit>> {
        // TODO: consider elementById or other selector options (ie: document.getElementById(this.options.element) when typeof === string)
        return {
            domOverlay: {
                root: this.options.element
            }
        };
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRDOMOverlay.Name,
    (xrSessionManager, options) => {
        return () => new WebXRDOMOverlay(xrSessionManager, options);
    },
    WebXRDOMOverlay.Version,
    false
);