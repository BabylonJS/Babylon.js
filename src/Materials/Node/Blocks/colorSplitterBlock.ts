import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';

/**
 * Block used to expand a Color3/4 into 4 outputs (one for each component)
 */
export class ColorSplitterBlock extends NodeMaterialBlock {

    /**
     * Create a new ColorSplitterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb ", NodeMaterialBlockConnectionPointTypes.Color3, true);

        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float);

        this.inputsAreExclusive = true;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ColorSplitterBlock";
    }

    /**
     * Gets the rgba component (input)
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rgb component (input)
     */
    public get rgbIn(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the rgb component (output)
     */
    public get rgbOut(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the r component (output)
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the g component (output)
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }
    /**
     * Gets the b component (output)
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }
    /**
     * Gets the a component (output)
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    protected _inputRename(name: string) {
        if (name === "rgb ") {
            return "rgbIn";
        }
        return name;
    }

    protected _outputRename(name: string) {
        if (name === "rgb") {
            return "rgbOut";
        }
        return name;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.rgba.isConnected ? this.rgba : this.rgbIn;

        if (!input.isConnected) {
            return;
        }

        let rgbOutput = this._outputs[0];
        let rOutput = this._outputs[1];
        let gOutput = this._outputs[2];
        let bOutput = this._outputs[3];
        let aOutput = this._outputs[4];

        if (rgbOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(rgbOutput, state) + ` = ${input.associatedVariableName}.rgb;\r\n`;
        }
        if (rOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(rOutput, state) + ` = ${input.associatedVariableName}.r;\r\n`;
        }
        if (gOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(gOutput, state) + ` = ${input.associatedVariableName}.g;\r\n`;
        }
        if (bOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(bOutput, state) + ` = ${input.associatedVariableName}.b;\r\n`;
        }
        if (aOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(aOutput, state) + ` = ${input.associatedVariableName}.a;\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ColorSplitterBlock"] = ColorSplitterBlock;