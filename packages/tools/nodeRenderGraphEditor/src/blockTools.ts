import type { Scene } from "core/scene";
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
import { RenderObjectsBlock } from "core/FrameGraph/Node/Blocks/Rendering/renderObjectsBlock";
import { RenderGraphGUIBlock } from "gui/2D/FrameGraph/renderGraphGUIBlock";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string, scene: Scene) {
        switch (data) {
            case "TeleportInBlock":
                return new RenderGraphTeleportInBlock("Teleport In", scene);
            case "TeleportOutBlock":
                return new RenderGraphTeleportOutBlock("Teleport Out", scene);
            case "RenderGraphOutputBlock":
                return new RenderGraphOutputBlock("Output", scene);
            case "ElbowBlock":
                return new RenderGraphElbowBlock("", scene);
            case "TextureBlock": {
                return new RenderGraphInputBlock("Texture", scene, NodeRenderGraphBlockConnectionPointTypes.Texture);
            }
            case "TextureBackBufferBlock": {
                return new RenderGraphInputBlock("Backbuffer color", scene, NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer);
            }
            case "TextureBackBufferDepthStencilBlock": {
                return new RenderGraphInputBlock("Backbuffer depth/stencil", scene, NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment);
            }
            case "TextureDepthStencilBlock": {
                return new RenderGraphInputBlock("Depth/stencil texture", scene, NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
            }
            case "CameraBlock": {
                return new RenderGraphInputBlock("Camera", scene, NodeRenderGraphBlockConnectionPointTypes.Camera);
            }
            case "ObjectListBlock": {
                return new RenderGraphInputBlock("Object list", scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
            }
            case "ClearBlock": {
                return new RenderGraphClearBlock("Clear", scene);
            }
            case "CopyTextureBlock": {
                return new RenderGraphCopyTextureBlock("Copy texture", scene);
            }
            case "BlackAndWhiteBlock": {
                return new BlackAndWhitePostProcessBlock("Black and White", scene);
            }
            case "BloomBlock": {
                return new BloomPostProcessBlock("Bloom", scene);
            }
            case "GUIBlock": {
                return new RenderGraphGUIBlock("GUI", scene);
            }
            case "RenderObjectsBlock": {
                return new RenderObjectsBlock("Render objects", scene);
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
            case NodeRenderGraphBlockConnectionPointTypes.ObjectList:
                color = "#b786cb";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.Camera:
                color = "#be5126";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment:
                color = "#591990";
                break;
            // case NodeRenderGraphBlockConnectionPointTypes.:
            //     color = "#84995c";
            //     break;
            // case NodeRenderGraphBlockConnectionPointTypes.:
            //     color = "#f28e0a";
            //     break;
            case NodeRenderGraphBlockConnectionPointTypes.AutoDetect: // Used by the elbow block
                color = "#880000";
                break;
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
            case "TextureDepthStencilAttachment":
                return NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment;
            case "Camera":
                return NodeRenderGraphBlockConnectionPointTypes.Camera;
            case "ObjectList":
                return NodeRenderGraphBlockConnectionPointTypes.ObjectList;
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
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment:
                return "TextureDepthStencilAttachment";
            case NodeRenderGraphBlockConnectionPointTypes.Camera:
                return "Camera";
            case NodeRenderGraphBlockConnectionPointTypes.ObjectList:
                return "ObjectList";
        }

        return "";
    }
}
