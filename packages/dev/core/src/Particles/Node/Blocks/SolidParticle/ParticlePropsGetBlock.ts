import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { SolidParticle } from "../../../solidParticle";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { serialize } from "../../../../Misc/decorators";

/**
 * Block used to get custom properties from particle.props
 * Works similar to contextual blocks but for dynamic property names
 */
export class ParticlePropsGetBlock extends NodeParticleBlock {
    /**
     * Gets or sets the property name to read from particle.props
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

    /**
     * Gets the value to display (returns propertyName as string)
     */
    public get displayValue(): string {
        return this.propertyName || "value";
    }

    public constructor(name: string) {
        super(name);

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.AutoDetect);
        // Set default type
        (this._outputs[0] as any)._defaultConnectionPointType = this._type;
    }

    public override getClassName() {
        return "ParticlePropsGetBlock";
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
            // Update output type
            (this._outputs[0] as any)._type = value;
            (this._outputs[0] as any)._defaultConnectionPointType = value;
        }
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        // Validate property name
        if (!this.propertyName || this.propertyName.trim() === "") {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        // Validate type
        if (this._type === NodeParticleBlockConnectionPointTypes.Undefined || this._type === NodeParticleBlockConnectionPointTypes.AutoDetect) {
            this._type = NodeParticleBlockConnectionPointTypes.Float;
            (this._outputs[0] as any)._type = this._type;
            (this._outputs[0] as any)._defaultConnectionPointType = this._type;
        }

        const propertyName = this.propertyName;

        const func = (state: NodeParticleBuildState) => {
            if (!state.particleContext) {
                return null;
            }

            const particle = state.particleContext as SolidParticle;

            if (!particle.props) {
                return null;
            }

            const value = particle.props[propertyName];

            if (value === undefined) {
                return null;
            }

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
        (this._outputs[0] as any)._type = this._type;
        (this._outputs[0] as any)._defaultConnectionPointType = this._type;
    }
}

RegisterClass("BABYLON.ParticlePropsGetBlock", ParticlePropsGetBlock);
