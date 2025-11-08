import type { Nullable } from "core/types";
import type { Color4 } from "core/Maths/math.color";
import type { Texture } from "core/Materials/Textures/texture";
import type { Mesh } from "core/Meshes/mesh";
import type { ColorGradient } from "core/Misc";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { IParticleSystem } from "core/Particles/IParticleSystem";
import type { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import type { ConeParticleEmitter } from "core/Particles/EmitterTypes/coneParticleEmitter";
import type { CylinderParticleEmitter } from "core/Particles/EmitterTypes/cylinderParticleEmitter";
import type { MeshParticleEmitter } from "core/Particles/EmitterTypes/meshParticleEmitter";
import type { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import type { SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { IShapeBlock } from "core/Particles/Node/Blocks/Emitters/IShapeBlock";

import { Vector2, Vector3 } from "core/Maths/math.vector";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleSystemSet } from "./nodeParticleSystemSet";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";
import { NodeParticleSystemSources } from "./Enums/nodeParticleSystemSources";
import { ParticleConverterBlock } from "./Blocks/particleConverterBlock";
import { ParticleGradientBlock } from "./Blocks/particleGradientBlock";
import { ParticleGradientValueBlock } from "./Blocks/particleGradientValueBlock";
import { ParticleInputBlock } from "./Blocks/particleInputBlock";
import { ParticleMathBlock, ParticleMathBlockOperations } from "./Blocks/particleMathBlock";
import { ParticleRandomBlock, ParticleRandomBlockLocks } from "./Blocks/particleRandomBlock";
import { ParticleTextureSourceBlock } from "./Blocks/particleSourceTextureBlock";
import { SystemBlock } from "./Blocks/systemBlock";
import { CreateParticleBlock } from "./Blocks/Emitters/createParticleBlock";
import { BoxShapeBlock } from "./Blocks/Emitters/boxShapeBlock";
import { ConeShapeBlock } from "./Blocks/Emitters/coneShapeBlock";
import { CylinderShapeBlock } from "./Blocks/Emitters/cylinderShapeBlock";
import { MeshShapeBlock } from "./Blocks/Emitters/meshShapeBlock";
import { PointShapeBlock } from "./Blocks/Emitters/pointShapeBlock";
import { SphereShapeBlock } from "./Blocks/Emitters/sphereShapeBlock";
import { UpdateAngleBlock } from "./Blocks/Update/updateAngleBlock";
import { UpdateColorBlock } from "./Blocks/Update/updateColorBlock";
import { UpdateDirectionBlock } from "./Blocks/Update/updateDirectionBlock";
import { UpdatePositionBlock } from "./Blocks/Update/updatePositionBlock";

/**
 * Converts a ParticleSystem to a NodeParticleSystemSet.
 * @param name The name of the node particle system set.
 * @param particleSystemsList The particle systems to convert.
 * @returns The converted node particle system set or null if conversion failed.
 * #0K3AQ2#3672
 * #7J0NXA#4
 */
export async function ConvertToNodeParticleSystemSetAsync(name: string, particleSystemsList: ParticleSystem[]): Promise<Nullable<NodeParticleSystemSet>> {
    if (!particleSystemsList || !particleSystemsList.length) {
        return null;
    }

    const nodeParticleSystemSet = new NodeParticleSystemSet(name);
    const promises: Promise<void>[] = [];

    for (const particleSystem of particleSystemsList) {
        promises.push(_ExtractDatafromParticleSystemAsync(nodeParticleSystemSet, particleSystem));
    }

    await Promise.all(promises);
    return nodeParticleSystemSet;
}

async function _ExtractDatafromParticleSystemAsync(newSet: NodeParticleSystemSet, oldSystem: ParticleSystem): Promise<void> {
    // CreateParticle block
    const createParticleBlock = _CreateCreateParticleBlock(oldSystem);

    // Emitter Shape block
    const shapeBlock = _CreateEmitterShapeBlock(oldSystem);
    createParticleBlock.particle.connectTo(shapeBlock.particle);

    // Update the particle position
    const positionUpdatedParticle = _CreateUpdateSystem(shapeBlock.output, oldSystem);

    // Color update
    const colorUpdateBlock = _CreateColorUpdateBlock(oldSystem, createParticleBlock);
    positionUpdatedParticle.connectTo(colorUpdateBlock.particle);

    // System block
    const newSystem = _CreateSystemBlock(oldSystem);
    colorUpdateBlock.output.connectTo(newSystem.particle);

    // Register
    newSet.systemBlocks.push(newSystem);
}

function _CreateSystemBlock(oldSystem: ParticleSystem): SystemBlock {
    const newSystem = new SystemBlock(oldSystem.name);

    _CreateAndConnectInput("Translation pivot", oldSystem.translationPivot, newSystem.translationPivot);
    _CreateAndConnectInput("Texture mask", oldSystem.textureMask, newSystem.textureMask);

    newSystem.emitRate = oldSystem.emitRate;
    newSystem.manualEmitCount = oldSystem.manualEmitCount;

    newSystem.blendMode = oldSystem.blendMode;
    newSystem.capacity = oldSystem.getCapacity();
    newSystem.targetStopDuration = oldSystem.targetStopDuration;
    newSystem.startDelay = oldSystem.startDelay;
    newSystem.targetStopDuration = oldSystem.targetStopDuration;
    newSystem.updateSpeed = oldSystem.updateSpeed;
    newSystem.preWarmCycles = oldSystem.preWarmCycles;
    newSystem.preWarmStepOffset = oldSystem.preWarmStepOffset;
    newSystem.isBillboardBased = oldSystem.isBillboardBased;
    newSystem.isLocal = oldSystem.isLocal;
    newSystem.disposeOnStop = oldSystem.disposeOnStop;

    // Texture
    const textureBlock = new ParticleTextureSourceBlock("Texture");
    const url = (oldSystem.particleTexture as Texture).url || "";
    if (url) {
        textureBlock.url = url;
    } else {
        textureBlock.sourceTexture = oldSystem.particleTexture;
    }
    textureBlock.texture.connectTo(newSystem.texture);

    return newSystem;
}

function _CreateCreateParticleBlock(oldSystem: ParticleSystem): CreateParticleBlock {
    // Create particle
    const createParticleBlock = new CreateParticleBlock("Create Particle");

    // Size
    const randomSizeBlock = new ParticleRandomBlock("Random size");
    _CreateAndConnectInput("Min size", oldSystem.minSize, randomSizeBlock.min);
    _CreateAndConnectInput("Max size", oldSystem.maxSize, randomSizeBlock.max);
    randomSizeBlock.output.connectTo(createParticleBlock.size);

    // Scale
    const randomScaleBlock = new ParticleRandomBlock("Random Scale");
    _CreateAndConnectInput("Min Scale", new Vector2(oldSystem.minScaleX, oldSystem.minScaleY), randomScaleBlock.min);
    _CreateAndConnectInput("Max Scale", new Vector2(oldSystem.maxScaleX, oldSystem.maxScaleY), randomScaleBlock.max);
    randomScaleBlock.output.connectTo(createParticleBlock.scale);

    // Color is handled when we do the color update block to manage gradients

    // Dead color
    _CreateAndConnectInput("Dead Color", oldSystem.colorDead, createParticleBlock.colorDead);

    // Emit power (Speed)
    const randomEmitPowerBlock = new ParticleRandomBlock("Random Emit Power");
    _CreateAndConnectInput("Min Emit Power", oldSystem.minEmitPower, randomEmitPowerBlock.min);
    _CreateAndConnectInput("Max Emit Power", oldSystem.maxEmitPower, randomEmitPowerBlock.max);
    randomEmitPowerBlock.output.connectTo(createParticleBlock.emitPower);

    // Angle (rotation)
    const randomRotationBlock = new ParticleRandomBlock("Random Rotation");
    _CreateAndConnectInput("Min Rotation", oldSystem.minInitialRotation, randomRotationBlock.min);
    _CreateAndConnectInput("Max Rotation", oldSystem.maxInitialRotation, randomRotationBlock.max);
    randomRotationBlock.output.connectTo(createParticleBlock.angle);

    // Lifetime
    const randomLifetimeBlock = new ParticleRandomBlock("Random Lifetime");
    _CreateAndConnectInput("Min Lifetime", oldSystem.minLifeTime, randomLifetimeBlock.min);
    _CreateAndConnectInput("Max Lifetime", oldSystem.maxLifeTime, randomLifetimeBlock.max);
    randomLifetimeBlock.output.connectTo(createParticleBlock.lifeTime);

    return createParticleBlock;
}

function _CreateEmitterShapeBlock(oldSystem: IParticleSystem): IShapeBlock {
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
            _CreateAndConnectInput("Direction 1", source.direction1, target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2, target.direction2);
            _CreateAndConnectInput("Min Emit Box", source.minEmitBox, target.minEmitBox);
            _CreateAndConnectInput("Max Emit Box", source.maxEmitBox, target.maxEmitBox);
            break;
        }
        case "ConeParticleEmitter": {
            const source = emitter as ConeParticleEmitter;
            shapeBlock = new ConeShapeBlock("Cone Shape");

            const target = shapeBlock as ConeShapeBlock;
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Angle", source.angle, target.angle);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Height Range", source.heightRange, target.heightRange);
            _CreateAndConnectInput("Emit From Spawn Point Only", source.emitFromSpawnPointOnly ? 1 : 0, target.emitFromSpawnPointOnly, NodeParticleBlockConnectionPointTypes.Int);
            _CreateAndConnectInput("Direction Randomizer", source.directionRandomizer, target.directionRandomizer);
            break;
        }
        case "CustomParticleEmitter": {
            // Custom emitter is not supported in nodes yet
            throw new Error("CustomParticleEmitter is not supported in Node Particle System.");
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
        case "HemisphericParticleEmitter": {
            // Hemispheric emitter is not supported in nodes yet
            throw new Error("HemisphericParticleEmitter is not supported in Node Particle System.");
        }
        case "MeshParticleEmitter": {
            const source = emitter as MeshParticleEmitter;
            shapeBlock = new MeshShapeBlock("Mesh Shape");

            const target = shapeBlock as MeshShapeBlock;
            _CreateAndConnectInput("Direction 1", source.direction1, target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2, target.direction2);

            target.mesh = source.mesh as Mesh;
            break;
        }
        case "PointParticleEmitter": {
            const source = emitter as PointParticleEmitter;
            shapeBlock = new PointShapeBlock("Point Shape");

            const target = shapeBlock as PointShapeBlock;
            _CreateAndConnectInput("Direction 1", source.direction1, target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2, target.direction2);
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
    }

    if (!shapeBlock) {
        throw new Error(`Unsupported particle emitter type: ${emitter.getClassName()}`);
    }

    return shapeBlock;
}

function _CreateUpdateSystem(inputParticle: NodeParticleConnectionPoint, oldSystem: IParticleSystem): NodeParticleConnectionPoint {
    let outputUpdate: NodeParticleConnectionPoint = inputParticle;

    if (oldSystem.minAngularSpeed !== 0 || oldSystem.maxAngularSpeed !== 0) {
        outputUpdate = _CreateAngularSpeedUpdate(outputUpdate, oldSystem.minAngularSpeed, oldSystem.maxAngularSpeed);
    }

    outputUpdate = _CreatePositionUpdate(outputUpdate);

    if (oldSystem.gravity.equalsToFloats(0, 0, 0) === false) {
        outputUpdate = _CreateGravityUpdate(outputUpdate, oldSystem.gravity);
    }

    return outputUpdate;
}

function _CreateAngularSpeedUpdate(inputParticle: NodeParticleConnectionPoint, minAngularSpeed: number, maxAngularSpeed: number): NodeParticleConnectionPoint {
    // Random value between for the angular speed of the particle
    const randomAngularSpeedBlock = new ParticleRandomBlock("Random Angular Speed");
    _CreateAndConnectInput("Min Angular Speed", minAngularSpeed, randomAngularSpeedBlock.min);
    _CreateAndConnectInput("Max Angular Speed", maxAngularSpeed, randomAngularSpeedBlock.max);

    // Create the angular speed delta
    const angleSpeedDeltaOutput = _CreateDeltaModifiedInput("Angular Speed", randomAngularSpeedBlock.output);

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
}

function _CreatePositionUpdate(inputParticle: NodeParticleConnectionPoint): NodeParticleConnectionPoint {
    // Calculate the new position
    const addPositionBlock = new ParticleMathBlock("Add Position");
    addPositionBlock.operation = ParticleMathBlockOperations.Add;
    _CreateAndConnectContextualSource("Position", NodeParticleContextualSources.Position, addPositionBlock.left);
    _CreateAndConnectContextualSource("Scaled Direction", NodeParticleContextualSources.ScaledDirection, addPositionBlock.right);

    // Update the particle position
    const updatePosition = new UpdatePositionBlock("Position Update");
    inputParticle.connectTo(updatePosition.particle);
    addPositionBlock.output.connectTo(updatePosition.position);

    return updatePosition.output;
}

function _CreateGravityUpdate(inputParticle: NodeParticleConnectionPoint, gravity: Vector3): NodeParticleConnectionPoint {
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

function _CreateColorUpdateBlock(oldSystem: IParticleSystem, createParticleBlock: CreateParticleBlock): UpdateColorBlock {
    if (!oldSystem) {
        throw new Error("Invalid particle system");
    }

    // Calculate the color
    const colorGradients = oldSystem.getColorGradients();
    let colorBlock: Nullable<ParticleGradientBlock | ParticleMathBlock> = null;
    if (colorGradients && colorGradients.length > 0) {
        colorBlock = _CreateGradientColorUpdate(oldSystem, colorGradients, createParticleBlock);
    } else {
        colorBlock = _CreateBasicColorUpdate();
    }

    // Clamp alpha >= 0
    const clampedColor = _ClampUpdateColorAlpha(colorBlock);

    // Create the color update block
    const colorUpdateBlock = new UpdateColorBlock("Color update");
    clampedColor.colorOut.connectTo(colorUpdateBlock.color);

    return colorUpdateBlock;
}

function _CreateGradientColorUpdate(oldSystem: IParticleSystem, gradient: Array<ColorGradient>, createParticleBlock: CreateParticleBlock): ParticleGradientBlock {
    const colorGradientBlock = new ParticleGradientBlock("Color Gradient");
    _CreateAndConnectContextualSource("gradient", NodeParticleContextualSources.Age, colorGradientBlock.gradient);

    let tempColor: Nullable<ParticleInputBlock | ParticleRandomBlock> = null;
    let colorStart: Nullable<ParticleInputBlock | ParticleRandomBlock> = null;
    let colorEnd: Nullable<ParticleInputBlock | ParticleRandomBlock> = null;
    for (let i = 0; i < gradient.length; i++) {
        const gradientStep = gradient[i];
        const gradientValueBlock = new ParticleGradientValueBlock("Color Gradient Value " + i);
        gradientValueBlock.reference = gradientStep.gradient;

        if (gradientStep.color2) {
            // Create a random between color1 and color2
            const randomColorBlock = new ParticleRandomBlock("Random Color for Gradient " + i);
            randomColorBlock.lockMode = ParticleRandomBlockLocks.PerSystem;
            _CreateAndConnectInput("Color 1", gradientStep.color1, randomColorBlock.min);
            _CreateAndConnectInput("Color 2", gradientStep.color2, randomColorBlock.max);
            randomColorBlock.output.connectTo(gradientValueBlock.value);
            tempColor = randomColorBlock;
        } else {
            // Single color
            const input = new ParticleInputBlock("Color " + i);
            input.value = gradientStep.color1;
            input.output.connectTo(gradientValueBlock.value);
            tempColor = input;
        }

        if (gradientStep.gradient === 0) {
            colorStart = tempColor;
        } else if (gradientStep.gradient === 1) {
            colorEnd = tempColor;
        }

        gradientValueBlock.output.connectTo(colorGradientBlock.inputs[i + 1]);
    }

    _UpdateCreateParticleColor(oldSystem, colorStart, colorEnd, createParticleBlock);

    return colorGradientBlock;
}

function _CreateBasicColorUpdate(): ParticleMathBlock {
    const addColorBlock = new ParticleMathBlock("Add Color");
    addColorBlock.operation = ParticleMathBlockOperations.Add;
    _CreateAndConnectContextualSource("Color", NodeParticleContextualSources.Color, addColorBlock.left);
    _CreateAndConnectContextualSource("Scaled Color Step", NodeParticleContextualSources.ScaledColorStep, addColorBlock.right);

    return addColorBlock;
}

function _UpdateCreateParticleColor(
    oldSystem: IParticleSystem,
    colorStart: Nullable<ParticleInputBlock | ParticleRandomBlock>,
    colorEnd: Nullable<ParticleInputBlock | ParticleRandomBlock>,
    createParticleBlock: CreateParticleBlock
): void {
    if (colorStart === null) {
        colorStart = new ParticleInputBlock("Color Start");
        colorStart.value = oldSystem.color1;
    }

    if (colorEnd === null) {
        colorEnd = new ParticleInputBlock("Color End");
        colorEnd.value = oldSystem.color2;
    }

    const randomColorBlock = new ParticleRandomBlock("Random color");
    randomColorBlock.lockMode = ParticleRandomBlockLocks.PerSystem;
    colorStart.output.connectTo(randomColorBlock.min);
    colorEnd.output.connectTo(randomColorBlock.max);
    randomColorBlock.output.connectTo(createParticleBlock.color);
}

function _ClampUpdateColorAlpha(colorBlock: ParticleMathBlock | ParticleGradientBlock): ParticleConverterBlock {
    // Decompose color to clamp alpha
    const decomposeColorBlock = new ParticleConverterBlock("Decompose Color");
    colorBlock.outputs[0].connectTo(decomposeColorBlock.colorIn);

    // Clamp alpha to be >= 0
    const maxAlphaBlock = new ParticleMathBlock("Alpha >= 0");
    maxAlphaBlock.operation = ParticleMathBlockOperations.Max;
    decomposeColorBlock.wOut.connectTo(maxAlphaBlock.left);
    _CreateAndConnectInput("Zero", 0, maxAlphaBlock.right);

    // Recompose color
    const composeColorBlock = new ParticleConverterBlock("Compose Color");
    decomposeColorBlock.xyzOut.connectTo(composeColorBlock.xyzIn);
    maxAlphaBlock.output.connectTo(composeColorBlock.wIn);

    return composeColorBlock;
}

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
