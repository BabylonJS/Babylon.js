import { RegisterClass } from "../../../../Misc/typeStore";
import { WithinEpsilon } from "../../../../Maths/math.scalar.functions";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";

/**
 * Conditions supported by the condition block
 */
export enum ParticleConditionBlockTests {
    /** Equal */
    Equal,
    /** NotEqual */
    NotEqual,
    /** LessThan */
    LessThan,
    /** GreaterThan */
    GreaterThan,
    /** LessOrEqual */
    LessOrEqual,
    /** GreaterOrEqual */
    GreaterOrEqual,
    /** Logical Exclusive OR */
    Xor,
    /** Logical Or */
    Or,
    /** Logical And */
    And,
}

/**
 * Block used to evaluate a condition and return a true or false value as a float (1 or 0).
 */
export class ParticleConditionBlock extends NodeParticleBlock {
    /**
     * Gets or sets the test used by the block
     */
    @editableInPropertyPage("Test", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Equal", value: ParticleConditionBlockTests.Equal },
            { label: "NotEqual", value: ParticleConditionBlockTests.NotEqual },
            { label: "LessThan", value: ParticleConditionBlockTests.LessThan },
            { label: "GreaterThan", value: ParticleConditionBlockTests.GreaterThan },
            { label: "LessOrEqual", value: ParticleConditionBlockTests.LessOrEqual },
            { label: "GreaterOrEqual", value: ParticleConditionBlockTests.GreaterOrEqual },
            { label: "Xor", value: ParticleConditionBlockTests.Xor },
            { label: "Or", value: ParticleConditionBlockTests.Or },
            { label: "And", value: ParticleConditionBlockTests.And },
        ],
    })
    public test = ParticleConditionBlockTests.Equal;

    /**
     * Gets or sets the epsilon value used for comparison
     */
    @editableInPropertyPage("Epsilon", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public epsilon = 0;

    /**
     * Create a new ParticleConditionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeParticleBlockConnectionPointTypes.Float);
        this.registerInput("right", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("ifTrue", NodeParticleBlockConnectionPointTypes.AutoDetect, true, 1);
        this.registerInput("ifFalse", NodeParticleBlockConnectionPointTypes.AutoDetect, true, 0);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = this._inputs[2];
        this.output._defaultConnectionPointType = NodeParticleBlockConnectionPointTypes.Float;
        this._inputs[0].acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Int);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Int);
        this._linkConnectionTypes(2, 3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleConditionBlock";
    }

    /**
     * Gets the left input component
     */
    public get left(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the right input component
     */
    public get right(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the ifTrue input component
     */
    public get ifTrue(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the ifFalse input component
     */
    public get ifFalse(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        const func = (state: NodeParticleBuildState) => {
            const left = this.left.getConnectedValue(state) as number;
            const right = this.right.getConnectedValue(state) as number;
            let condition = false;

            switch (this.test) {
                case ParticleConditionBlockTests.Equal:
                    condition = WithinEpsilon(left, right, this.epsilon);
                    break;
                case ParticleConditionBlockTests.NotEqual:
                    condition = !WithinEpsilon(left, right, this.epsilon);
                    break;
                case ParticleConditionBlockTests.LessThan:
                    condition = left < right + this.epsilon;
                    break;
                case ParticleConditionBlockTests.GreaterThan:
                    condition = left > right - this.epsilon;
                    break;
                case ParticleConditionBlockTests.LessOrEqual:
                    condition = left <= right + this.epsilon;
                    break;
                case ParticleConditionBlockTests.GreaterOrEqual:
                    condition = left >= right - this.epsilon;
                    break;
                case ParticleConditionBlockTests.Xor:
                    condition = (!!left && !right) || (!left && !!right);
                    break;
                case ParticleConditionBlockTests.Or:
                    condition = !!left || !!right;
                    break;
                case ParticleConditionBlockTests.And:
                    condition = !!left && !!right;
                    break;
            }
            return condition;
        };

        this.output._storedFunction = (state) => {
            if (func(state)) {
                return this.ifTrue.getConnectedValue(state);
            }

            return this.ifFalse.getConnectedValue(state);
        };
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.test = this.test;
        serializationObject.epsilon = this.epsilon;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.test = serializationObject.test;
        if (serializationObject.epsilon !== undefined) {
            this.epsilon = serializationObject.epsilon;
        }
    }
}

RegisterClass("BABYLON.ParticleConditionBlock", ParticleConditionBlock);
