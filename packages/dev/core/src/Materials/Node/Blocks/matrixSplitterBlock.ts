import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to split a matrix into Vector4
 */
export class MatrixSplitterBlock extends NodeMaterialBlock {
    /**
     * Creates a new MatrixSplitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("row0", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("row1", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("row2", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("row3", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col0", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col1", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col2", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("col3", NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "MatrixSplitterBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the row0 output vector
     */
    public get row0(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the row1 output vector
     */
    public get row1(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the row2 output vector
     */
    public get row2(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the row3 output vector
     */
    public get row3(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the col0 output vector
     */
    public get col0(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the col1 output vector
     */
    public get col1(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the col2 output vector
     */
    public get col2(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the col3 output vector
     */
    public get col3(): NodeMaterialConnectionPoint {
        return this._outputs[7];
    }

    private _exportColumn(state: NodeMaterialBuildState, col: NodeMaterialConnectionPoint, input: string, columnIndex: number) {
        const vec4 = state.shaderLanguage === ShaderLanguage.WGSL ? "vec4f" : "vec4";
        state.compilationString +=
            state._declareOutput(col) + ` = ${vec4}(${input}[0][${columnIndex}], ${input}[1][${columnIndex}], ${input}[2][${columnIndex}], ${input}[3][${columnIndex}]);\n`;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const input = this._inputs[0].associatedVariableName;

        const row0 = this.row0;
        const row1 = this.row1;
        const row2 = this.row2;
        const row3 = this.row3;
        const col0 = this.col0;
        const col1 = this.col1;
        const col2 = this.col2;
        const col3 = this.col3;

        if (row0.hasEndpoints) {
            state.compilationString += state._declareOutput(row0) + ` = ${input}[0];\n`;
        }
        if (row1.hasEndpoints) {
            state.compilationString += state._declareOutput(row1) + ` = ${input}[1];\n`;
        }
        if (row2.hasEndpoints) {
            state.compilationString += state._declareOutput(row2) + ` = ${input}[2];\n`;
        }
        if (row3.hasEndpoints) {
            state.compilationString += state._declareOutput(row3) + ` = ${input}[3];\n`;
        }

        if (col0.hasEndpoints) {
            this._exportColumn(state, col0, input, 0);
        }
        if (col1.hasEndpoints) {
            this._exportColumn(state, col1, input, 1);
        }
        if (col2.hasEndpoints) {
            this._exportColumn(state, col2, input, 2);
        }
        if (col3.hasEndpoints) {
            this._exportColumn(state, col3, input, 3);
        }

        return this;
    }
}

RegisterClass("BABYLON.MatrixSplitterBlock", MatrixSplitterBlock);
