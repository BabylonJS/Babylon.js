import type { Nullable } from "core/types";
import type { Color4 } from "core/Maths/math.color";
import type { Vector3 } from "core/Maths/math.vector";
import type { Texture } from "core/Materials/Textures/texture";
import type { Mesh } from "core/Meshes/mesh";
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
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";

import { NodeParticleSystemSet } from "./nodeParticleSystemSet";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";
import { ParticleConverterBlock } from "./Blocks/particleConverterBlock";
import { ParticleInputBlock } from "./Blocks/particleInputBlock";
import { ParticleMathBlock, ParticleMathBlockOperations } from "./Blocks/particleMathBlock";
import { ParticleRandomBlock } from "./Blocks/particleRandomBlock";
import { ParticleTextureSourceBlock } from "./Blocks/particleSourceTextureBlock";
import { SystemBlock } from "./Blocks/systemBlock";
import { CreateParticleBlock } from "./Blocks/Emitters/createParticleBlock";
import { BoxShapeBlock } from "./Blocks/Emitters/boxShapeBlock";
import { ConeShapeBlock } from "./Blocks/Emitters/coneShapeBlock";
import { CylinderShapeBlock } from "./Blocks/Emitters/cylinderShapeBlock";
import { MeshShapeBlock } from "./Blocks/Emitters/meshShapeBlock";
import { PointShapeBlock } from "./Blocks/Emitters/pointShapeBlock";
import { SphereShapeBlock } from "./Blocks/Emitters/sphereShapeBlock";
import { UpdateColorBlock } from "./Blocks/Update/updateColorBlock";
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
    // System block
    const newSystem = _CreateSystemBlock(oldSystem);

    // Shape block
    const shapeBlock = _CreateShapeBlock(oldSystem);

    // CreateParticle block
    const createParticleBlock = _CreateCreateParticleBlock(oldSystem);
    createParticleBlock.particle.connectTo(shapeBlock.particle);

    // Texture
    const textureBlock = new ParticleTextureSourceBlock("Texture");
    const url = (oldSystem.particleTexture as Texture).url || "";
    if (url) {
        textureBlock.url = url;
    } else {
        textureBlock.sourceTexture = oldSystem.particleTexture;
    }
    textureBlock.texture.connectTo(newSystem.texture);

    // Default position update
    const positionUpdateblock = new UpdatePositionBlock("Position update");
    shapeBlock.output.connectTo(positionUpdateblock.particle);

    const addPositionBlock = new ParticleMathBlock("Add Position");
    addPositionBlock.operation = ParticleMathBlockOperations.Add;
    _CreateAndConnectContextual("Position", NodeParticleContextualSources.Position, addPositionBlock.left);
    _CreateAndConnectContextual("Scaled Direction", NodeParticleContextualSources.ScaledDirection, addPositionBlock.right);
    addPositionBlock.output.connectTo(positionUpdateblock.position);

    // Default color update
    const colorUpdateblock = new UpdateColorBlock("Color update");
    positionUpdateblock.output.connectTo(colorUpdateblock.particle);

    const addColorBlock = new ParticleMathBlock("Add Color");
    addColorBlock.operation = ParticleMathBlockOperations.Add;
    _CreateAndConnectContextual("Color", NodeParticleContextualSources.Color, addColorBlock.left);
    _CreateAndConnectContextual("Scaled Color Step", NodeParticleContextualSources.ScaledColorStep, addColorBlock.right);
    addColorBlock.output.connectTo(colorUpdateblock.color);

    const decomposeColorBlock = new ParticleConverterBlock("Decompose Color");
    addColorBlock.output.connectTo(decomposeColorBlock.colorIn);

    // Clamp alpha to be >= 0
    const maxAlphaBlock = new ParticleMathBlock("Alpha >= 0");
    maxAlphaBlock.operation = ParticleMathBlockOperations.Max;
    decomposeColorBlock.wOut.connectTo(maxAlphaBlock.left);
    _CreateAndConnectInput("Zero", 0, maxAlphaBlock.right);

    const composeColorBlock = new ParticleConverterBlock("Compose Color");
    decomposeColorBlock.xyzOut.connectTo(composeColorBlock.xyzIn);
    maxAlphaBlock.output.connectTo(composeColorBlock.wIn);
    composeColorBlock.colorOut.connectTo(colorUpdateblock.color);

    colorUpdateblock.output.connectTo(newSystem.particle);

    // Register
    newSet.systemBlocks.push(newSystem);
}

function _CreateSystemBlock(oldSystem: IParticleSystem): SystemBlock {
    const newSystem = new SystemBlock(oldSystem.name);

    newSystem.blendMode = oldSystem.blendMode;
    newSystem.capacity = oldSystem.getCapacity();
    newSystem.emitRate = oldSystem.emitRate;
    newSystem.targetStopDuration = oldSystem.targetStopDuration;
    newSystem.startDelay = oldSystem.startDelay;
    newSystem.updateSpeed = oldSystem.updateSpeed;

    return newSystem;
}

function _CreateCreateParticleBlock(oldSystem: IParticleSystem): CreateParticleBlock {
    // Create particle
    const createParticleBlock = new CreateParticleBlock("Create Particle");

    // Color
    const randomColorBlock = new ParticleRandomBlock("Random Color");
    _CreateAndConnectInput("Color 1", oldSystem.color1, randomColorBlock.min);
    _CreateAndConnectInput("Color 2", oldSystem.color2, randomColorBlock.max);
    randomColorBlock.output.connectTo(createParticleBlock.color);

    // Dead color
    _CreateAndConnectInput("Dead Color", oldSystem.colorDead, createParticleBlock.colorDead);

    // Emit power
    const randomEmitPowerBlock = new ParticleRandomBlock("Random Emit Power");
    _CreateAndConnectInput("Min Emit Power", oldSystem.minEmitPower, randomEmitPowerBlock.min);
    _CreateAndConnectInput("Max Emit Power", oldSystem.maxEmitPower, randomEmitPowerBlock.max);
    randomEmitPowerBlock.output.connectTo(createParticleBlock.emitPower);

    // Scale
    const randomScaleBlock = new ParticleRandomBlock("Random Scale");
    _CreateAndConnectInput("Min Scale", oldSystem.minSize, randomScaleBlock.min);
    _CreateAndConnectInput("Max Scale", oldSystem.maxSize, randomScaleBlock.max);
    randomScaleBlock.output.connectTo(createParticleBlock.scale);

    // Lifetime
    const randomLifetimeBlock = new ParticleRandomBlock("Random Lifetime");
    _CreateAndConnectInput("Min Lifetime", oldSystem.minLifeTime, randomLifetimeBlock.min);
    _CreateAndConnectInput("Max Lifetime", oldSystem.maxLifeTime, randomLifetimeBlock.max);
    randomLifetimeBlock.output.connectTo(createParticleBlock.lifeTime);

    return createParticleBlock;
}

function _CreateShapeBlock(oldSystem: IParticleSystem): IShapeBlock {
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

function _CreateAndConnectInput(
    inputBlockName: string,
    value: number | Vector3 | Color4,
    targetToConnectTo: NodeParticleConnectionPoint,
    inputType?: NodeParticleBlockConnectionPointTypes
): void {
    const input = new ParticleInputBlock(inputBlockName, inputType);
    input.value = value;
    input.output.connectTo(targetToConnectTo);
}

function _CreateAndConnectContextual(contextualBlockName: string, contextValue: NodeParticleContextualSources, targetToConnectTo: NodeParticleConnectionPoint): void {
    const input = new ParticleInputBlock(contextualBlockName);
    input.contextualValue = contextValue;
    input.output.connectTo(targetToConnectTo);
}
