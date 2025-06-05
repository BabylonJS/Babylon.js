import type { ParticleSystem } from "core/Particles/particleSystem";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import type { Nullable } from "core/types";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { BaseParticleSystem } from "core/Particles/baseParticleSystem";

/**
 * Block used to get a system of particles
 */
export class SystemBlock extends NodeParticleBlock {
    /**
     * @internal
     */
    public _particleSystem: Nullable<ParticleSystem> = null;

    /**
     * Gets or sets the blend mode for the particle system
     */
    @editableInPropertyPage("Blend mode", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "OneOne", value: BaseParticleSystem.BLENDMODE_ONEONE },
            { label: "Standard", value: BaseParticleSystem.BLENDMODE_STANDARD },
            { label: "Add", value: BaseParticleSystem.BLENDMODE_ADD },
            { label: "Multiply", value: BaseParticleSystem.BLENDMODE_MULTIPLY },
            { label: "MultiplyAdd", value: BaseParticleSystem.BLENDMODE_MULTIPLYADD },
        ],
    })
    public blendMode = BaseParticleSystem.BLENDMODE_ONEONE;

    /**
     * Gets or sets the epsilon value used for comparison
     */
    @editableInPropertyPage("Capacity", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0, max: 10000 })
    public capacity = 1000;

    /**
     * Gets or sets the epsilon value used for comparison
     */
    @editableInPropertyPage("Emit rate", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public emitRate = 10;

    /**
     * Create a new SystemBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isSystem = true;

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("texture", NodeParticleBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SystemBlock";
    }

    /**
     * Gets the particle input component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Builds the block and return a functional particle system
     * @param state defines the building state
     * @returns the built particle system
     */
    public createSystem(state: NodeParticleBuildState): ParticleSystem {
        state.capacity = this.capacity;

        this.build(state);

        this._particleSystem = this.particle.getConnectedValue(state) as ParticleSystem;
        this._particleSystem.particleTexture = this.texture.getConnectedValue(state);
        this._particleSystem.emitRate = this.emitRate;
        this._particleSystem.blendMode = this.blendMode;

        return this._particleSystem;
    }

    public override dispose(): void {
        this._particleSystem = null;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.capacity = this.capacity;
        serializationObject.emitRate = this.emitRate;
        serializationObject.blendMode = this.blendMode;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.capacity = serializationObject.capacity;
        this.emitRate = serializationObject.emitRate;

        if (serializationObject.blendMode !== undefined) {
            this.blendMode = serializationObject.blendMode;
        }
    }
}

RegisterClass("BABYLON.SystemBlock", SystemBlock);
