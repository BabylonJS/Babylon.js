import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../nodeMaterialCompilationState';
/**
 * Block used to multiply 2 vector4
 */
export class MultiplyBlock extends NodeMaterialBlock {
    /**
     * Creates a new MultiplyBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("vector0", NodeMaterialBlockConnectionPointTypes.Vector4OrColor4);
        this.registerInput("vector1", NodeMaterialBlockConnectionPointTypes.Vector4OrColor4);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4OrColor4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MultiplyBlock";
    }

    protected _buildBlock(state: NodeMaterialCompilationState) {
        super._buildBlock(state);

        let output = this._outputs[0];

        let vector0 = this._inputs[0];
        let vector1 = this._inputs[1];

        state.compilationString += this._declareOutput(output, state) + ` = ${vector0.associatedVariableName} * ${vector1.associatedVariableName};\r\n`;

        return this;
    }
}