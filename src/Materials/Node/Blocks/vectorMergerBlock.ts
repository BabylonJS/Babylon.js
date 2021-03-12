import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';

/**
 * Block used to create a Vector2/3/4 out of individual inputs (one for each component)
 */
export class VectorMergerBlock extends NodeMaterialBlock {
    /**
     * Create a new VectorMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("xyz ", NodeMaterialBlockConnectionPointTypes.Vector3, true);
        this.registerInput("xy ", NodeMaterialBlockConnectionPointTypes.Vector2, true);
        this.registerInput("zw ", NodeMaterialBlockConnectionPointTypes.Vector2, true);
        this.registerInput("x", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("y", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("z", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("w", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.registerOutput("xyzw", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("xy", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerOutput("zw", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "VectorMergerBlock";
    }

    /**
     * Gets the xyz component (input)
     */
    public get xyzIn(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the xy component (input)
     */
    public get xyIn(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the zw component (input)
     */
    public get zwIn(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the x component (input)
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the y component (input)
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the z component (input)
     */
    public get z(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the w component (input)
     */
    public get w(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the xyzw component (output)
     */
    public get xyzw(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the xyz component (output)
     */
    public get xyzOut(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the xy component (output)
     */
    public get xyOut(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the zw component (output)
     */
    public get zwOut(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the xy component (output)
     * @deprecated Please use xyOut instead.
     */
    public get xy(): NodeMaterialConnectionPoint {
        return this.xyOut;
    }

    /**
     * Gets the xyz component (output)
     * @deprecated Please use xyzOut instead.
     */
    public get xyz(): NodeMaterialConnectionPoint {
        return this.xyzOut;
    }

    protected _inputRename(name: string) {
        if (name === "xyz ") {
            return "xyzIn";
        }
        if (name === "xy ") {
            return "xyIn";
        }
        if (name === "zw ") {
            return "zwIn";
        }
        return name;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let xInput = this.x;
        let yInput = this.y;
        let zInput = this.z;
        let wInput = this.w;
        let xyInput = this.xyIn;
        let zwInput = this.zwIn;
        let xyzInput = this.xyzIn;

        let v4Output = this._outputs[0];
        let v3Output = this._outputs[1];
        let v2Output = this._outputs[2];
        let v2CompOutput = this._outputs[3];

        if (xyzInput.isConnected) {
            if (v4Output.hasEndpoints) {
                state.compilationString += this._declareOutput(v4Output, state) + ` = vec4(${xyzInput.associatedVariableName}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"});\r\n`;
            }

            if (v3Output.hasEndpoints) {
                state.compilationString += this._declareOutput(v3Output, state) + ` = ${xyzInput.associatedVariableName};\r\n`;
            }

            if (v2Output.hasEndpoints) {
                state.compilationString += this._declareOutput(v2Output, state) + ` = ${xyzInput.associatedVariableName}.xy;\r\n`;
            }
        } else if (xyInput.isConnected) {
            if (v4Output.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString += this._declareOutput(v4Output, state) + ` = vec4(${xyInput.associatedVariableName}, ${zwInput.associatedVariableName});\r\n`;
                } else {
                    state.compilationString += this._declareOutput(v4Output, state) + ` = vec4(${xyInput.associatedVariableName}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"});\r\n`;
                }
            }

            if (v3Output.hasEndpoints) {
                state.compilationString += this._declareOutput(v3Output, state) + ` = vec3(${xyInput.associatedVariableName}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"});\r\n`;
            }

            if (v2Output.hasEndpoints) {
                state.compilationString += this._declareOutput(v2Output, state) + ` = ${xyInput.associatedVariableName};\r\n`;
            }

            if (v2CompOutput.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString += this._declareOutput(v2CompOutput, state) + ` = ${zwInput.associatedVariableName};\r\n`;
                } else {
                    state.compilationString += this._declareOutput(v2CompOutput, state) + ` = vec2(${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"});\r\n`;
                }
            }
        } else {
            if (v4Output.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString += this._declareOutput(v4Output, state) + ` = vec4(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"}, ${zwInput.associatedVariableName});\r\n`;
                } else {
                    state.compilationString += this._declareOutput(v4Output, state) + ` = vec4(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"});\r\n`;
                }
            }

            if (v3Output.hasEndpoints) {
                state.compilationString += this._declareOutput(v3Output, state) + ` = vec3(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"});\r\n`;
            }

            if (v2Output.hasEndpoints) {
                state.compilationString += this._declareOutput(v2Output, state) + ` = vec2(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"});\r\n`;
            }

            if (v2CompOutput.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString += this._declareOutput(v2CompOutput, state) + ` = ${zwInput.associatedVariableName};\r\n`;
                } else {
                    state.compilationString += this._declareOutput(v2CompOutput, state) + ` = vec2(${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"});\r\n`;
                }
            }
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.VectorMergerBlock"] = VectorMergerBlock;