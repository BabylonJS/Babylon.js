import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { Vector3 } from "core/Maths/math.vector";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { Particle } from "core/Particles/particle";
import { RandomRange } from "core/Maths/math.scalar.functions";

/**
 * Block used to provide a flow of particles emitted from a box shape.
 */
export class BoxShapeBlock extends NodeParticleBlock {
    /**
     * Create a new BoxShapeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("direction1", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("direction2", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, 1.0, 0));
        this.registerInput("minEmitBox", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(-0.5, -0.5, -0.5));
        this.registerInput("maxEmitBox", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0.5, 0.5, 0.5));
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "BoxShapeBlock";
    }

    /**
     * Gets the particle input component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the direction1 input component
     */
    public get direction1(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the direction2 input component
     */
    public get direction2(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the minEmitBox input component
     */
    public get minEmitBox(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the maxEmitBox input component
     */
    public get maxEmitBox(): NodeParticleConnectionPoint {
        return this._inputs[4];
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

            const direction1 = this.direction1.getConnectedValue(state) as Vector3;
            const direction2 = this.direction2.getConnectedValue(state) as Vector3;

            const randX = RandomRange(direction1.x, direction2.x);
            const randY = RandomRange(direction1.y, direction2.y);
            const randZ = RandomRange(direction1.z, direction2.z);

            if (state.isEmitterTransformNode) {
                Vector3.TransformNormalFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.direction);
            } else {
                particle.direction.copyFromFloats(randX, randY, randZ);
            }
        };

        system._positionCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;
            const minEmitBox = this.minEmitBox.getConnectedValue(state) as Vector3;
            const maxEmitBox = this.maxEmitBox.getConnectedValue(state) as Vector3;

            const randX = RandomRange(minEmitBox.x, maxEmitBox.x);
            const randY = RandomRange(minEmitBox.y, maxEmitBox.y);
            const randZ = RandomRange(minEmitBox.z, maxEmitBox.z);

            if (state.isEmitterTransformNode) {
                Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, state.emitterWorldMatrix!, particle.position);
            } else {
                particle.position.copyFromFloats(randX, randY, randZ);
                particle.position.addInPlace(state.emitterPosition!);
            }
        };

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.BoxShapeBlock", BoxShapeBlock);
