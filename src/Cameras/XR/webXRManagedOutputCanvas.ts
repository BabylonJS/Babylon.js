import { Nullable } from "../../types";
import { Observable } from "../../Misc/observable";
import { ThinEngine } from '../../Engines/thinEngine';
import { WebXRState, WebXRRenderTarget } from "./webXRTypes";

/**
 * Creates a canvas that is added/removed from the webpage when entering/exiting XR
 */
export class WebXRManagedOutputCanvas implements WebXRRenderTarget {

    private _engine: ThinEngine;
    private _canvas: Nullable<HTMLCanvasElement> = null;

    /**
     * xrpresent context of the canvas which can be used to display/mirror xr content
     */
    public canvasContext: WebGLRenderingContext;
    /**
     * xr layer for the canvas
     */
    public xrLayer: Nullable<XRWebGLLayer> = null;

    /**
     * Initializes the xr layer for the session
     * @param xrSession xr session
     * @returns a promise that will resolve once the XR Layer has been created
     */
    public initializeXRLayerAsync(xrSession: any) {
        // support canvases without makeXRCompatible
        if (!(this.canvasContext as any).makeXRCompatible) {
            this.xrLayer = new XRWebGLLayer(xrSession, this.canvasContext);
            return Promise.resolve(true);
        }

        return (this.canvasContext as any).makeXRCompatible().then(() => {
            this.xrLayer = new XRWebGLLayer(xrSession, this.canvasContext);
        });
    }

    /**
     * Initializes the canvas to be added/removed upon entering/exiting xr
     * @param engine the Babylon engine
     * @param canvas The canvas to be added/removed (If not specified a full screen canvas will be created)
     * @param onStateChangedObservable the mechanism by which the canvas will be added/removed based on XR state
     */
    constructor(engine: ThinEngine, canvas?: HTMLCanvasElement, onStateChangedObservable?: Observable<WebXRState>) {
        this._engine = engine;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.cssText = "position:absolute; bottom:0px;right:0px;z-index:10;width:90%;height:100%;background-color: #000000;";
        }
        this._setManagedOutputCanvas(canvas);

        if (onStateChangedObservable) {
            onStateChangedObservable.add((stateInfo) => {
                if (stateInfo == WebXRState.ENTERING_XR) {
                    // The canvas is added to the screen before entering XR because currently the xr session must be initialized while the canvas is added render properly
                    this._addCanvas();
                } else if (stateInfo == WebXRState.NOT_IN_XR) {
                    this._removeCanvas();
                }
            });
        }
    }
    /**
     * Disposes of the object
     */
    public dispose() {
        this._removeCanvas();
        this._setManagedOutputCanvas(null);
    }

    private _setManagedOutputCanvas(canvas: Nullable<HTMLCanvasElement>) {
        this._removeCanvas();
        if (!canvas) {
            this._canvas = null;
            (this.canvasContext as any) = null;
        } else {
            this._canvas = canvas;
            this.canvasContext = <any>this._canvas.getContext('webgl');
            if (!this.canvasContext) {
                this.canvasContext = <any>this._canvas.getContext('webgl2');
            }
        }
    }

    private _addCanvas() {
        if (this._canvas && this._canvas !== this._engine.getRenderingCanvas()) {
            document.body.appendChild(this._canvas);
        }
    }

    private _removeCanvas() {
        if (this._canvas && document.body.contains(this._canvas) && this._canvas !== this._engine.getRenderingCanvas()) {
            document.body.removeChild(this._canvas);
        }
    }
}