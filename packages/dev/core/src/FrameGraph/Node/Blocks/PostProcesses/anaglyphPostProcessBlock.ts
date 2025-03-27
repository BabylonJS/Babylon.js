// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { FrameGraphAnaglyphTask } from "core/FrameGraph/Tasks/PostProcesses/anaglyphTask";
import { ThinAnaglyphPostProcess } from "core/PostProcesses/thinAnaglyphPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the anaglyph post process
 */
export class NodeRenderGraphAnaglyphPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphAnaglyphTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderAnaglyphPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("leftTexture", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);

        this.leftTexture.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphAnaglyphTask(this.name, frameGraph, new ThinAnaglyphPostProcess(name, scene.getEngine()));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphAnaglyphPostProcessBlock";
    }

    /**
     * Gets the left texture input component
     */
    public get leftTexture(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.leftTexture = this.leftTexture.connectedPoint?.value as FrameGraphTextureHandle;
    }
}

RegisterClass("BABYLON.NodeRenderGraphAnaglyphPostProcessBlock", NodeRenderGraphAnaglyphPostProcessBlock);
