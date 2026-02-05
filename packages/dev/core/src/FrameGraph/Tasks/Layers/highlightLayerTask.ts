import type { FrameGraph, Scene, IThinHighlightLayerOptions } from "core/index";
import { ThinHighlightLayer } from "core/Layers/thinHighlightLayer";
import { Constants } from "core/Engines/constants";
import { FrameGraphBaseLayerTask } from "./baseLayerTask";
import { HasStencilAspect } from "core/Materials/Textures/textureHelper.functions";
import { FrameGraphBaseLayerBlurType } from "./baseLayerTask";

/**
 * Task which applies a highlight effect to a texture.
 */
export class FrameGraphHighlightLayerTask extends FrameGraphBaseLayerTask {
    /**
     * The highlight layer object. Use this object to update the highlight layer properties.
     */
    public override readonly layer: ThinHighlightLayer;

    /**
     * Constructs a new highlight layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the highlight layer in.
     * @param options Options for the highlight layer.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: IThinHighlightLayerOptions) {
        const alphaBlendingMode = options?.alphaBlendingMode ?? Constants.ALPHA_COMBINE;

        super(
            name,
            frameGraph,
            scene,
            new ThinHighlightLayer(name, scene, options, true),
            1,
            alphaBlendingMode === Constants.ALPHA_COMBINE ? FrameGraphBaseLayerBlurType.Glow : FrameGraphBaseLayerBlurType.Standard,
            true,
            true
        );
    }

    public override getClassName(): string {
        return "FrameGraphHighlightLayerTask";
    }

    public override record() {
        if (!this.objectRendererTask.depthTexture) {
            throw new Error(`FrameGraphHighlightLayerTask "${this.name}": objectRendererTask must have a depthTexture input`);
        }

        const depthTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.objectRendererTask.depthTexture);
        if (!depthTextureCreationOptions.options.formats || !HasStencilAspect(depthTextureCreationOptions.options.formats[0])) {
            throw new Error(`FrameGraphHighlightLayerTask "${this.name}": objectRendererTask depthTexture must have a stencil aspect`);
        }

        super.record();

        this.layer._mainObjectRendererRenderPassId = this.objectRendererTask.objectRenderer.renderPassId;
    }
}
