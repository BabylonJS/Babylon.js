import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import type { Scene } from "../../../../scene";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";
import { FrameGraphCopyToTextureTask } from "../../../Tasks/Texture/copyToTextureTask";
import type { FrameGraphTextureId } from "../../../frameGraphTypes";

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
     * @param scene defines the hosting scene
     */
    public constructor(name: string, scene: Scene) {
        super(name, scene);

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
        return "NodeRenderGraphCopyTextureBlock";
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

        const sourceConnectedPoint = this.source.connectedPoint;
        if (sourceConnectedPoint) {
            this._frameGraphTask.sourceTexture = sourceConnectedPoint.value as FrameGraphTextureId;
        }

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint) {
            this._frameGraphTask.destinationTexture = destinationConnectedPoint.value as FrameGraphTextureId;
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }
}

RegisterClass("BABYLON.NodeRenderGraphCopyTextureBlock", NodeRenderGraphCopyTextureBlock);
