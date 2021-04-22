import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';

/**
 * Operations supported by the ConditionalBlock block
 */
export enum ConditionalBlockConditions {
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
    And
}

/**
 * Block used to apply conditional operation between floats
 */
export class ConditionalBlock extends NodeMaterialBlock {

    /**
     * Gets or sets the condition applied by the block
     */
    public condition = ConditionalBlockConditions.LessThan;

    /**
     * Creates a new ConditionalBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("true", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("false", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._linkConnectionTypes(2, 3);
        this._outputs[0]._typeConnectionSource = this._inputs[2];
        this._outputs[0]._defaultConnectionPointType = NodeMaterialBlockConnectionPointTypes.Float;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ConditionalBlock";
    }

    /**
     * Gets the first operand component
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the second operand component
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the value to return if condition is true
     */
    public get true(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the value to return if condition is false
     */
    public get false(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];

        let trueStatement = this.true.isConnected ? this.true.associatedVariableName : "1.0";
        let falseStatement = this.false.isConnected ? this.false.associatedVariableName : "0.0";

        switch (this.condition) {
            case ConditionalBlockConditions.Equal: {
                state.compilationString += this._declareOutput(output, state) + ` = ${this.a.associatedVariableName} == ${this.b.associatedVariableName} ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.NotEqual: {
                state.compilationString += this._declareOutput(output, state) + ` = ${this.a.associatedVariableName} != ${this.b.associatedVariableName} ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.LessThan: {
                state.compilationString += this._declareOutput(output, state) + ` = ${this.a.associatedVariableName} < ${this.b.associatedVariableName} ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.LessOrEqual: {
                state.compilationString += this._declareOutput(output, state) + ` = ${this.a.associatedVariableName} <= ${this.b.associatedVariableName} ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.GreaterThan: {
                state.compilationString += this._declareOutput(output, state) + ` = ${this.a.associatedVariableName} > ${this.b.associatedVariableName} ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.GreaterOrEqual: {
                state.compilationString += this._declareOutput(output, state) + ` = ${this.a.associatedVariableName} >= ${this.b.associatedVariableName} ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.Xor: {
                state.compilationString += this._declareOutput(output, state) + ` = (mod(${this.a.associatedVariableName} + ${this.b.associatedVariableName}, 2.0) > 0.0) ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.Or: {
                state.compilationString += this._declareOutput(output, state) + ` = (min(${this.a.associatedVariableName} + ${this.b.associatedVariableName}, 1.0) > 0.0) ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
            case ConditionalBlockConditions.And: {
                state.compilationString += this._declareOutput(output, state) + ` = (${this.a.associatedVariableName} * ${this.b.associatedVariableName} > 0.0)  ? ${trueStatement} : ${falseStatement};\r\n`;
                break;
            }
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.condition = this.condition;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.condition = serializationObject.condition;
    }

    protected _dumpPropertiesCode() {
        var codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.operation = BABYLON.ConditionalBlockConditions.${ConditionalBlockConditions[this.condition]};\r\n`;
        return codeString;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ConditionalBlock"] = ConditionalBlock;