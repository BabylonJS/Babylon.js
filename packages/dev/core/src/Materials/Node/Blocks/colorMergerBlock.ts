import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Scene } from "../../../scene";

/**
 * Block used to create a Color3/4 out of individual inputs (one for each component)
 */
export class ColorMergerBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the swizzle for r (meaning which component to affect to the output.r)
     */
    public rSwizzle: "r" | "g" | "b" | "a" = "r";
    /**
     * Gets or sets the swizzle for g (meaning which component to affect to the output.g)
     */
    public gSwizzle: "r" | "g" | "b" | "a" = "g";
    /**
     * Gets or sets the swizzle for b (meaning which component to affect to the output.b)
     */
    public bSwizzle: "r" | "g" | "b" | "a" = "b";
    /**
     * Gets or sets the swizzle for a (meaning which component to affect to the output.a)
     */
    public aSwizzle: "r" | "g" | "b" | "a" = "a";

    /**
     * Create a new ColorMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("rgb ", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("r", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("g", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ColorMergerBlock";
    }

    /**
     * Gets the rgb component (input)
     */
    public get rgbIn(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the r component (input)
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the g component (input)
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the b component (input)
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the a component (input)
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the rgba component (output)
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the rgb component (output)
     */
    public get rgbOut(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the rgb component (output)
     * @deprecated Please use rgbOut instead.
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this.rgbOut;
    }

    protected override _inputRename(name: string) {
        if (name === "rgb ") {
            return "rgbIn";
        }
        return name;
    }

    private _buildSwizzle(len: number) {
        const swizzle = this.rSwizzle + this.gSwizzle + this.bSwizzle + this.aSwizzle;
        return "." + swizzle.substring(0, len);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const rInput = this.r;
        const gInput = this.g;
        const bInput = this.b;
        const aInput = this.a;
        const rgbInput = this.rgbIn;

        const color4Output = this._outputs[0];
        const color3Output = this._outputs[1];

        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);
        const vec3 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3);

        if (rgbInput.isConnected) {
            if (color4Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(color4Output) +
                    ` = ${vec4}(${rgbInput.associatedVariableName}, ${aInput.isConnected ? this._writeVariable(aInput) : "0.0"})${this._buildSwizzle(4)};\n`;
            }

            if (color3Output.hasEndpoints) {
                state.compilationString += state._declareOutput(color3Output) + ` = ${rgbInput.associatedVariableName}${this._buildSwizzle(3)};\n`;
            }
        } else {
            if (color4Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(color4Output) +
                    ` = ${vec4}(${rInput.isConnected ? this._writeVariable(rInput) : "0.0"}, ${gInput.isConnected ? this._writeVariable(gInput) : "0.0"}, ${
                        bInput.isConnected ? this._writeVariable(bInput) : "0.0"
                    }, ${aInput.isConnected ? this._writeVariable(aInput) : "0.0"})${this._buildSwizzle(4)};\n`;
            }

            if (color3Output.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(color3Output) +
                    ` = ${vec3}(${rInput.isConnected ? this._writeVariable(rInput) : "0.0"}, ${gInput.isConnected ? this._writeVariable(gInput) : "0.0"}, ${
                        bInput.isConnected ? this._writeVariable(bInput) : "0.0"
                    })${this._buildSwizzle(3)};\n`;
            }
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.rSwizzle = this.rSwizzle;
        serializationObject.gSwizzle = this.gSwizzle;
        serializationObject.bSwizzle = this.bSwizzle;
        serializationObject.aSwizzle = this.aSwizzle;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.rSwizzle = serializationObject.rSwizzle ?? "r";
        this.gSwizzle = serializationObject.gSwizzle ?? "g";
        this.bSwizzle = serializationObject.bSwizzle ?? "b";
        this.aSwizzle = serializationObject.aSwizzle ?? "a";
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.rSwizzle = "${this.rSwizzle}";\n`;
        codeString += `${this._codeVariableName}.gSwizzle = "${this.gSwizzle}";\n`;
        codeString += `${this._codeVariableName}.bSwizzle = "${this.bSwizzle}";\n`;
        codeString += `${this._codeVariableName}.aSwizzle = "${this.aSwizzle}";\n`;

        return codeString;
    }
}

RegisterClass("BABYLON.ColorMergerBlock", ColorMergerBlock);
