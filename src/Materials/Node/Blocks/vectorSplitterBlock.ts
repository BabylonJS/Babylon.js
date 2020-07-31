import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
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
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("xyzw", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("xyz ", NodeMaterialBlockConnectionPointTypes.Vector3, true);
        this.registerInput("xy ", NodeMaterialBlockConnectionPointTypes.Vector2, true);

        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("xy", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerOutput("x", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("y", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("z", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("w", NodeMaterialBlockConnectionPointTypes.Float);

        this.inputsAreExclusive = true;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "VectorSplitterBlock";
    }

    /**
     * Gets the xyzw component (input)
     */
    public get xyzw(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the xyz component (input)
     */
    public get xyzIn(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the xy component (input)
     */
    public get xyIn(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the xyz component (output)
     */
    public get xyzOut(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the xy component (output)
     */
    public get xyOut(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the x component (output)
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the y component (output)
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the z component (output)
     */
    public get z(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the w component (output)
     */
    public get w(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    protected _inputRename(name: string) {
        switch (name) {
            case "xy ":
                return "xyIn";
            case "xyz ":
                    return "xyzIn";
            default:
                return name;
        }
    }

    protected _outputRename(name: string) {
        switch (name) {
            case "xy":
                return "xyOut";
            case "xyz":
                    return "xyzOut";
            default:
                return name;
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.xyzw.isConnected ? this.xyzw : this.xyzIn.isConnected ? this.xyzIn : this.xyIn;

        let xyzOutput = this._outputs[0];
        let xyOutput = this._outputs[1];
        let xOutput = this._outputs[2];
        let yOutput = this._outputs[3];
        let zOutput = this._outputs[4];
        let wOutput = this._outputs[5];

        if (xyzOutput.hasEndpoints) {
            if (input === this.xyIn) {
                state.compilationString += this._declareOutput(xyzOutput, state) + ` = vec3(${input.associatedVariableName}, 0.0);\r\n`;
            } else {
                state.compilationString += this._declareOutput(xyzOutput, state) + ` = ${input.associatedVariableName}.xyz;\r\n`;
            }
        }
        if (xyOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(xyOutput, state) + ` = ${input.associatedVariableName}.xy;\r\n`;
        }
        if (xOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(xOutput, state) + ` = ${input.associatedVariableName}.x;\r\n`;
        }
        if (yOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(yOutput, state) + ` = ${input.associatedVariableName}.y;\r\n`;
        }
        if (zOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(zOutput, state) + ` = ${input.associatedVariableName}.z;\r\n`;
        }
        if (wOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(wOutput, state) + ` = ${input.associatedVariableName}.w;\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.VectorSplitterBlock"] = VectorSplitterBlock;