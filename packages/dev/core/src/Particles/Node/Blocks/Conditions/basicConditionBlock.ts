import { RegisterClass } from "../../../../Misc/typeStore";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../../Decorators/nodeDecorator";
import { WithinEpsilon } from "../../../../Maths/math.scalar.functions";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";

/**
 * Conditions supported by the condition block
 */
export enum ConditionBlockTests {
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
export class BasicConditionBlock extends NodeParticleBlock {
    /**
     * Gets or sets the test used by the block
     */
    @editableInPropertyPage("Test", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Equal", value: ConditionBlockTests.Equal },
            { label: "NotEqual", value: ConditionBlockTests.NotEqual },
            { label: "LessThan", value: ConditionBlockTests.LessThan },
            { label: "GreaterThan", value: ConditionBlockTests.GreaterThan },
            { label: "LessOrEqual", value: ConditionBlockTests.LessOrEqual },
            { label: "GreaterOrEqual", value: ConditionBlockTests.GreaterOrEqual },
            { label: "Xor", value: ConditionBlockTests.Xor },
            { label: "Or", value: ConditionBlockTests.Or },
            { label: "And", value: ConditionBlockTests.And },
        ],
    })
    public test = ConditionBlockTests.Equal;

    /**
     * Gets or sets the epsilon value used for comparison
     */
    @editableInPropertyPage("Epsilon", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public epsilon = 0;

    /**
     * Create a new BasicConditionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeParticleBlockConnectionPointTypes.Float);
        this.registerInput("right", NodeParticleBlockConnectionPointTypes.Float, true, 0);

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "BasicConditionBlock";
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
                case ConditionBlockTests.Equal:
                    condition = WithinEpsilon(left, right, this.epsilon);
                    break;
                case ConditionBlockTests.NotEqual:
                    condition = !WithinEpsilon(left, right, this.epsilon);
                    break;
                case ConditionBlockTests.LessThan:
                    condition = left < right + this.epsilon;
                    break;
                case ConditionBlockTests.GreaterThan:
                    condition = left > right - this.epsilon;
                    break;
                case ConditionBlockTests.LessOrEqual:
                    condition = left <= right + this.epsilon;
                    break;
                case ConditionBlockTests.GreaterOrEqual:
                    condition = left >= right - this.epsilon;
                    break;
                case ConditionBlockTests.Xor:
                    condition = (!!left && !right) || (!left && !!right);
                    break;
                case ConditionBlockTests.Or:
                    condition = !!left || !!right;
                    break;
                case ConditionBlockTests.And:
                    condition = !!left && !!right;
                    break;
            }
            return condition;
        };

        this.output._storedFunction = (state) => {
            if (func(state)) {
                return 1;
            }

            return 0;
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

RegisterClass("BABYLON.BasicConditionBlock", BasicConditionBlock);
