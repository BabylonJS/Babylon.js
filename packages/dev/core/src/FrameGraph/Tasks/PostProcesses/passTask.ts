// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { ThinPassCubePostProcess, ThinPassPostProcess } from "core/PostProcesses/thinPassPostProcess";

/**
 * Task which applies a pass post process.
 */
export class FrameGraphPassTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinPassPostProcess;

    /**
     * The second texture used for dual source blending (optional if dual source blending is not used).
     */
    public source2Texture?: FrameGraphTextureHandle;

    /**
     * Constructs a new pass task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the pass effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinPassPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinPassPostProcess(name, frameGraph.engine));
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphPassTask "${this.name}": sourceTexture is required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            if (this.source2Texture) {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "textureSampler2", this.source2Texture);
            }
        });

        pass.addDependencies(this.source2Texture);

        return pass;
    }
}

/**
 * Task which applies a pass cube post process.
 */
export class FrameGraphPassCubeTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinPassCubePostProcess;

    /**
     * Constructs a new pass cube task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the pass cube effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinPassCubePostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinPassCubePostProcess(name, frameGraph.engine));
    }
}
