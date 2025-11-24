import type { Nullable } from "core/types";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";

import { RegisterClass } from "core/Misc/typeStore";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";

/**
 * Operations supported by the FloatToInt block
 */
export enum ParticleFloatToIntBlockOperations {
    /** Round */
    Round,
    /** Ceil */
    Ceil,
    /** Floor */
    Floor,
    /** Truncate */
    Truncate,
}

/**
 * Block used to transform a float to an int
 */
export class ParticleFloatToIntBlock extends NodeParticleBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Round", value: ParticleFloatToIntBlockOperations.Round },
            { label: "Ceil", value: ParticleFloatToIntBlockOperations.Ceil },
            { label: "Floor", value: ParticleFloatToIntBlockOperations.Floor },
            { label: "Truncate", value: ParticleFloatToIntBlockOperations.Truncate },
        ],
    })
    public operation = ParticleFloatToIntBlockOperations.Round;

    /**
     * Creates a new ParticleFloatToIntBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Int);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeParticleBlockConnectionPointTypes.Float | NodeParticleBlockConnectionPointTypes.Int);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleFloatToIntBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        super._build(state);
        let func: Nullable<(value: NodeParticleBuildState) => number> = null;
        const input = this.input;

        switch (this.operation) {
            case ParticleFloatToIntBlockOperations.Round: {
                func = (state) => {
                    return Math.round(input.getConnectedValue(state));
                };
                break;
            }
            case ParticleFloatToIntBlockOperations.Ceil: {
                func = (state) => {
                    return Math.ceil(input.getConnectedValue(state));
                };
                break;
            }
            case ParticleFloatToIntBlockOperations.Floor: {
                func = (state) => {
                    return Math.floor(input.getConnectedValue(state));
                };
                break;
            }
            case ParticleFloatToIntBlockOperations.Truncate: {
                func = (state) => {
                    return Math.trunc(input.getConnectedValue(state));
                };
                break;
            }
        }

        if (!func) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            return func(state);
        };
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.operation = serializationObject.operation;
    }
}

RegisterClass("BABYLON.ParticleFloatToIntBlock", ParticleFloatToIntBlock);
