import type { NodeRenderGraphTextureType } from "../Enums/nodeRenderGraphTextureType";

/**
 * Handle to a texture
 */
export interface INodeRenderGraphTextureHandle {
    /** Texture handle */
    handle: number;
    /** Texture type */
    type: NodeRenderGraphTextureType;
}
