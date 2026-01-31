import type { Attractor } from "../attractor";
import type { FlowMap } from "../flowMap";
import type { Color3Gradient, ColorGradient } from "core/Misc";
import type { Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { Mesh } from "core/Meshes/mesh";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import type { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import type { ConeDirectedParticleEmitter, ConeParticleEmitter } from "core/Particles/EmitterTypes/coneParticleEmitter";
import type { CustomParticleEmitter } from "core/Particles/EmitterTypes/customParticleEmitter";
import type { CylinderDirectedParticleEmitter, CylinderParticleEmitter } from "core/Particles/EmitterTypes/cylinderParticleEmitter";
import type { HemisphericParticleEmitter } from "core/Particles/EmitterTypes/hemisphericParticleEmitter";
import type { MeshParticleEmitter } from "core/Particles/EmitterTypes/meshParticleEmitter";
import type { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import type { SphereDirectedParticleEmitter, SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { IShapeBlock } from "core/Particles/Node/Blocks/Emitters/IShapeBlock";

import { Color4 } from "core/Maths/math.color";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { TransformNode } from "../../Meshes/transformNode";
import { FactorGradient } from "core/Misc/gradients";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleSystemSet } from "./nodeParticleSystemSet";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";
import { NodeParticleSystemSources } from "./Enums/nodeParticleSystemSources";
import { ParticleConverterBlock } from "./Blocks/particleConverterBlock";
import { ParticleFloatToIntBlock, ParticleFloatToIntBlockOperations } from "./Blocks/particleFloatToIntBlock";
import { ParticleGradientBlock } from "./Blocks/particleGradientBlock";
import { ParticleGradientValueBlock } from "./Blocks/particleGradientValueBlock";
import { ParticleInputBlock } from "./Blocks/particleInputBlock";
import { ParticleMathBlock, ParticleMathBlockOperations } from "./Blocks/particleMathBlock";
import { ParticleRandomBlock, ParticleRandomBlockLocks } from "./Blocks/particleRandomBlock";
import { ParticleTextureSourceBlock } from "./Blocks/particleSourceTextureBlock";
import { ParticleVectorLengthBlock } from "./Blocks/particleVectorLengthBlock";
import { SystemBlock } from "./Blocks/systemBlock";
import { ParticleConditionBlock, ParticleConditionBlockTests } from "./Blocks/Conditions/particleConditionBlock";
import { CreateParticleBlock } from "./Blocks/Emitters/createParticleBlock";
import { BoxShapeBlock } from "./Blocks/Emitters/boxShapeBlock";
import { ConeShapeBlock } from "./Blocks/Emitters/coneShapeBlock";
import { CylinderShapeBlock } from "./Blocks/Emitters/cylinderShapeBlock";
import { CustomShapeBlock } from "./Blocks/Emitters/customShapeBlock";
import { MeshShapeBlock } from "./Blocks/Emitters/meshShapeBlock";
import { PointShapeBlock } from "./Blocks/Emitters/pointShapeBlock";
import { SetupSpriteSheetBlock } from "./Blocks/Emitters/setupSpriteSheetBlock";
import { SphereShapeBlock } from "./Blocks/Emitters/sphereShapeBlock";
import { UpdateAngleBlock } from "./Blocks/Update/updateAngleBlock";
import { BasicSpriteUpdateBlock } from "./Blocks/Update/basicSpriteUpdateBlock";
import { UpdateAttractorBlock } from "./Blocks/Update/updateAttractorBlock";
import { UpdateColorBlock } from "./Blocks/Update/updateColorBlock";
import { UpdateDirectionBlock } from "./Blocks/Update/updateDirectionBlock";
import { UpdateFlowMapBlock } from "./Blocks/Update/updateFlowMapBlock";
import { UpdateNoiseBlock } from "./Blocks/Update/updateNoiseBlock";
import { UpdatePositionBlock } from "./Blocks/Update/updatePositionBlock";
import { UpdateSizeBlock } from "./Blocks/Update/updateSizeBlock";
import { UpdateRemapBlock } from "./Blocks/Update/updateRemapBlock";
import { GenerateBase64StringFromPixelData } from "core/Misc/copyTools";

/** Represents blocks or groups of blocks that can be used in multiple places in the graph, so they are stored in this context to be reused */
type ConversionContext = {
    targetStopDurationBlockOutput: NodeParticleConnectionPoint;
    // Connections that represent calculated ratios values
    timeToStopTimeRatioBlockGroupOutput: NodeParticleConnectionPoint;
    ageToLifeTimeRatioBlockGroupOutput: NodeParticleConnectionPoint;
    // Connections for the start value of a gradient. These are stored so they can be reused for the Creation phase and the Update phase of the particle
    sizeGradientValue0Output: NodeParticleConnectionPoint;
    colorGradientValue0Output: NodeParticleConnectionPoint;
    // Updated scaled direction direction based on velocity and drag
    scaledDirection: NodeParticleConnectionPoint;
};

type RuntimeConversionContext = Partial<ConversionContext>;

/**
 * Converts a ParticleSystem to a NodeParticleSystemSet.
 * @param name The name of the node particle system set.
 * @param particleSystemsList The particle systems to convert.
 * @returns The converted node particle system set or null if conversion failed.
 */
export async function ConvertToNodeParticleSystemSetAsync(name: string, particleSystemsList: ParticleSystem[]): Promise<Nullable<NodeParticleSystemSet>> {
    if (!particleSystemsList || !particleSystemsList.length) {
        return null;
    }

    const nodeParticleSystemSet = new NodeParticleSystemSet(name);
    const promises: Promise<void>[] = [];

    for (const particleSystem of particleSystemsList) {
        promises.push(_ExtractDatafromParticleSystemAsync(nodeParticleSystemSet, particleSystem, {}));
    }

    await Promise.all(promises);
    return nodeParticleSystemSet;
}

async function _ExtractDatafromParticleSystemAsync(newSet: NodeParticleSystemSet, oldSystem: ParticleSystem, context: RuntimeConversionContext): Promise<void> {
    // CreateParticle block group
    const createParticleOutput = _CreateParticleBlockGroup(oldSystem, context);

    // UpdateParticle block group
    const updateParticleOutput = _UpdateParticleBlockGroup(createParticleOutput, oldSystem, context);

    // System block
    const newSystem = _SystemBlockGroup(updateParticleOutput, oldSystem, context);

    // Register
    newSet.systemBlocks.push(newSystem);
}

// ------------- CREATE PARTICLE FUNCTIONS -------------

// The creation of the different properties follows the order they are added to the CreationQueue in ThinParticleSystem:
// Lifetime, Emit Power, Size, Scale/StartSize, Angle, Color, Noise, ColorDead, Ramp, Sheet
function _CreateParticleBlockGroup(oldSystem: ParticleSystem, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    // Create particle block
    const createParticleBlock = new CreateParticleBlock("Create Particle");
    let createdParticle = createParticleBlock.particle;

    _CreateParticleLifetimeBlockGroup(oldSystem, context).connectTo(createParticleBlock.lifeTime);
    _CreateParticleEmitPowerBlockGroup(oldSystem).connectTo(createParticleBlock.emitPower);
    _CreateParticleSizeBlockGroup(oldSystem, context).connectTo(createParticleBlock.size);
    _CreateParticleScaleBlockGroup(oldSystem, context).connectTo(createParticleBlock.scale);
    _CreateParticleAngleBlockGroup(oldSystem).connectTo(createParticleBlock.angle);
    _CreateParticleColorBlockGroup(oldSystem, context).connectTo(createParticleBlock.color);

    // Dead color
    _CreateAndConnectInput("Dead Color", oldSystem.colorDead.clone(), createParticleBlock.colorDead);

    // Emitter shape
    createdParticle = _EmitterShapeBlock(createdParticle, oldSystem);

    // Sprite sheet setup
    if (oldSystem.isAnimationSheetEnabled) {
        createdParticle = _SpriteSheetBlock(createdParticle, oldSystem);
    }

    return createdParticle;
}

/**
 * Creates the group of blocks that represent the particle lifetime
 * @param oldSystem The old particle system to convert
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle lifetime
 */
function _CreateParticleLifetimeBlockGroup(oldSystem: ParticleSystem, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    if (oldSystem.targetStopDuration && oldSystem._lifeTimeGradients && oldSystem._lifeTimeGradients.length > 0) {
        context.timeToStopTimeRatioBlockGroupOutput = _CreateTimeToStopTimeRatioBlockGroup(oldSystem.targetStopDuration, context);
        const gradientBlockGroupOutput = _CreateGradientBlockGroup(
            context.timeToStopTimeRatioBlockGroupOutput,
            oldSystem._lifeTimeGradients,
            ParticleRandomBlockLocks.PerParticle,
            "Lifetime"
        );
        return gradientBlockGroupOutput;
    } else {
        const randomLifetimeBlock = new ParticleRandomBlock("Random Lifetime");
        _CreateAndConnectInput("Min Lifetime", oldSystem.minLifeTime, randomLifetimeBlock.min);
        _CreateAndConnectInput("Max Lifetime", oldSystem.maxLifeTime, randomLifetimeBlock.max);
        return randomLifetimeBlock.output;
    }
}

/**
 * Creates the group of blocks that represent the particle emit power
 * @param oldSystem The old particle system to convert
 * @returns The output of the group of blocks that represent the particle emit power
 */
function _CreateParticleEmitPowerBlockGroup(oldSystem: ParticleSystem): NodeParticleConnectionPoint {
    const randomEmitPowerBlock = new ParticleRandomBlock("Random Emit Power");
    _CreateAndConnectInput("Min Emit Power", oldSystem.minEmitPower, randomEmitPowerBlock.min);
    _CreateAndConnectInput("Max Emit Power", oldSystem.maxEmitPower, randomEmitPowerBlock.max);
    return randomEmitPowerBlock.output;
}

/**
 * Creates the group of blocks that represent the particle size
 * @param oldSystem The old particle system to convert
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle size
 */
function _CreateParticleSizeBlockGroup(oldSystem: ParticleSystem, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    if (oldSystem._sizeGradients && oldSystem._sizeGradients.length > 0) {
        context.sizeGradientValue0Output = _CreateParticleInitialValueFromGradient(oldSystem._sizeGradients);
        return context.sizeGradientValue0Output;
    } else {
        const randomSizeBlock = new ParticleRandomBlock("Random size");
        _CreateAndConnectInput("Min size", oldSystem.minSize, randomSizeBlock.min);
        _CreateAndConnectInput("Max size", oldSystem.maxSize, randomSizeBlock.max);
        return randomSizeBlock.output;
    }
}

/**
 * Creates the group of blocks that represent the particle scale
 * @param oldSystem The old particle system to convert
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle scale
 */
function _CreateParticleScaleBlockGroup(oldSystem: ParticleSystem, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    // Create the random scale
    const randomScaleBlock = new ParticleRandomBlock("Random Scale");
    _CreateAndConnectInput("Min Scale", new Vector2(oldSystem.minScaleX, oldSystem.minScaleY), randomScaleBlock.min);
    _CreateAndConnectInput("Max Scale", new Vector2(oldSystem.maxScaleX, oldSystem.maxScaleY), randomScaleBlock.max);

    if (oldSystem.targetStopDuration && oldSystem._startSizeGradients && oldSystem._startSizeGradients.length > 0) {
        // Create the start size gradient
        context.timeToStopTimeRatioBlockGroupOutput = _CreateTimeToStopTimeRatioBlockGroup(oldSystem.targetStopDuration, context);
        const gradientBlockGroupOutput = _CreateGradientBlockGroup(
            context.timeToStopTimeRatioBlockGroupOutput,
            oldSystem._startSizeGradients,
            ParticleRandomBlockLocks.PerParticle,
            "Start Size"
        );

        // Multiply the initial random scale by the start size gradient
        const multiplyScaleBlock = new ParticleMathBlock("Multiply Scale by Start Size Gradient");
        multiplyScaleBlock.operation = ParticleMathBlockOperations.Multiply;
        randomScaleBlock.output.connectTo(multiplyScaleBlock.left);
        gradientBlockGroupOutput.connectTo(multiplyScaleBlock.right);

        return multiplyScaleBlock.output;
    } else {
        return randomScaleBlock.output;
    }
}

/**
 * Creates the group of blocks that represent the particle angle (rotation)
 * @param oldSystem The old particle system to convert
 * @returns The output of the group of blocks that represent the particle angle (rotation)
 */
function _CreateParticleAngleBlockGroup(oldSystem: ParticleSystem): NodeParticleConnectionPoint {
    const randomRotationBlock = new ParticleRandomBlock("Random Rotation");
    _CreateAndConnectInput("Min Rotation", oldSystem.minInitialRotation, randomRotationBlock.min);
    _CreateAndConnectInput("Max Rotation", oldSystem.maxInitialRotation, randomRotationBlock.max);
    return randomRotationBlock.output;
}

/**
 * Creates the group of blocks that represent the particle color
 * @param oldSystem The old particle system to convert
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle color
 */
function _CreateParticleColorBlockGroup(oldSystem: ParticleSystem, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    if (oldSystem._colorGradients && oldSystem._colorGradients.length > 0) {
        context.colorGradientValue0Output = _CreateParticleInitialValueFromGradient(oldSystem._colorGradients);
        return context.colorGradientValue0Output;
    } else {
        const randomColorBlock = new ParticleRandomBlock("Random color");
        _CreateAndConnectInput("Color 1", oldSystem.color1.clone(), randomColorBlock.min);
        _CreateAndConnectInput("Color 2", oldSystem.color2.clone(), randomColorBlock.max);
        return randomColorBlock.output;
    }
}

function _CreateParticleInitialValueFromGradient(gradients: Array<FactorGradient> | Array<ColorGradient>): NodeParticleConnectionPoint {
    if (gradients.length === 0) {
        throw new Error("No gradients provided.");
    }

    const gradientStep = gradients[0];
    const value1 = (gradientStep as any).factor1 ?? (gradientStep as any).color1;
    const value2 = (gradientStep as any).factor2 ?? (gradientStep as any).color2;

    if (value2 !== undefined) {
        // Create a random between value1 and value2
        const randomBlock = new ParticleRandomBlock("Random Value 0");
        randomBlock.lockMode = ParticleRandomBlockLocks.OncePerParticle;
        _CreateAndConnectInput("Value 1", value1, randomBlock.min);
        _CreateAndConnectInput("Value 2", value2, randomBlock.max);
        return randomBlock.output;
    } else {
        // Single value
        const sizeBlock = new ParticleInputBlock("Value");
        sizeBlock.value = value1;
        return sizeBlock.output;
    }
}

function _EmitterShapeBlock(particle: NodeParticleConnectionPoint, oldSystem: IParticleSystem): NodeParticleConnectionPoint {
    const emitter = oldSystem.particleEmitterType;
    if (!emitter) {
        throw new Error("Particle system has no emitter type.");
    }

    let shapeBlock: Nullable<IShapeBlock> = null;
    switch (emitter.getClassName()) {
        case "BoxParticleEmitter": {
            const source = emitter as BoxParticleEmitter;
            shapeBlock = new BoxShapeBlock("Box Shape");

            const target = shapeBlock as BoxShapeBlock;
            _CreateAndConnectInput("Direction 1", source.direction1.clone(), target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2.clone(), target.direction2);
            _CreateAndConnectInput("Min Emit Box", source.minEmitBox.clone(), target.minEmitBox);
            _CreateAndConnectInput("Max Emit Box", source.maxEmitBox.clone(), target.maxEmitBox);
            break;
        }
        case "ConeParticleEmitter": {
            const source = emitter as ConeParticleEmitter;
            shapeBlock = new ConeShapeBlock("Cone Shape");

            const target = shapeBlock as ConeShapeBlock;
            target.emitFromSpawnPointOnly = source.emitFromSpawnPointOnly;
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Angle", source.angle, target.angle);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Height Range", source.heightRange, target.heightRange);
            _CreateAndConnectInput("Direction Randomizer", source.directionRandomizer, target.directionRandomizer);
            break;
        }
        case "ConeDirectedParticleEmitter": {
            const source = emitter as ConeDirectedParticleEmitter;
            shapeBlock = new ConeShapeBlock("Cone Shape");

            const target = shapeBlock as ConeShapeBlock;
            target.emitFromSpawnPointOnly = source.emitFromSpawnPointOnly;
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Angle", source.angle, target.angle);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Height Range", source.heightRange, target.heightRange);
            _CreateAndConnectInput("Direction 1", source.direction1.clone(), target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2.clone(), target.direction2);
            break;
        }
        case "CustomParticleEmitter": {
            const source = emitter as CustomParticleEmitter;
            shapeBlock = new CustomShapeBlock("Custom Shape");

            const target = shapeBlock as CustomShapeBlock;
            target.particlePositionGenerator = source.particlePositionGenerator;
            target.particleDestinationGenerator = source.particleDestinationGenerator;
            target.particleDirectionGenerator = source.particleDirectionGenerator;
            break;
        }
        case "CylinderParticleEmitter": {
            const source = emitter as CylinderParticleEmitter;
            shapeBlock = new CylinderShapeBlock("Cylinder Shape");

            const target = shapeBlock as CylinderShapeBlock;
            _CreateAndConnectInput("Height", source.height, target.height);
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Direction Randomizer", source.directionRandomizer, target.directionRandomizer);
            break;
        }
        case "CylinderDirectedParticleEmitter": {
            const source = emitter as CylinderDirectedParticleEmitter;
            shapeBlock = new CylinderShapeBlock("Cylinder Shape");

            const target = shapeBlock as CylinderShapeBlock;
            _CreateAndConnectInput("Height", source.height, target.height);
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Direction 1", source.direction1.clone(), target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2.clone(), target.direction2);
            break;
        }
        case "HemisphericParticleEmitter": {
            const source = emitter as HemisphericParticleEmitter;
            shapeBlock = new SphereShapeBlock("Sphere Shape");

            const target = shapeBlock as SphereShapeBlock;
            target.isHemispheric = true;
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Direction Randomizer", source.directionRandomizer, target.directionRandomizer);
            break;
        }
        case "MeshParticleEmitter": {
            const source = emitter as MeshParticleEmitter;
            shapeBlock = new MeshShapeBlock("Mesh Shape");

            const target = shapeBlock as MeshShapeBlock;
            target.useMeshNormalsForDirection = source.useMeshNormalsForDirection;
            _CreateAndConnectInput("Direction 1", source.direction1.clone(), target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2.clone(), target.direction2);

            target.mesh = source.mesh as Mesh;
            break;
        }
        case "PointParticleEmitter": {
            const source = emitter as PointParticleEmitter;
            shapeBlock = new PointShapeBlock("Point Shape");

            const target = shapeBlock as PointShapeBlock;
            _CreateAndConnectInput("Direction 1", source.direction1.clone(), target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2.clone(), target.direction2);
            break;
        }
        case "SphereParticleEmitter": {
            const source = emitter as SphereParticleEmitter;
            shapeBlock = new SphereShapeBlock("Sphere Shape");

            const target = shapeBlock as SphereShapeBlock;
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Direction Randomizer", source.directionRandomizer, target.directionRandomizer);
            break;
        }
        case "SphereDirectedParticleEmitter": {
            const source = emitter as SphereDirectedParticleEmitter;
            shapeBlock = new SphereShapeBlock("Sphere Shape");

            const target = shapeBlock as SphereShapeBlock;
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Direction1", source.direction1.clone(), target.direction1);
            _CreateAndConnectInput("Direction2", source.direction2.clone(), target.direction2);
            break;
        }
    }

    if (!shapeBlock) {
        throw new Error(`Unsupported particle emitter type: ${emitter.getClassName()}`);
    }

    particle.connectTo(shapeBlock.particle);
    return shapeBlock.output;
}

function _SpriteSheetBlock(particle: NodeParticleConnectionPoint, oldSystem: ParticleSystem): NodeParticleConnectionPoint {
    const spriteSheetBlock = new SetupSpriteSheetBlock("Sprite Sheet Setup");
    particle.connectTo(spriteSheetBlock.particle);

    spriteSheetBlock.start = oldSystem.startSpriteCellID;
    spriteSheetBlock.end = oldSystem.endSpriteCellID;
    spriteSheetBlock.width = oldSystem.spriteCellWidth;
    spriteSheetBlock.height = oldSystem.spriteCellHeight;
    spriteSheetBlock.spriteCellChangeSpeed = oldSystem.spriteCellChangeSpeed;
    spriteSheetBlock.loop = oldSystem.spriteCellLoop;
    spriteSheetBlock.randomStartCell = oldSystem.spriteRandomStartCell;

    return spriteSheetBlock.output;
}

// ------------- UPDATE PARTICLE FUNCTIONS -------------

/**
 * Creates the group of blocks that represent the particle system update
 * The creation of the different properties follows the order they are added to the ProcessQueue in ThinParticleSystem:
 * Color, AngularSpeedGradients, AngularSpeed, VelocityGradients, Direction, LimitVelocityGradients, DragGradients, Position, Noise, SizeGradients, Gravity, RemapGradients
 * @param inputParticle The particle input connection point
 * @param oldSystem The old particle system to convert
 * @param context The runtime conversion context
 * @returns The output connection point after all updates have been applied
 */
function _UpdateParticleBlockGroup(inputParticle: NodeParticleConnectionPoint, oldSystem: ParticleSystem, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    let updatedParticle: NodeParticleConnectionPoint = inputParticle;

    updatedParticle = _UpdateParticleColorBlockGroup(updatedParticle, oldSystem._colorGradients, context);
    updatedParticle = _UpdateParticleAngleBlockGroup(updatedParticle, oldSystem._angularSpeedGradients, oldSystem.minAngularSpeed, oldSystem.maxAngularSpeed, context);

    if (oldSystem._velocityGradients && oldSystem._velocityGradients.length > 0) {
        context.scaledDirection = _UpdateParticleVelocityGradientBlockGroup(oldSystem._velocityGradients, context);
    }

    if (oldSystem._dragGradients && oldSystem._dragGradients.length > 0) {
        context.scaledDirection = _UpdateParticleDragGradientBlockGroup(oldSystem._dragGradients, context);
    }

    updatedParticle = _UpdateParticlePositionBlockGroup(updatedParticle, oldSystem.isLocal, context);

    if (oldSystem.attractors && oldSystem.attractors.length > 0) {
        updatedParticle = _UpdateParticleAttractorBlockGroup(updatedParticle, oldSystem.attractors);
    }

    if (oldSystem.flowMap) {
        updatedParticle = _UpdateParticleFlowMapBlockGroup(updatedParticle, oldSystem.flowMap, oldSystem.flowMapStrength);
    }

    if (oldSystem._limitVelocityGradients && oldSystem._limitVelocityGradients.length > 0 && oldSystem.limitVelocityDamping !== 0) {
        updatedParticle = _UpdateParticleVelocityLimitGradientBlockGroup(updatedParticle, oldSystem._limitVelocityGradients, oldSystem.limitVelocityDamping, context);
    }

    if (oldSystem.noiseTexture && oldSystem.noiseStrength) {
        updatedParticle = _UpdateParticleNoiseBlockGroup(updatedParticle, oldSystem.noiseTexture.clone(), oldSystem.noiseStrength.clone());
    }

    if (oldSystem._sizeGradients && oldSystem._sizeGradients.length > 0) {
        updatedParticle = _UpdateParticleSizeGradientBlockGroup(updatedParticle, oldSystem._sizeGradients, context);
    }

    if (oldSystem.gravity.equalsToFloats(0, 0, 0) === false) {
        updatedParticle = _UpdateParticleGravityBlockGroup(updatedParticle, oldSystem.gravity);
    }

    if (oldSystem.useRampGradients) {
        updatedParticle = _UpdateParticleRemapGradientBlockGroup(updatedParticle, oldSystem.getColorRemapGradients(), oldSystem.getAlphaRemapGradients(), context);
    }

    if (oldSystem.isAnimationSheetEnabled) {
        updatedParticle = _UpdateParticleSpriteCellBlockGroup(updatedParticle);
    }

    return updatedParticle;
}

/**
 * Creates the group of blocks that represent the particle color update
 * @param inputParticle The input particle to update
 * @param colorGradients The color gradients (if any)
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle color update
 */
function _UpdateParticleColorBlockGroup(
    inputParticle: NodeParticleConnectionPoint,
    colorGradients: Nullable<Array<ColorGradient>>,
    context: RuntimeConversionContext
): NodeParticleConnectionPoint {
    let colorCalculation: NodeParticleConnectionPoint | undefined = undefined;
    if (colorGradients && colorGradients.length > 0) {
        if (context.colorGradientValue0Output === undefined) {
            throw new Error("Initial color gradient values not found in context.");
        }

        context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);
        colorCalculation = _CreateGradientBlockGroup(context.ageToLifeTimeRatioBlockGroupOutput, colorGradients, ParticleRandomBlockLocks.OncePerParticle, "Color", [
            context.colorGradientValue0Output,
        ]);
    } else {
        colorCalculation = _BasicColorUpdateBlockGroup();
    }

    // Create the color update block clamping alpha >= 0
    const colorUpdateBlock = new UpdateColorBlock("Color update");
    inputParticle.connectTo(colorUpdateBlock.particle);
    _ClampUpdateColorAlpha(colorCalculation).connectTo(colorUpdateBlock.color);

    return colorUpdateBlock.output;
}

/**
 * Creates the group of blocks that represent the particle angle update
 * @param inputParticle The input particle to update
 * @param angularSpeedGradients The angular speed gradients (if any)
 * @param minAngularSpeed The minimum angular speed
 * @param maxAngularSpeed The maximum angular speed
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle color update
 */
function _UpdateParticleAngleBlockGroup(
    inputParticle: NodeParticleConnectionPoint,
    angularSpeedGradients: Nullable<Array<FactorGradient>>,
    minAngularSpeed: number,
    maxAngularSpeed: number,
    context: RuntimeConversionContext
): NodeParticleConnectionPoint {
    // We will try to use gradients if they exist
    // If not, we will try to use min/max angular speed
    let angularSpeedCalculation = null;
    if (angularSpeedGradients && angularSpeedGradients.length > 0) {
        angularSpeedCalculation = _UpdateParticleAngularSpeedGradientBlockGroup(angularSpeedGradients, context);
    } else if (minAngularSpeed !== 0 || maxAngularSpeed !== 0) {
        angularSpeedCalculation = _UpdateParticleAngularSpeedBlockGroup(minAngularSpeed, maxAngularSpeed);
    }

    // If we have an angular speed calculation, then update the angle
    if (angularSpeedCalculation) {
        // Create the angular speed delta
        const angleSpeedDeltaOutput = _CreateDeltaModifiedInput("Angular Speed", angularSpeedCalculation);

        // Add it to the angle
        const addAngle = new ParticleMathBlock("Add Angular Speed to Angle");
        addAngle.operation = ParticleMathBlockOperations.Add;
        _CreateAndConnectContextualSource("Angle", NodeParticleContextualSources.Angle, addAngle.left);
        angleSpeedDeltaOutput.connectTo(addAngle.right);

        // Update the particle angle
        const updateAngle = new UpdateAngleBlock("Angle Update with Angular Speed");
        inputParticle.connectTo(updateAngle.particle);
        addAngle.output.connectTo(updateAngle.angle);

        return updateAngle.output;
    } else {
        return inputParticle;
    }
}

/**
 * Creates the group of blocks that represent the particle velocity update
 * @param velocityGradients The velocity gradients
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle velocity update
 */
function _UpdateParticleVelocityGradientBlockGroup(velocityGradients: Array<FactorGradient>, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);

    // Generate the gradient
    const velocityValueOutput = _CreateGradientBlockGroup(context.ageToLifeTimeRatioBlockGroupOutput, velocityGradients, ParticleRandomBlockLocks.OncePerParticle, "Velocity");

    // Update the direction scale based on the velocity
    const multiplyScaleByVelocity = new ParticleMathBlock("Multiply Direction Scale by Velocity");
    multiplyScaleByVelocity.operation = ParticleMathBlockOperations.Multiply;
    velocityValueOutput.connectTo(multiplyScaleByVelocity.left);
    _CreateAndConnectContextualSource("Direction Scale", NodeParticleContextualSources.DirectionScale, multiplyScaleByVelocity.right);

    // Update the particle direction scale
    const multiplyDirection = new ParticleMathBlock("Scaled Direction");
    multiplyDirection.operation = ParticleMathBlockOperations.Multiply;
    multiplyScaleByVelocity.output.connectTo(multiplyDirection.left);
    _CreateAndConnectContextualSource("Direction", NodeParticleContextualSources.Direction, multiplyDirection.right);

    // Store the new calculation of the scaled direction in the context
    context.scaledDirection = multiplyDirection.output;
    return multiplyDirection.output;
}

/**
 * Creates the group of blocks that represent the particle velocity limit update
 * @param inputParticle The input particle to update
 * @param velocityLimitGradients The velocity limit gradients
 * @param limitVelocityDamping The limit velocity damping factor
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle velocity limit update
 */
function _UpdateParticleVelocityLimitGradientBlockGroup(
    inputParticle: NodeParticleConnectionPoint,
    velocityLimitGradients: Array<FactorGradient>,
    limitVelocityDamping: number,
    context: RuntimeConversionContext
): NodeParticleConnectionPoint {
    context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);

    // Calculate the current speed
    const currentSpeedBlock = new ParticleVectorLengthBlock("Current Speed");
    _CreateAndConnectContextualSource("Direction", NodeParticleContextualSources.Direction, currentSpeedBlock.input);

    // Calculate the velocity limit from the gradient
    const velocityLimitValueOutput = _CreateGradientBlockGroup(
        context.ageToLifeTimeRatioBlockGroupOutput,
        velocityLimitGradients,
        ParticleRandomBlockLocks.OncePerParticle,
        "Velocity Limit"
    );

    // Blocks that will calculate the new velocity if over the limit
    const damped = new ParticleMathBlock("Damped Speed");
    damped.operation = ParticleMathBlockOperations.Multiply;
    _CreateAndConnectContextualSource("Direction", NodeParticleContextualSources.Direction, damped.left);
    _CreateAndConnectInput("Limit Velocity Damping", limitVelocityDamping, damped.right);

    // Compare current speed and limit
    const compareSpeed = new ParticleConditionBlock("Compare Speed to Limit");
    compareSpeed.test = ParticleConditionBlockTests.GreaterThan;
    currentSpeedBlock.output.connectTo(compareSpeed.left);
    velocityLimitValueOutput.connectTo(compareSpeed.right);
    damped.output.connectTo(compareSpeed.ifTrue);
    _CreateAndConnectContextualSource("Direction", NodeParticleContextualSources.Direction, compareSpeed.ifFalse);

    // Update the direction based on the calculted value
    const updateDirection = new UpdateDirectionBlock("Direction Update");
    inputParticle.connectTo(updateDirection.particle);
    compareSpeed.output.connectTo(updateDirection.direction);

    return updateDirection.output;
}

/**
 * Creates the group of blocks that represent the particle noise update
 * @param inputParticle The particle to update
 * @param noiseTexture The noise texture
 * @param noiseStrength The strength of the noise
 * @returns The output of the group of blocks that represent the particle noise update
 */
function _UpdateParticleNoiseBlockGroup(inputParticle: NodeParticleConnectionPoint, noiseTexture: ProceduralTexture, noiseStrength: Vector3): NodeParticleConnectionPoint {
    const noiseUpdate = new UpdateNoiseBlock("Noise Update");
    inputParticle.connectTo(noiseUpdate.particle);
    _CreateTextureBlock(noiseTexture).connectTo(noiseUpdate.noiseTexture);
    _CreateAndConnectInput("Noise Strength", noiseStrength, noiseUpdate.strength);
    return noiseUpdate.output;
}

/**
 * Creates the group of blocks that represent the particle drag update
 * @param dragGradients The drag gradients
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle drag update
 */
function _UpdateParticleDragGradientBlockGroup(dragGradients: Array<FactorGradient>, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);

    // Generate the gradient
    const dragValueOutput = _CreateGradientBlockGroup(context.ageToLifeTimeRatioBlockGroupOutput, dragGradients, ParticleRandomBlockLocks.OncePerParticle, "Drag");

    // Calculate drag factor
    const oneMinusDragBlock = new ParticleMathBlock("1 - Drag");
    oneMinusDragBlock.operation = ParticleMathBlockOperations.Subtract;
    _CreateAndConnectInput("One", 1, oneMinusDragBlock.left);
    dragValueOutput.connectTo(oneMinusDragBlock.right);

    // Multiply the scaled direction by drag factor
    const multiplyDirection = new ParticleMathBlock("Scaled Direction with Drag");
    multiplyDirection.operation = ParticleMathBlockOperations.Multiply;
    oneMinusDragBlock.output.connectTo(multiplyDirection.left);
    if (context.scaledDirection === undefined) {
        _CreateAndConnectContextualSource("Scaled Direction", NodeParticleContextualSources.ScaledDirection, multiplyDirection.right);
    } else {
        context.scaledDirection.connectTo(multiplyDirection.right);
    }

    // Store the new calculation of the scaled direction in the context
    context.scaledDirection = multiplyDirection.output;
    return multiplyDirection.output;
}

/**
 * Creates the group of blocks that represent the particle position update
 * @param inputParticle The input particle to update
 * @param isLocal Whether the particle coordinate system is local or not
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle position update
 */
function _UpdateParticlePositionBlockGroup(inputParticle: NodeParticleConnectionPoint, isLocal: boolean, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    // Update the particle position
    const updatePosition = new UpdatePositionBlock("Position Update");
    inputParticle.connectTo(updatePosition.particle);

    if (isLocal) {
        _CreateAndConnectContextualSource("Local Position Updated", NodeParticleContextualSources.LocalPositionUpdated, updatePosition.position);
    } else {
        // Calculate the new position
        const addPositionBlock = new ParticleMathBlock("Add Position");
        addPositionBlock.operation = ParticleMathBlockOperations.Add;
        _CreateAndConnectContextualSource("Position", NodeParticleContextualSources.Position, addPositionBlock.left);
        if (context.scaledDirection === undefined) {
            _CreateAndConnectContextualSource("Scaled Direction", NodeParticleContextualSources.ScaledDirection, addPositionBlock.right);
        } else {
            context.scaledDirection.connectTo(addPositionBlock.right);
        }

        addPositionBlock.output.connectTo(updatePosition.position);
    }

    return updatePosition.output;
}

/**
 * Creates the group of blocks that represent the particle attractor update
 * @param inputParticle The input particle to update
 * @param attractors The attractors (if any)
 * @returns The output of the group of blocks that represent the particle attractor update
 */
function _UpdateParticleAttractorBlockGroup(inputParticle: NodeParticleConnectionPoint, attractors: Attractor[]): NodeParticleConnectionPoint {
    let outputParticle = inputParticle;

    // Chain update attractor blocks for each attractor
    for (let i = 0; i < attractors.length; i++) {
        const attractor = attractors[i];
        const attractorBlock = new UpdateAttractorBlock(`Attractor Block ${i}`);
        outputParticle.connectTo(attractorBlock.particle);
        _CreateAndConnectInput("Attractor Position", attractor.position.clone(), attractorBlock.attractor);
        _CreateAndConnectInput("Attractor Strength", attractor.strength, attractorBlock.strength);
        outputParticle = attractorBlock.output;
    }

    return outputParticle;
}

/**
 * Creates the group of blocks that represent the particle flow map update
 * @param inputParticle The input particle to update
 * @param flowMap The flow map data
 * @param flowMapStrength The strength of the flow map
 * @returns The output of the group of blocks that represent the particle flow map update
 */
function _UpdateParticleFlowMapBlockGroup(inputParticle: NodeParticleConnectionPoint, flowMap: FlowMap, flowMapStrength: number): NodeParticleConnectionPoint {
    // Create the flow map update block
    const updateFlowMapBlock = new UpdateFlowMapBlock("Flow Map Update");
    inputParticle.connectTo(updateFlowMapBlock.particle);

    // Create a texture block from the flow map data
    // The FlowMap only stores raw pixel data, so we need to convert it to a base64 data URL
    // Y has to be flipped as the texture data is flipped between CPU (canvas, Y=0 at top) and GPU (texture, Y=0 at bottom)
    const flowMapTextureBlock = new ParticleTextureSourceBlock("Flow Map Texture");
    flowMapTextureBlock.serializedCachedData = true;
    flowMapTextureBlock.textureDataUrl = GenerateBase64StringFromPixelData(flowMap.data, { width: flowMap.width, height: flowMap.height }, true) ?? "";
    flowMapTextureBlock.texture.connectTo(updateFlowMapBlock.flowMap);

    _CreateAndConnectInput("Flow Map Strength", flowMapStrength, updateFlowMapBlock.strength);

    return updateFlowMapBlock.output;
}

/**
 * Creates the group of blocks that represent the particle size update
 * @param inputParticle The input particle to update
 * @param sizeGradients The size gradients (if any)
 * @param context The context of the current conversion
 * @returns The output of the group of blocks that represent the particle size update
 */
function _UpdateParticleSizeGradientBlockGroup(
    inputParticle: NodeParticleConnectionPoint,
    sizeGradients: Array<FactorGradient>,
    context: RuntimeConversionContext
): NodeParticleConnectionPoint {
    if (context.sizeGradientValue0Output === undefined) {
        throw new Error("Initial size gradient values not found in context.");
    }

    context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);

    // Generate the gradient
    const sizeValueOutput = _CreateGradientBlockGroup(context.ageToLifeTimeRatioBlockGroupOutput, sizeGradients, ParticleRandomBlockLocks.OncePerParticle, "Size", [
        context.sizeGradientValue0Output,
    ]);

    // Create the update size
    const updateSizeBlock = new UpdateSizeBlock("Size Update");
    inputParticle.connectTo(updateSizeBlock.particle);
    sizeValueOutput.connectTo(updateSizeBlock.size);

    return updateSizeBlock.output;
}

/**
 * Creates the group of blocks that represent the particle gravity update
 * @param inputParticle The input particle to update
 * @param gravity The gravity vector to apply
 * @returns The output of the group of blocks that represent the particle gravity update
 */
function _UpdateParticleGravityBlockGroup(inputParticle: NodeParticleConnectionPoint, gravity: Vector3): NodeParticleConnectionPoint {
    // Create the gravity delta
    const gravityDeltaOutput = _CreateDeltaModifiedInput("Gravity", gravity);

    // Add it to the direction
    const addDirectionBlock = new ParticleMathBlock("Add Gravity to Direction");
    addDirectionBlock.operation = ParticleMathBlockOperations.Add;
    _CreateAndConnectContextualSource("Direction", NodeParticleContextualSources.Direction, addDirectionBlock.left);
    gravityDeltaOutput.connectTo(addDirectionBlock.right);

    // Update the particle direction
    const updateDirection = new UpdateDirectionBlock("Direction Update with Gravity");
    inputParticle.connectTo(updateDirection.particle);
    addDirectionBlock.output.connectTo(updateDirection.direction);

    return updateDirection.output;
}

/**
 * Creates the group of blocks that represent the color and alpha remap update
 * @param inputParticle The input particle to update
 * @param colorRemapGradients The color remap gradients
 * @param alphaRemapGradients The alpha remap gradients
 * @param context The context of the current conversion
 * @returns The ouput of the group of blocks that represent the particle remap update
 */
function _UpdateParticleRemapGradientBlockGroup(
    inputParticle: NodeParticleConnectionPoint,
    colorRemapGradients: Nullable<Array<FactorGradient>>,
    alphaRemapGradients: Nullable<Array<FactorGradient>>,
    context: RuntimeConversionContext
): NodeParticleConnectionPoint {
    let hasUpdate = false;

    const remapUpdateBlock = new UpdateRemapBlock("Remap Update");

    if (colorRemapGradients && colorRemapGradients.length > 0) {
        context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);

        // Split the color gradient into factor1 and factor2 gradients
        const colorFactor1Gradients: Array<FactorGradient> = [];
        const colorFactor2Gradients: Array<FactorGradient> = [];

        for (let i = 0; i < colorRemapGradients.length; i++) {
            const gradientValue = colorRemapGradients[i];

            colorFactor1Gradients.push(new FactorGradient(gradientValue.gradient, gradientValue.factor1));
            colorFactor2Gradients.push(new FactorGradient(gradientValue.gradient, gradientValue.factor2!));
        }

        // Generate the gradient
        const colorFactor1BlockGroup = _CreateGradientBlockGroup(
            context.ageToLifeTimeRatioBlockGroupOutput,
            colorFactor1Gradients,
            ParticleRandomBlockLocks.OncePerParticle,
            "Color Min"
        );

        // Generate the gradient
        const colorFactor2BlockGroup = _CreateGradientBlockGroup(
            context.ageToLifeTimeRatioBlockGroupOutput,
            colorFactor2Gradients,
            ParticleRandomBlockLocks.OncePerParticle,
            "Color Max"
        );

        const substractBlock = new ParticleMathBlock("Color Max - Min");
        substractBlock.operation = ParticleMathBlockOperations.Subtract;
        colorFactor2BlockGroup.connectTo(substractBlock.left);
        colorFactor1BlockGroup.connectTo(substractBlock.right);

        const colorConverterBlock = new ParticleConverterBlock("Color Remap Converter");
        colorFactor1BlockGroup.connectTo(colorConverterBlock.xIn);
        substractBlock.output.connectTo(colorConverterBlock.yIn);

        colorConverterBlock.xyOut.connectTo(remapUpdateBlock.remapColor);

        hasUpdate = true;
    }

    if (alphaRemapGradients && alphaRemapGradients.length > 0) {
        context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);

        // Split the color gradient into factor1 and factor2 gradients
        const alphaFactor1Gradients: Array<FactorGradient> = [];
        const alphaFactor2Gradients: Array<FactorGradient> = [];

        for (let i = 0; i < alphaRemapGradients.length; i++) {
            const gradientValue = alphaRemapGradients[i];

            alphaFactor1Gradients.push(new FactorGradient(gradientValue.gradient, gradientValue.factor1));
            alphaFactor2Gradients.push(new FactorGradient(gradientValue.gradient, gradientValue.factor2!));
        }

        // Generate the gradient
        const alphaFactor1BlockGroup = _CreateGradientBlockGroup(
            context.ageToLifeTimeRatioBlockGroupOutput,
            alphaFactor1Gradients,
            ParticleRandomBlockLocks.OncePerParticle,
            "Alpha Min"
        );

        // Generate the gradient
        const alphaFactor2BlockGroup = _CreateGradientBlockGroup(
            context.ageToLifeTimeRatioBlockGroupOutput,
            alphaFactor2Gradients,
            ParticleRandomBlockLocks.OncePerParticle,
            "Alpha Max"
        );

        const substractBlock = new ParticleMathBlock("Alpha Max - Min");
        substractBlock.operation = ParticleMathBlockOperations.Subtract;
        alphaFactor2BlockGroup.connectTo(substractBlock.left);
        alphaFactor1BlockGroup.connectTo(substractBlock.right);

        const alphaConverterBlock = new ParticleConverterBlock("Alpha Remap Converter");
        alphaFactor1BlockGroup.connectTo(alphaConverterBlock.xIn);
        substractBlock.output.connectTo(alphaConverterBlock.yIn);

        alphaConverterBlock.xyOut.connectTo(remapUpdateBlock.remapAlpha);

        hasUpdate = true;
    }

    if (hasUpdate) {
        inputParticle.connectTo(remapUpdateBlock.particle);
        return remapUpdateBlock.output;
    }

    return inputParticle;
}

/**
 * Creates the group of blocks that represent the particle sprite cell update
 * @param inputParticle The input particle to update
 * @returns The output of the group of blocks that represent the particle sprite cell update #2MI0A1#3
 */
function _UpdateParticleSpriteCellBlockGroup(inputParticle: NodeParticleConnectionPoint): NodeParticleConnectionPoint {
    const updateSpriteCell = new BasicSpriteUpdateBlock("Sprite Cell Update");
    inputParticle.connectTo(updateSpriteCell.particle);
    return updateSpriteCell.output;
}

function _UpdateParticleAngularSpeedGradientBlockGroup(angularSpeedGradients: Array<FactorGradient>, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    context.ageToLifeTimeRatioBlockGroupOutput = _CreateAgeToLifeTimeRatioBlockGroup(context);

    // Generate the gradient
    const angularSpeedValueOutput = _CreateGradientBlockGroup(
        context.ageToLifeTimeRatioBlockGroupOutput,
        angularSpeedGradients,
        ParticleRandomBlockLocks.OncePerParticle,
        "Angular Speed"
    );
    return angularSpeedValueOutput;
}

function _UpdateParticleAngularSpeedBlockGroup(minAngularSpeed: number, maxAngularSpeed: number): NodeParticleConnectionPoint {
    // Random value between for the angular speed of the particle
    const randomAngularSpeedBlock = new ParticleRandomBlock("Random Angular Speed");
    randomAngularSpeedBlock.lockMode = ParticleRandomBlockLocks.OncePerParticle;
    _CreateAndConnectInput("Min Angular Speed", minAngularSpeed, randomAngularSpeedBlock.min);
    _CreateAndConnectInput("Max Angular Speed", maxAngularSpeed, randomAngularSpeedBlock.max);
    return randomAngularSpeedBlock.output;
}

function _BasicColorUpdateBlockGroup(): NodeParticleConnectionPoint {
    const addColorBlock = new ParticleMathBlock("Add Color");
    addColorBlock.operation = ParticleMathBlockOperations.Add;
    _CreateAndConnectContextualSource("Color", NodeParticleContextualSources.Color, addColorBlock.left);
    _CreateAndConnectContextualSource("Scaled Color Step", NodeParticleContextualSources.ScaledColorStep, addColorBlock.right);
    return addColorBlock.output;
}

function _ClampUpdateColorAlpha(colorCalculationOutput: NodeParticleConnectionPoint): NodeParticleConnectionPoint {
    // Decompose color to clamp alpha
    const decomposeColorBlock = new ParticleConverterBlock("Decompose Color");
    colorCalculationOutput.connectTo(decomposeColorBlock.colorIn);

    // Clamp alpha to be >= 0
    const maxAlphaBlock = new ParticleMathBlock("Alpha >= 0");
    maxAlphaBlock.operation = ParticleMathBlockOperations.Max;
    decomposeColorBlock.wOut.connectTo(maxAlphaBlock.left);
    _CreateAndConnectInput("Zero", 0, maxAlphaBlock.right);

    // Recompose color
    const composeColorBlock = new ParticleConverterBlock("Compose Color");
    decomposeColorBlock.xyzOut.connectTo(composeColorBlock.xyzIn);
    maxAlphaBlock.output.connectTo(composeColorBlock.wIn);

    return composeColorBlock.colorOut;
}

// ------------- SYSTEM FUNCTIONS -------------

function _SystemBlockGroup(updateParticleOutput: NodeParticleConnectionPoint, oldSystem: ParticleSystem, context: RuntimeConversionContext): SystemBlock {
    const newSystem = new SystemBlock(oldSystem.name);

    newSystem.translationPivot.value = oldSystem.translationPivot.clone();
    newSystem.textureMask.value = oldSystem.textureMask.clone();
    newSystem.manualEmitCount = oldSystem.manualEmitCount;
    newSystem.blendMode = oldSystem.blendMode;
    newSystem.capacity = oldSystem.getCapacity();
    newSystem.startDelay = oldSystem.startDelay;
    newSystem.updateSpeed = oldSystem.updateSpeed;
    newSystem.preWarmCycles = oldSystem.preWarmCycles;
    newSystem.preWarmStepOffset = oldSystem.preWarmStepOffset;
    newSystem.isBillboardBased = oldSystem.isBillboardBased;
    newSystem.billBoardMode = oldSystem.billboardMode;
    newSystem.isLocal = oldSystem.isLocal;
    newSystem.disposeOnStop = oldSystem.disposeOnStop;

    _SystemCustomShader(oldSystem, newSystem);

    if (oldSystem.emitter) {
        _SystemEmitterPosition(oldSystem.emitter, newSystem);
    }

    _SystemEmitRateValue(oldSystem.getEmitRateGradients(), oldSystem.targetStopDuration, oldSystem.emitRate, newSystem, context);
    _SystemTargetStopDuration(oldSystem.targetStopDuration, newSystem, context);

    const rampGradients = oldSystem.getRampGradients();
    if (rampGradients && rampGradients.length > 0) {
        _SystemRampGradientsBlockGroup(rampGradients, newSystem);
    }

    const texture = oldSystem.particleTexture;
    if (texture) {
        _CreateTextureBlock(texture).connectTo(newSystem.texture);
    }

    updateParticleOutput.connectTo(newSystem.particle);

    return newSystem;
}

function _SystemCustomShader(oldSystem: ParticleSystem, newSystem: SystemBlock) {
    if (oldSystem.customShader) {
        // Copy the custom shader configuration so it can be recreated when building the system
        newSystem.customShader = {
            shaderPath: {
                fragmentElement: oldSystem.customShader.shaderPath.fragmentElement,
            },
            shaderOptions: {
                uniforms: oldSystem.customShader.shaderOptions.uniforms.slice(),
                samplers: oldSystem.customShader.shaderOptions.samplers.slice(),
                defines: oldSystem.customShader.shaderOptions.defines.slice(),
            },
        };
    } else {
        // Check if there's a custom effect set directly without customShader metadata
        // This happens when using the ThinParticleSystem constructor with a customEffect parameter or when calling setCustomEffect directly
        const customEffect = oldSystem.getCustomEffect(0);
        if (customEffect) {
            const effectName = customEffect.name;
            const fragmentElement =
                typeof effectName === "string"
                    ? effectName
                    : ((effectName as { fragmentElement?: string; fragment?: string }).fragmentElement ?? (effectName as { fragment?: string }).fragment);

            newSystem.customShader = {
                shaderPath: {
                    fragmentElement: fragmentElement ?? "",
                },
                shaderOptions: {
                    uniforms: (customEffect as any)._uniformsNames.slice(),
                    samplers: (customEffect as any)._samplerList.slice(),
                    defines: customEffect.defines ? customEffect.defines.split("\n").filter((d) => d.length > 0) : [],
                },
            };
        }
    }
}

function _SystemEmitterPosition(emitter: TransformNode | Vector3, newSystem: SystemBlock): void {
    if (emitter) {
        _CreateAndConnectInput(
            "Emitter Position",
            emitter instanceof TransformNode ? emitter.position.clone() : emitter.clone(),
            newSystem.emitterPosition,
            NodeParticleBlockConnectionPointTypes.Vector3
        );
    }
}

function _SystemEmitRateValue(
    emitGradients: Nullable<Array<FactorGradient>>,
    targetStopDuration: number,
    emitRate: number,
    newSystem: SystemBlock,
    context: RuntimeConversionContext
): void {
    if (emitGradients && emitGradients.length > 0 && targetStopDuration > 0) {
        // Create the emit gradients
        context.timeToStopTimeRatioBlockGroupOutput = _CreateTimeToStopTimeRatioBlockGroup(targetStopDuration, context);
        const gradientValue = _CreateGradientBlockGroup(context.timeToStopTimeRatioBlockGroupOutput, emitGradients, ParticleRandomBlockLocks.PerSystem, "Emit Rate");

        // Round the value to an int
        const roundBlock = new ParticleFloatToIntBlock("Round to Int");
        roundBlock.operation = ParticleFloatToIntBlockOperations.Round;
        gradientValue.connectTo(roundBlock.input);
        roundBlock.output.connectTo(newSystem.emitRate);
    } else {
        newSystem.emitRate.value = emitRate;
    }
}

function _SystemTargetStopDuration(targetStopDuration: number, newSystem: SystemBlock, context: RuntimeConversionContext): void {
    // If something else uses the target stop duration (like a gradient),
    // then the block is already created and stored in the context
    if (context.targetStopDurationBlockOutput) {
        context.targetStopDurationBlockOutput.connectTo(newSystem.targetStopDuration);
    } else {
        // If no one used it, do not create a block just set the value
        newSystem.targetStopDuration.value = targetStopDuration;
    }
}

function _SystemRampGradientsBlockGroup(rampGradients: Color3Gradient[], newSystem: SystemBlock): void {
    const gradientBlock = new ParticleGradientBlock("Ramp Gradient Block");

    for (let i = 0; i < rampGradients.length; i++) {
        const rampGradient = rampGradients[i];

        const gradientValueBlock = new ParticleGradientValueBlock(`Ramp Gradient ${i}`);
        gradientValueBlock.reference = rampGradient.gradient;
        _CreateAndConnectInput(
            `Color ${i}`,
            new Color4(rampGradient.color.r, rampGradient.color.g, rampGradient.color.b),
            gradientValueBlock.value,
            NodeParticleBlockConnectionPointTypes.Color4
        );

        gradientValueBlock.output.connectTo(gradientBlock.inputs[i + 1]);
    }

    gradientBlock.output.connectTo(newSystem.rampGradient);
}

// ------------- UTILITY FUNCTIONS -------------

function _CreateDeltaModifiedInput(name: string, value: Vector3 | NodeParticleConnectionPoint): NodeParticleConnectionPoint {
    const multiplyBlock = new ParticleMathBlock("Multiply by Delta");
    multiplyBlock.operation = ParticleMathBlockOperations.Multiply;
    if (value instanceof Vector3) {
        _CreateAndConnectInput(name, value, multiplyBlock.left);
    } else {
        value.connectTo(multiplyBlock.left);
    }
    _CreateAndConnectSystemSource("Delta", NodeParticleSystemSources.Delta, multiplyBlock.right);

    return multiplyBlock.output;
}

function _CreateAndConnectInput(
    inputBlockName: string,
    value: number | Vector2 | Vector3 | Color4,
    targetToConnectTo: NodeParticleConnectionPoint,
    inputType?: NodeParticleBlockConnectionPointTypes
): void {
    const input = new ParticleInputBlock(inputBlockName, inputType);
    input.value = value;
    input.output.connectTo(targetToConnectTo);
}

function _CreateAndConnectContextualSource(contextualBlockName: string, contextSource: NodeParticleContextualSources, targetToConnectTo: NodeParticleConnectionPoint): void {
    const input = new ParticleInputBlock(contextualBlockName);
    input.contextualValue = contextSource;
    input.output.connectTo(targetToConnectTo);
}

function _CreateAndConnectSystemSource(systemBlockName: string, systemSource: NodeParticleSystemSources, targetToConnectTo: NodeParticleConnectionPoint): void {
    const input = new ParticleInputBlock(systemBlockName);
    input.systemSource = systemSource;
    input.output.connectTo(targetToConnectTo);
}

/**
 * Creates the target stop duration input block, as it can be shared in multiple places
 * This block is stored in the context so the same block is shared in the graph
 * @param targetStopDuration The target stop duration value
 * @param context The context of the current conversion
 * @returns
 */
function _CreateTargetStopDurationInputBlock(targetStopDuration: number, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    // If we have already created the target stop duration input block, return it
    if (context.targetStopDurationBlockOutput) {
        return context.targetStopDurationBlockOutput;
    }

    // Create the target stop duration input block if not already created
    const targetStopDurationInputBlock = new ParticleInputBlock("Target Stop Duration");
    targetStopDurationInputBlock.value = targetStopDuration;

    // Save the output in our context to avoid regenerating it again
    context.targetStopDurationBlockOutput = targetStopDurationInputBlock.output;
    return context.targetStopDurationBlockOutput;
}

/**
 * Create a group of blocks that calculates the ratio between the actual frame and the target stop duration, clamped between 0 and 1.
 * This is used to simulate the behavior of the old particle system where several particle gradient values are affected by the target stop duration.
 * This block group is stored in the context so the same group is shared in the graph
 * @param targetStopDuration The target stop duration value
 * @param context The context of the current conversion
 * @returns The ratio block output connection point
 */
function _CreateTimeToStopTimeRatioBlockGroup(targetStopDuration: number, context: RuntimeConversionContext): NodeParticleConnectionPoint {
    // If we have already generated this group, return it
    if (context.timeToStopTimeRatioBlockGroupOutput) {
        return context.timeToStopTimeRatioBlockGroupOutput;
    }

    context.targetStopDurationBlockOutput = _CreateTargetStopDurationInputBlock(targetStopDuration, context);

    // Find the ratio between the actual frame and the target stop duration
    const ratio = new ParticleMathBlock("Frame/Stop Ratio");
    ratio.operation = ParticleMathBlockOperations.Divide;
    _CreateAndConnectSystemSource("Actual Frame", NodeParticleSystemSources.Time, ratio.left);
    context.targetStopDurationBlockOutput.connectTo(ratio.right);

    // Make sure values is >=0
    const clampMin = new ParticleMathBlock("Clamp Min 0");
    clampMin.operation = ParticleMathBlockOperations.Max;
    _CreateAndConnectInput("Zero", 0, clampMin.left);
    ratio.output.connectTo(clampMin.right);

    // Make sure values is <=1
    const clampMax = new ParticleMathBlock("Clamp Max 1");
    clampMax.operation = ParticleMathBlockOperations.Min;
    _CreateAndConnectInput("One", 1, clampMax.left);
    clampMin.output.connectTo(clampMax.right);

    // Save the group output in our context to avoid regenerating it again
    context.timeToStopTimeRatioBlockGroupOutput = clampMax.output;
    return context.timeToStopTimeRatioBlockGroupOutput;
}

function _CreateAgeToLifeTimeRatioBlockGroup(context: RuntimeConversionContext): NodeParticleConnectionPoint {
    // If we have already generated this group, return it
    if (context.ageToLifeTimeRatioBlockGroupOutput) {
        return context.ageToLifeTimeRatioBlockGroupOutput;
    }

    // Find the ratio between the age and the lifetime
    const ratio = new ParticleMathBlock("Age/LifeTime Ratio");
    ratio.operation = ParticleMathBlockOperations.Divide;
    _CreateAndConnectContextualSource("Age", NodeParticleContextualSources.Age, ratio.left);
    _CreateAndConnectContextualSource("LifeTime", NodeParticleContextualSources.Lifetime, ratio.right);

    // Save the group output in our context to avoid regenerating it again
    context.ageToLifeTimeRatioBlockGroupOutput = ratio.output;
    return ratio.output;
}

/**
 * Creates the blocks that represent a gradient
 * @param gradientSelector The value that determines which gradient to use
 * @param gradientValues The list of gradient values
 * @param randomLockMode The type of random to use for the gradient values
 * @param prefix The prefix to use for naming the blocks
 * @param initialValues Optional initial values to connect to the gradient inputs that were calculated during other steps of the conversion
 * @returns The output connection point of the gradient block
 */
function _CreateGradientBlockGroup(
    gradientSelector: NodeParticleConnectionPoint,
    gradientValues: Array<FactorGradient> | Array<ColorGradient>,
    randomLockMode: ParticleRandomBlockLocks,
    prefix: string,
    initialValues: NodeParticleConnectionPoint[] = []
): NodeParticleConnectionPoint {
    // Create the gradient block and connect the value that controls the gradient selection
    const gradientBlock = new ParticleGradientBlock(prefix + " Gradient Block");
    gradientSelector.connectTo(gradientBlock.gradient);

    // If initial values are provided, we use them instead of the values in the gradientValues array
    // These means this values were already transformed into blocks on a previous step of the conversion and we must reuse them
    for (let i = 0; i < initialValues.length; i++) {
        const reference = i < gradientValues.length ? gradientValues[i].gradient : 1;
        const gradientValueBlock = new ParticleGradientValueBlock(prefix + " Gradient Value " + i);
        gradientValueBlock.reference = reference;
        initialValues[i].connectTo(gradientValueBlock.value);
        gradientValueBlock.output.connectTo(gradientBlock.inputs[i + 1]);
    }

    // Create the gradient values
    for (let i = 0 + initialValues.length; i < gradientValues.length; i++) {
        const gradientValueBlockGroupOutput = _CreateGradientValueBlockGroup(gradientValues[i], randomLockMode, prefix, i);
        gradientValueBlockGroupOutput.connectTo(gradientBlock.inputs[i + 1]);
    }

    return gradientBlock.output;
}

/**
 * Creates the blocks that represent a gradient value
 * This can be either a single value or a random between two values
 * @param gradientStep The gradient step data
 * @param randomLockMode The lock mode to use for random values
 * @param prefix The prefix to use for naming the blocks
 * @param index The index of the gradient step
 * @returns The output connection point of the gradient value block
 */
function _CreateGradientValueBlockGroup(
    gradientStep: FactorGradient | ColorGradient,
    randomLockMode: ParticleRandomBlockLocks,
    prefix: string,
    index: number
): NodeParticleConnectionPoint {
    const gradientValueBlock = new ParticleGradientValueBlock(prefix + " Gradient Value " + index);
    gradientValueBlock.reference = gradientStep.gradient;

    const value1 = (gradientStep as any).factor1 ?? (gradientStep as any).color1.clone();
    const value2 = (gradientStep as any).factor2 ?? (gradientStep as any).color2?.clone();

    if (value2 !== undefined) {
        // Create a random between value1 and value2
        const randomBlock = new ParticleRandomBlock("Random Value " + index);
        randomBlock.lockMode = randomLockMode;
        _CreateAndConnectInput("Value 1", value1, randomBlock.min);
        _CreateAndConnectInput("Value 2", value2, randomBlock.max);
        randomBlock.output.connectTo(gradientValueBlock.value);
    } else {
        // Single value
        _CreateAndConnectInput("Value", value1, gradientValueBlock.value);
    }

    return gradientValueBlock.output;
}

function _CreateTextureBlock(texture: Nullable<BaseTexture>): NodeParticleConnectionPoint {
    // Texture - always use sourceTexture to preserve all texture options
    const textureBlock = new ParticleTextureSourceBlock("Texture");
    textureBlock.sourceTexture = texture;
    return textureBlock.texture;
}
