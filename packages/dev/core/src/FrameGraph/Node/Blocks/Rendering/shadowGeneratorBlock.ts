// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph } from "core/index";
import { NodeRenderGraphBaseShadowGeneratorBlock } from "./baseShadowGeneratorBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FrameGraphShadowGeneratorTask } from "../../../Tasks/Rendering/shadowGeneratorTask";

/**
 * Block that generate shadows through a shadow generator
 */
export class NodeRenderGraphShadowGeneratorBlock extends NodeRenderGraphBaseShadowGeneratorBlock {
    /**
     * Create a new NodeRenderGraphShadowGeneratorBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphShadowGeneratorTask(this.name, frameGraph, scene);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphShadowGeneratorBlock";
    }
}

RegisterClass("BABYLON.NodeRenderGraphShadowGeneratorBlock", NodeRenderGraphShadowGeneratorBlock);
