import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';
import { NodeMaterial } from '../nodeMaterial';
import { InputBlock } from './Input/inputBlock';
import { Vector4 } from '../../../Maths/math.vector';

/**
 * Block used to build a matrix from 4 Vector4
 */
export class MatrixBuilderBlock extends NodeMaterialBlock {

    /**
     * Creates a new MatrixBuilder
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("row0", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("row1", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("row2", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("row3", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MatrixBuilder";
    }

    /**
     * Gets the row0 vector
     */
    public get row0(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the row1 vector
     */
    public get row1(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the row2 vector
     */
    public get row2(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the row3 vector
     */
    public get row3(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.row0.isConnected) {
            let row0Input = new InputBlock("row0");
            row0Input.value = new Vector4(1, 0, 0, 0);
            row0Input.output.connectTo(this.row0);
        }

        if (!this.row1.isConnected) {
            let row1Input = new InputBlock("row1");
            row1Input.value = new Vector4(0, 1, 0, 0);
            row1Input.output.connectTo(this.row1);
        }

        if (!this.row2.isConnected) {
            let row2Input = new InputBlock("row2");
            row2Input.value = new Vector4(0, 0, 1, 0);
            row2Input.output.connectTo(this.row2);
        }

        if (!this.row3.isConnected) {
            let row3Input = new InputBlock("row3");
            row3Input.value = new Vector4(0, 0, 0, 1);
            row3Input.output.connectTo(this.row3);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let row0 = this.row0;
        let row1 = this.row1;
        let row2 = this.row2;
        let row3 = this.row3;

        state.compilationString += this._declareOutput(output, state) + ` = mat4(${row0.associatedVariableName}, ${row1.associatedVariableName}, ${row2.associatedVariableName}, ${row3.associatedVariableName});\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.MatrixBuilder"] = MatrixBuilderBlock;