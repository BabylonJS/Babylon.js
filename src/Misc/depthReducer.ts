import { Nullable } from "../types";
import { Scene } from "../scene";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Camera } from "../Cameras/camera";
import { Constants } from "../Engines/constants";
import { DepthRenderer } from "../Rendering/depthRenderer";
import { Observer } from "./observable";

import { MinMaxReducer } from "./minMaxReducer";

/**
 * This class is a small wrapper around the MinMaxReducer class to compute the min/max values of a depth texture
 */
export class DepthReducer extends MinMaxReducer {

    private _depthRenderer: Nullable<DepthRenderer>;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;

    /**
     * Gets the depth renderer used for the computation.
     * Note that the result is null if you provide your own renderer when calling setDepthRenderer.
     */
    public get depthRenderer(): Nullable<DepthRenderer> {
        return this._depthRenderer;
    }

    /**
     * Creates a depth reducer
     * @param camera The camera used to render the depth texture
     */
    constructor(camera: Camera) {
        super(camera);
    }

    /**
     * 
     * @param depthRenderer The depth renderer to use. If not provided, a new one will be created automatically
     * @param type The texture type of the depth map (default: TEXTURETYPE_HALF_FLOAT)
     * @param forceFullscreenViewport Forces the post processes used for the reduction to be applied without taking into account viewport (defaults to true)
     */
    public setDepthRenderer(depthRenderer: Nullable<DepthRenderer> = null, type: number = Constants.TEXTURETYPE_HALF_FLOAT, forceFullscreenViewport = true): void {
        const scene = this._camera.getScene();

        if (this._onBeforeRenderObserver) {
            scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }

        if (this._depthRenderer) {
            this._depthRenderer.dispose();
            this._depthRenderer = null;
        }

        if (depthRenderer === null) {
            depthRenderer = this._depthRenderer = new DepthRenderer(scene, type, this._camera, false);
            depthRenderer.enabled = false;
        }

        this._onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            if (this.activated) {
                // make sure the depth map is created first, before the shadow maps, as we need the results of the reduction
                // to set the min/max value, and therefore the new frustum splits
                (scene as any)._renderTargets.push(depthRenderer!.getDepthMap());
            }
        });

        super.setSourceTexture(depthRenderer.getDepthMap(), true, type, forceFullscreenViewport);
    }

    /** @hidden */
    public setSourceTexture(sourceTexture: RenderTargetTexture, depthRedux: boolean, type: number = Constants.TEXTURETYPE_HALF_FLOAT, forceFullscreenViewport = true): void {
        super.setSourceTexture(sourceTexture, depthRedux, type, forceFullscreenViewport);
    }

    /**
     * Activates the reduction computation.
     * When activated, the observers registered in onAfterReductionPerformed are
     * called after the compuation is performed
     */
    public activate(): void {
        if (this._depthRenderer) {
            this._depthRenderer.enabled = true;
        }

        super.activate();
    }

    /**
     * Deactivates the reduction computation.
     */
    public deactivate(): void {
        super.deactivate();

        if (this._depthRenderer) {
            this._depthRenderer.enabled = false;
        }
    }

    /**
     * Disposes the depth reducer
     * @param disposeAll true to dispose all the resources. You should always call this function with true as the parameter (or without any parameter as it is the default one). This flag is meant to be used internally.
     */
    public dispose(disposeAll = true): void {
        super.dispose(disposeAll);

        if (this._onBeforeRenderObserver && disposeAll) {
            this._camera.getScene().onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }

        if (this._depthRenderer && disposeAll) {
            this._depthRenderer.dispose();
            this._depthRenderer = null;
        }
    }

}