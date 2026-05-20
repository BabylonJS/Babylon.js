// Layers blocks
import { RegisterGlowLayerBlock } from "./Layers/glowLayerBlock.pure";
import { RegisterHighlightLayerBlock } from "./Layers/highlightLayerBlock.pure";
import { RegisterSelectionOutlineLayerBlock } from "./Layers/selectionOutlineLayerBlock.pure";

// PostProcesses blocks
import { RegisterAnaglyphPostProcessBlock } from "./PostProcesses/anaglyphPostProcessBlock.pure";
import { RegisterBlackAndWhitePostProcessBlock } from "./PostProcesses/blackAndWhitePostProcessBlock.pure";
import { RegisterBloomPostProcessBlock } from "./PostProcesses/bloomPostProcessBlock.pure";
import { RegisterBlurPostProcessBlock } from "./PostProcesses/blurPostProcessBlock.pure";
import { RegisterChromaticAberrationPostProcessBlock } from "./PostProcesses/chromaticAberrationPostProcessBlock.pure";
import { RegisterCircleOfConfusionPostProcessBlock } from "./PostProcesses/circleOfConfusionPostProcessBlock.pure";
import { RegisterColorCorrectionPostProcessBlock } from "./PostProcesses/colorCorrectionPostProcessBlock.pure";
import { RegisterConvolutionPostProcessBlock } from "./PostProcesses/convolutionPostProcessBlock.pure";
import { RegisterDepthOfFieldPostProcessBlock } from "./PostProcesses/depthOfFieldPostProcessBlock.pure";
import { RegisterExtractHighlightsPostProcessBlock } from "./PostProcesses/extractHighlightsPostProcessBlock.pure";
import { RegisterFilterPostProcessBlock } from "./PostProcesses/filterPostProcessBlock.pure";
import { RegisterFxaaPostProcessBlock } from "./PostProcesses/fxaaPostProcessBlock.pure";
import { RegisterGrainPostProcessBlock } from "./PostProcesses/grainPostProcessBlock.pure";
import { RegisterImageProcessingPostProcessBlock } from "./PostProcesses/imageProcessingPostProcessBlock.pure";
import { RegisterMotionBlurPostProcessBlock } from "./PostProcesses/motionBlurPostProcessBlock.pure";
import { RegisterPassPostProcessBlock } from "./PostProcesses/passPostProcessBlock.pure";
import { RegisterScreenSpaceCurvaturePostProcessBlock } from "./PostProcesses/screenSpaceCurvaturePostProcessBlock.pure";
import { RegisterSharpenPostProcessBlock } from "./PostProcesses/sharpenPostProcessBlock.pure";
import { RegisterSsao2PostProcessBlock } from "./PostProcesses/ssao2PostProcessBlock.pure";
import { RegisterSsrPostProcessBlock } from "./PostProcesses/ssrPostProcessBlock.pure";
import { RegisterTaaPostProcessBlock } from "./PostProcesses/taaPostProcessBlock.pure";
import { RegisterTonemapPostProcessBlock } from "./PostProcesses/tonemapPostProcessBlock.pure";
import { RegisterVolumetricLightingBlock } from "./PostProcesses/volumetricLightingBlock.pure";

// Rendering blocks
import { RegisterCsmShadowGeneratorBlock } from "./Rendering/csmShadowGeneratorBlock.pure";
import { RegisterGeometryRendererBlock } from "./Rendering/geometryRendererBlock.pure";
import { RegisterObjectRendererBlock } from "./Rendering/objectRendererBlock.pure";
import { RegisterShadowGeneratorBlock } from "./Rendering/shadowGeneratorBlock.pure";
import { RegisterUtilityLayerRendererBlock } from "./Rendering/utilityLayerRendererBlock.pure";

// Teleport blocks
import { RegisterFrameGraphNodeBlocksTeleportTeleportInBlock } from "./Teleport/teleportInBlock.pure";
import { RegisterFrameGraphNodeBlocksTeleportTeleportOutBlock } from "./Teleport/teleportOutBlock.pure";

// Textures blocks
import { RegisterClearBlock } from "./Textures/clearBlock.pure";
import { RegisterCopyTextureBlock } from "./Textures/copyTextureBlock.pure";
import { RegisterGenerateMipmapsBlock } from "./Textures/generateMipmapsBlock.pure";

// Root-level blocks
import { RegisterComputeShaderBlock } from "./computeShaderBlock.pure";
import { RegisterCullObjectsBlock } from "./cullObjectsBlock.pure";
import { RegisterFrameGraphNodeBlocksElbowBlock } from "./elbowBlock.pure";
import { RegisterExecuteBlock } from "./executeBlock.pure";
import { RegisterFrameGraphNodeBlocksInputBlock } from "./inputBlock.pure";
import { RegisterLightingVolumeBlock } from "./lightingVolumeBlock.pure";
import { RegisterOutputBlock } from "./outputBlock.pure";
import { RegisterResourceContainerBlock } from "./resourceContainerBlock.pure";

/**
 * Registers all layer node render graph blocks for deserialization.
 */
export function RegisterNodeRenderGraphLayersBlocks(): void {
    RegisterGlowLayerBlock();
    RegisterHighlightLayerBlock();
    RegisterSelectionOutlineLayerBlock();
}

/**
 * Registers all post-process node render graph blocks for deserialization.
 */
export function RegisterNodeRenderGraphPostProcessesBlocks(): void {
    RegisterAnaglyphPostProcessBlock();
    RegisterBlackAndWhitePostProcessBlock();
    RegisterBloomPostProcessBlock();
    RegisterBlurPostProcessBlock();
    RegisterChromaticAberrationPostProcessBlock();
    RegisterCircleOfConfusionPostProcessBlock();
    RegisterColorCorrectionPostProcessBlock();
    RegisterConvolutionPostProcessBlock();
    RegisterDepthOfFieldPostProcessBlock();
    RegisterExtractHighlightsPostProcessBlock();
    RegisterFilterPostProcessBlock();
    RegisterFxaaPostProcessBlock();
    RegisterGrainPostProcessBlock();
    RegisterImageProcessingPostProcessBlock();
    RegisterMotionBlurPostProcessBlock();
    RegisterPassPostProcessBlock();
    RegisterScreenSpaceCurvaturePostProcessBlock();
    RegisterSharpenPostProcessBlock();
    RegisterSsao2PostProcessBlock();
    RegisterSsrPostProcessBlock();
    RegisterTaaPostProcessBlock();
    RegisterTonemapPostProcessBlock();
    RegisterVolumetricLightingBlock();
}

/**
 * Registers all rendering node render graph blocks for deserialization.
 */
export function RegisterNodeRenderGraphRenderingBlocks(): void {
    RegisterCsmShadowGeneratorBlock();
    RegisterGeometryRendererBlock();
    RegisterObjectRendererBlock();
    RegisterShadowGeneratorBlock();
    RegisterUtilityLayerRendererBlock();
}

/**
 * Registers all teleport node render graph blocks for deserialization.
 */
export function RegisterNodeRenderGraphTeleportBlocks(): void {
    RegisterFrameGraphNodeBlocksTeleportTeleportInBlock();
    RegisterFrameGraphNodeBlocksTeleportTeleportOutBlock();
}

/**
 * Registers all texture node render graph blocks for deserialization.
 */
export function RegisterNodeRenderGraphTexturesBlocks(): void {
    RegisterClearBlock();
    RegisterCopyTextureBlock();
    RegisterGenerateMipmapsBlock();
}

/**
 * Registers all core (root-level) node render graph blocks for deserialization.
 */
export function RegisterNodeRenderGraphCoreBlocks(): void {
    RegisterComputeShaderBlock();
    RegisterCullObjectsBlock();
    RegisterFrameGraphNodeBlocksElbowBlock();
    RegisterExecuteBlock();
    RegisterFrameGraphNodeBlocksInputBlock();
    RegisterLightingVolumeBlock();
    RegisterOutputBlock();
    RegisterResourceContainerBlock();
}

let _Registered = false;
/**
 * Registers all node render graph blocks for deserialization.
 * Call this function when you need to deserialize node render graphs from JSON/snippets.
 *
 * This is the tree-shakeable replacement for:
 * ```ts
 * import "@babylonjs/core/FrameGraph/Node/Blocks/index";
 * ```
 */
export function RegisterAllNodeRenderGraphBlocks(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterNodeRenderGraphLayersBlocks();
    RegisterNodeRenderGraphPostProcessesBlocks();
    RegisterNodeRenderGraphRenderingBlocks();
    RegisterNodeRenderGraphTeleportBlocks();
    RegisterNodeRenderGraphTexturesBlocks();
    RegisterNodeRenderGraphCoreBlocks();
}
