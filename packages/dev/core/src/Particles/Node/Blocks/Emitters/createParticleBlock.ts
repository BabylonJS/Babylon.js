import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import { ParticleSystem } from "core/Particles/particleSystem";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { _IExecutionQueueItem } from "core/Particles/Queue/executionQueue";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { _RemoveFromQueue } from "core/Particles/Queue/executionQueue";
import type { Particle } from "core/Particles/particle";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import { Color4 } from "core/Maths/math.color";
import { Vector2 } from "core/Maths/math.vector";
import { RegisterClass } from "core/Misc/typeStore";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";

/**
 * @internal
 */
export class CreateParticleBlock extends NodeParticleBlock {
    /**
     * Create a new CreateParticleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("emitPower", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("lifeTime", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4, true, new Color4(1, 1, 1, 1));
        this.registerInput("colorDead", NodeParticleBlockConnectionPointTypes.Color4, true, new Color4(0, 0, 0, 0));
        this.registerInput("scale", NodeParticleBlockConnectionPointTypes.Vector2, true, new Vector2(1, 1));
        this.registerInput("angle", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerOutput("particle", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CreateParticleBlock";
    }

    /**
     * Gets the emitPower input component
     */
    public get emitPower(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the lifeTime input component
     */
    public get lifeTime(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the color dead input component
     */
    public get colorDead(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the angle input component
     */
    public get angle(): NodeParticleConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the particle output component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * @internal
     */
    public override _build(state: NodeParticleBuildState) {
        const system = new ParticleSystem(this.name, state.capacity, state.scene, null, false, undefined, true);
        system.particleEmitterType = new PointParticleEmitter();

        // Creation
        system._lifeTimeCreation.process = (particle: Particle, system: ThinParticleSystem) => {
            state.particleContext = particle;
            particle.lifeTime = this.lifeTime.getConnectedValue(state);
            system._emitPower = this.emitPower.getConnectedValue(state);
        };

        system._colorCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            particle.color.copyFrom(this.color.getConnectedValue(state));
            system.colorDead.copyFrom(this.colorDead.getConnectedValue(state));
            particle.initialColor.copyFrom(particle.color);
            system.colorDead.subtractToRef(particle.initialColor, system._colorDiff);
            system._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
        };

        system._sizeCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            particle.size = 1;
            particle.scale.copyFrom(this.scale.getConnectedValue(state));
        };

        system._angleCreation.process = (particle: Particle) => {
            state.particleContext = particle;
            particle.angle = this.angle.getConnectedValue(state);
        };

        this.particle._storedValue = system;
    }
}

RegisterClass("BABYLON.CreateParticleBlock", CreateParticleBlock);
