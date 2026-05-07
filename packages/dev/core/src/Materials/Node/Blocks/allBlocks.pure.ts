// Vertex blocks
import { registerVertexOutputBlock } from "./Vertex/vertexOutputBlock.pure";
import { registerBonesBlock } from "./Vertex/bonesBlock.pure";
import { registerInstancesBlock } from "./Vertex/instancesBlock.pure";
import { registerMorphTargetsBlock } from "./Vertex/morphTargetsBlock.pure";
import { registerLightInformationBlock } from "./Vertex/lightInformationBlock.pure";

// Fragment blocks
import { registerFragmentOutputBlock } from "./Fragment/fragmentOutputBlock.pure";
import { registerSmartFilterFragmentOutputBlock } from "./Fragment/smartFilterFragmentOutputBlock.pure";
import { registerImageProcessingBlock } from "./Fragment/imageProcessingBlock.pure";
import { registerPerturbNormalBlock } from "./Fragment/perturbNormalBlock.pure";
import { registerDiscardBlock } from "./Fragment/discardBlock.pure";
import { registerFrontFacingBlock } from "./Fragment/frontFacingBlock.pure";
import { registerDerivativeBlock } from "./Fragment/derivativeBlock.pure";
import { registerFragCoordBlock } from "./Fragment/fragCoordBlock.pure";
import { registerScreenSizeBlock } from "./Fragment/screenSizeBlock.pure";
import { registerScreenSpaceBlock } from "./Fragment/screenSpaceBlock.pure";
import { registerTwirlBlock } from "./Fragment/twirlBlock.pure";
import { registerTBNBlock } from "./Fragment/TBNBlock.pure";
import { registerHeightToNormalBlock } from "./Fragment/heightToNormalBlock.pure";
import { registerFragDepthBlock } from "./Fragment/fragDepthBlock.pure";
import { registerShadowMapBlock } from "./Fragment/shadowMapBlock.pure";
import { registerPrePassOutputBlock } from "./Fragment/prePassOutputBlock.pure";
import { registerAmbientOcclusionBlock } from "./Fragment/ambientOcclusionBlock.pure";

// Dual blocks
import { registerFogBlock } from "./Dual/fogBlock.pure";
import { registerLightBlock } from "./Dual/lightBlock.pure";
import { registerTextureBlock } from "./Dual/textureBlock.pure";
import { registerReflectionTextureBaseBlock } from "./Dual/reflectionTextureBaseBlock.pure";
import { registerReflectionTextureBlock } from "./Dual/reflectionTextureBlock.pure";
import { registerCurrentScreenBlock } from "./Dual/currentScreenBlock.pure";
import { registerSceneDepthBlock } from "./Dual/sceneDepthBlock.pure";
import { registerImageSourceBlock } from "./Dual/imageSourceBlock.pure";
import { registerDepthSourceBlock } from "./Dual/depthSourceBlock.pure";
import { registerClipPlanesBlock } from "./Dual/clipPlanesBlock.pure";
import { registerSmartFilterTextureBlock } from "./Dual/smartFilterTextureBlock.pure";

// Input blocks
import { registerMaterialsNodeBlocksInputInputBlock } from "./Input/inputBlock.pure";
import { registerPrePassTextureBlock } from "./Input/prePassTextureBlock.pure";

// Teleport blocks
import { registerMaterialsNodeBlocksTeleportTeleportInBlock } from "./Teleport/teleportInBlock.pure";
import { registerMaterialsNodeBlocksTeleportTeleportOutBlock } from "./Teleport/teleportOutBlock.pure";

// PBR blocks
import { registerPbrMetallicRoughnessBlock } from "./PBR/pbrMetallicRoughnessBlock.pure";
import { registerSheenBlock } from "./PBR/sheenBlock.pure";
import { registerAnisotropyBlock } from "./PBR/anisotropyBlock.pure";
import { registerReflectionBlock } from "./PBR/reflectionBlock.pure";
import { registerClearCoatBlock } from "./PBR/clearCoatBlock.pure";
import { registerRefractionBlock } from "./PBR/refractionBlock.pure";
import { registerSubSurfaceBlock } from "./PBR/subSurfaceBlock.pure";
import { registerIridescenceBlock } from "./PBR/iridescenceBlock.pure";

// Particle blocks
import { registerParticleTextureBlock } from "./Particle/particleTextureBlock.pure";
import { registerParticleRampGradientBlock } from "./Particle/particleRampGradientBlock.pure";
import { registerParticleBlendMultiplyBlock } from "./Particle/particleBlendMultiplyBlock.pure";

// Gaussian Splatting blocks
import { registerGaussianSplattingBlock } from "./GaussianSplatting/gaussianSplattingBlock.pure";
import { registerSplatReaderBlock } from "./GaussianSplatting/splatReaderBlock.pure";
import { registerGaussianBlock } from "./GaussianSplatting/gaussianBlock.pure";

// Root-level blocks
import { registerMultiplyBlock } from "./multiplyBlock.pure";
import { registerAddBlock } from "./addBlock.pure";
import { registerScaleBlock } from "./scaleBlock.pure";
import { registerClampBlock } from "./clampBlock.pure";
import { registerCrossBlock } from "./crossBlock.pure";
import { registerCustomBlock } from "./customBlock.pure";
import { registerDotBlock } from "./dotBlock.pure";
import { registerTransformBlock } from "./transformBlock.pure";
import { registerRemapBlock } from "./remapBlock.pure";
import { registerNormalizeBlock } from "./normalizeBlock.pure";
import { registerTrigonometryBlock } from "./trigonometryBlock.pure";
import { registerColorMergerBlock } from "./colorMergerBlock.pure";
import { registerVectorMergerBlock } from "./vectorMergerBlock.pure";
import { registerColorSplitterBlock } from "./colorSplitterBlock.pure";
import { registerVectorSplitterBlock } from "./vectorSplitterBlock.pure";
import { registerLerpBlock } from "./lerpBlock.pure";
import { registerDivideBlock } from "./divideBlock.pure";
import { registerSubtractBlock } from "./subtractBlock.pure";
import { registerStepBlock } from "./stepBlock.pure";
import { registerOneMinusBlock } from "./oneMinusBlock.pure";
import { registerViewDirectionBlock } from "./viewDirectionBlock.pure";
import { registerFresnelBlock } from "./fresnelBlock.pure";
import { registerMaxBlock } from "./maxBlock.pure";
import { registerMinBlock } from "./minBlock.pure";
import { registerDistanceBlock } from "./distanceBlock.pure";
import { registerLengthBlock } from "./lengthBlock.pure";
import { registerNegateBlock } from "./negateBlock.pure";
import { registerPowBlock } from "./powBlock.pure";
import { registerRandomNumberBlock } from "./randomNumberBlock.pure";
import { registerArcTan2Block } from "./arcTan2Block.pure";
import { registerSmoothStepBlock } from "./smoothStepBlock.pure";
import { registerReciprocalBlock } from "./reciprocalBlock.pure";
import { registerReplaceColorBlock } from "./replaceColorBlock.pure";
import { registerPosterizeBlock } from "./posterizeBlock.pure";
import { registerWaveBlock } from "./waveBlock.pure";
import { registerGradientBlock } from "./gradientBlock.pure";
import { registerNLerpBlock } from "./nLerpBlock.pure";
import { registerWorleyNoise3DBlock } from "./worleyNoise3DBlock.pure";
import { registerSimplexPerlin3DBlock } from "./simplexPerlin3DBlock.pure";
import { registerNormalBlendBlock } from "./normalBlendBlock.pure";
import { registerRotate2dBlock } from "./rotate2dBlock.pure";
import { registerReflectBlock } from "./reflectBlock.pure";
import { registerRefractBlock } from "./refractBlock.pure";
import { registerDesaturateBlock } from "./desaturateBlock.pure";
import { registerModBlock } from "./modBlock.pure";
import { registerMatrixBuilderBlock } from "./matrixBuilderBlock.pure";
import { registerConditionalBlock } from "./conditionalBlock.pure";
import { registerCloudBlock } from "./cloudBlock.pure";
import { registerVoronoiNoiseBlock } from "./voronoiNoiseBlock.pure";
import { registerMaterialsNodeBlocksElbowBlock } from "./elbowBlock.pure";
import { registerTriPlanarBlock } from "./triPlanarBlock.pure";
import { registerBiPlanarBlock } from "./biPlanarBlock.pure";
import { registerMatrixDeterminantBlock } from "./matrixDeterminantBlock.pure";
import { registerMatrixTransposeBlock } from "./matrixTransposeBlock.pure";
import { registerMeshAttributeExistsBlock } from "./meshAttributeExistsBlock.pure";
import { registerCurveBlock } from "./curveBlock.pure";
import { registerColorConverterBlock } from "./colorConverterBlock.pure";
import { registerLoopBlock } from "./loopBlock.pure";
import { registerStorageReadBlock } from "./storageReadBlock.pure";
import { registerStorageWriteBlock } from "./storageWriteBlock.pure";
import { registerMatrixSplitterBlock } from "./matrixSplitterBlock.pure";
import { registerMaterialsNodeBlocksDebugBlock } from "./debugBlock.pure";
import { registerPannerBlock } from "./pannerBlock.pure";

/**
 * Registers all vertex shader node material blocks for deserialization.
 * Call this if you only need vertex blocks to be deserializable.
 */
export function registerNodeMaterialVertexBlocks(): void {
    registerVertexOutputBlock();
    registerBonesBlock();
    registerInstancesBlock();
    registerMorphTargetsBlock();
    registerLightInformationBlock();
}

/**
 * Registers all fragment shader node material blocks for deserialization.
 * Call this if you only need fragment blocks to be deserializable.
 */
export function registerNodeMaterialFragmentBlocks(): void {
    registerFragmentOutputBlock();
    registerSmartFilterFragmentOutputBlock();
    registerImageProcessingBlock();
    registerPerturbNormalBlock();
    registerDiscardBlock();
    registerFrontFacingBlock();
    registerDerivativeBlock();
    registerFragCoordBlock();
    registerScreenSizeBlock();
    registerScreenSpaceBlock();
    registerTwirlBlock();
    registerTBNBlock();
    registerHeightToNormalBlock();
    registerFragDepthBlock();
    registerShadowMapBlock();
    registerPrePassOutputBlock();
    registerAmbientOcclusionBlock();
}

/**
 * Registers all dual (vertex + fragment) node material blocks for deserialization.
 * Call this if you only need dual blocks to be deserializable.
 */
export function registerNodeMaterialDualBlocks(): void {
    registerFogBlock();
    registerLightBlock();
    registerTextureBlock();
    registerReflectionTextureBaseBlock();
    registerReflectionTextureBlock();
    registerCurrentScreenBlock();
    registerSceneDepthBlock();
    registerImageSourceBlock();
    registerDepthSourceBlock();
    registerClipPlanesBlock();
    registerSmartFilterTextureBlock();
}

/**
 * Registers all input node material blocks for deserialization.
 * Call this if you only need input blocks to be deserializable.
 */
export function registerNodeMaterialInputBlocks(): void {
    registerMaterialsNodeBlocksInputInputBlock();
    registerPrePassTextureBlock();
}

/**
 * Registers all teleport node material blocks for deserialization.
 * Call this if you only need teleport blocks to be deserializable.
 */
export function registerNodeMaterialTeleportBlocks(): void {
    registerMaterialsNodeBlocksTeleportTeleportInBlock();
    registerMaterialsNodeBlocksTeleportTeleportOutBlock();
}

/**
 * Registers all PBR node material blocks for deserialization.
 * Call this if you only need PBR blocks to be deserializable.
 */
export function registerNodeMaterialPBRBlocks(): void {
    registerPbrMetallicRoughnessBlock();
    registerSheenBlock();
    registerAnisotropyBlock();
    registerReflectionBlock();
    registerClearCoatBlock();
    registerRefractionBlock();
    registerSubSurfaceBlock();
    registerIridescenceBlock();
}

/**
 * Registers all particle node material blocks for deserialization.
 * Call this if you only need particle blocks to be deserializable.
 */
export function registerNodeMaterialParticleBlocks(): void {
    registerParticleTextureBlock();
    registerParticleRampGradientBlock();
    registerParticleBlendMultiplyBlock();
}

/**
 * Registers all Gaussian splatting node material blocks for deserialization.
 * Call this if you only need Gaussian splatting blocks to be deserializable.
 */
export function registerNodeMaterialGaussianSplattingBlocks(): void {
    registerGaussianSplattingBlock();
    registerSplatReaderBlock();
    registerGaussianBlock();
}

/**
 * Registers all root-level (math/utility) node material blocks for deserialization.
 * Call this if you only need math and utility blocks to be deserializable.
 */
export function registerNodeMaterialMathBlocks(): void {
    registerMultiplyBlock();
    registerAddBlock();
    registerScaleBlock();
    registerClampBlock();
    registerCrossBlock();
    registerCustomBlock();
    registerDotBlock();
    registerTransformBlock();
    registerRemapBlock();
    registerNormalizeBlock();
    registerTrigonometryBlock();
    registerColorMergerBlock();
    registerVectorMergerBlock();
    registerColorSplitterBlock();
    registerVectorSplitterBlock();
    registerLerpBlock();
    registerDivideBlock();
    registerSubtractBlock();
    registerStepBlock();
    registerOneMinusBlock();
    registerViewDirectionBlock();
    registerFresnelBlock();
    registerMaxBlock();
    registerMinBlock();
    registerDistanceBlock();
    registerLengthBlock();
    registerNegateBlock();
    registerPowBlock();
    registerRandomNumberBlock();
    registerArcTan2Block();
    registerSmoothStepBlock();
    registerReciprocalBlock();
    registerReplaceColorBlock();
    registerPosterizeBlock();
    registerWaveBlock();
    registerGradientBlock();
    registerNLerpBlock();
    registerWorleyNoise3DBlock();
    registerSimplexPerlin3DBlock();
    registerNormalBlendBlock();
    registerRotate2dBlock();
    registerReflectBlock();
    registerRefractBlock();
    registerDesaturateBlock();
    registerModBlock();
    registerMatrixBuilderBlock();
    registerConditionalBlock();
    registerCloudBlock();
    registerVoronoiNoiseBlock();
    registerMaterialsNodeBlocksElbowBlock();
    registerTriPlanarBlock();
    registerBiPlanarBlock();
    registerMatrixDeterminantBlock();
    registerMatrixTransposeBlock();
    registerMeshAttributeExistsBlock();
    registerCurveBlock();
    registerColorConverterBlock();
    registerLoopBlock();
    registerStorageReadBlock();
    registerStorageWriteBlock();
    registerMatrixSplitterBlock();
    registerMaterialsNodeBlocksDebugBlock();
    registerPannerBlock();
}

let _registered = false;
/**
 * Registers all node material blocks for deserialization.
 * Call this function when you need to deserialize node materials from JSON/snippets
 * and cannot know at build time which blocks will be used.
 *
 * This is the tree-shakeable replacement for:
 * ```ts
 * import "@babylonjs/core/Materials/Node/Blocks/index";
 * ```
 *
 * For granular control, use per-category functions instead:
 * - {@link registerNodeMaterialVertexBlocks}
 * - {@link registerNodeMaterialFragmentBlocks}
 * - {@link registerNodeMaterialDualBlocks}
 * - {@link registerNodeMaterialInputBlocks}
 * - {@link registerNodeMaterialTeleportBlocks}
 * - {@link registerNodeMaterialPBRBlocks}
 * - {@link registerNodeMaterialParticleBlocks}
 * - {@link registerNodeMaterialGaussianSplattingBlocks}
 * - {@link registerNodeMaterialMathBlocks}
 */
export function registerAllNodeMaterialBlocks(): void {
    if (_registered) return;
    _registered = true;

    registerNodeMaterialVertexBlocks();
    registerNodeMaterialFragmentBlocks();
    registerNodeMaterialDualBlocks();
    registerNodeMaterialInputBlocks();
    registerNodeMaterialTeleportBlocks();
    registerNodeMaterialPBRBlocks();
    registerNodeMaterialParticleBlocks();
    registerNodeMaterialGaussianSplattingBlocks();
    registerNodeMaterialMathBlocks();
}
