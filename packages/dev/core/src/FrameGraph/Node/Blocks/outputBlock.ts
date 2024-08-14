import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Enums/nodeRenderGraphBlockConnectionPointTypes";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
import type { IFrameGraphCopyToBackbufferColorInputData } from "core/FrameGraph/Tasks/copyToBackbufferColorTask";
import { FrameGraphCopyToBackbufferColorTask } from "core/FrameGraph/Tasks/copyToBackbufferColorTask";

/**
 * Block used to generate the final graph
 */
export class RenderGraphOutputBlock extends NodeRenderGraphBlock {
    private _taskParameters: IFrameGraphCopyToBackbufferColorInputData;

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
        this._taskParameters = {
            sourceTexture: undefined as any,
        };
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

        const inputTexture = this.texture.connectedPoint?.value;
        if (NodeRenderGraphConnectionPoint.ValueIsTexture(inputTexture)) {
            this._taskParameters.sourceTexture = inputTexture;
        }

        state.frameGraph.addTask(this._frameGraphTask, this._taskParameters);
    }
}

RegisterClass("BABYLON.RenderGraphOutputBlock", RenderGraphOutputBlock);
