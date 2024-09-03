import type { Scene } from "core/scene";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import { NodeRenderGraphOutputBlock } from "core/FrameGraph/Node/Blocks/outputBlock";
import { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphElbowBlock } from "core/FrameGraph/Node/Blocks/elbowBlock";
import { NodeRenderGraphTeleportInBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportInBlock";
import { NodeRenderGraphTeleportOutBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportOutBlock";
import { NodeRenderGraphBlackAndWhitePostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/blackAndWhitePostProcessBlock";
import { NodeRenderGraphBloomPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/bloomPostProcessBlock";
import { NodeRenderGraphBlurPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/blurPostProcessBlock";
import { NodeRenderGraphClearBlock } from "core/FrameGraph/Node/Blocks/Textures/clearBlock";
import { NodeRenderGraphCopyTextureBlock } from "core/FrameGraph/Node/Blocks/Textures/copyTextureBlock";
import { NodeRenderGraphGenerateMipmapsBlock } from "core/FrameGraph/Node/Blocks/Textures/generateMipmapsBlock";
import { NodeRenderGraphObjectRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/objectRendererBlock";
import { NodeRenderGraphGeometryRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/geometryRendererBlock";
import { NodeRenderGraphCullObjectsBlock } from "core/FrameGraph/Node/Blocks/Rendering/cullObjectsBlock";
import { NodeRenderGraphGUIBlock } from "gui/2D/FrameGraph/renderGraphGUIBlock";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string, scene: Scene) {
        switch (data) {
            case "TeleportInBlock":
                return new NodeRenderGraphTeleportInBlock("Teleport In", scene);
            case "TeleportOutBlock":
                return new NodeRenderGraphTeleportOutBlock("Teleport Out", scene);
            case "OutputBlock":
                return new NodeRenderGraphOutputBlock("Output", scene);
            case "ElbowBlock":
                return new NodeRenderGraphElbowBlock("", scene);
            case "TextureBlock": {
                return new NodeRenderGraphInputBlock("Texture", scene, NodeRenderGraphBlockConnectionPointTypes.Texture);
            }
            case "TextureBackBufferBlock": {
                return new NodeRenderGraphInputBlock("Backbuffer color", scene, NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer);
            }
            case "TextureBackBufferDepthStencilBlock": {
                return new NodeRenderGraphInputBlock("Backbuffer depth/stencil", scene, NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment);
            }
            case "TextureDepthStencilBlock": {
                return new NodeRenderGraphInputBlock("Depth/stencil texture", scene, NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
            }
            case "CameraBlock": {
                return new NodeRenderGraphInputBlock("Camera", scene, NodeRenderGraphBlockConnectionPointTypes.Camera);
            }
            case "ObjectListBlock": {
                return new NodeRenderGraphInputBlock("Object list", scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
            }
            case "ClearBlock": {
                return new NodeRenderGraphClearBlock("Clear", scene);
            }
            case "CopyTextureBlock": {
                return new NodeRenderGraphCopyTextureBlock("Copy texture", scene);
            }
            case "GenerateMipmapsBlock": {
                return new NodeRenderGraphGenerateMipmapsBlock("Generate mipmaps", scene);
            }
            case "BlackAndWhiteBlock": {
                return new NodeRenderGraphBlackAndWhitePostProcessBlock("Black and White", scene);
            }
            case "BloomBlock": {
                return new NodeRenderGraphBloomPostProcessBlock("Bloom", scene);
            }
            case "BlurBlock": {
                return new NodeRenderGraphBlurPostProcessBlock("Blur", scene);
            }
            case "GUIBlock": {
                return new NodeRenderGraphGUIBlock("GUI", scene);
            }
            case "ObjectRendererBlock": {
                return new NodeRenderGraphObjectRendererBlock("Object renderer", scene);
            }
            case "GeometryRendererBlock": {
                return new NodeRenderGraphGeometryRendererBlock("Geometry renderer", scene);
            }
            case "CullBlock": {
                return new NodeRenderGraphCullObjectsBlock("Cull", scene);
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
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepth:
                color = "#84995c";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureNormal:
                color = "#84995c";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo:
                color = "#84995c";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity:
                color = "#84995c";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TexturePosition:
                color = "#84995c";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureVelocity:
                color = "#84995c";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.BasedOnInput:
                color = "#f28e0a"; // Used by the teleport blocks
                break;
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
            case "TextureDepth":
                return NodeRenderGraphBlockConnectionPointTypes.TextureDepth;
            case "TextureNormal":
                return NodeRenderGraphBlockConnectionPointTypes.TextureNormal;
            case "TextureAlbedo":
                return NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo;
            case "TextureReflectivity":
                return NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity;
            case "TexturePosition":
                return NodeRenderGraphBlockConnectionPointTypes.TexturePosition;
            case "TextureVelocity":
                return NodeRenderGraphBlockConnectionPointTypes.TextureVelocity;
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
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepth:
                return "TextureDepth";
            case NodeRenderGraphBlockConnectionPointTypes.TextureNormal:
                return "TextureNormal";
            case NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo:
                return "TextureAlbedo";
            case NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity:
                return "TextureReflectivity";
            case NodeRenderGraphBlockConnectionPointTypes.TexturePosition:
                return "TexturePosition";
            case NodeRenderGraphBlockConnectionPointTypes.TextureVelocity:
                return "TextureVelocity";
        }

        return "";
    }
}
