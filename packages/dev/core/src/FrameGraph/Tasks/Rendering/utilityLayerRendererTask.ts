// eslint-disable-next-line import/no-internal-modules
import type { Camera, FrameGraph, FrameGraphTextureHandle, Scene } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";

/**
 * Task used to render an utility layer.
 */
export class FrameGraphUtilityLayerRendererTask extends FrameGraphTask {
    /**
     * The target texture of the task.
     */
    public targetTexture: FrameGraphTextureHandle;

    /**
     * The camera used to render the utility layer.
     */
    public camera: Camera;

    /**
     * The output texture of the task.
     * This is the same texture as the target texture, but the handles are different!
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The utility layer renderer.
     */
    public readonly layer: UtilityLayerRenderer;

    /**
     * Creates a new utility layer renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the task belongs to.
     * @param handleEvents If the utility layer should handle events.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, handleEvents = true) {
        super(name, frameGraph);

        this.layer = new UtilityLayerRenderer(scene, handleEvents, true);
        this.layer.utilityLayerScene._useCurrentFrameBuffer = true;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public record(): void {
        if (!this.targetTexture || !this.camera) {
            throw new Error("FrameGraphUtilityLayerRendererTask: targetTexture and camera are required");
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            this.layer.setRenderCamera(this.camera);

            context.render(this.layer);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public override dispose(): void {
        this.layer.dispose();
        super.dispose();
    }
}
