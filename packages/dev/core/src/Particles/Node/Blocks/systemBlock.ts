import type { Nullable } from "core/types";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { ParticleSystem } from "core/Particles/particleSystem";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import type { ParticleGradientValueBlock } from "./particleGradientValueBlock";

import { Constants } from "../../../Engines/constants";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { RegisterClass } from "core/Misc/typeStore";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { BaseParticleSystem } from "core/Particles/baseParticleSystem";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { _TriggerSubEmitter } from "core/Particles/Node/Blocks/Triggers/triggerTools";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { ParticleGradientBlock } from "./particleGradientBlock";

type CustomShader = {
    shaderPath: { fragmentElement: string };
    shaderOptions: { uniforms: string[]; samplers: string[]; defines: string[] };
};

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
            { label: "Blend Mode OneOne", value: BaseParticleSystem.BLENDMODE_ONEONE },
            { label: "Blend Mode Standard", value: BaseParticleSystem.BLENDMODE_STANDARD },
            { label: "Blend Mode Add", value: BaseParticleSystem.BLENDMODE_ADD },
            { label: "Blend Mode Multiply", value: BaseParticleSystem.BLENDMODE_MULTIPLY },
            { label: "Blend Mode MultiplyAdd", value: BaseParticleSystem.BLENDMODE_MULTIPLYADD },
        ],
    })
    public blendMode = BaseParticleSystem.BLENDMODE_ONEONE;

    /**
     * Gets or sets the epsilon value used for comparison
     */
    @editableInPropertyPage("Capacity", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0, max: 10000 })
    public capacity = 1000;

    /**
     * Gets or sets the manual emit count
     */
    @editableInPropertyPage("Manual emit count", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: -1 })
    public manualEmitCount = -1;

    /**
     * Gets or sets the target stop duration for the particle system
     */
    @editableInPropertyPage("Delay start(ms)", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public startDelay = 0;

    /**
     * Gets or sets the target stop duration for the particle system
     */
    @editableInPropertyPage("updateSpeed", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0, max: 0.1 })
    public updateSpeed = 0.0167;

    /**
     * Gets or sets the number of pre-warm cycles before rendering the particle system
     */
    @editableInPropertyPage("Pre-warm cycles", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public preWarmCycles = 0;

    /**
     * Gets or sets the time step multiplier used for pre-warm
     */
    @editableInPropertyPage("Pre-warm step multiplier", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public preWarmStepOffset = 0;

    /**
     * Gets or sets a boolean indicating if the system is billboard based
     */
    @editableInPropertyPage("Is billboard based", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public isBillboardBased = true;

    /**
     * Gets or sets the billboard mode for the particle system
     */
    @editableInPropertyPage("Billboard mode", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Billboard Mode All", value: Constants.PARTICLES_BILLBOARDMODE_ALL },
            { label: "Billboard Mode Y", value: Constants.PARTICLES_BILLBOARDMODE_Y },
            { label: "Billboard Mode Stretched", value: Constants.PARTICLES_BILLBOARDMODE_STRETCHED },
            { label: "Billboard Mode Stretched Local", value: Constants.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL },
        ],
    })
    public billBoardMode = Constants.PARTICLES_BILLBOARDMODE_ALL;

    /**
     * Gets or sets a boolean indicating if the system coordinate space is local or global
     */
    @editableInPropertyPage("Is local", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public isLocal = false;

    /**
     * Gets or sets a boolean indicating if the system should be disposed when stopped
     */
    @editableInPropertyPage("Dispose on stop", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public disposeOnStop = false;

    /**
     * Gets or sets a boolean indicating if the system should not start automatically
     */
    @editableInPropertyPage("Do no start", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public doNoStart = false;

    /**
     * Gets or sets the rendering group id for the particle system (0 by default)
     */
    @editableInPropertyPage("Rendering group id", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public renderingGroupId = 0;

    /** @internal */
    public _internalId = SystemBlock._IdCounter++;

    /**
     * Gets or sets the custom shader configuration used to render the particles.
     * This can be used to set your own shader to render the particle system.
     */
    public customShader: Nullable<CustomShader> = null;

    /**
     * Gets or sets the emitter for the particle system.
     */
    public emitter: Nullable<AbstractMesh | Vector3> = Vector3.Zero();

    /**
     * Create a new SystemBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isSystem = true;

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("emitRate", NodeParticleBlockConnectionPointTypes.Int, true, 10, 0);
        this.registerInput("texture", NodeParticleBlockConnectionPointTypes.Texture);
        this.registerInput("translationPivot", NodeParticleBlockConnectionPointTypes.Vector2, true);
        this.registerInput("textureMask", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("targetStopDuration", NodeParticleBlockConnectionPointTypes.Float, true, 0, 0);
        this.registerInput("onStart", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("onEnd", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("rampGradient", NodeParticleBlockConnectionPointTypes.Color4, true);
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
     * Gets the emitRate input component
     */
    public get emitRate(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the translationPivot input component
     */
    public get translationPivot(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the textureMask input component
     */
    public get textureMask(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the targetStopDuration input component
     */
    public get targetStopDuration(): NodeParticleConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the onStart input component
     */
    public get onStart(): NodeParticleConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the onEnd input component
     */
    public get onEnd(): NodeParticleConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the rampGradient input component
     */
    public get rampGradient(): NodeParticleConnectionPoint {
        return this._inputs[8];
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
        particleSystem.emitRate = this.emitRate.getConnectedValue(state) as number;
        particleSystem.manualEmitCount = this.manualEmitCount;
        particleSystem.updateSpeed = this.updateSpeed;
        particleSystem.preWarmCycles = this.preWarmCycles;
        particleSystem.preWarmStepOffset = this.preWarmStepOffset;
        particleSystem.blendMode = this.blendMode;
        particleSystem.name = this.name;
        particleSystem._targetStopDuration = (this.targetStopDuration.getConnectedValue(state) as number) ?? 0;
        particleSystem.startDelay = this.startDelay;
        particleSystem.isBillboardBased = this.isBillboardBased;
        particleSystem.billboardMode = this.billBoardMode;
        particleSystem.translationPivot = (this.translationPivot.getConnectedValue(state) as Vector2) || Vector2.Zero();
        particleSystem.textureMask = this.textureMask.getConnectedValue(state) ?? new Color4(1, 1, 1, 1);
        particleSystem.isLocal = this.isLocal;
        particleSystem.disposeOnStop = this.disposeOnStop;
        particleSystem.renderingGroupId = this.renderingGroupId;
        if (this.emitter) {
            particleSystem.emitter = this.emitter;
        }

        // Apply custom shader if defined
        if (this.customShader) {
            const engine = particleSystem.getScene()?.getEngine();
            if (engine?.createEffectForParticles) {
                const defines: string = this.customShader.shaderOptions.defines.length > 0 ? this.customShader.shaderOptions.defines.join("\n") : "";
                const effect = engine.createEffectForParticles(
                    this.customShader.shaderPath.fragmentElement,
                    this.customShader.shaderOptions.uniforms,
                    this.customShader.shaderOptions.samplers,
                    defines
                );
                particleSystem.setCustomEffect(effect, 0);
                particleSystem.customShader = this.customShader;
            }
        }

        // The emit rate can vary if it is connected to another block like a gradient
        particleSystem._calculateEmitRate = () => {
            state.systemContext = particleSystem;
            return this.emitRate.getConnectedValue(state) as number;
        };

        // Get the ramp gradients
        particleSystem.useRampGradients = false;
        if (this.rampGradient.isConnected) {
            if (this.rampGradient.connectedPoint?.ownerBlock instanceof ParticleGradientBlock) {
                // We have a possible gradient, loop through its entries
                const gradientInputs = this.rampGradient.connectedPoint?.ownerBlock.inputs;

                // Skip the first input which is the gradient selector, and we only care about the gradient values
                for (let i = 1; i < gradientInputs.length; i++) {
                    if (gradientInputs[i].isConnected) {
                        const rampEntry = gradientInputs[i].connectedPoint?.ownerBlock as ParticleGradientValueBlock;
                        const color = rampEntry._inputs[0].getConnectedValue(state) as Color4;
                        particleSystem.addRampGradient(rampEntry.reference, new Color3(color.r, color.g, color.b));
                        particleSystem.useRampGradients = true;
                    }
                }
            } else {
                // We have a single value, add it as ramp gradient
                const color = this.rampGradient.getConnectedValue(state) as Color4;
                particleSystem.addRampGradient(0, new Color3(color.r, color.g, color.b));
                particleSystem.useRampGradients = true;
            }
        }

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

    /**
     * Serializes the system block
     * @returns The serialized object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.capacity = this.capacity;
        serializationObject.manualEmitCount = this.manualEmitCount;
        serializationObject.blendMode = this.blendMode;
        serializationObject.updateSpeed = this.updateSpeed;
        serializationObject.preWarmCycles = this.preWarmCycles;
        serializationObject.preWarmStepOffset = this.preWarmStepOffset;
        serializationObject.isBillboardBased = this.isBillboardBased;
        serializationObject.billBoardMode = this.billBoardMode;
        serializationObject.isLocal = this.isLocal;
        serializationObject.disposeOnStop = this.disposeOnStop;
        serializationObject.doNoStart = this.doNoStart;
        serializationObject.renderingGroupId = this.renderingGroupId;
        serializationObject.startDelay = this.startDelay;
        serializationObject.customShader = this.customShader;

        return serializationObject;
    }

    /**
     * Deserializes the system block
     * @param serializationObject The serialized system
     */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.capacity = serializationObject.capacity;
        this.manualEmitCount = serializationObject.manualEmitCount ?? -1;
        this.updateSpeed = serializationObject.updateSpeed ?? 0.0167;
        this.preWarmCycles = serializationObject.preWarmCycles ?? 0;
        this.preWarmStepOffset = serializationObject.preWarmStepOffset ?? 0;
        this.isBillboardBased = serializationObject.isBillboardBased ?? true;
        this.billBoardMode = serializationObject.billBoardMode ?? Constants.PARTICLES_BILLBOARDMODE_ALL;
        this.isLocal = serializationObject.isLocal ?? false;
        this.disposeOnStop = serializationObject.disposeOnStop ?? false;
        this.doNoStart = !!serializationObject.doNoStart;
        this.renderingGroupId = serializationObject.renderingGroupId ?? 0;

        if (serializationObject.emitRate !== undefined) {
            this.emitRate.value = serializationObject.emitRate;
        }

        if (serializationObject.blendMode !== undefined) {
            this.blendMode = serializationObject.blendMode;
        }

        if (serializationObject.startDelay !== undefined) {
            this.startDelay = serializationObject.startDelay;
        }

        if (serializationObject.customShader !== undefined) {
            this.customShader = serializationObject.customShader;
        }
    }
}

RegisterClass("BABYLON.SystemBlock", SystemBlock);
