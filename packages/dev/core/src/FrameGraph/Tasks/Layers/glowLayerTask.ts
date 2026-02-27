import type { FrameGraph, Scene, IThinGlowLayerOptions } from "core/index";
import { ThinGlowLayer } from "core/Layers/thinGlowLayer";
import { FrameGraphBaseLayerTask } from "./baseLayerTask";

/**
 * Task which applies a glowing effect to a texture.
 */
export class FrameGraphGlowLayerTask extends FrameGraphBaseLayerTask {
    /**
     * The glow layer object. Use this object to update the glow layer properties (e.g. intensity, blur kernel size).
     */
    public override readonly layer: ThinGlowLayer;

    /**
     * Constructs a new glow layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the glow layer in.
     * @param options Options for the glow layer.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: IThinGlowLayerOptions) {
        super(name, frameGraph, scene, new ThinGlowLayer(name, scene, options, true), 2);

        this.layer._renderPassId = this._objectRendererForLayerTask.objectRenderer.renderPassId;
    }

    public override getClassName(): string {
        return "FrameGraphGlowLayerTask";
    }
}
