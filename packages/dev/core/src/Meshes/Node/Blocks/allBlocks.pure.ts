// Instances blocks
import { registerInstantiateBlock } from "./Instances/instantiateBlock.pure";
import { registerInstantiateLinearBlock } from "./Instances/instantiateLinearBlock.pure";
import { registerInstantiateOnFacesBlock } from "./Instances/instantiateOnFacesBlock.pure";
import { registerInstantiateOnVerticesBlock } from "./Instances/instantiateOnVerticesBlock.pure";
import { registerInstantiateOnVolumeBlock } from "./Instances/instantiateOnVolumeBlock.pure";
import { registerInstantiateRadialBlock } from "./Instances/instantiateRadialBlock.pure";

// Matrices blocks
import { registerAlignBlock } from "./Matrices/alignBlock.pure";
import { registerRotationXBlock } from "./Matrices/rotationXBlock.pure";
import { registerRotationYBlock } from "./Matrices/rotationYBlock.pure";
import { registerRotationZBlock } from "./Matrices/rotationZBlock.pure";
import { registerScalingBlock } from "./Matrices/scalingBlock.pure";
import { registerTranslationBlock } from "./Matrices/translationBlock.pure";

// Set blocks
import { registerAggregatorBlock } from "./Set/aggregatorBlock.pure";
import { registerLatticeBlock } from "./Set/latticeBlock.pure";
import { registerSetColorsBlock } from "./Set/setColorsBlock.pure";
import { registerSetMaterialIDBlock } from "./Set/setMaterialIDBlock.pure";
import { registerSetNormalsBlock } from "./Set/setNormalsBlock.pure";
import { registerSetPositionsBlock } from "./Set/setPositionsBlock.pure";
import { registerSetTangentsBlock } from "./Set/setTangentsBlock.pure";
import { registerSetUVsBlock } from "./Set/setUVsBlock.pure";

// Sources blocks
import { registerBoxBlock } from "./Sources/boxBlock.pure";
import { registerCapsuleBlock } from "./Sources/capsuleBlock.pure";
import { registerCylinderBlock } from "./Sources/cylinderBlock.pure";
import { registerDiscBlock } from "./Sources/discBlock.pure";
import { registerGridBlock } from "./Sources/gridBlock.pure";
import { registerIcoSphereBlock } from "./Sources/icoSphereBlock.pure";
import { registerMeshBlock } from "./Sources/meshBlock.pure";
import { registerNullBlock } from "./Sources/nullBlock.pure";
import { registerPlaneBlock } from "./Sources/planeBlock.pure";
import { registerPointListBlock } from "./Sources/pointListBlock.pure";
import { registerSphereBlock } from "./Sources/sphereBlock.pure";
import { registerTorusBlock } from "./Sources/torusBlock.pure";

// Teleport blocks
import { registerMeshesNodeBlocksTeleportTeleportInBlock } from "./Teleport/teleportInBlock.pure";
import { registerMeshesNodeBlocksTeleportTeleportOutBlock } from "./Teleport/teleportOutBlock.pure";

// Textures blocks
import { registerGeometryTextureBlock } from "./Textures/geometryTextureBlock.pure";
import { registerGeometryTextureFetchBlock } from "./Textures/geometryTextureFetchBlock.pure";

// Root-level blocks
import { registerBooleanGeometryBlock } from "./booleanGeometryBlock.pure";
import { registerBoundingBlock } from "./boundingBlock.pure";
import { registerCleanGeometryBlock } from "./cleanGeometryBlock.pure";
import { registerComputeNormalsBlock } from "./computeNormalsBlock.pure";
import { registerConditionBlock } from "./conditionBlock.pure";
import { registerMeshesNodeBlocksDebugBlock } from "./debugBlock.pure";
import { registerGeometryArcTan2Block } from "./geometryArcTan2Block.pure";
import { registerGeometryClampBlock } from "./geometryClampBlock.pure";
import { registerGeometryCollectionBlock } from "./geometryCollectionBlock.pure";
import { registerGeometryCrossBlock } from "./geometryCrossBlock.pure";
import { registerGeometryCurveBlock } from "./geometryCurveBlock.pure";
import { registerGeometryDesaturateBlock } from "./geometryDesaturateBlock.pure";
import { registerGeometryDistanceBlock } from "./geometryDistanceBlock.pure";
import { registerGeometryDotBlock } from "./geometryDotBlock.pure";
import { registerGeometryEaseBlock } from "./geometryEaseBlock.pure";
import { registerGeometryElbowBlock } from "./geometryElbowBlock.pure";
import { registerGeometryInfoBlock } from "./geometryInfoBlock.pure";
import { registerGeometryInputBlock } from "./geometryInputBlock.pure";
import { registerGeometryInterceptorBlock } from "./geometryInterceptorBlock.pure";
import { registerGeometryLengthBlock } from "./geometryLengthBlock.pure";
import { registerGeometryLerpBlock } from "./geometryLerpBlock.pure";
import { registerGeometryModBlock } from "./geometryModBlock.pure";
import { registerGeometryNLerpBlock } from "./geometryNLerpBlock.pure";
import { registerGeometryOptimizeBlock } from "./geometryOptimizeBlock.pure";
import { registerGeometryOutputBlock } from "./geometryOutputBlock.pure";
import { registerGeometryPosterizeBlock } from "./geometryPosterizeBlock.pure";
import { registerGeometryPowBlock } from "./geometryPowBlock.pure";
import { registerGeometryReplaceColorBlock } from "./geometryReplaceColorBlock.pure";
import { registerGeometryRotate2dBlock } from "./geometryRotate2dBlock.pure";
import { registerGeometrySmoothStepBlock } from "./geometrySmoothStepBlock.pure";
import { registerGeometryStepBlock } from "./geometryStepBlock.pure";
import { registerGeometryTransformBlock } from "./geometryTransformBlock.pure";
import { registerGeometryTrigonometryBlock } from "./geometryTrigonometryBlock.pure";
import { registerIntFloatConverterBlock } from "./intFloatConverterBlock.pure";
import { registerMapRangeBlock } from "./mapRangeBlock.pure";
import { registerMappingBlock } from "./mappingBlock.pure";
import { registerMathBlock } from "./mathBlock.pure";
import { registerMatrixComposeBlock } from "./matrixComposeBlock.pure";
import { registerMergeGeometryBlock } from "./mergeGeometryBlock.pure";
import { registerNoiseBlock } from "./noiseBlock.pure";
import { registerNormalizeVectorBlock } from "./normalizeVectorBlock.pure";
import { registerRandomBlock } from "./randomBlock.pure";
import { registerSubdivideBlock } from "./subdivideBlock.pure";
import { registerVectorConverterBlock } from "./vectorConverterBlock.pure";

/**
 * Registers all instance-related node geometry blocks for deserialization.
 */
export function registerNodeGeometryInstancesBlocks(): void {
    registerInstantiateBlock();
    registerInstantiateLinearBlock();
    registerInstantiateOnFacesBlock();
    registerInstantiateOnVerticesBlock();
    registerInstantiateOnVolumeBlock();
    registerInstantiateRadialBlock();
}

/**
 * Registers all matrix-related node geometry blocks for deserialization.
 */
export function registerNodeGeometryMatricesBlocks(): void {
    registerAlignBlock();
    registerRotationXBlock();
    registerRotationYBlock();
    registerRotationZBlock();
    registerScalingBlock();
    registerTranslationBlock();
}

/**
 * Registers all set/modify node geometry blocks for deserialization.
 */
export function registerNodeGeometrySetBlocks(): void {
    registerAggregatorBlock();
    registerLatticeBlock();
    registerSetColorsBlock();
    registerSetMaterialIDBlock();
    registerSetNormalsBlock();
    registerSetPositionsBlock();
    registerSetTangentsBlock();
    registerSetUVsBlock();
}

/**
 * Registers all source/primitive node geometry blocks for deserialization.
 */
export function registerNodeGeometrySourcesBlocks(): void {
    registerBoxBlock();
    registerCapsuleBlock();
    registerCylinderBlock();
    registerDiscBlock();
    registerGridBlock();
    registerIcoSphereBlock();
    registerMeshBlock();
    registerNullBlock();
    registerPlaneBlock();
    registerPointListBlock();
    registerSphereBlock();
    registerTorusBlock();
}

/**
 * Registers all teleport node geometry blocks for deserialization.
 */
export function registerNodeGeometryTeleportBlocks(): void {
    registerMeshesNodeBlocksTeleportTeleportInBlock();
    registerMeshesNodeBlocksTeleportTeleportOutBlock();
}

/**
 * Registers all texture node geometry blocks for deserialization.
 */
export function registerNodeGeometryTexturesBlocks(): void {
    registerGeometryTextureBlock();
    registerGeometryTextureFetchBlock();
}

/**
 * Registers all root-level (math/utility/geometry) node geometry blocks for deserialization.
 */
export function registerNodeGeometryMathBlocks(): void {
    registerBooleanGeometryBlock();
    registerBoundingBlock();
    registerCleanGeometryBlock();
    registerComputeNormalsBlock();
    registerConditionBlock();
    registerMeshesNodeBlocksDebugBlock();
    registerGeometryArcTan2Block();
    registerGeometryClampBlock();
    registerGeometryCollectionBlock();
    registerGeometryCrossBlock();
    registerGeometryCurveBlock();
    registerGeometryDesaturateBlock();
    registerGeometryDistanceBlock();
    registerGeometryDotBlock();
    registerGeometryEaseBlock();
    registerGeometryElbowBlock();
    registerGeometryInfoBlock();
    registerGeometryInputBlock();
    registerGeometryInterceptorBlock();
    registerGeometryLengthBlock();
    registerGeometryLerpBlock();
    registerGeometryModBlock();
    registerGeometryNLerpBlock();
    registerGeometryOptimizeBlock();
    registerGeometryOutputBlock();
    registerGeometryPosterizeBlock();
    registerGeometryPowBlock();
    registerGeometryReplaceColorBlock();
    registerGeometryRotate2dBlock();
    registerGeometrySmoothStepBlock();
    registerGeometryStepBlock();
    registerGeometryTransformBlock();
    registerGeometryTrigonometryBlock();
    registerIntFloatConverterBlock();
    registerMapRangeBlock();
    registerMappingBlock();
    registerMathBlock();
    registerMatrixComposeBlock();
    registerMergeGeometryBlock();
    registerNoiseBlock();
    registerNormalizeVectorBlock();
    registerRandomBlock();
    registerSubdivideBlock();
    registerVectorConverterBlock();
}

let _registered = false;
/**
 * Registers all node geometry blocks for deserialization.
 * Call this function when you need to deserialize node geometry from JSON/snippets.
 *
 * This is the tree-shakeable replacement for:
 * ```ts
 * import "@babylonjs/core/Meshes/Node/Blocks/index";
 * ```
 */
export function registerAllNodeGeometryBlocks(): void {
    if (_registered) return;
    _registered = true;

    registerNodeGeometryInstancesBlocks();
    registerNodeGeometryMatricesBlocks();
    registerNodeGeometrySetBlocks();
    registerNodeGeometrySourcesBlocks();
    registerNodeGeometryTeleportBlocks();
    registerNodeGeometryTexturesBlocks();
    registerNodeGeometryMathBlocks();
}
