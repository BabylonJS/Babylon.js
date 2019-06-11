import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';

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

    /**
     * Gets the R component input
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the G component input
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the B component input
     */
    public get b(): NodeMaterialConnectionPoint {
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

        let rInput = this.r;
        let gInput = this.g;
        let bInput = this.b;

        let output = this._outputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = vec3(${this._writeVariable(rInput)}, ${this._writeVariable(gInput)}, ${this._writeVariable(bInput)});\r\n`;

        return this;
    }
}