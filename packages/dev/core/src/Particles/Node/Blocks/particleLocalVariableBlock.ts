import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

export enum ParticleLocalVariableBlockScope {
    Particle = 0,
    Loop = 1,
}

/**
 * Defines a block used to store local values
 * #A1OS53#5
 */
export class ParticleLocalVariableBlock extends NodeParticleBlock {
    /**
     * Gets or sets the scope used by the block
     */
    @editableInPropertyPage("Scope", PropertyTypeForEdition.List, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
        options: [
            { label: "Particle", value: ParticleLocalVariableBlockScope.Particle },
            { label: "Loop", value: ParticleLocalVariableBlockScope.Loop },
        ],
    })
    public scope = ParticleLocalVariableBlockScope.Particle;

    /**
     * Create a new ParticleLocalVariableBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isDebug = true;

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.FloatGradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector2Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector3Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Color4Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.System);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Particle);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleLocalVariableBlock";
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
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        let storedValue: any = null;
        let localId = -1;

        const func = (state: NodeParticleBuildState) => {
            if (!state.particleContext && !state.systemContext) {
                storedValue = null;
                return null;
            }

            const id = (this.scope === ParticleLocalVariableBlockScope.Particle ? state.particleContext?.id : state.systemContext?.getScene()!.getFrameId()) || -1;

            if (localId !== id) {
                localId = id;
                storedValue = null;
            }

            if (storedValue === null) {
                storedValue = this.input.getConnectedValue(state);
            }

            return storedValue;
        };

        if (this.output.isConnected) {
            this.output._storedFunction = func;
        } else {
            this.output._storedValue = func(state);
        }
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.scope = this.scope;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.scope = serializationObject.scope;
    }
}

RegisterClass("BABYLON.ParticleLocalVariableBlock", ParticleLocalVariableBlock);
