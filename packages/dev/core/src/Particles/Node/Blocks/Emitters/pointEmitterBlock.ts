import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Vector3 } from "core/Maths/math.vector";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";

/**
 * Block used to provide a flow of particles emitted from a point.
 */
export class PointEmitterBlock extends NodeParticleBlock {
    /**
     * Create a new PointEmitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerOutput("particle", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PointEmitterBlock";
    }

    /**
     * Gets the direction1 input component
     */
    public get direction1(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the direction2 input component
     */
    public get direction2(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the particle output component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Builds the block
     */
    public override async _buildAsync() {
        this.particle._storedFunction = (state) => {
            const system = new ParticleSystem(this.name, state.capacity, state.scene);
            const pointEmitter = new PointParticleEmitter();

            pointEmitter.direction1 = this.direction1.getConnectedValue(state) as Vector3;
            pointEmitter.direction2 = this.direction2.getConnectedValue(state) as Vector3;

            system.particleEmitterType = pointEmitter;

            return system;
        };
    }
}

RegisterClass("BABYLON.PointEmitterBlock", PointEmitterBlock);
