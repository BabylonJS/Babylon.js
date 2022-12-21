import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";

/**
 * Block used to compute the determinant of a matrix
 */
export class MatrixDeterminantBlock extends NodeMaterialBlock {
    /**
     * Creates a new MatrixDeterminantBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MatrixDeterminantBlock";
    }

    /**
     * Gets the input matrix
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

        const output = this.output;
        const input = this.input;

        state.compilationString += this._declareOutput(output, state) + `${output.associatedVariableName} = determinant(${input.associatedVariableName});\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.MatrixDeterminantBlock", MatrixDeterminantBlock);
