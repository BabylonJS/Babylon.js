import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphBlockConnectionPointValueTypes } from "../Types/nodeRenderGraphBlockConnectionPointTypes";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
import { FrameGraphCopyToTextureTask } from "../../../FrameGraph/Tasks/copyToTextureTask";

/**
 * Block used to copy a texture
 */
export class RenderGraphCopyTextureBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCopyToTextureTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new RenderGraphCopyTextureBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.destination;

        this._frameGraphTask = new FrameGraphCopyToTextureTask(name);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RenderGraphCopyTextureBlock";
    }
    /**
     * Gets the source input component
     */
    public get source(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the destination input component
     */
    public get destination(): NodeRenderGraphConnectionPoint {
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

        this._frameGraphTask.name = this.name;

        this.output.value = this._frameGraphTask.outputTextureReference; // the value of the output connection point is the "output" texture of the task
        this.output.valueType = NodeRenderGraphBlockConnectionPointValueTypes.Texture;

        const sourceConnectedPoint = this.source.connectedPoint;
        if (sourceConnectedPoint && sourceConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.sourceTexture = sourceConnectedPoint.value!;
        }

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint && destinationConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.destinationTexture = destinationConnectedPoint.value;
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }
}

RegisterClass("BABYLON.RenderGraphCopyTextureBlock", RenderGraphCopyTextureBlock);
