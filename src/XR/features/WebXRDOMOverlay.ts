import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

/**
 * Options for DOM Overlay feature
 */
export interface IWebXRDomOverlayOptions {
    /**
     * DOM Element or document query selector string for overlay.
     *
     * NOTE: UA may make this element background transparent in XR.
     */
    element: Element | string;
    /**
     * Supress XR Select events on container element (DOM blocks interaction to scene).
     */
    supressXRSelectEvents?: boolean;
}

/**
 * Type of DOM overlay provided by UA.
 */
type WebXRDomOverlayType =
    /**
     * Covers the entire physical screen for a screen-based device, for example handheld AR
     */
    'screen' |
    /**
     * Appears as a floating rectangle in space
     */
     'floating' |
     /**
      * Follows the user’s head movement consistently, appearing similar to a HUD
      */
     'head-locked';

/**
 * DOM Overlay Feature
 *
 * @since 5.0.0
 */
export class WebXRDomOverlay extends WebXRAbstractFeature {

    /**
     * Type of overlay - non-null when available
     */
    private _domOverlayType: Nullable<WebXRDomOverlayType> = null;

    /**
     * Event Listener to supress "beforexrselect" events.
     */
    private _beforeXRSelectListener: Nullable<EventListenerOrEventListenerObject> = null;

    /**
     * Element used for overlay
     */
    private _element: Nullable<Element> = null;

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
        public readonly options: IWebXRDomOverlayOptions
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

        // Feature not available
        if (!this._xrSessionManager.session.domOverlayState || this._xrSessionManager.session.domOverlayState.type === null) {
            return false;
        }

        this._domOverlayType = this._xrSessionManager.session.domOverlayState.type;

        if (this._element !== null && this.options.supressXRSelectEvents === true) {
            this._beforeXRSelectListener = (ev) => {
                ev.preventDefault();
            };
            this._element.addEventListener('beforexrselect', this._beforeXRSelectListener);
        }

        return true;
    }

    /**
     * The type of DOM overlay (null when not supported).  Provided by UA and remains unchanged for duration of session.
     */
    public get domOverlayType(): Nullable<WebXRDomOverlayType> {
        return this._domOverlayType;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();
        if (this._element !== null && this._beforeXRSelectListener) {
            this._element.removeEventListener('beforexrselect', this._beforeXRSelectListener);
        }
    }

    protected _onXRFrame(_xrFrame: XRFrame): void { /* empty */ }

    /**
     * Extends the session init object if needed
     * @returns augmentation object for the xr session init object.
     */
    public async getXRSessionInitExtension(): Promise<Partial<XRSessionInit>> {
        if (this.options.element === undefined) {
            Tools.Warn('"element" option must be provided to attach xr-dom-overlay feature.');
            return {};
        } else if (typeof this.options.element === 'string') {
            const selectedElement = document.querySelector(this.options.element);
            if (selectedElement === null) {
                Tools.Warn(`element not found '${this.options.element}' (not requesting xr-dom-overlay)`);
                return {};
            }
            this._element = selectedElement;
        } else {
            this._element = this.options.element;
        }

        return {
            domOverlay: {
                root: this._element
            }
        };
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRDomOverlay.Name,
    (xrSessionManager, options) => {
        return () => new WebXRDomOverlay(xrSessionManager, options);
    },
    WebXRDomOverlay.Version,
    false
);