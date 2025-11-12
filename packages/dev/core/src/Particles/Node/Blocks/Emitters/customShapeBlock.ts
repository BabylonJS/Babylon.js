import type { Nullable } from "core/types";
import type { Particle } from "core/Particles/particle";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import type { IShapeBlock } from "./IShapeBlock";

import { TmpVectors, Vector3 } from "core/Maths/math.vector";
import { RegisterClass } from "core/Misc/typeStore";
import { EmptyGeneratorFunc } from "core/Particles/EmitterTypes";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { _CreateLocalPositionData } from "./emitters.functions";

/** Function that generates particle position/direction data */
export type ParticleGeneratorFunction = (index: number, particle: Nullable<Particle>, outPosition: Vector3) => void;

/**
 * Block used to provide a flow of particles emitted from a custom position.
 */
export class CustomShapeBlock extends NodeParticleBlock implements IShapeBlock {
    /**
     * Create a new CustomShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("particlePositionGenerator", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("particleDestinationGenerator", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("particleDirectionGenerator", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CustomShapeBlock";
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the position generator input component
     */
    public get particlePositionGenerator(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the destination generator input component
     */
    public get particleDestinationGenerator(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the direction generator input component
     */
    public get particleDirectionGenerator(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Builds the block
     * @param state defines the build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state);

        system._directionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            const directionGenerator = this.particleDirectionGenerator.getConnectedValue(state) as ParticleGeneratorFunction;
            const destinationGenerator = this.particleDestinationGenerator.getConnectedValue(state) as ParticleGeneratorFunction;
            const tmpVector = TmpVectors.Vector3[0];

            if (directionGenerator && directionGenerator !== EmptyGeneratorFunc) {
                directionGenerator(-1, particle, tmpVector);
            } else if (destinationGenerator && destinationGenerator !== EmptyGeneratorFunc) {
                destinationGenerator(-1, particle, tmpVector);

                // Get direction
                const diffVector = TmpVectors.Vector3[1];
                tmpVector.subtractToRef(particle.position, diffVector);

                diffVector.scaleToRef(1 / particle.lifeTime, tmpVector);
            } else {
                tmpVector.set(0, 0, 0);
            }

            if (system.isLocal) {
                particle.direction.copyFrom(tmpVector);
            } else {
                Vector3.TransformNormalToRef(tmpVector, state.emitterWorldMatrix!, particle.direction);
            }

            particle._initialDirection = particle.direction.clone();
        };

        system._positionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            const positionGenerator = this.particlePositionGenerator.getConnectedValue(state) as ParticleGeneratorFunction;
            const tmpVector = TmpVectors.Vector3[0];

            if (positionGenerator && positionGenerator !== EmptyGeneratorFunc) {
                positionGenerator(-1, particle, tmpVector);
            } else {
                tmpVector.set(0, 0, 0);
            }

            if (system.isLocal) {
                particle.position.copyFrom(tmpVector);
            } else {
                Vector3.TransformCoordinatesToRef(tmpVector, state.emitterWorldMatrix!, particle.position);
            }

            _CreateLocalPositionData(particle);
        };

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.CustomShapeBlock", CustomShapeBlock);
