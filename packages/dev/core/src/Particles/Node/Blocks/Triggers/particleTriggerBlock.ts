import { RegisterClass } from "core/Misc/typeStore";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import type { SystemBlock } from "../systemBlock";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { _TriggerSubEmitter } from "./triggerTools";
import type { Nullable } from "core/types";

/**
 * Block used to trigger a particle system based on a condition.
 */
export class ParticleTriggerBlock extends NodeParticleBlock {
    private _triggerCount = 0;

    /**
     * Gets or sets the emit rate
     */
    @editableInPropertyPage("Max simultaneous", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public limit = 5;

    /**
     * Gets or sets the emit rate
     */
    @editableInPropertyPage("Delay between calls (ms)", PropertyTypeForEdition.Int, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public delay = 250;

    /**
     * Create a new ParticleTriggerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("condition", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("system", NodeParticleBlockConnectionPointTypes.System);

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleTriggerBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the condition input component
     */
    public get condition(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the target system input component
     */
    public get system(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    private _previousOne: Nullable<number> = null;

    public override _build(state: NodeParticleBuildState) {
        this._triggerCount = 0;
        const system = this.input.getConnectedValue(state) as ThinParticleSystem;

        const processCondition = (particle: Particle) => {
            state.particleContext = particle;
            state.systemContext = system;

            if (this.condition.getConnectedValue(state) !== 0) {
                if (this.limit === 0 || this._triggerCount < this.limit) {
                    const now = new Date().getTime();
                    if (this._previousOne && now - this._previousOne < this.delay) {
                        return; // Skip if the delay has not passed
                    }

                    this._triggerCount++;
                    this._previousOne = now;
                    // Trigger the target particle system
                    const targetSystem = this.system.getConnectedValue(state) as SystemBlock;
                    if (targetSystem) {
                        const clone = _TriggerSubEmitter(targetSystem, state.scene, particle.position);
                        clone.onDisposeObservable.addOnce(() => {
                            this._triggerCount--;
                        });

                        system.onDisposeObservable.addOnce(() => {
                            // Clean up the cloned system when the original system is disposed
                            clone.dispose();
                        });
                    }
                }
            }
        };

        const conditionProcessing = {
            process: processCondition,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(conditionProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = conditionProcessing;
        }

        this.output._storedValue = system;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.limit = this.limit;
        serializationObject.delay = this.delay;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.limit !== undefined) {
            this.limit = serializationObject.limit;
        }

        if (serializationObject.delay !== undefined) {
            this.delay = serializationObject.delay;
        }
    }

    public override dispose(): void {
        super.dispose();
        this._triggerCount = 0;
    }
}

RegisterClass("BABYLON.ParticleTriggerBlock", ParticleTriggerBlock);
