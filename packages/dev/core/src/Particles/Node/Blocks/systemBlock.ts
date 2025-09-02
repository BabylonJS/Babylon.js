import type { ParticleSystem } from "core/Particles/particleSystem";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { BaseParticleSystem } from "core/Particles/baseParticleSystem";
import { _TriggerSubEmitter } from "./Triggers/triggerTools";

/**
 * Block used to get a system of particles
 */
export class SystemBlock extends NodeParticleBlock {
    private static _IdCounter = 0;

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
     * Gets or sets the emit rate
     */
    @editableInPropertyPage("Emit rate", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public emitRate = 10;

    /**
     * Gets or sets the target stop duration for the particle system
     */
    @editableInPropertyPage("Target duration", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public targetStopDuration = 0;

    /**
     * Gets or sets the target stop duration for the particle system
     */
    @editableInPropertyPage("Delay start(ms)", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public startDelay = 0;

    /**
     * Gets or sets a boolean indicating if the system should not start automatically
     */
    @editableInPropertyPage("Do no start", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public doNoStart = false;

    /** @internal */
    public _internalId = SystemBlock._IdCounter++;

    /**
     * Create a new SystemBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isSystem = true;

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("texture", NodeParticleBlockConnectionPointTypes.Texture);
        this.registerInput("onStart", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("onEnd", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerOutput("system", NodeParticleBlockConnectionPointTypes.System);
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
     * Gets the onStart input component
     */
    public get onStart(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the onEnd input component
     */
    public get onEnd(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the system output component
     */
    public get system(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Builds the block and return a functional particle system
     * @param state defines the building state
     * @returns the built particle system
     */
    public createSystem(state: NodeParticleBuildState): ParticleSystem {
        state.capacity = this.capacity;
        state.buildId = this._buildId++;

        this.build(state);

        const particleSystem = this.particle.getConnectedValue(state) as ParticleSystem;
        particleSystem.particleTexture = this.texture.getConnectedValue(state);
        particleSystem.emitRate = this.emitRate;
        particleSystem.blendMode = this.blendMode;
        particleSystem.name = this.name;
        particleSystem._targetStopDuration = this.targetStopDuration;
        particleSystem.startDelay = this.startDelay;

        this.system._storedValue = this;

        particleSystem.canStart = () => {
            return !this.doNoStart;
        };

        particleSystem.onStartedObservable.add((system) => {
            // Triggers
            const onStartSystem = this.onStart.getConnectedValue(state);
            if (onStartSystem) {
                system.onStartedObservable.addOnce(() => {
                    state.systemContext = particleSystem;
                    const clone = _TriggerSubEmitter(onStartSystem, state.scene, state.emitterPosition!);

                    this.onDisposeObservable.addOnce(() => {
                        // Clean up the cloned system when the original system is disposed
                        clone.dispose();
                    });
                });
            }

            const onEndSystem = this.onEnd.getConnectedValue(state);
            if (onEndSystem) {
                system.onStoppedObservable.addOnce(() => {
                    state.systemContext = particleSystem;
                    const clone = _TriggerSubEmitter(onEndSystem, state.scene, state.emitterPosition!);

                    this.onDisposeObservable.addOnce(() => {
                        // Clean up the cloned system when the original system is disposed
                        clone.dispose();
                    });
                });
            }
        });

        this.onDisposeObservable.addOnce(() => {
            particleSystem.dispose();
        });

        // Return
        return particleSystem;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.capacity = this.capacity;
        serializationObject.emitRate = this.emitRate;
        serializationObject.blendMode = this.blendMode;
        serializationObject.doNoStart = this.doNoStart;
        serializationObject.targetStopDuration = this.targetStopDuration;
        serializationObject.startDelay = this.startDelay;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.capacity = serializationObject.capacity;
        this.emitRate = serializationObject.emitRate;
        this.doNoStart = !!serializationObject.doNoStart;

        if (serializationObject.blendMode !== undefined) {
            this.blendMode = serializationObject.blendMode;
        }

        if (serializationObject.targetStopDuration !== undefined) {
            this.targetStopDuration = serializationObject.targetStopDuration;
        }

        if (serializationObject.startDelay !== undefined) {
            this.startDelay = serializationObject.startDelay;
        }
    }
}

RegisterClass("BABYLON.SystemBlock", SystemBlock);
