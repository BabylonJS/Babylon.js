/** This file must only contain pure code and pure imports */

import { NodeRenderGraphBaseObjectRendererBlock } from "./baseObjectRendererBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block that render objects to a render target
 */
export class NodeRenderGraphObjectRendererBlock extends NodeRenderGraphBaseObjectRendererBlock {
    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphObjectRendererBlock";
    }
}


let _registered = false;
export function registerObjectRendererBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass("BABYLON.NodeRenderGraphObjectRendererBlock", NodeRenderGraphObjectRendererBlock);
}
