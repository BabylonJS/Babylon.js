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

let _Registered = false;
/**
 * Register side effects for objectRendererBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterObjectRendererBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.NodeRenderGraphObjectRendererBlock", NodeRenderGraphObjectRendererBlock);
}
