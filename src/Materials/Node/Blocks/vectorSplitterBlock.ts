import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';

/**
 * Block used to expand a Vector3/4 into 4 outputs (one for each component)
 */
export class VectorSplitterBlock extends NodeMaterialBlock {

    /**
     * Create a new VectorSplitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("xyzw", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3, true);

        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("x", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("y", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("z", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("w", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "VectorSplitterBlock";
    }

    /**
     * Gets the rgba input component
     */
    public get xyzw(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rgb input component
     */
    public get xyz(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.xyzw.isConnected ? this.xyzw : this.xyz;

        let xyzOutput = this._outputs[0];
        let xOutput = this._outputs[1];
        let yOutput = this._outputs[2];
        let zOutput = this._outputs[3];
        let wOutput = this._outputs[4];

        if (xyzOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(xyzOutput, state) + ` = ${input.associatedVariableName}.xyz;\r\n`;
        }
        if (xOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(xOutput, state) + ` = ${input.associatedVariableName}.x;\r\n`;
        }
        if (yOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(yOutput, state) + ` = ${input.associatedVariableName}.y;\r\n`;
        }
        if (zOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(zOutput, state) + ` = ${input.associatedVariableName}.z;\r\n`;
        }
        if (wOutput.connectedBlocks.length > 0) {
            state.compilationString += this._declareOutput(wOutput, state) + ` = ${input.associatedVariableName}.w;\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.VectorSplitterBlock"] = VectorSplitterBlock;