import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../../nodeMaterialCompilationState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';

/**
 * Block used to create a Color4 out of 4 inputs (one for each component)
 */
export class RGBAMergerBlock extends NodeMaterialBlock {
    /**
     * Create a new RGBAMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("r", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("g", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("rgb", NodeMaterialBlockConnectionPointTypes.Vector3OrColor3, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RGBAMergerBlock";
    }

    protected _buildBlock(state: NodeMaterialCompilationState) {
        super._buildBlock(state);

        let rgbInput = this._inputs[3];
        let aInput = this._inputs[4];
        let output = this._outputs[0];

        if (rgbInput.connectedPoint) {
            state.compilationString += this._declareOutput(output, state) + ` = vec4(${rgbInput.associatedVariableName}, ${aInput.associatedVariableName});\r\n`;
        } else {
            let rInput = this._inputs[0];
            let gInput = this._inputs[1];
            let bInput = this._inputs[2];
            state.compilationString += this._declareOutput(output, state) + ` = vec4(${rInput.associatedVariableName}, ${gInput.associatedVariableName}, ${bInput.associatedVariableName}, ${aInput.associatedVariableName});\r\n`;
        }

        return this;
    }
}