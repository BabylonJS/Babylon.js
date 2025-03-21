// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, FrameGraphTextureHandle, FrameGraph, NodeRenderGraphBuildState } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { FrameGraphCopyToTextureTask } from "../../../Tasks/Texture/copyToTextureTask";

/**
 * Block used to copy a texture
 */
export class NodeRenderGraphCopyTextureBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCopyToTextureTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphCopyTextureBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.target;

        this._frameGraphTask = new FrameGraphCopyToTextureTask(name, frameGraph);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphCopyTextureBlock";
    }
    /**
     * Gets the source input component
     */
    public get source(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the target input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture; // the value of the output connection point is the "output" texture of the task

        this._frameGraphTask.sourceTexture = this.source.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
    }
}

RegisterClass("BABYLON.NodeRenderGraphCopyTextureBlock", NodeRenderGraphCopyTextureBlock);
