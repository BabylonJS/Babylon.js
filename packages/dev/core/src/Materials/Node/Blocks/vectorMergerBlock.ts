import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Scene } from "../../../scene";

/**
 * Block used to create a Vector2/3/4 out of individual inputs (one for each component)
 */
export class VectorMergerBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the swizzle for x (meaning which component to affect to the output.x)
     */
    public xSwizzle: "x" | "y" | "z" | "w" = "x";
    /**
     * Gets or sets the swizzle for y (meaning which component to affect to the output.y)
     */
    public ySwizzle: "x" | "y" | "z" | "w" = "y";
    /**
     * Gets or sets the swizzle for z (meaning which component to affect to the output.z)
     */
    public zSwizzle: "x" | "y" | "z" | "w" = "z";
    /**
     * Gets or sets the swizzle for w (meaning which component to affect to the output.w)
     */
    public wSwizzle: "x" | "y" | "z" | "w" = "w";

    /**
     * Create a new VectorMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("xyzw ", NodeMaterialBlockConnectionPointTypes.Vector4, true);
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
    public override getClassName() {
        return "VectorMergerBlock";
    }

    /**
     * Gets the xyzw component (input)
     */
    public get xyzwIn(): NodeMaterialConnectionPoint {
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
     * Gets the zw component (input)
     */
    public get zwIn(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the x component (input)
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the y component (input)
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the z component (input)
     */
    public get z(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the w component (input)
     */
    public get w(): NodeMaterialConnectionPoint {
        return this._inputs[7];
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

    protected override _inputRename(name: string) {
        if (name === "xyzw ") {
            return "xyzwIn";
        }
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

    private _buildSwizzle(len: number) {
        const swizzle = this.xSwizzle + this.ySwizzle + this.zSwizzle + this.wSwizzle;

        return "." + swizzle.substring(0, len);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const xInput = this.x;
        const yInput = this.y;
        const zInput = this.z;
        const wInput = this.w;
        const xyInput = this.xyIn;
        const zwInput = this.zwIn;
        const xyzInput = this.xyzIn;
        const xyzwInput = this.xyzwIn;

        const v4Output = this._outputs[0];
        const v3Output = this._outputs[1];
        const v2Output = this._outputs[2];
        const v2CompOutput = this._outputs[3];

        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);
        const vec3 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3);
        const vec2 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector2);

        if (xyzwInput.isConnected) {
            if (v4Output.hasEndpoints) {
                state.compilationString += state._declareOutput(v4Output) + ` = ${xyzwInput.associatedVariableName}${this._buildSwizzle(4)};\n`;
            }

            if (v3Output.hasEndpoints) {
                state.compilationString += state._declareOutput(v3Output) + ` = ${xyzwInput.associatedVariableName}${this._buildSwizzle(3)};\n`;
            }

            if (v2Output.hasEndpoints) {
                state.compilationString += state._declareOutput(v2Output) + ` = ${xyzwInput.associatedVariableName}${this._buildSwizzle(2)};\n`;
            }
        } else if (xyzInput.isConnected) {
            if (v4Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(v4Output) +
                    ` = ${vec4}(${xyzInput.associatedVariableName}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"})${this._buildSwizzle(4)};\n`;
            }

            if (v3Output.hasEndpoints) {
                state.compilationString += state._declareOutput(v3Output) + ` = ${xyzInput.associatedVariableName}${this._buildSwizzle(3)};\n`;
            }

            if (v2Output.hasEndpoints) {
                state.compilationString += state._declareOutput(v2Output) + ` = ${xyzInput.associatedVariableName}${this._buildSwizzle(2)};\n`;
            }
        } else if (xyInput.isConnected) {
            if (v4Output.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString +=
                        state._declareOutput(v4Output) + ` = ${vec4}(${xyInput.associatedVariableName}, ${zwInput.associatedVariableName})${this._buildSwizzle(4)};\n`;
                } else {
                    state.compilationString +=
                        state._declareOutput(v4Output) +
                        ` = ${vec4}(${xyInput.associatedVariableName}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${
                            wInput.isConnected ? this._writeVariable(wInput) : "0.0"
                        })${this._buildSwizzle(4)};\n`;
                }
            }

            if (v3Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(v3Output) +
                    ` = ${vec3}(${xyInput.associatedVariableName}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"})${this._buildSwizzle(3)};\n`;
            }

            if (v2Output.hasEndpoints) {
                state.compilationString += state._declareOutput(v2Output) + ` = ${xyInput.associatedVariableName}${this._buildSwizzle(2)};\n`;
            }

            if (v2CompOutput.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString += state._declareOutput(v2CompOutput) + ` = ${zwInput.associatedVariableName}${this._buildSwizzle(2)};\n`;
                } else {
                    state.compilationString +=
                        state._declareOutput(v2CompOutput) +
                        ` = ${vec2}(${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"})${this._buildSwizzle(
                            2
                        )};\n`;
                }
            }
        } else {
            if (v4Output.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString +=
                        state._declareOutput(v4Output) +
                        ` = ${vec4}(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"}, ${
                            zwInput.associatedVariableName
                        })${this._buildSwizzle(4)};\n`;
                } else {
                    state.compilationString +=
                        state._declareOutput(v4Output) +
                        ` = ${vec4}(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"}, ${
                            zInput.isConnected ? this._writeVariable(zInput) : "0.0"
                        }, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"})${this._buildSwizzle(4)};\n`;
                }
            }

            if (v3Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(v3Output) +
                    ` = ${vec3}(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"}, ${
                        zInput.isConnected ? this._writeVariable(zInput) : "0.0"
                    })${this._buildSwizzle(3)};\n`;
            }

            if (v2Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(v2Output) +
                    ` = ${vec2}(${xInput.isConnected ? this._writeVariable(xInput) : "0.0"}, ${yInput.isConnected ? this._writeVariable(yInput) : "0.0"})${this._buildSwizzle(2)};\n`;
            }

            if (v2CompOutput.hasEndpoints) {
                if (zwInput.isConnected) {
                    state.compilationString += state._declareOutput(v2CompOutput) + ` = ${zwInput.associatedVariableName}${this._buildSwizzle(2)};\n`;
                } else {
                    state.compilationString +=
                        state._declareOutput(v2CompOutput) +
                        ` = ${vec2}(${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${wInput.isConnected ? this._writeVariable(wInput) : "0.0"})${this._buildSwizzle(
                            2
                        )};\n`;
                }
            }
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.xSwizzle = this.xSwizzle;
        serializationObject.ySwizzle = this.ySwizzle;
        serializationObject.zSwizzle = this.zSwizzle;
        serializationObject.wSwizzle = this.wSwizzle;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.xSwizzle = serializationObject.xSwizzle ?? "x";
        this.ySwizzle = serializationObject.ySwizzle ?? "y";
        this.zSwizzle = serializationObject.zSwizzle ?? "z";
        this.wSwizzle = serializationObject.wSwizzle ?? "w";
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.xSwizzle = "${this.xSwizzle}";\n`;
        codeString += `${this._codeVariableName}.ySwizzle = "${this.ySwizzle}";\n`;
        codeString += `${this._codeVariableName}.zSwizzle = "${this.zSwizzle}";\n`;
        codeString += `${this._codeVariableName}.wSwizzle = "${this.wSwizzle}";\n`;

        return codeString;
    }
}

RegisterClass("BABYLON.VectorMergerBlock", VectorMergerBlock);
