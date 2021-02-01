import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
/**
 * Block used to smooth step a value
 */
export class SmoothStepBlock extends NodeMaterialBlock {
    /**
     * Creates a new SmoothStepBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("edge0", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("edge1", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SmoothStepBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the first edge operand input component
     */
    public get edge0(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the second edge operand input component
     */
    public get edge1(): NodeMaterialConnectionPoint {
        return this._inputs[2];
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

        state.compilationString += this._declareOutput(output, state) + ` = smoothstep(${this.edge0.associatedVariableName}, ${this.edge1.associatedVariableName}, ${this.value.associatedVariableName});\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.SmoothStepBlock"] = SmoothStepBlock;