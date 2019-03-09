import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
/**
 * Block used to clamp a float
 */
export class ClampBlock extends NodeMaterialBlock {

    /** Gets or sets the minimum range */
    public minimum = 0.0;
    /** Gets or sets the maximum range */
    public maximum = 1.0;

    /**
     * Creates a new ClampBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ClampBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];

        let value = this._inputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = clamp(${value.associatedVariableName}, ${this._writeFloat(this.minimum)}, ${this._writeFloat(this.maximum)});\r\n`;

        return this;
    }
}