import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { SolidParticle } from "../../../solidParticle";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { serialize } from "../../../../Misc/decorators";

/**
 * Block used to set custom properties in particle.props
 * Works as a side-effect block that stores values and passes them through
 */
export class ParticlePropsSetBlock extends NodeParticleBlock {
    /**
     * Gets or sets the property name to store in particle.props
     */
    @serialize("propertyName")
    @editableInPropertyPage("Property Name", PropertyTypeForEdition.String, "PROPERTIES", {
        embedded: false,
        notifiers: { rebuild: true },
    })
    public propertyName: string = "value";

    /**
     * Gets or sets the connection point type (default float)
     */
    private _type: NodeParticleBlockConnectionPointTypes = NodeParticleBlockConnectionPointTypes.Float;

    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeParticleBlockConnectionPointTypes.AutoDetect, true);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);
        
        // Link output type to input type
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        // Set default type for when input is not connected
        (this._outputs[0] as any)._defaultConnectionPointType = this._type;
    }

    public override getClassName() {
        return "ParticlePropsSetBlock";
    }

    public get value(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the value to display (returns propertyName as string)
     * This shadows the connection point name for display purposes
     */
    public get displayValue(): string {
        return this.propertyName || "value";
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets or sets the connection point type
     */
    public get type(): NodeParticleBlockConnectionPointTypes {
        return this._type;
    }

    public set type(value: NodeParticleBlockConnectionPointTypes) {
        if (this._type !== value) {
            this._type = value;
            // Update default type (used when input is not connected)
            (this._outputs[0] as any)._defaultConnectionPointType = value;
        }
    }

    public override _build(state: NodeParticleBuildState) {
        // Validate property name
        if (!this.propertyName || this.propertyName.trim() === "") {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const propertyName = this.propertyName;

        const func = (state: NodeParticleBuildState) => {
            if (!state.particleContext) {
                return null;
            }

            const particle = state.particleContext as SolidParticle;

            const value = this.value.getConnectedValue(state);

            if (!particle.props) {
                particle.props = {};
            }

            particle.props[propertyName] = value;

            return value;
        };

        if (this.output.isConnected) {
            this.output._storedFunction = func;
        } else {
            this.output._storedValue = func(state);
        }
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.propertyName = this.propertyName;
        serializationObject.type = this._type;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.propertyName = serializationObject.propertyName || "value";
        this._type = serializationObject.type || NodeParticleBlockConnectionPointTypes.Float;
        (this._outputs[0] as any)._defaultConnectionPointType = this._type;
    }
}

RegisterClass("BABYLON.ParticlePropsSetBlock", ParticlePropsSetBlock);
