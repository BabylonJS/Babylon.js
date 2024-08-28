import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphBlockConnectionPointTypes";
import type { Scene } from "../../../scene";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
import { FrameGraphCopyToBackbufferColorTask } from "../../Tasks/Texture/copyToBackbufferColorTask";
import type { FrameGraphTextureId } from "../../frameGraphTypes";

/**
 * Block used to generate the final graph
 */
export class RenderGraphOutputBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCopyToBackbufferColorTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new RenderGraphOutputBlock
     * @param name defines the block name
     * @param scene defines the hosting scene
     */
    public constructor(name: string, scene: Scene) {
        super(name, scene);

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
        if (textureConnectedPoint) {
            this._frameGraphTask.sourceTexture = textureConnectedPoint.value as FrameGraphTextureId;
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }
}

RegisterClass("BABYLON.RenderGraphOutputBlock", RenderGraphOutputBlock);
