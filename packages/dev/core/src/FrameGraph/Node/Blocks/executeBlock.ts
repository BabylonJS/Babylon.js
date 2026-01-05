import type { NodeRenderGraphConnectionPoint, Scene, FrameGraph, FrameGraphContext } from "core/index";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import { FrameGraphExecuteTask } from "../../Tasks/Misc/executeTask";

/**
 * Block used to execute a custom function in the frame graph
 */
export class NodeRenderGraphExecuteBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphExecuteTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Creates a new NodeRenderGraphExecuteBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._addDependenciesInput(
            NodeRenderGraphBlockConnectionPointTypes.Camera | NodeRenderGraphBlockConnectionPointTypes.ShadowLight | NodeRenderGraphBlockConnectionPointTypes.ObjectList
        );

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.ResourceContainer);

        this._frameGraphTask = new FrameGraphExecuteTask(name, frameGraph);
    }

    /**
     * Gets or sets the execute function
     */
    public get func(): (context: FrameGraphContext) => void {
        return this._frameGraphTask.func;
    }

    public set func(func: (context: FrameGraphContext) => void) {
        this._frameGraphTask.func = func;
    }

    /**
     * Gets or sets the execute when task disabled function
     */
    public get funcDisabled(): ((context: FrameGraphContext) => void) | undefined {
        return this._frameGraphTask.funcDisabled;
    }

    public set funcDisabled(func: ((context: FrameGraphContext) => void) | undefined) {
        this._frameGraphTask.funcDisabled = func;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphExecuteBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }
}

RegisterClass("BABYLON.NodeRenderGraphExecuteBlock", NodeRenderGraphExecuteBlock);
