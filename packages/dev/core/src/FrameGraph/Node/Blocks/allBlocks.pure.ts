// Layers blocks
import { registerGlowLayerBlock } from "./Layers/glowLayerBlock.pure";
import { registerHighlightLayerBlock } from "./Layers/highlightLayerBlock.pure";
import { registerSelectionOutlineLayerBlock } from "./Layers/selectionOutlineLayerBlock.pure";

// PostProcesses blocks
import { registerAnaglyphPostProcessBlock } from "./PostProcesses/anaglyphPostProcessBlock.pure";
import { registerBlackAndWhitePostProcessBlock } from "./PostProcesses/blackAndWhitePostProcessBlock.pure";
import { registerBloomPostProcessBlock } from "./PostProcesses/bloomPostProcessBlock.pure";
import { registerBlurPostProcessBlock } from "./PostProcesses/blurPostProcessBlock.pure";
import { registerChromaticAberrationPostProcessBlock } from "./PostProcesses/chromaticAberrationPostProcessBlock.pure";
import { registerCircleOfConfusionPostProcessBlock } from "./PostProcesses/circleOfConfusionPostProcessBlock.pure";
import { registerColorCorrectionPostProcessBlock } from "./PostProcesses/colorCorrectionPostProcessBlock.pure";
import { registerConvolutionPostProcessBlock } from "./PostProcesses/convolutionPostProcessBlock.pure";
import { registerDepthOfFieldPostProcessBlock } from "./PostProcesses/depthOfFieldPostProcessBlock.pure";
import { registerExtractHighlightsPostProcessBlock } from "./PostProcesses/extractHighlightsPostProcessBlock.pure";
import { registerFilterPostProcessBlock } from "./PostProcesses/filterPostProcessBlock.pure";
import { registerFxaaPostProcessBlock } from "./PostProcesses/fxaaPostProcessBlock.pure";
import { registerGrainPostProcessBlock } from "./PostProcesses/grainPostProcessBlock.pure";
import { registerImageProcessingPostProcessBlock } from "./PostProcesses/imageProcessingPostProcessBlock.pure";
import { registerMotionBlurPostProcessBlock } from "./PostProcesses/motionBlurPostProcessBlock.pure";
import { registerPassPostProcessBlock } from "./PostProcesses/passPostProcessBlock.pure";
import { registerScreenSpaceCurvaturePostProcessBlock } from "./PostProcesses/screenSpaceCurvaturePostProcessBlock.pure";
import { registerSharpenPostProcessBlock } from "./PostProcesses/sharpenPostProcessBlock.pure";
import { registerSsao2PostProcessBlock } from "./PostProcesses/ssao2PostProcessBlock.pure";
import { registerSsrPostProcessBlock } from "./PostProcesses/ssrPostProcessBlock.pure";
import { registerTaaPostProcessBlock } from "./PostProcesses/taaPostProcessBlock.pure";
import { registerTonemapPostProcessBlock } from "./PostProcesses/tonemapPostProcessBlock.pure";
import { registerVolumetricLightingBlock } from "./PostProcesses/volumetricLightingBlock.pure";

// Rendering blocks
import { registerCsmShadowGeneratorBlock } from "./Rendering/csmShadowGeneratorBlock.pure";
import { registerGeometryRendererBlock } from "./Rendering/geometryRendererBlock.pure";
import { registerObjectRendererBlock } from "./Rendering/objectRendererBlock.pure";
import { registerShadowGeneratorBlock } from "./Rendering/shadowGeneratorBlock.pure";
import { registerUtilityLayerRendererBlock } from "./Rendering/utilityLayerRendererBlock.pure";

// Teleport blocks
import { registerFrameGraphNodeBlocksTeleportTeleportInBlock } from "./Teleport/teleportInBlock.pure";
import { registerFrameGraphNodeBlocksTeleportTeleportOutBlock } from "./Teleport/teleportOutBlock.pure";

// Textures blocks
import { registerClearBlock } from "./Textures/clearBlock.pure";
import { registerCopyTextureBlock } from "./Textures/copyTextureBlock.pure";
import { registerGenerateMipmapsBlock } from "./Textures/generateMipmapsBlock.pure";

// Root-level blocks
import { registerComputeShaderBlock } from "./computeShaderBlock.pure";
import { registerCullObjectsBlock } from "./cullObjectsBlock.pure";
import { registerFrameGraphNodeBlocksElbowBlock } from "./elbowBlock.pure";
import { registerExecuteBlock } from "./executeBlock.pure";
import { registerFrameGraphNodeBlocksInputBlock } from "./inputBlock.pure";
import { registerLightingVolumeBlock } from "./lightingVolumeBlock.pure";
import { registerOutputBlock } from "./outputBlock.pure";
import { registerResourceContainerBlock } from "./resourceContainerBlock.pure";

/**
 * Registers all layer node render graph blocks for deserialization.
 */
export function registerNodeRenderGraphLayersBlocks(): void {
    registerGlowLayerBlock();
    registerHighlightLayerBlock();
    registerSelectionOutlineLayerBlock();
}

/**
 * Registers all post-process node render graph blocks for deserialization.
 */
export function registerNodeRenderGraphPostProcessesBlocks(): void {
    registerAnaglyphPostProcessBlock();
    registerBlackAndWhitePostProcessBlock();
    registerBloomPostProcessBlock();
    registerBlurPostProcessBlock();
    registerChromaticAberrationPostProcessBlock();
    registerCircleOfConfusionPostProcessBlock();
    registerColorCorrectionPostProcessBlock();
    registerConvolutionPostProcessBlock();
    registerDepthOfFieldPostProcessBlock();
    registerExtractHighlightsPostProcessBlock();
    registerFilterPostProcessBlock();
    registerFxaaPostProcessBlock();
    registerGrainPostProcessBlock();
    registerImageProcessingPostProcessBlock();
    registerMotionBlurPostProcessBlock();
    registerPassPostProcessBlock();
    registerScreenSpaceCurvaturePostProcessBlock();
    registerSharpenPostProcessBlock();
    registerSsao2PostProcessBlock();
    registerSsrPostProcessBlock();
    registerTaaPostProcessBlock();
    registerTonemapPostProcessBlock();
    registerVolumetricLightingBlock();
}

/**
 * Registers all rendering node render graph blocks for deserialization.
 */
export function registerNodeRenderGraphRenderingBlocks(): void {
    registerCsmShadowGeneratorBlock();
    registerGeometryRendererBlock();
    registerObjectRendererBlock();
    registerShadowGeneratorBlock();
    registerUtilityLayerRendererBlock();
}

/**
 * Registers all teleport node render graph blocks for deserialization.
 */
export function registerNodeRenderGraphTeleportBlocks(): void {
    registerFrameGraphNodeBlocksTeleportTeleportInBlock();
    registerFrameGraphNodeBlocksTeleportTeleportOutBlock();
}

/**
 * Registers all texture node render graph blocks for deserialization.
 */
export function registerNodeRenderGraphTexturesBlocks(): void {
    registerClearBlock();
    registerCopyTextureBlock();
    registerGenerateMipmapsBlock();
}

/**
 * Registers all core (root-level) node render graph blocks for deserialization.
 */
export function registerNodeRenderGraphCoreBlocks(): void {
    registerComputeShaderBlock();
    registerCullObjectsBlock();
    registerFrameGraphNodeBlocksElbowBlock();
    registerExecuteBlock();
    registerFrameGraphNodeBlocksInputBlock();
    registerLightingVolumeBlock();
    registerOutputBlock();
    registerResourceContainerBlock();
}

let _registered = false;
/**
 * Registers all node render graph blocks for deserialization.
 * Call this function when you need to deserialize node render graphs from JSON/snippets.
 *
 * This is the tree-shakeable replacement for:
 * ```ts
 * import "@babylonjs/core/FrameGraph/Node/Blocks/index";
 * ```
 */
export function registerAllNodeRenderGraphBlocks(): void {
    if (_registered) return;
    _registered = true;

    registerNodeRenderGraphLayersBlocks();
    registerNodeRenderGraphPostProcessesBlocks();
    registerNodeRenderGraphRenderingBlocks();
    registerNodeRenderGraphTeleportBlocks();
    registerNodeRenderGraphTexturesBlocks();
    registerNodeRenderGraphCoreBlocks();
}
