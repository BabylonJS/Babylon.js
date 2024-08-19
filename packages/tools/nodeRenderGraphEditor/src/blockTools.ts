import type { AbstractEngine } from "core/Engines";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphBlockConnectionPointTypes";
import { RenderGraphOutputBlock } from "core/FrameGraph/Node/Blocks/outputBlock";
import { RenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { RenderGraphElbowBlock } from "core/FrameGraph/Node/Blocks/elbowBlock";
import { RenderGraphTeleportInBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportInBlock";
import { RenderGraphTeleportOutBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportOutBlock";
import { BlackAndWhitePostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/blackAndWhitePostProcessBlock";
import { BloomPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/bloomPostProcessBlock";
import { RenderGraphClearBlock } from "core/FrameGraph/Node/Blocks/clearBlock";
import { RenderGraphCopyTextureBlock } from "core/FrameGraph/Node/Blocks/copyTextureBlock";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string, engine: AbstractEngine) {
        switch (data) {
            case "TeleportInBlock":
                return new RenderGraphTeleportInBlock("Teleport In", engine);
            case "TeleportOutBlock":
                return new RenderGraphTeleportOutBlock("Teleport Out", engine);
            case "RenderGraphOutputBlock":
                return new RenderGraphOutputBlock("Output", engine);
            case "ElbowBlock":
                return new RenderGraphElbowBlock("", engine);
            case "TextureBlock": {
                return new RenderGraphInputBlock("Texture", engine, NodeRenderGraphBlockConnectionPointTypes.Texture);
            }
            case "TextureBackBufferBlock": {
                return new RenderGraphInputBlock("Backbuffer color", engine, NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer);
            }
            case "TextureBackBufferDepthStencilBlock": {
                return new RenderGraphInputBlock("Backbuffer depth/stencil", engine, NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment);
            }
            case "ClearBlock": {
                return new RenderGraphClearBlock("Clear", engine);
            }
            case "CopyTextureBlock": {
                return new RenderGraphCopyTextureBlock("Copy texture", engine);
            }
            case "BlackAndWhitePostProcessBlock": {
                return new BlackAndWhitePostProcessBlock("Black and White", engine);
            }
            case "BloomPostProcessBlock": {
                return new BloomPostProcessBlock("Bloom", engine);
            }
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeRenderGraphBlockConnectionPointTypes) {
        let color = "#880000";
        switch (type) {
            case NodeRenderGraphBlockConnectionPointTypes.Texture:
                color = "#51b0e5";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer:
                color = "#cb9e27";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment:
                color = "#16bcb1";
                break;
            // case NodeRenderGraphBlockConnectionPointTypes.:
            //     color = "#b786cb";
            //     break;
            // case NodeRenderGraphBlockConnectionPointTypes.:
            //     color = "#be5126";
            //     break;
            // case NodeRenderGraphBlockConnectionPointTypes.:
            //     color = "#591990";
            //     break;
            // case NodeRenderGraphBlockConnectionPointTypes.:
            //     color = "#84995c";
            //     break;
            // case NodeRenderGraphBlockConnectionPointTypes.:
            //     color = "#f28e0a";
            //     break;
            default:
                throw new Error("Unknown connection point type: " + type);
        }

        return color;
    }

    public static GetConnectionNodeTypeFromString(type: string) {
        switch (type) {
            case "Texture":
                return NodeRenderGraphBlockConnectionPointTypes.Texture;
            case "TextureBackBuffer":
                return NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer;
            case "TextureBackBufferDepthStencilAttachment":
                return NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment;
        }

        return NodeRenderGraphBlockConnectionPointTypes.AutoDetect;
    }

    public static GetStringFromConnectionNodeType(type: NodeRenderGraphBlockConnectionPointTypes) {
        switch (type) {
            case NodeRenderGraphBlockConnectionPointTypes.Texture:
                return "Texture";
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer:
                return "TextureBackBuffer";
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment:
                return "TextureBackBufferDepthStencilAttachment";
        }

        return "";
    }
}
