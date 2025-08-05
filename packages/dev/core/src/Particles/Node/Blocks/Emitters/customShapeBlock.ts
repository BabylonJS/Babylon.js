import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { Vector3 } from "core/Maths/math.vector";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { Particle } from "core/Particles/particle";
import type { IShapeBlock } from "./IShapeBlock";

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
        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 0, 0));
        this.registerInput("direction", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
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
     * Gets the position input component
     */
    public get position(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the direction input component
     */
    public get direction(): NodeParticleConnectionPoint {
        return this._inputs[2];
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

            const direction = this.direction.getConnectedValue(state);

            if (state.isEmitterTransformNode) {
                Vector3.TransformNormalToRef(direction, state.emitterWorldMatrix!, particle.direction);
            } else {
                particle.direction.copyFrom(direction);
            }
        };

        system._positionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            const position = this.position.getConnectedValue(state);

            if (state.isEmitterTransformNode) {
                Vector3.TransformCoordinatesToRef(position, state.emitterWorldMatrix!, particle.position);
            } else {
                particle.position.copyFrom(position);
                particle.position.addInPlace(state.emitterPosition!);
            }
        };

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.CustomShapeBlock", CustomShapeBlock);
