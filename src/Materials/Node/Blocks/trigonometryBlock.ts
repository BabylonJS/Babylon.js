import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';

/**
 * Operations supported by the Trigonometry block
 */
export enum TrigonometryBlockOperations {
    /** Cos */
    Cos,
    /** Sin */
    Sin,
    /** Abs */
    Abs,
    /** Exp */
    Exp,
    /** Exp2 */
    Exp2,
    /** Round */
    Round,
    /** Floor */
    Floor,
    /** Ceiling */
    Ceiling,
    /** Square root */
    Sqrt,
}

/**
 * Block used to apply trigonometry operation to floats
 */
export class TrigonometryBlock extends NodeMaterialBlock {

    /**
     * Gets or sets the operation applied by the block
     */
    public operation = TrigonometryBlockOperations.Cos;

    /**
     * Creates a new TrigonometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TrigonometryBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
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
        let operation = "";

        switch (this.operation) {
            case TrigonometryBlockOperations.Cos: {
                operation = "cos";
                break;
            }
            case TrigonometryBlockOperations.Sin: {
                operation = "sin";
                break;
            }
            case TrigonometryBlockOperations.Abs: {
                operation = "abs";
                break;
            }
            case TrigonometryBlockOperations.Exp: {
                operation = "exp";
                break;
            }
            case TrigonometryBlockOperations.Exp2: {
                operation = "exp2";
                break;
            }
            case TrigonometryBlockOperations.Round: {
                operation = "round";
                break;
            }
            case TrigonometryBlockOperations.Floor: {
                operation = "floor";
                break;
            }
            case TrigonometryBlockOperations.Ceiling: {
                operation = "ceil";
                break;
            }
            case TrigonometryBlockOperations.Sqrt: {
                operation = "sqrt";
                break;
            }
        }

        state.compilationString += this._declareOutput(output, state) + ` = ${operation}(${this.input.associatedVariableName});\r\n`;

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.operation = serializationObject.operation;
    }
}

_TypeStore.RegisteredTypes["BABYLON.TrigonometryBlock"] = TrigonometryBlock;