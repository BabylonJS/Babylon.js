// Vertex blocks
import { RegisterVertexOutputBlock } from "./Vertex/vertexOutputBlock.pure";
import { RegisterBonesBlock } from "./Vertex/bonesBlock.pure";
import { RegisterInstancesBlock } from "./Vertex/instancesBlock.pure";
import { RegisterMorphTargetsBlock } from "./Vertex/morphTargetsBlock.pure";
import { RegisterLightInformationBlock } from "./Vertex/lightInformationBlock.pure";

// Fragment blocks
import { RegisterFragmentOutputBlock } from "./Fragment/fragmentOutputBlock.pure";
import { RegisterSmartFilterFragmentOutputBlock } from "./Fragment/smartFilterFragmentOutputBlock.pure";
import { RegisterImageProcessingBlock } from "./Fragment/imageProcessingBlock.pure";
import { RegisterPerturbNormalBlock } from "./Fragment/perturbNormalBlock.pure";
import { RegisterDiscardBlock } from "./Fragment/discardBlock.pure";
import { RegisterFrontFacingBlock } from "./Fragment/frontFacingBlock.pure";
import { RegisterDerivativeBlock } from "./Fragment/derivativeBlock.pure";
import { RegisterFragCoordBlock } from "./Fragment/fragCoordBlock.pure";
import { RegisterScreenSizeBlock } from "./Fragment/screenSizeBlock.pure";
import { RegisterScreenSpaceBlock } from "./Fragment/screenSpaceBlock.pure";
import { RegisterTwirlBlock } from "./Fragment/twirlBlock.pure";
import { RegisterTBNBlock } from "./Fragment/TBNBlock.pure";
import { RegisterHeightToNormalBlock } from "./Fragment/heightToNormalBlock.pure";
import { RegisterFragDepthBlock } from "./Fragment/fragDepthBlock.pure";
import { RegisterShadowMapBlock } from "./Fragment/shadowMapBlock.pure";
import { RegisterPrePassOutputBlock } from "./Fragment/prePassOutputBlock.pure";
import { RegisterAmbientOcclusionBlock } from "./Fragment/ambientOcclusionBlock.pure";

// Dual blocks
import { RegisterFogBlock } from "./Dual/fogBlock.pure";
import { RegisterLightBlock } from "./Dual/lightBlock.pure";
import { RegisterTextureBlock } from "./Dual/textureBlock.pure";
import { RegisterReflectionTextureBaseBlock } from "./Dual/reflectionTextureBaseBlock.pure";
import { RegisterReflectionTextureBlock } from "./Dual/reflectionTextureBlock.pure";
import { RegisterCurrentScreenBlock } from "./Dual/currentScreenBlock.pure";
import { RegisterSceneDepthBlock } from "./Dual/sceneDepthBlock.pure";
import { RegisterImageSourceBlock } from "./Dual/imageSourceBlock.pure";
import { RegisterDepthSourceBlock } from "./Dual/depthSourceBlock.pure";
import { RegisterClipPlanesBlock } from "./Dual/clipPlanesBlock.pure";
import { RegisterSmartFilterTextureBlock } from "./Dual/smartFilterTextureBlock.pure";

// Input blocks
import { RegisterMaterialsNodeBlocksInputInputBlock } from "./Input/inputBlock.pure";
import { RegisterPrePassTextureBlock } from "./Input/prePassTextureBlock.pure";

// Teleport blocks
import { RegisterMaterialsNodeBlocksTeleportTeleportInBlock } from "./Teleport/teleportInBlock.pure";
import { RegisterMaterialsNodeBlocksTeleportTeleportOutBlock } from "./Teleport/teleportOutBlock.pure";

// PBR blocks
import { RegisterPbrMetallicRoughnessBlock } from "./PBR/pbrMetallicRoughnessBlock.pure";
import { RegisterSheenBlock } from "./PBR/sheenBlock.pure";
import { RegisterAnisotropyBlock } from "./PBR/anisotropyBlock.pure";
import { RegisterReflectionBlock } from "./PBR/reflectionBlock.pure";
import { RegisterClearCoatBlock } from "./PBR/clearCoatBlock.pure";
import { RegisterRefractionBlock } from "./PBR/refractionBlock.pure";
import { RegisterSubSurfaceBlock } from "./PBR/subSurfaceBlock.pure";
import { RegisterIridescenceBlock } from "./PBR/iridescenceBlock.pure";

// Particle blocks
import { RegisterParticleTextureBlock } from "./Particle/particleTextureBlock.pure";
import { RegisterParticleRampGradientBlock } from "./Particle/particleRampGradientBlock.pure";
import { RegisterParticleBlendMultiplyBlock } from "./Particle/particleBlendMultiplyBlock.pure";

// Gaussian Splatting blocks
import { RegisterGaussianSplattingBlock } from "./GaussianSplatting/gaussianSplattingBlock.pure";
import { RegisterSplatReaderBlock } from "./GaussianSplatting/splatReaderBlock.pure";
import { RegisterGaussianBlock } from "./GaussianSplatting/gaussianBlock.pure";

// Root-level blocks
import { RegisterMultiplyBlock } from "./multiplyBlock.pure";
import { RegisterAddBlock } from "./addBlock.pure";
import { RegisterScaleBlock } from "./scaleBlock.pure";
import { RegisterClampBlock } from "./clampBlock.pure";
import { RegisterCrossBlock } from "./crossBlock.pure";
import { RegisterCustomBlock } from "./customBlock.pure";
import { RegisterDotBlock } from "./dotBlock.pure";
import { RegisterTransformBlock } from "./transformBlock.pure";
import { RegisterRemapBlock } from "./remapBlock.pure";
import { RegisterNormalizeBlock } from "./normalizeBlock.pure";
import { RegisterTrigonometryBlock } from "./trigonometryBlock.pure";
import { RegisterColorMergerBlock } from "./colorMergerBlock.pure";
import { RegisterVectorMergerBlock } from "./vectorMergerBlock.pure";
import { RegisterColorSplitterBlock } from "./colorSplitterBlock.pure";
import { RegisterVectorSplitterBlock } from "./vectorSplitterBlock.pure";
import { RegisterLerpBlock } from "./lerpBlock.pure";
import { RegisterDivideBlock } from "./divideBlock.pure";
import { RegisterSubtractBlock } from "./subtractBlock.pure";
import { RegisterStepBlock } from "./stepBlock.pure";
import { RegisterOneMinusBlock } from "./oneMinusBlock.pure";
import { RegisterViewDirectionBlock } from "./viewDirectionBlock.pure";
import { RegisterFresnelBlock } from "./fresnelBlock.pure";
import { RegisterMaxBlock } from "./maxBlock.pure";
import { RegisterMinBlock } from "./minBlock.pure";
import { RegisterDistanceBlock } from "./distanceBlock.pure";
import { RegisterLengthBlock } from "./lengthBlock.pure";
import { RegisterNegateBlock } from "./negateBlock.pure";
import { RegisterPowBlock } from "./powBlock.pure";
import { RegisterRandomNumberBlock } from "./randomNumberBlock.pure";
import { RegisterArcTan2Block } from "./arcTan2Block.pure";
import { RegisterSmoothStepBlock } from "./smoothStepBlock.pure";
import { RegisterReciprocalBlock } from "./reciprocalBlock.pure";
import { RegisterReplaceColorBlock } from "./replaceColorBlock.pure";
import { RegisterPosterizeBlock } from "./posterizeBlock.pure";
import { RegisterWaveBlock } from "./waveBlock.pure";
import { RegisterGradientBlock } from "./gradientBlock.pure";
import { RegisterNLerpBlock } from "./nLerpBlock.pure";
import { RegisterWorleyNoise3DBlock } from "./worleyNoise3DBlock.pure";
import { RegisterSimplexPerlin3DBlock } from "./simplexPerlin3DBlock.pure";
import { RegisterNormalBlendBlock } from "./normalBlendBlock.pure";
import { RegisterRotate2dBlock } from "./rotate2dBlock.pure";
import { RegisterReflectBlock } from "./reflectBlock.pure";
import { RegisterRefractBlock } from "./refractBlock.pure";
import { RegisterDesaturateBlock } from "./desaturateBlock.pure";
import { RegisterModBlock } from "./modBlock.pure";
import { RegisterMatrixBuilderBlock } from "./matrixBuilderBlock.pure";
import { RegisterConditionalBlock } from "./conditionalBlock.pure";
import { RegisterCloudBlock } from "./cloudBlock.pure";
import { RegisterVoronoiNoiseBlock } from "./voronoiNoiseBlock.pure";
import { RegisterMaterialsNodeBlocksElbowBlock } from "./elbowBlock.pure";
import { RegisterTriPlanarBlock } from "./triPlanarBlock.pure";
import { RegisterBiPlanarBlock } from "./biPlanarBlock.pure";
import { RegisterMatrixDeterminantBlock } from "./matrixDeterminantBlock.pure";
import { RegisterMatrixTransposeBlock } from "./matrixTransposeBlock.pure";
import { RegisterMeshAttributeExistsBlock } from "./meshAttributeExistsBlock.pure";
import { RegisterCurveBlock } from "./curveBlock.pure";
import { RegisterColorConverterBlock } from "./colorConverterBlock.pure";
import { RegisterLoopBlock } from "./loopBlock.pure";
import { RegisterStorageReadBlock } from "./storageReadBlock.pure";
import { RegisterStorageWriteBlock } from "./storageWriteBlock.pure";
import { RegisterMatrixSplitterBlock } from "./matrixSplitterBlock.pure";
import { RegisterMaterialsNodeBlocksDebugBlock } from "./debugBlock.pure";
import { RegisterPannerBlock } from "./pannerBlock.pure";

/**
 * Registers all vertex shader node material blocks for deserialization.
 * Call this if you only need vertex blocks to be deserializable.
 */
export function RegisterNodeMaterialVertexBlocks(): void {
    RegisterVertexOutputBlock();
    RegisterBonesBlock();
    RegisterInstancesBlock();
    RegisterMorphTargetsBlock();
    RegisterLightInformationBlock();
}

/**
 * Registers all fragment shader node material blocks for deserialization.
 * Call this if you only need fragment blocks to be deserializable.
 */
export function RegisterNodeMaterialFragmentBlocks(): void {
    RegisterFragmentOutputBlock();
    RegisterSmartFilterFragmentOutputBlock();
    RegisterImageProcessingBlock();
    RegisterPerturbNormalBlock();
    RegisterDiscardBlock();
    RegisterFrontFacingBlock();
    RegisterDerivativeBlock();
    RegisterFragCoordBlock();
    RegisterScreenSizeBlock();
    RegisterScreenSpaceBlock();
    RegisterTwirlBlock();
    RegisterTBNBlock();
    RegisterHeightToNormalBlock();
    RegisterFragDepthBlock();
    RegisterShadowMapBlock();
    RegisterPrePassOutputBlock();
    RegisterAmbientOcclusionBlock();
}

/**
 * Registers all dual (vertex + fragment) node material blocks for deserialization.
 * Call this if you only need dual blocks to be deserializable.
 */
export function RegisterNodeMaterialDualBlocks(): void {
    RegisterFogBlock();
    RegisterLightBlock();
    RegisterTextureBlock();
    RegisterReflectionTextureBaseBlock();
    RegisterReflectionTextureBlock();
    RegisterCurrentScreenBlock();
    RegisterSceneDepthBlock();
    RegisterImageSourceBlock();
    RegisterDepthSourceBlock();
    RegisterClipPlanesBlock();
    RegisterSmartFilterTextureBlock();
}

/**
 * Registers all input node material blocks for deserialization.
 * Call this if you only need input blocks to be deserializable.
 */
export function RegisterNodeMaterialInputBlocks(): void {
    RegisterMaterialsNodeBlocksInputInputBlock();
    RegisterPrePassTextureBlock();
}

/**
 * Registers all teleport node material blocks for deserialization.
 * Call this if you only need teleport blocks to be deserializable.
 */
export function RegisterNodeMaterialTeleportBlocks(): void {
    RegisterMaterialsNodeBlocksTeleportTeleportInBlock();
    RegisterMaterialsNodeBlocksTeleportTeleportOutBlock();
}

/**
 * Registers all PBR node material blocks for deserialization.
 * Call this if you only need PBR blocks to be deserializable.
 */
export function RegisterNodeMaterialPBRBlocks(): void {
    RegisterPbrMetallicRoughnessBlock();
    RegisterSheenBlock();
    RegisterAnisotropyBlock();
    RegisterReflectionBlock();
    RegisterClearCoatBlock();
    RegisterRefractionBlock();
    RegisterSubSurfaceBlock();
    RegisterIridescenceBlock();
}

/**
 * Registers all particle node material blocks for deserialization.
 * Call this if you only need particle blocks to be deserializable.
 */
export function RegisterNodeMaterialParticleBlocks(): void {
    RegisterParticleTextureBlock();
    RegisterParticleRampGradientBlock();
    RegisterParticleBlendMultiplyBlock();
}

/**
 * Registers all Gaussian splatting node material blocks for deserialization.
 * Call this if you only need Gaussian splatting blocks to be deserializable.
 */
export function RegisterNodeMaterialGaussianSplattingBlocks(): void {
    RegisterGaussianSplattingBlock();
    RegisterSplatReaderBlock();
    RegisterGaussianBlock();
}

/**
 * Registers all root-level (math/utility) node material blocks for deserialization.
 * Call this if you only need math and utility blocks to be deserializable.
 */
export function RegisterNodeMaterialMathBlocks(): void {
    RegisterMultiplyBlock();
    RegisterAddBlock();
    RegisterScaleBlock();
    RegisterClampBlock();
    RegisterCrossBlock();
    RegisterCustomBlock();
    RegisterDotBlock();
    RegisterTransformBlock();
    RegisterRemapBlock();
    RegisterNormalizeBlock();
    RegisterTrigonometryBlock();
    RegisterColorMergerBlock();
    RegisterVectorMergerBlock();
    RegisterColorSplitterBlock();
    RegisterVectorSplitterBlock();
    RegisterLerpBlock();
    RegisterDivideBlock();
    RegisterSubtractBlock();
    RegisterStepBlock();
    RegisterOneMinusBlock();
    RegisterViewDirectionBlock();
    RegisterFresnelBlock();
    RegisterMaxBlock();
    RegisterMinBlock();
    RegisterDistanceBlock();
    RegisterLengthBlock();
    RegisterNegateBlock();
    RegisterPowBlock();
    RegisterRandomNumberBlock();
    RegisterArcTan2Block();
    RegisterSmoothStepBlock();
    RegisterReciprocalBlock();
    RegisterReplaceColorBlock();
    RegisterPosterizeBlock();
    RegisterWaveBlock();
    RegisterGradientBlock();
    RegisterNLerpBlock();
    RegisterWorleyNoise3DBlock();
    RegisterSimplexPerlin3DBlock();
    RegisterNormalBlendBlock();
    RegisterRotate2dBlock();
    RegisterReflectBlock();
    RegisterRefractBlock();
    RegisterDesaturateBlock();
    RegisterModBlock();
    RegisterMatrixBuilderBlock();
    RegisterConditionalBlock();
    RegisterCloudBlock();
    RegisterVoronoiNoiseBlock();
    RegisterMaterialsNodeBlocksElbowBlock();
    RegisterTriPlanarBlock();
    RegisterBiPlanarBlock();
    RegisterMatrixDeterminantBlock();
    RegisterMatrixTransposeBlock();
    RegisterMeshAttributeExistsBlock();
    RegisterCurveBlock();
    RegisterColorConverterBlock();
    RegisterLoopBlock();
    RegisterStorageReadBlock();
    RegisterStorageWriteBlock();
    RegisterMatrixSplitterBlock();
    RegisterMaterialsNodeBlocksDebugBlock();
    RegisterPannerBlock();
}

let _Registered = false;
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
 * - {@link RegisterNodeMaterialVertexBlocks}
 * - {@link RegisterNodeMaterialFragmentBlocks}
 * - {@link RegisterNodeMaterialDualBlocks}
 * - {@link RegisterNodeMaterialInputBlocks}
 * - {@link RegisterNodeMaterialTeleportBlocks}
 * - {@link RegisterNodeMaterialPBRBlocks}
 * - {@link RegisterNodeMaterialParticleBlocks}
 * - {@link RegisterNodeMaterialGaussianSplattingBlocks}
 * - {@link RegisterNodeMaterialMathBlocks}
 */
export function RegisterAllNodeMaterialBlocks(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterNodeMaterialVertexBlocks();
    RegisterNodeMaterialFragmentBlocks();
    RegisterNodeMaterialDualBlocks();
    RegisterNodeMaterialInputBlocks();
    RegisterNodeMaterialTeleportBlocks();
    RegisterNodeMaterialPBRBlocks();
    RegisterNodeMaterialParticleBlocks();
    RegisterNodeMaterialGaussianSplattingBlocks();
    RegisterNodeMaterialMathBlocks();
}
