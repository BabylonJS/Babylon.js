import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphBlockConnectionPointValueTypes } from "../Types/nodeRenderGraphBlockConnectionPointTypes";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
import { FrameGraphCopyToBackbufferColorTask } from "core/FrameGraph/Tasks/copyToBackbufferColorTask";

/**
 * Block used to generate the final graph
 */
export class RenderGraphOutputBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCopyToBackbufferColorTask;

    /**
     * Create a new RenderGraphOutputBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this._isUnique = true;

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);

        this._frameGraphTask = new FrameGraphCopyToBackbufferColorTask(name);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RenderGraphOutputBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        const textureConnectedPoint = this.texture.connectedPoint;
        if (textureConnectedPoint && textureConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.sourceTexture = textureConnectedPoint.value!;
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }
}

RegisterClass("BABYLON.RenderGraphOutputBlock", RenderGraphOutputBlock);
