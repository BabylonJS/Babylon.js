import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";

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
        this.registerOutput("zw", NodeMaterialBlockConnectionPointTypes.Vector2);
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
    public override getClassName() {
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
     * Gets the zw component (output)
     */
    public get zw(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the x component (output)
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the y component (output)
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the z component (output)
     */
    public get z(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the w component (output)
     */
    public get w(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    protected override _inputRename(name: string) {
        switch (name) {
            case "xy ":
                return "xyIn";
            case "xyz ":
                return "xyzIn";
            default:
                return name;
        }
    }

    protected override _outputRename(name: string) {
        switch (name) {
            case "xy":
                return "xyOut";
            case "xyz":
                return "xyzOut";
            default:
                return name;
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const input = this.xyzw.isConnected ? this.xyzw : this.xyzIn.isConnected ? this.xyzIn : this.xyIn;

        const xyzOutput = this._outputs[0];
        const xyOutput = this._outputs[1];
        const zwOutput = this._outputs[2];
        const xOutput = this._outputs[3];
        const yOutput = this._outputs[4];
        const zOutput = this._outputs[5];
        const wOutput = this._outputs[6];

        const vec3 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3);
        if (xyzOutput.hasEndpoints) {
            if (input === this.xyIn) {
                state.compilationString += state._declareOutput(xyzOutput) + ` = ${vec3}(${input.associatedVariableName}, 0.0);\n`;
            } else {
                state.compilationString += state._declareOutput(xyzOutput) + ` = ${input.associatedVariableName}.xyz;\n`;
            }
        }
        if (zwOutput.hasEndpoints && this.xyzw.isConnected) {
            state.compilationString += state._declareOutput(zwOutput) + ` = ${this.xyzw.associatedVariableName}.zw;\n`;
        }
        if (xyOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(xyOutput) + ` = ${input.associatedVariableName}.xy;\n`;
        }
        if (xOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(xOutput) + ` = ${input.associatedVariableName}.x;\n`;
        }
        if (yOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(yOutput) + ` = ${input.associatedVariableName}.y;\n`;
        }
        if (zOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(zOutput) + ` = ${input.associatedVariableName}.z;\n`;
        }
        if (wOutput.hasEndpoints) {
            state.compilationString += state._declareOutput(wOutput) + ` = ${input.associatedVariableName}.w;\n`;
        }

        return this;
    }
}

RegisterClass("BABYLON.VectorSplitterBlock", VectorSplitterBlock);
