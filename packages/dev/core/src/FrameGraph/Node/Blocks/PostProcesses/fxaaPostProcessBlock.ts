// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FrameGraphFXAATask } from "core/FrameGraph/Tasks/PostProcesses/fxaaTask";
import { ThinFXAAPostProcess } from "core/PostProcesses/thinFXAAPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the FXAA post process
 */
export class NodeRenderGraphFXAAPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphFXAATask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new FXAA post-process block
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphFXAATask(this.name, frameGraph, new ThinFXAAPostProcess(name, scene.getEngine()));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphFXAAPostProcessBlock";
    }
}

RegisterClass("BABYLON.NodeRenderGraphFXAAPostProcessBlock", NodeRenderGraphFXAAPostProcessBlock);
