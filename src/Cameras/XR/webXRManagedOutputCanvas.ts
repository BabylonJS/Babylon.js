import { Nullable } from "../../types";
import { IDisposable } from "../../scene";
import { WebXRExperienceHelper, WebXRState } from "./webXRExperienceHelper";
/**
 * Creates a canvas that is added/removed from the webpage when entering/exiting XR
 */
export class WebXRManagedOutputCanvas implements IDisposable {
    private _canvas: Nullable<HTMLCanvasElement> = null;
    /**
     * xrpresent context of the canvas which can be used to display/mirror xr content
     */
    public canvasContext: WebGLRenderingContext;
    public xrLayer:any;
    
    public initializeXRLayerAsync(xrSession:any){
        return (this.canvasContext as any).makeXRCompatible().then(()=>{
            this.xrLayer = new XRWebGLLayer(xrSession, this.canvasContext);
        });
    }

    /**
     * Initializes the canvas to be added/removed upon entering/exiting xr
     * @param helper the xr experience helper used to trigger adding/removing of the canvas
     * @param canvas The canvas to be added/removed (If not specified a full screen canvas will be created)
     */
    constructor(helper: WebXRExperienceHelper, canvas?: HTMLCanvasElement) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.cssText = "position:absolute; bottom:0px;right:0px;z-index:10;width:90%;height:100%;background-color: #000000;";
        }
        this._setManagedOutputCanvas(canvas);
        helper.onStateChangedObservable.add((stateInfo) => {
            if (stateInfo == WebXRState.ENTERING_XR) {
                // The canvas is added to the screen before entering XR because currently the xr session must be initialized while the canvas is added render properly
                this._addCanvas();
            } else if (helper.state == WebXRState.NOT_IN_XR) {
                this._removeCanvas();
            }
        });
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
            this.canvasContext = <any>this._canvas.getContext('webgl2');
        }
    }

    private _addCanvas() {
        if (this._canvas) {
            document.body.appendChild(this._canvas);
        }
    }

    private _removeCanvas() {
        if (this._canvas && document.body.contains(this._canvas)) {
            document.body.removeChild(this._canvas);
        }
    }
}