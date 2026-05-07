// Conditions blocks
import { registerParticleConditionBlock } from "./Conditions/particleConditionBlock.pure";

// Emitters blocks
import { registerBoxShapeBlock } from "./Emitters/boxShapeBlock.pure";
import { registerConeShapeBlock } from "./Emitters/coneShapeBlock.pure";
import { registerCreateParticleBlock } from "./Emitters/createParticleBlock.pure";
import { registerCustomShapeBlock } from "./Emitters/customShapeBlock.pure";
import { registerCylinderShapeBlock } from "./Emitters/cylinderShapeBlock.pure";
import { registerMeshShapeBlock } from "./Emitters/meshShapeBlock.pure";
import { registerPointShapeBlock } from "./Emitters/pointShapeBlock.pure";
import { registerSetupSpriteSheetBlock } from "./Emitters/setupSpriteSheetBlock.pure";
import { registerSphereShapeBlock } from "./Emitters/sphereShapeBlock.pure";

// Teleport blocks
import { registerParticleTeleportInBlock } from "./Teleport/particleTeleportInBlock.pure";
import { registerParticleTeleportOutBlock } from "./Teleport/particleTeleportOutBlock.pure";

// Triggers blocks
import { registerParticleTriggerBlock } from "./Triggers/particleTriggerBlock.pure";

// Update blocks
import { registerAlignAngleBlock } from "./Update/alignAngleBlock.pure";
import { registerBasicColorUpdateBlock } from "./Update/basicColorUpdateBlock.pure";
import { registerBasicPositionUpdateBlock } from "./Update/basicPositionUpdateBlock.pure";
import { registerBasicSpriteUpdateBlock } from "./Update/basicSpriteUpdateBlock.pure";
import { registerUpdateAgeBlock } from "./Update/updateAgeBlock.pure";
import { registerUpdateAngleBlock } from "./Update/updateAngleBlock.pure";
import { registerUpdateAttractorBlock } from "./Update/updateAttractorBlock.pure";
import { registerUpdateColorBlock } from "./Update/updateColorBlock.pure";
import { registerUpdateDirectionBlock } from "./Update/updateDirectionBlock.pure";
import { registerUpdateFlowMapBlock } from "./Update/updateFlowMapBlock.pure";
import { registerUpdateNoiseBlock } from "./Update/updateNoiseBlock.pure";
import { registerUpdatePositionBlock } from "./Update/updatePositionBlock.pure";
import { registerUpdateScaleBlock } from "./Update/updateScaleBlock.pure";
import { registerUpdateSizeBlock } from "./Update/updateSizeBlock.pure";
import { registerUpdateSpriteCellIndexBlock } from "./Update/updateSpriteCellIndexBlock.pure";

// Root-level blocks
import { registerParticleClampBlock } from "./particleClampBlock.pure";
import { registerParticleConverterBlock } from "./particleConverterBlock.pure";
import { registerParticleDebugBlock } from "./particleDebugBlock.pure";
import { registerParticleElbowBlock } from "./particleElbowBlock.pure";
import { registerParticleFloatToIntBlock } from "./particleFloatToIntBlock.pure";
import { registerParticleGradientBlock } from "./particleGradientBlock.pure";
import { registerParticleGradientValueBlock } from "./particleGradientValueBlock.pure";
import { registerParticleInputBlock } from "./particleInputBlock.pure";
import { registerParticleLerpBlock } from "./particleLerpBlock.pure";
import { registerParticleLocalVariableBlock } from "./particleLocalVariableBlock.pure";
import { registerParticleMathBlock } from "./particleMathBlock.pure";
import { registerParticleNLerpBlock } from "./particleNLerpBlock.pure";
import { registerParticleNumberMathBlock } from "./particleNumberMathBlock.pure";
import { registerParticleRandomBlock } from "./particleRandomBlock.pure";
import { registerParticleSmoothStepBlock } from "./particleSmoothStepBlock.pure";
import { registerParticleSourceTextureBlock } from "./particleSourceTextureBlock.pure";
import { registerParticleStepBlock } from "./particleStepBlock.pure";
import { registerParticleTrigonometryBlock } from "./particleTrigonometryBlock.pure";
import { registerParticleVectorLengthBlock } from "./particleVectorLengthBlock.pure";
import { registerParticleVectorMathBlock } from "./particleVectorMathBlock.pure";
import { registerSystemBlock } from "./systemBlock.pure";

/**
 * Registers all condition node particle blocks for deserialization.
 */
export function registerNodeParticleConditionsBlocks(): void {
    registerParticleConditionBlock();
}

/**
 * Registers all emitter node particle blocks for deserialization.
 */
export function registerNodeParticleEmittersBlocks(): void {
    registerBoxShapeBlock();
    registerConeShapeBlock();
    registerCreateParticleBlock();
    registerCustomShapeBlock();
    registerCylinderShapeBlock();
    registerMeshShapeBlock();
    registerPointShapeBlock();
    registerSetupSpriteSheetBlock();
    registerSphereShapeBlock();
}

/**
 * Registers all teleport node particle blocks for deserialization.
 */
export function registerNodeParticleTeleportBlocks(): void {
    registerParticleTeleportInBlock();
    registerParticleTeleportOutBlock();
}

/**
 * Registers all trigger node particle blocks for deserialization.
 */
export function registerNodeParticleTriggersBlocks(): void {
    registerParticleTriggerBlock();
}

/**
 * Registers all update node particle blocks for deserialization.
 */
export function registerNodeParticleUpdateBlocks(): void {
    registerAlignAngleBlock();
    registerBasicColorUpdateBlock();
    registerBasicPositionUpdateBlock();
    registerBasicSpriteUpdateBlock();
    registerUpdateAgeBlock();
    registerUpdateAngleBlock();
    registerUpdateAttractorBlock();
    registerUpdateColorBlock();
    registerUpdateDirectionBlock();
    registerUpdateFlowMapBlock();
    registerUpdateNoiseBlock();
    registerUpdatePositionBlock();
    registerUpdateScaleBlock();
    registerUpdateSizeBlock();
    registerUpdateSpriteCellIndexBlock();
}

/**
 * Registers all root-level (math/utility) node particle blocks for deserialization.
 */
export function registerNodeParticleMathBlocks(): void {
    registerParticleClampBlock();
    registerParticleConverterBlock();
    registerParticleDebugBlock();
    registerParticleElbowBlock();
    registerParticleFloatToIntBlock();
    registerParticleGradientBlock();
    registerParticleGradientValueBlock();
    registerParticleInputBlock();
    registerParticleLerpBlock();
    registerParticleLocalVariableBlock();
    registerParticleMathBlock();
    registerParticleNLerpBlock();
    registerParticleNumberMathBlock();
    registerParticleRandomBlock();
    registerParticleSmoothStepBlock();
    registerParticleSourceTextureBlock();
    registerParticleStepBlock();
    registerParticleTrigonometryBlock();
    registerParticleVectorLengthBlock();
    registerParticleVectorMathBlock();
    registerSystemBlock();
}

let _registered = false;
/**
 * Registers all node particle blocks for deserialization.
 * Call this function when you need to deserialize node particle systems from JSON/snippets.
 *
 * This is the tree-shakeable replacement for:
 * ```ts
 * import "@babylonjs/core/Particles/Node/Blocks/index";
 * ```
 */
export function registerAllNodeParticleBlocks(): void {
    if (_registered) return;
    _registered = true;

    registerNodeParticleConditionsBlocks();
    registerNodeParticleEmittersBlocks();
    registerNodeParticleTeleportBlocks();
    registerNodeParticleTriggersBlocks();
    registerNodeParticleUpdateBlocks();
    registerNodeParticleMathBlocks();
}
