import type { Nullable } from "core/types";
import type { ParticleSystem } from "../particleSystem";
import type { IShapeBlock } from "./Blocks/Emitters/IShapeBlock";
import type { Vector3 } from "core/Maths/math.vector";
import type { Color4 } from "core/Maths/math.color";
import type { NodeParticleConnectionPoint } from "./nodeParticleBlockConnectionPoint";
import type { BoxParticleEmitter } from "../EmitterTypes/boxParticleEmitter";
import type { PointParticleEmitter } from "../EmitterTypes/pointParticleEmitter";
import type { SphereParticleEmitter } from "../EmitterTypes/sphereParticleEmitter";
import type { CylinderParticleEmitter, MeshParticleEmitter } from "../EmitterTypes";
import type { Mesh } from "core/Meshes/mesh";
import type { Texture } from "core/Materials/Textures/texture";

import { NodeParticleSystemSet } from "./nodeParticleSystemSet";
import { SystemBlock } from "./Blocks/systemBlock";
import { CreateParticleBlock } from "./Blocks/Emitters/createParticleBlock";
import { BoxShapeBlock } from "./Blocks/Emitters/boxShapeBlock";
import { ParticleInputBlock } from "./Blocks/particleInputBlock";
import { PointShapeBlock } from "./Blocks/Emitters/pointShapeBlock";
import { SphereShapeBlock } from "./Blocks/Emitters/sphereShapeBlock";
import { CylinderShapeBlock } from "./Blocks/Emitters/cylinderShapeBlock";
import { MeshShapeBlock } from "./Blocks/Emitters/meshShapeBlock";
import { ParticleTextureSourceBlock } from "./Blocks/particleSourceTextureBlock";
import { ParticleRandomBlock } from "./Blocks/particleRandomBlock";
import { ParticleConverterBlock, ParticleMathBlock, ParticleMathBlockOperations, UpdateColorBlock, UpdatePositionBlock } from "./Blocks";
import { NodeParticleContextualSources } from "./Enums/nodeParticleContextualSources";

/**
 * Converts a ParticleSystem to a NodeParticleSystemSet.
 * @param name The name of the node particle system set.
 * @param particleSystems The particle systems to convert.
 * @returns The converted node particle system set or null if conversion failed.
 * #0K3AQ2#3670
 */
export async function ConvertToNodeParticleSystemSetAsync(name: string, particleSystems: ParticleSystem[]): Promise<Nullable<NodeParticleSystemSet>> {
    if (!particleSystems || !particleSystems.length) {
        return null;
    }

    const nodeParticleSystemSet = new NodeParticleSystemSet(name);
    const promises: Promise<void>[] = [];

    for (const particleSystem of particleSystems) {
        promises.push(_ExtractDatafromParticleSystemAsync(particleSystem, nodeParticleSystemSet));
    }

    await Promise.all(promises);
    return nodeParticleSystemSet;
}

async function _ExtractDatafromParticleSystemAsync(particleSystem: ParticleSystem, target: NodeParticleSystemSet) {
    // Main system
    const system = new SystemBlock(particleSystem.name);
    system.capacity = particleSystem.getCapacity();
    system.emitRate = particleSystem.emitRate;

    // Create particle
    const createParticleBlock = new CreateParticleBlock("Create Particle");

    // Shape
    let shapeBlock: Nullable<IShapeBlock> = null;
    switch (particleSystem.particleEmitterType.getClassName()) {
        case "BoxParticleEmitter": {
            const source = particleSystem.particleEmitterType as BoxParticleEmitter;
            shapeBlock = new BoxShapeBlock("Box Shape");

            const target = shapeBlock as BoxShapeBlock;
            _CreateAndConnectInput("Direction 1", source.direction1, target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2, target.direction2);
            _CreateAndConnectInput("Min Emit Box", source.minEmitBox, target.minEmitBox);
            _CreateAndConnectInput("Max Emit Box", source.maxEmitBox, target.maxEmitBox);
            break;
        }
        case "PointParticleEmitter": {
            const source = particleSystem.particleEmitterType as PointParticleEmitter;
            shapeBlock = new PointShapeBlock("Point Shape");

            const target = shapeBlock as PointShapeBlock;
            _CreateAndConnectInput("Direction 1", source.direction1, target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2, target.direction2);
            break;
        }
        case "SphereParticleEmitter": {
            const source = particleSystem.particleEmitterType as SphereParticleEmitter;
            shapeBlock = new SphereShapeBlock("Sphere Shape");

            const target = shapeBlock as SphereShapeBlock;
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Direction Randomizer", source.directionRandomizer, target.directionRandomizer);
            break;
        }
        case "CylinderParticleEmitter": {
            const source = particleSystem.particleEmitterType as CylinderParticleEmitter;
            shapeBlock = new CylinderShapeBlock("Cylinder Shape");

            const target = shapeBlock as CylinderShapeBlock;
            _CreateAndConnectInput("Height", source.height, target.height);
            _CreateAndConnectInput("Radius", source.radius, target.radius);
            _CreateAndConnectInput("Radius Range", source.radiusRange, target.radiusRange);
            _CreateAndConnectInput("Direction Randomizer", source.directionRandomizer, target.directionRandomizer);
            break;
        }
        case "MeshParticleEmitter": {
            const source = particleSystem.particleEmitterType as MeshParticleEmitter;
            shapeBlock = new MeshShapeBlock("Mesh Shape");

            const target = shapeBlock as MeshShapeBlock;
            _CreateAndConnectInput("Direction 1", source.direction1, target.direction1);
            _CreateAndConnectInput("Direction 2", source.direction2, target.direction2);

            target.mesh = source.mesh as Mesh;
            break;
        }
    }

    if (!shapeBlock) {
        throw new Error(`Unsupported particle emitter type: ${particleSystem.particleEmitterType.getClassName()}`);
    }

    createParticleBlock.particle.connectTo(shapeBlock.particle);

    // Dead color
    _CreateAndConnectInput("Dead Color", particleSystem.colorDead, createParticleBlock.colorDead);

    // Color
    const randomColorBlock = new ParticleRandomBlock("Random Color");
    _CreateAndConnectInput("Color 1", particleSystem.color1, randomColorBlock.min);
    _CreateAndConnectInput("Color 2", particleSystem.color2, randomColorBlock.max);
    randomColorBlock.output.connectTo(createParticleBlock.color);

    // Emit power
    const randomEmitPowerBlock = new ParticleRandomBlock("Random Emit Power");
    _CreateAndConnectInput("Min Emit Power", particleSystem.minEmitPower, randomEmitPowerBlock.min);
    _CreateAndConnectInput("Max Emit Power", particleSystem.maxEmitPower, randomEmitPowerBlock.max);
    randomEmitPowerBlock.output.connectTo(createParticleBlock.emitPower);

    // Lifetime
    const randomLifetimeBlock = new ParticleRandomBlock("Random Lifetime");
    _CreateAndConnectInput("Min Lifetime", particleSystem.minLifeTime, randomLifetimeBlock.min);
    _CreateAndConnectInput("Max Lifetime", particleSystem.maxLifeTime, randomLifetimeBlock.max);
    randomLifetimeBlock.output.connectTo(createParticleBlock.lifeTime);

    // Texture
    const textureBlock = new ParticleTextureSourceBlock("Texture");
    const url = (particleSystem.particleTexture as Texture).url || "";
    if (url) {
        textureBlock.url = url;
    } else {
        textureBlock.sourceTexture = particleSystem.particleTexture;
    }
    textureBlock.texture.connectTo(system.texture);

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

    colorUpdateblock.output.connectTo(system.particle);

    // Register
    target.systemBlocks.push(system);
}

function _CreateAndConnectInput(inputBlockName: string, value: number | Vector3 | Color4, outputToConnectTo: NodeParticleConnectionPoint) {
    const input = new ParticleInputBlock(inputBlockName);
    input.value = value;
    input.output.connectTo(outputToConnectTo);
}

function _CreateAndConnectContextual(contextualBlockName: string, contextValue: NodeParticleContextualSources, outputToConnectTo: NodeParticleConnectionPoint): void {
    const input = new ParticleInputBlock(contextualBlockName);
    input.contextualValue = contextValue;
    input.output.connectTo(outputToConnectTo);
}
