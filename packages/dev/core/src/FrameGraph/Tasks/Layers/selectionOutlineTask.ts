import type { FrameGraph, Scene, IThinSelectionOutlineLayerOptions, FrameGraphTextureHandle, Effect, FrameGraphRenderContext } from "core/index";
import { ThinSelectionOutlineLayer } from "core/Layers/thinSelectionOutlineLayer";
import { FrameGraphBaseLayerTask, FrameGraphBaseLayerBlurType } from "./baseLayerTask";

/**
 * Task which applies a selection outline effect to a texture.
 */
export class FrameGraphSelectionOutlineLayerTask extends FrameGraphBaseLayerTask {
    /**
     * The selection outline layer object. Use this object to update the selection outline layer properties (e.g. intensity, blur kernel size).
     */
    public override readonly layer: ThinSelectionOutlineLayer;

    /**
     * The depth texture to use when rendering the selection outline layer.
     * It must store the scene depth in camera view space Z, normalized or not.
     * If not normalized, the storeCameraSpaceZ option must be passed to the constructor.
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * Constructs a new selection outline layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the selection outline layer in.
     * @param options Options for the selection outline layer.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: IThinSelectionOutlineLayerOptions) {
        super(name, frameGraph, scene, new ThinSelectionOutlineLayer(name, scene, options, true), 0, FrameGraphBaseLayerBlurType.None, false, false, false);

        this._objectRendererForLayerTask.objectList = {
            meshes: this.layer._selection || [],
            particleSystems: [],
        };
    }

    public override getClassName(): string {
        return "FrameGraphSelectionOutlineLayerTask";
    }

    public override record() {
        if (this.depthTexture === undefined) {
            throw new Error(`FrameGraphSelectionOutlineLayerTask "${this.name}": depthTexture is required`);
        }

        super.record(false, (context: FrameGraphRenderContext, effect: Effect) => {
            context.bindTextureHandle(effect, "depthSampler", this.depthTexture);
            context.bindTextureHandle(effect, "maskSampler", this._objectRendererForLayerTask.outputTexture);
        });

        this.layer.textureWidth = this._layerTextureDimensions.width;
        this.layer.textureHeight = this._layerTextureDimensions.height;
    }
}
