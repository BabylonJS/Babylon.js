/** This file must only contain pure code and pure imports */

import { NodeRenderGraphBaseObjectRendererBlock } from "./baseObjectRendererBlock";

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
