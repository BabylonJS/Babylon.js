import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
/**
 * Block used to compute arc tangent of 2 values
 */
export class ArcTan2Block extends NodeMaterialBlock {
    /**
     * Creates a new ArcTan2Block
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("x", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("y", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ArcTan2Block";
    }

    /**
     * Gets the x operand input component
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the y operand input component
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._inputs[1];
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

        state.compilationString += this._declareOutput(output, state) + ` = atan(${this.x.associatedVariableName}, ${this.y.associatedVariableName});\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ArcTan2Block"] = ArcTan2Block;