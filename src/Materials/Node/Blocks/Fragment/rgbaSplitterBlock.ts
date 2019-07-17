import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to expand a Color4 or a Vector4 into 4 outputs (one for each component)
 */
export class RGBASplitterBlock extends NodeMaterialBlock {

    /**
     * Create a new RGBASplitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Vector4OrColor4);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RGBASplitterBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.input;
        let rOutput = this._outputs[0];
        let gOutput = this._outputs[1];
        let bOutput = this._outputs[2];
        let aOutput = this._outputs[3];

        if (rOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(rOutput, state) + ` = ${input.associatedVariableName}.r;\r\n`;
        }
        if (gOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(gOutput, state) + ` = ${input.associatedVariableName}.g;\r\n`;
        }
        if (bOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(bOutput, state) + ` = ${input.associatedVariableName}.b;\r\n`;
        }
        if (aOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(aOutput, state) + ` = ${input.associatedVariableName}.a;\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.RGBASplitterBlock"] = RGBASplitterBlock;