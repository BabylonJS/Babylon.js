import type { Scene } from "core/scene";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import { NodeRenderGraphOutputBlock } from "core/FrameGraph/Node/Blocks/outputBlock";
import { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphElbowBlock } from "core/FrameGraph/Node/Blocks/elbowBlock";
import { NodeRenderGraphTeleportInBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportInBlock";
import { NodeRenderGraphTeleportOutBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportOutBlock";
import { NodeRenderGraphBlackAndWhitePostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/blackAndWhitePostProcessBlock";
import { NodeRenderGraphBloomPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/bloomPostProcessBlock";
import { NodeRenderGraphBlurPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/blurPostProcessBlock";
import { NodeRenderGraphCircleOfConfusionPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/circleOfConfusionPostProcessBlock";
import { NodeRenderGraphDepthOfFieldPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/depthOfFieldPostProcessBlock";
import { NodeRenderGraphExtractHighlightsPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/extractHighlightsPostProcessBlock";
import { NodeRenderGraphClearBlock } from "core/FrameGraph/Node/Blocks/Textures/clearBlock";
import { NodeRenderGraphCopyTextureBlock } from "core/FrameGraph/Node/Blocks/Textures/copyTextureBlock";
import { NodeRenderGraphGenerateMipmapsBlock } from "core/FrameGraph/Node/Blocks/Textures/generateMipmapsBlock";
import { NodeRenderGraphObjectRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/objectRendererBlock";
import { NodeRenderGraphGeometryRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/geometryRendererBlock";
import { NodeRenderGraphCullObjectsBlock } from "core/FrameGraph/Node/Blocks/cullObjectsBlock";
import { NodeRenderGraphGUIBlock } from "gui/2D/FrameGraph/renderGraphGUIBlock";
import { NodeRenderGraphTAAPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/taaPostProcessBlock";
import { NodeRenderGraphResourceContainerBlock } from "core/FrameGraph/Node/Blocks/resourceContainerBlock";
import { NodeRenderGraphShadowGeneratorBlock } from "core/FrameGraph/Node/Blocks/Rendering/shadowGeneratorBlock";
import { NodeRenderGraphCascadedShadowGeneratorBlock } from "core/FrameGraph/Node/Blocks/Rendering/csmShadowGeneratorBlock";
import { NodeRenderGraphExecuteBlock } from "core/FrameGraph/Node/Blocks/executeBlock";
import { NodeRenderGraphGlowLayerBlock } from "core/FrameGraph/Node/Blocks/Layers/glowLayerBlock";
import { NodeRenderGraphHighlightLayerBlock } from "core/FrameGraph/Node/Blocks/Layers/highlightLayerBlock";
import { NodeRenderGraphPassCubePostProcessBlock, NodeRenderGraphPassPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/passPostProcessBlock";
import { NodeRenderGraphUtilityLayerRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/utilityLayerRendererBlock";
import { NodeRenderGraphSSRPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/ssrPostProcessBlock";
import { NodeRenderGraphAnaglyphPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/anaglyphPostProcessBlock";
import { NodeRenderGraphChromaticAberrationPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/chromaticAberrationPostProcessBlock";
import { NodeRenderGraphImageProcessingPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/imageProcessingPostProcessBlock";
import { NodeRenderGraphFXAAPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/fxaaPostProcessBlock";
import { NodeRenderGraphGrainPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/grainPostProcessBlock";
import { NodeRenderGraphMotionBlurPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/motionBlurPostProcessBlock";
import { NodeRenderGraphConvolutionPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/convolutionPostProcessBlock";
import { NodeRenderGraphSharpenPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/sharpenPostProcessBlock";
import { NodeRenderGraphScreenSpaceCurvaturePostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/screenSpaceCurvaturePostProcessBlock";
import { NodeRenderGraphColorCorrectionPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/colorCorrectionPostProcessBlock";
import { NodeRenderGraphFilterPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/filterPostProcessBlock";
import { NodeRenderGraphTonemapPostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/tonemapPostProcessBlock";
import { NodeRenderGraphSSAO2PostProcessBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/ssao2PostProcessBlock";
import { NodeRenderGraphComputeShaderBlock } from "core/FrameGraph/Node/Blocks/computeShaderBlock";
import { NodeRenderGraphVolumetricLightingBlock } from "core/FrameGraph/Node/Blocks/PostProcesses/volumetricLightingBlock";
import { NodeRenderGraphLightingVolumeBlock } from "core/FrameGraph/Node/Blocks/lightingVolumeBlock";
import { NodeRenderGraphSelectionOutlineLayerBlock } from "core/FrameGraph/Node/Blocks/Layers/selectionOutlineLayerBlock";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string, frameGraph: FrameGraph, scene: Scene) {
        switch (data) {
            case "TeleportInBlock":
                return new NodeRenderGraphTeleportInBlock("Teleport In", frameGraph, scene);
            case "TeleportOutBlock":
                return new NodeRenderGraphTeleportOutBlock("Teleport Out", frameGraph, scene);
            case "OutputBlock":
                return new NodeRenderGraphOutputBlock("Output", frameGraph, scene);
            case "ElbowBlock":
                return new NodeRenderGraphElbowBlock("", frameGraph, scene);
            case "ResourceContainerBlock":
                return new NodeRenderGraphResourceContainerBlock("Resources", frameGraph, scene);
            case "ExecuteBlock":
                return new NodeRenderGraphExecuteBlock("Execute", frameGraph, scene);
            case "UtilityLayerRendererBlock":
                return new NodeRenderGraphUtilityLayerRendererBlock("Utility Layer", frameGraph, scene);
            case "TextureBlock": {
                return new NodeRenderGraphInputBlock("Texture", frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.Texture);
            }
            case "TextureBackBufferBlock": {
                return new NodeRenderGraphInputBlock("Backbuffer color", frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer);
            }
            case "TextureBackBufferDepthStencilBlock": {
                return new NodeRenderGraphInputBlock(
                    "Backbuffer depth/stencil",
                    frameGraph,
                    scene,
                    NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment
                );
            }
            case "TextureDepthStencilBlock": {
                return new NodeRenderGraphInputBlock("Depth/stencil texture", frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
            }
            case "CameraBlock": {
                return new NodeRenderGraphInputBlock("Camera", frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.Camera);
            }
            case "ObjectListBlock": {
                return new NodeRenderGraphInputBlock("Object list", frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
            }
            case "ShadowLightBlock": {
                return new NodeRenderGraphInputBlock("Shadow light", frameGraph, scene, NodeRenderGraphBlockConnectionPointTypes.ShadowLight);
            }
            case "ClearBlock": {
                return new NodeRenderGraphClearBlock("Clear", frameGraph, scene);
            }
            case "CopyTextureBlock": {
                return new NodeRenderGraphCopyTextureBlock("Copy texture", frameGraph, scene);
            }
            case "GenerateMipmapsBlock": {
                return new NodeRenderGraphGenerateMipmapsBlock("Generate mipmaps", frameGraph, scene);
            }
            case "BlackAndWhiteBlock": {
                return new NodeRenderGraphBlackAndWhitePostProcessBlock("Black and White", frameGraph, scene);
            }
            case "BloomBlock": {
                return new NodeRenderGraphBloomPostProcessBlock("Bloom", frameGraph, scene);
            }
            case "BlurBlock": {
                return new NodeRenderGraphBlurPostProcessBlock("Blur", frameGraph, scene);
            }
            case "PassBlock": {
                return new NodeRenderGraphPassPostProcessBlock("Pass", frameGraph, scene);
            }
            case "PassCubeBlock": {
                return new NodeRenderGraphPassCubePostProcessBlock("Pass cube", frameGraph, scene);
            }
            case "GUIBlock": {
                return new NodeRenderGraphGUIBlock("GUI", frameGraph, scene);
            }
            case "ObjectRendererBlock": {
                return new NodeRenderGraphObjectRendererBlock("Object renderer", frameGraph, scene);
            }
            case "GeometryRendererBlock": {
                return new NodeRenderGraphGeometryRendererBlock("Geometry renderer", frameGraph, scene);
            }
            case "TAABlock": {
                return new NodeRenderGraphTAAPostProcessBlock("Temporal Anti-Aliasing", frameGraph, scene);
            }
            case "CullBlock": {
                return new NodeRenderGraphCullObjectsBlock("Cull", frameGraph, scene);
            }
            case "CircleOfConfusionBlock": {
                return new NodeRenderGraphCircleOfConfusionPostProcessBlock("Circle of Confusion", frameGraph, scene);
            }
            case "DepthOfFieldBlock": {
                return new NodeRenderGraphDepthOfFieldPostProcessBlock("Depth of Field", frameGraph, scene);
            }
            case "ExtractHighlightsBlock": {
                return new NodeRenderGraphExtractHighlightsPostProcessBlock("Extract Highlights", frameGraph, scene);
            }
            case "ShadowGeneratorBlock": {
                return new NodeRenderGraphShadowGeneratorBlock("Shadow Generator", frameGraph, scene);
            }
            case "CascadedShadowGeneratorBlock": {
                return new NodeRenderGraphCascadedShadowGeneratorBlock("Cascaded Shadow Generator", frameGraph, scene);
            }
            case "GlowLayerBlock": {
                return new NodeRenderGraphGlowLayerBlock("Glow Layer", frameGraph, scene);
            }
            case "HighlightLayerBlock": {
                return new NodeRenderGraphHighlightLayerBlock("Highlight Layer", frameGraph, scene);
            }
            case "SSRBlock": {
                return new NodeRenderGraphSSRPostProcessBlock("SSR", frameGraph, scene);
            }
            case "AnaglyphBlock": {
                return new NodeRenderGraphAnaglyphPostProcessBlock("Anaglyph", frameGraph, scene);
            }
            case "ChromaticAberrationBlock": {
                return new NodeRenderGraphChromaticAberrationPostProcessBlock("Chromatic Aberration", frameGraph, scene);
            }
            case "ImageProcessingBlock": {
                return new NodeRenderGraphImageProcessingPostProcessBlock("Image Processing", frameGraph, scene);
            }
            case "FXAABlock": {
                return new NodeRenderGraphFXAAPostProcessBlock("FXAA", frameGraph, scene);
            }
            case "GrainBlock": {
                return new NodeRenderGraphGrainPostProcessBlock("Grain", frameGraph, scene);
            }
            case "MotionBlurBlock": {
                return new NodeRenderGraphMotionBlurPostProcessBlock("Motion Blur", frameGraph, scene);
            }
            case "ConvolutionBlock": {
                return new NodeRenderGraphConvolutionPostProcessBlock("Convolution", frameGraph, scene);
            }
            case "SharpenBlock": {
                return new NodeRenderGraphSharpenPostProcessBlock("Sharpen", frameGraph, scene);
            }
            case "ScreenSpaceCurvatureBlock": {
                return new NodeRenderGraphScreenSpaceCurvaturePostProcessBlock("Screen Space Curvature", frameGraph, scene);
            }
            case "ColorCorrectionBlock": {
                return new NodeRenderGraphColorCorrectionPostProcessBlock("Color Correction", frameGraph, scene, "https://assets.babylonjs.com/textures/co.png");
            }
            case "FilterBlock": {
                return new NodeRenderGraphFilterPostProcessBlock("Filter", frameGraph, scene);
            }
            case "TonemapBlock": {
                return new NodeRenderGraphTonemapPostProcessBlock("Tonemap", frameGraph, scene);
            }
            case "SSAO2Block": {
                return new NodeRenderGraphSSAO2PostProcessBlock("SSAO", frameGraph, scene);
            }
            case "ComputeShaderBlock": {
                return new NodeRenderGraphComputeShaderBlock("Compute Shader", frameGraph, scene);
            }
            case "VolumetricLightingBlock": {
                return new NodeRenderGraphVolumetricLightingBlock("Volumetric Lighting", frameGraph, scene);
            }
            case "LightingVolumeBlock": {
                return new NodeRenderGraphLightingVolumeBlock("Lighting Volume", frameGraph, scene);
            }
            case "SelectionOutlineLayerBlock": {
                return new NodeRenderGraphSelectionOutlineLayerBlock("Selection Outline Layer", frameGraph, scene);
            }
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeRenderGraphBlockConnectionPointTypes) {
        let color = "#964848";
        switch (type) {
            case NodeRenderGraphBlockConnectionPointTypes.ObjectList:
                color = "#84995c";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.Camera:
                color = "#e24975";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.Texture:
                color = "#f28e0a";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer:
                color = "#51dcc5";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment:
                color = "#51e5c4";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment:
                color = "#51e593";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth:
            case NodeRenderGraphBlockConnectionPointTypes.TextureNormalizedViewDepth:
                color = "#51e566";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal:
                color = "#7ee551";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo:
                color = "#b9e551";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity:
                color = "#e5af51";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition:
                color = "#e58551";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureVelocity:
                color = "#e55151";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth:
                color = "#e55185";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition:
                color = "#e551a8";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal:
                color = "#e551d5";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity:
                color = "#c451e5";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.ResourceContainer:
                color = "#adad92";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator:
                color = "#495e77";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.ShadowLight:
                color = "#e08e4b";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.BasedOnInput:
                color = "#f28e0a"; // Used by the teleport blocks
                break;
            case NodeRenderGraphBlockConnectionPointTypes.AutoDetect: // Used by the elbow block
                color = "#880000";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.Object:
                color = "#6174FA";
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
            case "TextureViewDepth":
                return NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth;
            case "TextureNormalizedViewDepth":
                return NodeRenderGraphBlockConnectionPointTypes.TextureNormalizedViewDepth;
            case "TextureNormal":
                return NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal;
            case "TextureAlbedo":
                return NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo;
            case "TextureReflectivity":
                return NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity;
            case "TexturePosition":
                return NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition;
            case "TextureVelocity":
                return NodeRenderGraphBlockConnectionPointTypes.TextureVelocity;
            case "TextureScreenDepth":
                return NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth;
            case "TextureLocalPosition":
                return NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition;
            case "TextureWorldNormal":
                return NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal;
            case "TextureLinearVelocity":
                return NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity;
            case "ResourceContainer":
                return NodeRenderGraphBlockConnectionPointTypes.ResourceContainer;
            case "ShadowGenerator":
                return NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator;
            case "ShadowLight":
                return NodeRenderGraphBlockConnectionPointTypes.ShadowLight;
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
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth:
                return "TextureViewDepth";
            case NodeRenderGraphBlockConnectionPointTypes.TextureNormalizedViewDepth:
                return "TextureNormalizedViewDepth";
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal:
                return "TextureNormal";
            case NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo:
                return "TextureAlbedo";
            case NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity:
                return "TextureReflectivity";
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition:
                return "TexturePosition";
            case NodeRenderGraphBlockConnectionPointTypes.TextureVelocity:
                return "TextureVelocity";
            case NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth:
                return "TextureScreenDepth";
            case NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition:
                return "TextureLocalPosition";
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal:
                return "TextureWorldNormal";
            case NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity:
                return "TextureLinearVelocity";
            case NodeRenderGraphBlockConnectionPointTypes.ResourceContainer:
                return "ResourceContainer";
            case NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator:
                return "ShadowGenerator";
            case NodeRenderGraphBlockConnectionPointTypes.ShadowLight:
                return "ShadowLight";
        }

        return "";
    }
}
