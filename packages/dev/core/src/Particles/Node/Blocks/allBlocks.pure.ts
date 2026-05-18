// Conditions blocks
import { RegisterParticleConditionBlock } from "./Conditions/particleConditionBlock.pure";

// Emitters blocks
import { RegisterBoxShapeBlock } from "./Emitters/boxShapeBlock.pure";
import { RegisterConeShapeBlock } from "./Emitters/coneShapeBlock.pure";
import { RegisterCreateParticleBlock } from "./Emitters/createParticleBlock.pure";
import { RegisterCustomShapeBlock } from "./Emitters/customShapeBlock.pure";
import { RegisterCylinderShapeBlock } from "./Emitters/cylinderShapeBlock.pure";
import { RegisterMeshShapeBlock } from "./Emitters/meshShapeBlock.pure";
import { RegisterPointShapeBlock } from "./Emitters/pointShapeBlock.pure";
import { RegisterSetupSpriteSheetBlock } from "./Emitters/setupSpriteSheetBlock.pure";
import { RegisterSphereShapeBlock } from "./Emitters/sphereShapeBlock.pure";

// Teleport blocks
import { RegisterParticleTeleportInBlock } from "./Teleport/particleTeleportInBlock.pure";
import { RegisterParticleTeleportOutBlock } from "./Teleport/particleTeleportOutBlock.pure";

// Triggers blocks
import { RegisterParticleTriggerBlock } from "./Triggers/particleTriggerBlock.pure";

// Update blocks
import { RegisterAlignAngleBlock } from "./Update/alignAngleBlock.pure";
import { RegisterBasicColorUpdateBlock } from "./Update/basicColorUpdateBlock.pure";
import { RegisterBasicPositionUpdateBlock } from "./Update/basicPositionUpdateBlock.pure";
import { RegisterBasicSpriteUpdateBlock } from "./Update/basicSpriteUpdateBlock.pure";
import { RegisterUpdateAgeBlock } from "./Update/updateAgeBlock.pure";
import { RegisterUpdateAngleBlock } from "./Update/updateAngleBlock.pure";
import { RegisterUpdateAttractorBlock } from "./Update/updateAttractorBlock.pure";
import { RegisterUpdateColorBlock } from "./Update/updateColorBlock.pure";
import { RegisterUpdateDirectionBlock } from "./Update/updateDirectionBlock.pure";
import { RegisterUpdateFlowMapBlock } from "./Update/updateFlowMapBlock.pure";
import { RegisterUpdateNoiseBlock } from "./Update/updateNoiseBlock.pure";
import { RegisterUpdatePositionBlock } from "./Update/updatePositionBlock.pure";
import { RegisterUpdateScaleBlock } from "./Update/updateScaleBlock.pure";
import { RegisterUpdateSizeBlock } from "./Update/updateSizeBlock.pure";
import { RegisterUpdateSpriteCellIndexBlock } from "./Update/updateSpriteCellIndexBlock.pure";

// Root-level blocks
import { RegisterParticleClampBlock } from "./particleClampBlock.pure";
import { RegisterParticleConverterBlock } from "./particleConverterBlock.pure";
import { RegisterParticleDebugBlock } from "./particleDebugBlock.pure";
import { RegisterParticleElbowBlock } from "./particleElbowBlock.pure";
import { RegisterParticleFloatToIntBlock } from "./particleFloatToIntBlock.pure";
import { RegisterParticleGradientBlock } from "./particleGradientBlock.pure";
import { RegisterParticleGradientValueBlock } from "./particleGradientValueBlock.pure";
import { RegisterParticleInputBlock } from "./particleInputBlock.pure";
import { RegisterParticleLerpBlock } from "./particleLerpBlock.pure";
import { RegisterParticleLocalVariableBlock } from "./particleLocalVariableBlock.pure";
import { RegisterParticleMathBlock } from "./particleMathBlock.pure";
import { RegisterParticleNLerpBlock } from "./particleNLerpBlock.pure";
import { RegisterParticleNumberMathBlock } from "./particleNumberMathBlock.pure";
import { RegisterParticleRandomBlock } from "./particleRandomBlock.pure";
import { RegisterParticleSmoothStepBlock } from "./particleSmoothStepBlock.pure";
import { RegisterParticleSourceTextureBlock } from "./particleSourceTextureBlock.pure";
import { RegisterParticleStepBlock } from "./particleStepBlock.pure";
import { RegisterParticleTrigonometryBlock } from "./particleTrigonometryBlock.pure";
import { RegisterParticleVectorLengthBlock } from "./particleVectorLengthBlock.pure";
import { RegisterParticleVectorMathBlock } from "./particleVectorMathBlock.pure";
import { RegisterSystemBlock } from "./systemBlock.pure";

/**
 * Registers all condition node particle blocks for deserialization.
 */
export function RegisterNodeParticleConditionsBlocks(): void {
    RegisterParticleConditionBlock();
}

/**
 * Registers all emitter node particle blocks for deserialization.
 */
export function RegisterNodeParticleEmittersBlocks(): void {
    RegisterBoxShapeBlock();
    RegisterConeShapeBlock();
    RegisterCreateParticleBlock();
    RegisterCustomShapeBlock();
    RegisterCylinderShapeBlock();
    RegisterMeshShapeBlock();
    RegisterPointShapeBlock();
    RegisterSetupSpriteSheetBlock();
    RegisterSphereShapeBlock();
}

/**
 * Registers all teleport node particle blocks for deserialization.
 */
export function RegisterNodeParticleTeleportBlocks(): void {
    RegisterParticleTeleportInBlock();
    RegisterParticleTeleportOutBlock();
}

/**
 * Registers all trigger node particle blocks for deserialization.
 */
export function RegisterNodeParticleTriggersBlocks(): void {
    RegisterParticleTriggerBlock();
}

/**
 * Registers all update node particle blocks for deserialization.
 */
export function RegisterNodeParticleUpdateBlocks(): void {
    RegisterAlignAngleBlock();
    RegisterBasicColorUpdateBlock();
    RegisterBasicPositionUpdateBlock();
    RegisterBasicSpriteUpdateBlock();
    RegisterUpdateAgeBlock();
    RegisterUpdateAngleBlock();
    RegisterUpdateAttractorBlock();
    RegisterUpdateColorBlock();
    RegisterUpdateDirectionBlock();
    RegisterUpdateFlowMapBlock();
    RegisterUpdateNoiseBlock();
    RegisterUpdatePositionBlock();
    RegisterUpdateScaleBlock();
    RegisterUpdateSizeBlock();
    RegisterUpdateSpriteCellIndexBlock();
}

/**
 * Registers all root-level (math/utility) node particle blocks for deserialization.
 */
export function RegisterNodeParticleMathBlocks(): void {
    RegisterParticleClampBlock();
    RegisterParticleConverterBlock();
    RegisterParticleDebugBlock();
    RegisterParticleElbowBlock();
    RegisterParticleFloatToIntBlock();
    RegisterParticleGradientBlock();
    RegisterParticleGradientValueBlock();
    RegisterParticleInputBlock();
    RegisterParticleLerpBlock();
    RegisterParticleLocalVariableBlock();
    RegisterParticleMathBlock();
    RegisterParticleNLerpBlock();
    RegisterParticleNumberMathBlock();
    RegisterParticleRandomBlock();
    RegisterParticleSmoothStepBlock();
    RegisterParticleSourceTextureBlock();
    RegisterParticleStepBlock();
    RegisterParticleTrigonometryBlock();
    RegisterParticleVectorLengthBlock();
    RegisterParticleVectorMathBlock();
    RegisterSystemBlock();
}

let _Registered = false;
/**
 * Registers all node particle blocks for deserialization.
 * Call this function when you need to deserialize node particle systems from JSON/snippets.
 *
 * This is the tree-shakeable replacement for:
 * ```ts
 * import "@babylonjs/core/Particles/Node/Blocks/index";
 * ```
 */
export function RegisterAllNodeParticleBlocks(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterNodeParticleConditionsBlocks();
    RegisterNodeParticleEmittersBlocks();
    RegisterNodeParticleTeleportBlocks();
    RegisterNodeParticleTriggersBlocks();
    RegisterNodeParticleUpdateBlocks();
    RegisterNodeParticleMathBlocks();
}
