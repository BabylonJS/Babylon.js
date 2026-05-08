/** This file must only contain pure code and pure imports */

import { type Scene, type FrameGraph } from "core/index";
import { FrameGraphPassCubeTask, FrameGraphPassTask } from "core/FrameGraph/Tasks/PostProcesses/passTask";
import { ThinPassCubePostProcess, ThinPassPostProcess } from "core/PostProcesses/thinPassPostProcess";
import { NodeRenderGraphBaseWithPropertiesPostProcessBlock } from "././baseWithPropertiesPostProcessBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block that implements the pass post process
 */
export class NodeRenderGraphPassPostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    protected override _frameGraphTask: FrameGraphPassTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphPassPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphPassTask(this.name, frameGraph, new ThinPassPostProcess(name, scene.getEngine()));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphPassPostProcessBlock";
    }
}

/**
 * Block that implements the pass cube post process
 */
export class NodeRenderGraphPassCubePostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    protected override _frameGraphTask: FrameGraphPassCubeTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphPassCubePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphPassCubeTask(this.name, frameGraph, new ThinPassCubePostProcess(name, scene.getEngine()));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphPassCubePostProcessBlock";
    }
}

let _Registered = false;
/**
 * Register side effects for passPostProcessBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterPassPostProcessBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.NodeRenderGraphPassPostProcessBlock", NodeRenderGraphPassPostProcessBlock);
    RegisterClass("BABYLON.NodeRenderGraphPassCubePostProcessBlock", NodeRenderGraphPassCubePostProcessBlock);
}
