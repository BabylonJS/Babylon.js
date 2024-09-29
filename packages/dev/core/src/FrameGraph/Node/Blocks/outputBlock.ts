import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes";
import type { Scene } from "../../../scene";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
import { FrameGraphCopyToBackbufferColorTask } from "../../Tasks/Texture/copyToBackbufferColorTask";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import type { FrameGraph } from "core/FrameGraph/frameGraph";

/**
 * Block used to generate the final graph
 */
export class NodeRenderGraphOutputBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCopyToBackbufferColorTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphOutputBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._isUnique = true;

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);

        this._frameGraphTask = new FrameGraphCopyToBackbufferColorTask(name, frameGraph);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphOutputBlock";
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
            this._frameGraphTask.sourceTexture = textureConnectedPoint.value as FrameGraphTextureHandle;
        }
    }
}

RegisterClass("BABYLON.NodeRenderGraphOutputBlock", NodeRenderGraphOutputBlock);
