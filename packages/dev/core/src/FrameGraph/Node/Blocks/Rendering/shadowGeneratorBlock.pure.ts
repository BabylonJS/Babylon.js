/** This file must only contain pure code and pure imports */

import { type Scene, type FrameGraph } from "core/index.pure";
import { NodeRenderGraphBaseShadowGeneratorBlock } from "./baseShadowGeneratorBlock";
import { FrameGraphShadowGeneratorTask } from "../../../Tasks/Rendering/shadowGeneratorTask";
import { RegisterClass } from "../../../../Misc/typeStore";

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

        this._frameGraphTask = new FrameGraphShadowGeneratorTask(this.name, frameGraph);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphShadowGeneratorBlock";
    }
}


let _registered = false;
export function registerShadowGeneratorBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass("BABYLON.NodeRenderGraphShadowGeneratorBlock", NodeRenderGraphShadowGeneratorBlock);
}
