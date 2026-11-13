import { type IMultiRenderTargetOptions, MultiRenderTarget } from "./multiRenderTarget.pure";
import { type Engine } from "../../Engines/engine";
import { type RenderTargetTexture } from "./renderTargetTexture";
import { type Scene } from "../../scene";
import { type PostProcess } from "../../PostProcesses/postProcess";
import { ImageProcessingPostProcess } from "../../PostProcesses/imageProcessingPostProcess";
import { type Nullable } from "../../types";
import { Observable } from "../../Misc/observable.pure";

/**
 * A multi render target designed to render the prepass.
 * Prepass is a scene component used to render information in multiple textures
 * alongside with the scene materials rendering.
 * Note : This is an internal class, and you should NOT need to instanciate this.
 * Only the `PrePassRenderer` should instanciate this class.
 * It is more likely that you need a regular `MultiRenderTarget`
 * @internal
 */
export class PrePassRenderTarget extends MultiRenderTarget {
    /**
     * @internal
     */
    public _beforeCompositionPostProcesses: PostProcess[] = [];
    /**
     * Image processing post process for composition
     */
    public imageProcessingPostProcess: ImageProcessingPostProcess;

    /**
     * @internal
     */
    public override _engine: Engine;

    /**
     * @internal
     */
    public override _scene: Scene;

    /**
     * @internal
     */
    public _outputPostProcess: Nullable<PostProcess>;

    /**
     * @internal
     */
    public _internalTextureDirty = false;

    /**
     * Raised right after the internal textures were recreated (resize or attachment count change), before the
     * target is cleared or rendered into, so dependents can re-bind resources (e.g. shared depth) in time.
     * @internal
     */
    public readonly _onInternalTexturesRecreatedObservable = new Observable<PrePassRenderTarget>();

    private _internalTexturesRecreatedNotificationPending = false;

    /** @internal */
    public _notifyInternalTexturesRecreated(): void {
        this._internalTexturesRecreatedNotificationPending = true;
        this._onInternalTexturesRecreatedObservable.notifyObservers(this);
        this._internalTexturesRecreatedNotificationPending = false;
    }

    /** @internal */
    public _retryInternalTexturesRecreatedNotification(): void {
        if (this._internalTexturesRecreatedNotificationPending) {
            this._notifyInternalTexturesRecreated();
        }
    }

    /**
     * Is this render target enabled for prepass rendering
     */
    public enabled: boolean = false;

    /**
     * Render target associated with this prePassRenderTarget
     * If this is `null`, it means this prePassRenderTarget is associated with the scene
     */
    public renderTargetTexture: Nullable<RenderTargetTexture> = null;

    public constructor(name: string, renderTargetTexture: Nullable<RenderTargetTexture>, size: any, count: number, scene?: Scene, options?: IMultiRenderTargetOptions) {
        super(name, size, count, scene, options);

        this.renderTargetTexture = renderTargetTexture;
    }

    /**
     * Creates a composition effect for this RT
     * @internal
     */
    public _createCompositionEffect() {
        this.imageProcessingPostProcess = new ImageProcessingPostProcess("prePassComposition", 1, null, undefined, this._engine);
        this.imageProcessingPostProcess._updateParameters();
    }

    /**
     * Checks that the size of this RT is still adapted to the desired render size.
     * @internal
     */
    public _checkSize() {
        const requiredWidth = this._engine.getRenderWidth(true);
        const requiredHeight = this._engine.getRenderHeight(true);

        const width = this.getRenderWidth();
        const height = this.getRenderHeight();

        if (width !== requiredWidth || height !== requiredHeight) {
            this.resize({ width: requiredWidth, height: requiredHeight });

            this._internalTextureDirty = true;
            this._notifyInternalTexturesRecreated();
        }
    }

    /**
     * Changes the number of render targets in this MRT
     * Be careful as it will recreate all the data in the new texture.
     * @param count new texture count
     * @param options Specifies texture types and sampling modes for new textures
     * @param textureNames Specifies the names of the textures (optional)
     */
    public override updateCount(count: number, options?: IMultiRenderTargetOptions, textureNames?: string[]) {
        super.updateCount(count, options, textureNames);
        this._internalTextureDirty = true;
        this._notifyInternalTexturesRecreated();
    }

    /**
     * Resets the post processes chains applied to this RT.
     * @internal
     */
    public _resetPostProcessChain() {
        this._beforeCompositionPostProcesses.length = 0;
    }

    /**
     * Diposes this render target
     */
    public override dispose() {
        const scene = this._scene;

        super.dispose();

        // Optional: MultiRenderTarget's constructor disposes unsupported targets before field initializers run.
        this._onInternalTexturesRecreatedObservable?.clear();

        if (scene && scene.prePassRenderer) {
            const index = scene.prePassRenderer.renderTargets.indexOf(this);

            if (index !== -1) {
                scene.prePassRenderer.renderTargets.splice(index, 1);
            }
        }

        if (this.imageProcessingPostProcess) {
            this.imageProcessingPostProcess.dispose();
        }

        if (this.renderTargetTexture) {
            this.renderTargetTexture._prePassRenderTarget = null;
        }

        if (this._outputPostProcess) {
            this._outputPostProcess.autoClear = true;
            this._outputPostProcess.restoreDefaultInputTexture();
        }
    }
}
