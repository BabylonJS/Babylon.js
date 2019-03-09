import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';

/**
 * Block used to create a Color3 out of 3 inputs (one for each component)
 */
export class RGBMergerBlock extends NodeMaterialBlock {
    /**
     * Create a new RGBMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("r", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("g", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RGBMergerBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let rInput = this._inputs[0];
        let gInput = this._inputs[1];
        let bInput = this._inputs[2];

        let output = this._outputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = vec3(${this._writeVariable(rInput)}, ${this._writeVariable(gInput)}, ${this._writeVariable(bInput)});\r\n`;

        return this;
    }
}