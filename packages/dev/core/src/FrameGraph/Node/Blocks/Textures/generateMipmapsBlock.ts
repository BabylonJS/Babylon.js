import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import type { Scene } from "../../../../scene";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";
import type { FrameGraphTextureId } from "../../../frameGraphTypes";
import { FrameGraphGenerateMipMapsTask } from "../../../Tasks/Texture/generateMipMapsTask";

/**
 * Block used to generate mipmaps for a texture
 */
export class NodeRenderGraphGenerateMipmapsBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphGenerateMipMapsTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphGenerateMipmapsBlock
     * @param name defines the block name
     * @param scene defines the hosting scene
     */
    public constructor(name: string, scene: Scene) {
        super(name, scene);

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.output._typeConnectionSource = this.texture;

        this._frameGraphTask = new FrameGraphGenerateMipMapsTask(name);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphGenerateMipmapsBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
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

        this._propagateInputValueToOutput(this.texture, this.output);

        const textureConnectedPoint = this.texture.connectedPoint;
        if (textureConnectedPoint) {
            this._frameGraphTask.destinationTexture = textureConnectedPoint.value as FrameGraphTextureId;
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }
}

RegisterClass("BABYLON.NodeRenderGraphGenerateMipmapsBlock", NodeRenderGraphGenerateMipmapsBlock);
