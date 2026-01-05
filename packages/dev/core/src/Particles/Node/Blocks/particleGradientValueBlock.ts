import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
/**
 * Block used to define a gradient entry for a gradient block
 */
export class ParticleGradientValueBlock extends NodeParticleBlock {
    /**
     * Gets or sets the epsilon value used for comparison
     */
    @editableInPropertyPage("Reference", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0, max: 1 })
    public reference = 0;

    /**
     * Creates a new ParticleGradientEntryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._outputs[0]._typeConnectionSourceTranslation = (type) => {
            switch (type) {
                case NodeParticleBlockConnectionPointTypes.Float:
                    return NodeParticleBlockConnectionPointTypes.FloatGradient;
                case NodeParticleBlockConnectionPointTypes.Vector2:
                    return NodeParticleBlockConnectionPointTypes.Vector2Gradient;
                case NodeParticleBlockConnectionPointTypes.Vector3:
                    return NodeParticleBlockConnectionPointTypes.Vector3Gradient;
                case NodeParticleBlockConnectionPointTypes.Color4:
                    return NodeParticleBlockConnectionPointTypes.Color4Gradient;
            }
            return type;
        };

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeParticleBlockConnectionPointTypes.Float |
                NodeParticleBlockConnectionPointTypes.Vector2 |
                NodeParticleBlockConnectionPointTypes.Vector3 |
                NodeParticleBlockConnectionPointTypes.Color4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleGradientValueBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        this.output._storedFunction = (state) => {
            return null;
        };
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.reference = this.reference;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.reference = serializationObject.reference;
    }
}

RegisterClass("BABYLON.ParticleGradientValueBlock", ParticleGradientValueBlock);
