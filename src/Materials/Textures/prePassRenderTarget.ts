import { MultiRenderTarget, IMultiRenderTargetOptions } from "./multiRenderTarget";
import { Engine } from "../../Engines/engine";
import { RenderTargetTexture } from './renderTargetTexture';
import { Scene } from "../../scene";
import { PostProcess } from "../../PostProcesses/postProcess";
import { ImageProcessingPostProcess } from "../../PostProcesses/imageProcessingPostProcess";
import { Nullable } from "../../types";

/**
 * A multi render target designed to render the prepass.
 * Prepass is a scene component used to render information in multiple textures
 * alongside with the scene materials rendering.
 * Note : This is an internal class, and you should NOT need to instanciate this.
 * Only the `PrePassRenderer` should instanciate this class.
 * It is more likely that you need a regular `MultiRenderTarget`
 */
export class PrePassRenderTarget extends MultiRenderTarget {

    public _beforeCompositionPostProcesses: PostProcess[] = [];
    /**
     * Image processing post process for composition
     */
    public imageProcessingPostProcess: ImageProcessingPostProcess;

    /**
     * How many samples are used for MSAA of the scene render target
     */
    public get samples() {
        return this._samples;
    }

    public set samples(n: number) {
        if (!this.imageProcessingPostProcess) {
            this._createCompositionEffect();
        }

        this._samples = n;
    }

    public _engine: Engine;
    public _scene: Scene;

    /**
      * Is this render target enabled for prepass rendering
      */
    public enabled: boolean = false;

    /**
      * Render target associated with this prePassRenderTarget
      * If this is `null`, it means this prePassRenderTarget is associated with the scene
      */
    public renderTargetTexture: Nullable<RenderTargetTexture> = null;

    public constructor(name: string,  renderTargetTexture: Nullable<RenderTargetTexture>, size: any, count: number, scene: Scene, options?: IMultiRenderTargetOptions | undefined) {
        super(name, size, count, scene, options);

        this.renderTargetTexture = renderTargetTexture;
        // TODO : poser dans prepassrenderer ?
        // this._resetLayout();
        // this._reinitializeAttachments();
    }

    public _createCompositionEffect() {
        // TODO : GBR
        // if (this._useGeometryBufferFallback && !this._geometryBuffer) {
        //     // Initializes the link with geometry buffer
        //     this.useGeometryBufferFallback = true;
        // }

        const applyByPostProcess = this._scene.imageProcessingConfiguration?.applyByPostProcess;
        this.imageProcessingPostProcess = new ImageProcessingPostProcess("prePassComposition", 1, null, undefined, this._engine);
        this.imageProcessingPostProcess.imageProcessingConfiguration.applyByPostProcess = applyByPostProcess;
    }

    /**
     * Checks that the size of this RT is still adapted to the desired render size.
     */
    public _checkSize() {
        var requiredWidth = this._engine.getRenderWidth(true);
        var requiredHeight = this._engine.getRenderHeight(true);
        var width = this.getRenderWidth();
        var height = this.getRenderHeight();

        if (width !== requiredWidth || height !== requiredHeight) {
            this.resize({ width: requiredWidth, height: requiredHeight });

            // TODO : geometry buffer
            // this._updateGeometryBufferLayout();
        }
    }

    /**
     * Resets the post processes chains applied to this RT.
     */
    public _resetPostProcessChain() {
        this._beforeCompositionPostProcesses = [];
    }

    /**
     * Diposes this render target
     */
    public dispose() {
        super.dispose();

        if (this._scene.prePassRenderer) {
            const index = this._scene.prePassRenderer.renderTargets.indexOf(this);

            if (index !== -1) {
                this._scene.prePassRenderer.renderTargets.splice(index, 1);
            }
        }

        if (this.imageProcessingPostProcess) {
            this.imageProcessingPostProcess.dispose();
        }
    }
}