import type { Nullable } from "core/types";
import type { ParticleSystem } from "../particleSystem";
import { NodeParticleSystemSet } from "./nodeParticleSystemSet";
import { SystemBlock } from "./Blocks/systemBlock";
import { CreateParticleBlock } from "./Blocks/Emitters/createParticleBlock";
import { BoxShapeBlock } from "./Blocks/Emitters/boxShapeBlock";
import type { IShapeBlock } from "./Blocks/Emitters/IShapeBlock";
import type { Vector3 } from "core/Maths/math.vector";
import type { NodeParticleConnectionPoint } from "./nodeParticleBlockConnectionPoint";
import type { BoxParticleEmitter } from "../EmitterTypes/boxParticleEmitter";
import type { PointParticleEmitter } from "../EmitterTypes/pointParticleEmitter";
import type { SphereParticleEmitter } from "../EmitterTypes/sphereParticleEmitter";
import type { CylinderParticleEmitter, MeshParticleEmitter } from "../EmitterTypes";
import type { Mesh } from "core/Meshes/mesh";
import { ParticleInputBlock } from "./Blocks/particleInputBlock";
import { PointShapeBlock } from "./Blocks/Emitters/pointShapeBlock";
import { SphereShapeBlock } from "./Blocks/Emitters/sphereShapeBlock";
import { CylinderShapeBlock } from "./Blocks/Emitters/cylinderShapeBlock";
import { MeshShapeBlock } from "./Blocks/Emitters/meshShapeBlock";

function _CreateAndConnectInput(connectionPoint: NodeParticleConnectionPoint, name: string, defaultValue: Vector3 | number) {
    const input = new ParticleInputBlock(name);
    input.value = defaultValue;
    input.output.connectTo(connectionPoint);
}

/**
 * Converts a ParticleSystem to a NodeParticleSystemSet.
 * @param name The name of the node particle system set.
 * @param particleSystems The particle systems to convert.
 * @returns The converted node particle system set or null if conversion failed.
 */
export function ConvertToNodeParticleSystemSet(name: string, particleSystems: ParticleSystem[]): Nullable<NodeParticleSystemSet> {
    if (!particleSystems || !particleSystems.length) {
        return null;
    }

    const nodeParticleSystemSet = new NodeParticleSystemSet(name);

    for (const particleSystem of particleSystems) {
        // Main system
        const system = new SystemBlock(particleSystem.name);

        // Create particle
        const createParticleBlock = new CreateParticleBlock("Create particle");

        // Shape
        let shapeBlock: Nullable<IShapeBlock> = null;
        switch (particleSystem.particleEmitterType.getClassName()) {
            case "BoxParticleEmitter": {
                const source = particleSystem.particleEmitterType as BoxParticleEmitter;
                shapeBlock = new BoxShapeBlock("Box shape");

                const target = shapeBlock as BoxShapeBlock;
                _CreateAndConnectInput(target.direction1, "Direction 1", source.direction1);
                _CreateAndConnectInput(target.direction2, "Direction 2", source.direction2);
                _CreateAndConnectInput(target.minEmitBox, "Min Emit Box", source.minEmitBox);
                _CreateAndConnectInput(target.maxEmitBox, "Max Emit Box", source.maxEmitBox);
                break;
            }
            case "PointParticleEmitter": {
                const source = particleSystem.particleEmitterType as PointParticleEmitter;
                shapeBlock = new PointShapeBlock("Point shape");

                const target = shapeBlock as PointShapeBlock;
                _CreateAndConnectInput(target.direction1, "Direction 1", source.direction1);
                _CreateAndConnectInput(target.direction2, "Direction 2", source.direction2);
                break;
            }
            case "SphereParticleEmitter": {
                const source = particleSystem.particleEmitterType as SphereParticleEmitter;
                shapeBlock = new SphereShapeBlock("Sphere shape");

                const target = shapeBlock as SphereShapeBlock;
                _CreateAndConnectInput(target.radius, "Radius", source.radius);
                _CreateAndConnectInput(target.radiusRange, "Radius Range", source.radiusRange);
                _CreateAndConnectInput(target.directionRandomizer, "Direction Randomizer", source.directionRandomizer);
                break;
            }
            case "CylinderParticleEmitter": {
                const source = particleSystem.particleEmitterType as CylinderParticleEmitter;
                shapeBlock = new CylinderShapeBlock("Cylinder shape");

                const target = shapeBlock as CylinderShapeBlock;
                _CreateAndConnectInput(target.height, "Height", source.height);
                _CreateAndConnectInput(target.radius, "Radius", source.radius);
                _CreateAndConnectInput(target.radiusRange, "Radius Range", source.radiusRange);
                _CreateAndConnectInput(target.directionRandomizer, "Direction Randomizer", source.directionRandomizer);
                break;
            }
            case "MeshParticleEmitter": {
                const source = particleSystem.particleEmitterType as MeshParticleEmitter;
                shapeBlock = new MeshShapeBlock("Mesh shape");

                const target = shapeBlock as MeshShapeBlock;
                _CreateAndConnectInput(target.direction1, "Direction 1", source.direction1);
                _CreateAndConnectInput(target.direction2, "Direction 2", source.direction2);

                target.mesh = source.mesh as Mesh;
                break;
            }
        }

        if (!shapeBlock) {
            throw new Error(`Unsupported particle emitter type: ${particleSystem.particleEmitterType.getClassName()}`);
        }

        createParticleBlock.particle.connectTo(shapeBlock.particle);
        shapeBlock.output.connectTo(system.particle);

        nodeParticleSystemSet.systemBlocks.push(system);
    }

    return nodeParticleSystemSet;
}
