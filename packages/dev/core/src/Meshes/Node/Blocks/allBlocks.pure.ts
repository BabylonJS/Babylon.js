// Instances blocks
import { RegisterInstantiateBlock } from "./Instances/instantiateBlock.pure";
import { RegisterInstantiateLinearBlock } from "./Instances/instantiateLinearBlock.pure";
import { RegisterInstantiateOnFacesBlock } from "./Instances/instantiateOnFacesBlock.pure";
import { RegisterInstantiateOnVerticesBlock } from "./Instances/instantiateOnVerticesBlock.pure";
import { RegisterInstantiateOnVolumeBlock } from "./Instances/instantiateOnVolumeBlock.pure";
import { RegisterInstantiateRadialBlock } from "./Instances/instantiateRadialBlock.pure";

// Matrices blocks
import { RegisterAlignBlock } from "./Matrices/alignBlock.pure";
import { RegisterRotationXBlock } from "./Matrices/rotationXBlock.pure";
import { RegisterRotationYBlock } from "./Matrices/rotationYBlock.pure";
import { RegisterRotationZBlock } from "./Matrices/rotationZBlock.pure";
import { RegisterScalingBlock } from "./Matrices/scalingBlock.pure";
import { RegisterTranslationBlock } from "./Matrices/translationBlock.pure";

// Set blocks
import { RegisterAggregatorBlock } from "./Set/aggregatorBlock.pure";
import { RegisterLatticeBlock } from "./Set/latticeBlock.pure";
import { RegisterSetColorsBlock } from "./Set/setColorsBlock.pure";
import { RegisterSetMaterialIDBlock } from "./Set/setMaterialIDBlock.pure";
import { RegisterSetNormalsBlock } from "./Set/setNormalsBlock.pure";
import { RegisterSetPositionsBlock } from "./Set/setPositionsBlock.pure";
import { RegisterSetTangentsBlock } from "./Set/setTangentsBlock.pure";
import { RegisterSetUVsBlock } from "./Set/setUVsBlock.pure";

// Sources blocks
import { RegisterBoxBlock } from "./Sources/boxBlock.pure";
import { RegisterCapsuleBlock } from "./Sources/capsuleBlock.pure";
import { RegisterCylinderBlock } from "./Sources/cylinderBlock.pure";
import { RegisterDiscBlock } from "./Sources/discBlock.pure";
import { RegisterGridBlock } from "./Sources/gridBlock.pure";
import { RegisterIcoSphereBlock } from "./Sources/icoSphereBlock.pure";
import { RegisterMeshBlock } from "./Sources/meshBlock.pure";
import { RegisterNullBlock } from "./Sources/nullBlock.pure";
import { RegisterPlaneBlock } from "./Sources/planeBlock.pure";
import { RegisterPointListBlock } from "./Sources/pointListBlock.pure";
import { RegisterSphereBlock } from "./Sources/sphereBlock.pure";
import { RegisterTorusBlock } from "./Sources/torusBlock.pure";

// Teleport blocks
import { RegisterMeshesNodeBlocksTeleportTeleportInBlock } from "./Teleport/teleportInBlock.pure";
import { RegisterMeshesNodeBlocksTeleportTeleportOutBlock } from "./Teleport/teleportOutBlock.pure";

// Textures blocks
import { RegisterGeometryTextureBlock } from "./Textures/geometryTextureBlock.pure";
import { RegisterGeometryTextureFetchBlock } from "./Textures/geometryTextureFetchBlock.pure";

// Root-level blocks
import { RegisterBooleanGeometryBlock } from "./booleanGeometryBlock.pure";
import { RegisterBoundingBlock } from "./boundingBlock.pure";
import { RegisterCleanGeometryBlock } from "./cleanGeometryBlock.pure";
import { RegisterComputeNormalsBlock } from "./computeNormalsBlock.pure";
import { RegisterConditionBlock } from "./conditionBlock.pure";
import { RegisterMeshesNodeBlocksDebugBlock } from "./debugBlock.pure";
import { RegisterGeometryArcTan2Block } from "./geometryArcTan2Block.pure";
import { RegisterGeometryClampBlock } from "./geometryClampBlock.pure";
import { RegisterGeometryCollectionBlock } from "./geometryCollectionBlock.pure";
import { RegisterGeometryCrossBlock } from "./geometryCrossBlock.pure";
import { RegisterGeometryCurveBlock } from "./geometryCurveBlock.pure";
import { RegisterGeometryDesaturateBlock } from "./geometryDesaturateBlock.pure";
import { RegisterGeometryDistanceBlock } from "./geometryDistanceBlock.pure";
import { RegisterGeometryDotBlock } from "./geometryDotBlock.pure";
import { RegisterGeometryEaseBlock } from "./geometryEaseBlock.pure";
import { RegisterGeometryElbowBlock } from "./geometryElbowBlock.pure";
import { RegisterGeometryInfoBlock } from "./geometryInfoBlock.pure";
import { RegisterGeometryInputBlock } from "./geometryInputBlock.pure";
import { RegisterGeometryInterceptorBlock } from "./geometryInterceptorBlock.pure";
import { RegisterGeometryLengthBlock } from "./geometryLengthBlock.pure";
import { RegisterGeometryLerpBlock } from "./geometryLerpBlock.pure";
import { RegisterGeometryModBlock } from "./geometryModBlock.pure";
import { RegisterGeometryNLerpBlock } from "./geometryNLerpBlock.pure";
import { RegisterGeometryOptimizeBlock } from "./geometryOptimizeBlock.pure";
import { RegisterGeometryOutputBlock } from "./geometryOutputBlock.pure";
import { RegisterGeometryPosterizeBlock } from "./geometryPosterizeBlock.pure";
import { RegisterGeometryPowBlock } from "./geometryPowBlock.pure";
import { RegisterGeometryReplaceColorBlock } from "./geometryReplaceColorBlock.pure";
import { RegisterGeometryRotate2dBlock } from "./geometryRotate2dBlock.pure";
import { RegisterGeometrySmoothStepBlock } from "./geometrySmoothStepBlock.pure";
import { RegisterGeometryStepBlock } from "./geometryStepBlock.pure";
import { RegisterGeometryTransformBlock } from "./geometryTransformBlock.pure";
import { RegisterGeometryTrigonometryBlock } from "./geometryTrigonometryBlock.pure";
import { RegisterIntFloatConverterBlock } from "./intFloatConverterBlock.pure";
import { RegisterMapRangeBlock } from "./mapRangeBlock.pure";
import { RegisterMappingBlock } from "./mappingBlock.pure";
import { RegisterMathBlock } from "./mathBlock.pure";
import { RegisterMatrixComposeBlock } from "./matrixComposeBlock.pure";
import { RegisterMergeGeometryBlock } from "./mergeGeometryBlock.pure";
import { RegisterNoiseBlock } from "./noiseBlock.pure";
import { RegisterNormalizeVectorBlock } from "./normalizeVectorBlock.pure";
import { RegisterRandomBlock } from "./randomBlock.pure";
import { RegisterSubdivideBlock } from "./subdivideBlock.pure";
import { RegisterVectorConverterBlock } from "./vectorConverterBlock.pure";

/**
 * Registers all instance-related node geometry blocks for deserialization.
 */
export function RegisterNodeGeometryInstancesBlocks(): void {
    RegisterInstantiateBlock();
    RegisterInstantiateLinearBlock();
    RegisterInstantiateOnFacesBlock();
    RegisterInstantiateOnVerticesBlock();
    RegisterInstantiateOnVolumeBlock();
    RegisterInstantiateRadialBlock();
}

/**
 * Registers all matrix-related node geometry blocks for deserialization.
 */
export function RegisterNodeGeometryMatricesBlocks(): void {
    RegisterAlignBlock();
    RegisterRotationXBlock();
    RegisterRotationYBlock();
    RegisterRotationZBlock();
    RegisterScalingBlock();
    RegisterTranslationBlock();
}

/**
 * Registers all set/modify node geometry blocks for deserialization.
 */
export function RegisterNodeGeometrySetBlocks(): void {
    RegisterAggregatorBlock();
    RegisterLatticeBlock();
    RegisterSetColorsBlock();
    RegisterSetMaterialIDBlock();
    RegisterSetNormalsBlock();
    RegisterSetPositionsBlock();
    RegisterSetTangentsBlock();
    RegisterSetUVsBlock();
}

/**
 * Registers all source/primitive node geometry blocks for deserialization.
 */
export function RegisterNodeGeometrySourcesBlocks(): void {
    RegisterBoxBlock();
    RegisterCapsuleBlock();
    RegisterCylinderBlock();
    RegisterDiscBlock();
    RegisterGridBlock();
    RegisterIcoSphereBlock();
    RegisterMeshBlock();
    RegisterNullBlock();
    RegisterPlaneBlock();
    RegisterPointListBlock();
    RegisterSphereBlock();
    RegisterTorusBlock();
}

/**
 * Registers all teleport node geometry blocks for deserialization.
 */
export function RegisterNodeGeometryTeleportBlocks(): void {
    RegisterMeshesNodeBlocksTeleportTeleportInBlock();
    RegisterMeshesNodeBlocksTeleportTeleportOutBlock();
}

/**
 * Registers all texture node geometry blocks for deserialization.
 */
export function RegisterNodeGeometryTexturesBlocks(): void {
    RegisterGeometryTextureBlock();
    RegisterGeometryTextureFetchBlock();
}

/**
 * Registers all root-level (math/utility/geometry) node geometry blocks for deserialization.
 */
export function RegisterNodeGeometryMathBlocks(): void {
    RegisterBooleanGeometryBlock();
    RegisterBoundingBlock();
    RegisterCleanGeometryBlock();
    RegisterComputeNormalsBlock();
    RegisterConditionBlock();
    RegisterMeshesNodeBlocksDebugBlock();
    RegisterGeometryArcTan2Block();
    RegisterGeometryClampBlock();
    RegisterGeometryCollectionBlock();
    RegisterGeometryCrossBlock();
    RegisterGeometryCurveBlock();
    RegisterGeometryDesaturateBlock();
    RegisterGeometryDistanceBlock();
    RegisterGeometryDotBlock();
    RegisterGeometryEaseBlock();
    RegisterGeometryElbowBlock();
    RegisterGeometryInfoBlock();
    RegisterGeometryInputBlock();
    RegisterGeometryInterceptorBlock();
    RegisterGeometryLengthBlock();
    RegisterGeometryLerpBlock();
    RegisterGeometryModBlock();
    RegisterGeometryNLerpBlock();
    RegisterGeometryOptimizeBlock();
    RegisterGeometryOutputBlock();
    RegisterGeometryPosterizeBlock();
    RegisterGeometryPowBlock();
    RegisterGeometryReplaceColorBlock();
    RegisterGeometryRotate2dBlock();
    RegisterGeometrySmoothStepBlock();
    RegisterGeometryStepBlock();
    RegisterGeometryTransformBlock();
    RegisterGeometryTrigonometryBlock();
    RegisterIntFloatConverterBlock();
    RegisterMapRangeBlock();
    RegisterMappingBlock();
    RegisterMathBlock();
    RegisterMatrixComposeBlock();
    RegisterMergeGeometryBlock();
    RegisterNoiseBlock();
    RegisterNormalizeVectorBlock();
    RegisterRandomBlock();
    RegisterSubdivideBlock();
    RegisterVectorConverterBlock();
}

let _Registered = false;
/**
 * Registers all node geometry blocks for deserialization.
 * Call this function when you need to deserialize node geometry from JSON/snippets.
 *
 * This is the tree-shakeable replacement for:
 * ```ts
 * import "@babylonjs/core/Meshes/Node/Blocks/index";
 * ```
 */
export function RegisterAllNodeGeometryBlocks(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterNodeGeometryInstancesBlocks();
    RegisterNodeGeometryMatricesBlocks();
    RegisterNodeGeometrySetBlocks();
    RegisterNodeGeometrySourcesBlocks();
    RegisterNodeGeometryTeleportBlocks();
    RegisterNodeGeometryTexturesBlocks();
    RegisterNodeGeometryMathBlocks();
}
