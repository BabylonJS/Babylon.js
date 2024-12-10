// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, FrameGraphTextureHandle, FrameGraph, NodeRenderGraphBuildState } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
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
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.output._typeConnectionSource = this.texture;

        this._frameGraphTask = new FrameGraphGenerateMipMapsTask(name, frameGraph);
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

        this._propagateInputValueToOutput(this.texture, this.output);

        this._frameGraphTask.destinationTexture = this.texture.connectedPoint?.value as FrameGraphTextureHandle;
    }
}

RegisterClass("BABYLON.NodeRenderGraphGenerateMipmapsBlock", NodeRenderGraphGenerateMipmapsBlock);
