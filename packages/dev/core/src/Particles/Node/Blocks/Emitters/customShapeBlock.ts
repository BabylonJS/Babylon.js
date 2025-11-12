import type { Nullable } from "core/types";
import type { Particle } from "core/Particles/particle";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import type { IShapeBlock } from "./IShapeBlock";

import { TmpVectors, Vector3 } from "core/Maths/math.vector";
import { RegisterClass } from "core/Misc/typeStore";
import { EmptyGeneratorFunc } from "core/Particles/EmitterTypes/customParticleEmitter";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { _CreateLocalPositionData } from "./emitters.functions";

/** Function that generates particle position/direction data */
type ParticleGeneratorFunction = (index: number, particle: Nullable<Particle>, outPosition: Vector3) => void;

/**
 * Block used to provide a flow of particles emitted from a custom position.
 */
export class CustomShapeBlock extends NodeParticleBlock implements IShapeBlock {
    /** The particle position generator function */
    public particlePositionGenerator: ParticleGeneratorFunction = EmptyGeneratorFunc;
    /** The particle destination generator function */
    public particleDestinationGenerator: ParticleGeneratorFunction = EmptyGeneratorFunc;
    /** The particle direction generator function */
    public particleDirectionGenerator: ParticleGeneratorFunction = EmptyGeneratorFunc;

    /**
     * Create a new CustomShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
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

            const tmpVector = TmpVectors.Vector3[0];

            if (this.particleDirectionGenerator && this.particleDirectionGenerator !== EmptyGeneratorFunc) {
                this.particleDirectionGenerator(-1, particle, tmpVector);
            } else if (this.particleDestinationGenerator && this.particleDestinationGenerator !== EmptyGeneratorFunc) {
                this.particleDestinationGenerator(-1, particle, tmpVector);

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

            const tmpVector = TmpVectors.Vector3[0];

            if (this.particlePositionGenerator && this.particlePositionGenerator !== EmptyGeneratorFunc) {
                this.particlePositionGenerator(-1, particle, tmpVector);
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
