import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Scene } from "../../../../scene";
import type { NodeMaterialDefines, NodeMaterial } from "../../nodeMaterial";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { Effect } from "../../../effect";
import type { Mesh } from "../../../../Meshes/mesh";
import { BindLogDepth } from "../../../materialHelper.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Color spaces supported by the fragment output block
 */
export enum FragmentOutputBlockColorSpace {
    /** Unspecified */
    NoColorSpace,
    /** Gamma */
    Gamma,
    /** Linear */
    Linear,
}

/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    private _linearDefineName: string;
    private _gammaDefineName: string;
    private _additionalColorDefineName: string;
    protected _outputString: string;

    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true, true);

        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("glow", NodeMaterialBlockConnectionPointTypes.Color3, true);

        this.rgb.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this.rgb.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);

        this.additionalColor.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this.additionalColor.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
    }

    /** Gets or sets a boolean indicating if content needs to be converted to gamma space */
    public convertToGammaSpace = false;

    /** Gets or sets a boolean indicating if content needs to be converted to linear space */
    public convertToLinearSpace = false;

    /** Gets or sets a boolean indicating if logarithmic depth should be used */
    @editableInPropertyPage("Use logarithmic depth", PropertyTypeForEdition.Boolean, "PROPERTIES", { embedded: true })
    public useLogarithmicDepth = false;

    /**
     * Gets or sets the color space used for the block
     */
    @editableInPropertyPage("Color space", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "No color space", value: FragmentOutputBlockColorSpace.NoColorSpace },
            { label: "To Gamma", value: FragmentOutputBlockColorSpace.Gamma },
            { label: "To Linear", value: FragmentOutputBlockColorSpace.Linear },
        ],
    })
    public get colorSpace() {
        if (this.convertToGammaSpace) {
            return FragmentOutputBlockColorSpace.Gamma;
        }
        if (this.convertToLinearSpace) {
            return FragmentOutputBlockColorSpace.Linear;
        }
        return FragmentOutputBlockColorSpace.NoColorSpace;
    }

    public set colorSpace(value: FragmentOutputBlockColorSpace) {
        this.convertToGammaSpace = value === FragmentOutputBlockColorSpace.Gamma;
        this.convertToLinearSpace = value === FragmentOutputBlockColorSpace.Linear;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FragmentOutputBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("logarithmicDepthConstant");
        state._excludeVariableName("vFragmentDepth");
    }

    /**
     * Gets the rgba input component
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rgb input component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the a input component
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the additionalColor input component (named glow in the UI for now)
     */
    public get additionalColor(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the glow input component
     */
    public get glow(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    protected _getOutputString(state: NodeMaterialBuildState): string {
        return state.shaderLanguage === ShaderLanguage.WGSL ? "fragmentOutputsColor" : "gl_FragColor";
    }

    public override prepareDefines(defines: NodeMaterialDefines, nodeMaterial: NodeMaterial) {
        defines.setValue(this._linearDefineName, this.convertToLinearSpace, true);
        defines.setValue(this._gammaDefineName, this.convertToGammaSpace, true);
        defines.setValue(this._additionalColorDefineName, this.additionalColor.connectedPoint && nodeMaterial._useAdditionalColor, true);
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if ((this.useLogarithmicDepth || nodeMaterial.useLogarithmicDepth) && mesh) {
            BindLogDepth(undefined, effect, mesh.getScene());
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const rgba = this.rgba;
        const rgb = this.rgb;
        const a = this.a;
        const additionalColor = this.additionalColor;

        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        state.sharedData.hints.needAlphaBlending = rgba.isConnected || a.isConnected;
        state.sharedData.blocksWithDefines.push(this);

        if (this.useLogarithmicDepth || state.sharedData.nodeMaterial.useLogarithmicDepth) {
            state._emitUniformFromString("logarithmicDepthConstant", NodeMaterialBlockConnectionPointTypes.Float);
            state._emitVaryingFromString("vFragmentDepth", NodeMaterialBlockConnectionPointTypes.Float);
            state.sharedData.bindableBlocks.push(this);
        }

        if (additionalColor.connectedPoint) {
            state._excludeVariableName("useAdditionalColor");
            state._emitUniformFromString("useAdditionalColor", NodeMaterialBlockConnectionPointTypes.Float);
            this._additionalColorDefineName = state._getFreeDefineName("USEADDITIONALCOLOR");
        }

        this._linearDefineName = state._getFreeDefineName("CONVERTTOLINEAR");
        this._gammaDefineName = state._getFreeDefineName("CONVERTTOGAMMA");

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        const outputString = this._getOutputString(state);
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            state.compilationString += `var ${outputString} : vec4<f32>;\r\n`;
        }

        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);

        if (additionalColor.connectedPoint) {
            let aValue = "1.0";

            if (a.connectedPoint) {
                aValue = a.associatedVariableName;
            }
            state.compilationString += `#ifdef ${this._additionalColorDefineName}\n`;
            if (additionalColor.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Float) {
                state.compilationString += `${outputString}  = ${vec4}(${additionalColor.associatedVariableName}, ${additionalColor.associatedVariableName}, ${additionalColor.associatedVariableName}, ${aValue});\n`;
            } else {
                state.compilationString += `${outputString}  = ${vec4}(${additionalColor.associatedVariableName}, ${aValue});\n`;
            }
            state.compilationString += `#else\n`;
        }

        if (rgba.connectedPoint) {
            if (a.isConnected) {
                state.compilationString += `${outputString} = ${vec4}(${rgba.associatedVariableName}.rgb, ${a.associatedVariableName});\n`;
            } else {
                state.compilationString += `${outputString}  = ${rgba.associatedVariableName};\n`;
            }
        } else if (rgb.connectedPoint) {
            let aValue = "1.0";

            if (a.connectedPoint) {
                aValue = a.associatedVariableName;
            }

            if (rgb.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Float) {
                state.compilationString += `${outputString}  = ${vec4}(${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${aValue});\n`;
            } else {
                state.compilationString += `${outputString}  = ${vec4}(${rgb.associatedVariableName}, ${aValue});\n`;
            }
        } else {
            state.sharedData.checks.notConnectedNonOptionalInputs.push(rgba);
        }

        if (additionalColor.connectedPoint) {
            state.compilationString += `#endif\n`;
        }

        state.compilationString += `#ifdef ${this._linearDefineName}\n`;
        state.compilationString += `${outputString}  = toLinearSpace${state.shaderLanguage === ShaderLanguage.WGSL ? "Vec4" : ""}(${outputString});\n`;
        state.compilationString += `#endif\n`;

        state.compilationString += `#ifdef ${this._gammaDefineName}\n`;
        state.compilationString += `${outputString}  = toGammaSpace(${outputString});\n`;
        state.compilationString += `#endif\n`;

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            state.compilationString += `#if !defined(PREPASS)\r\n`;
            state.compilationString += `fragmentOutputs.color = ${outputString};\r\n`;
            state.compilationString += `#endif\r\n`;
        }

        if (this.useLogarithmicDepth || state.sharedData.nodeMaterial.useLogarithmicDepth) {
            const fragDepth = isWebGPU ? "input.vFragmentDepth" : "vFragmentDepth";
            const uniformP = isWebGPU ? "uniforms." : "";
            const output = isWebGPU ? "fragmentOutputs.fragDepth" : "gl_FragDepthEXT";

            state.compilationString += `${output} = log2(${fragDepth}) * ${uniformP}logarithmicDepthConstant * 0.5;\n`;
        }

        state.compilationString += `#if defined(PREPASS)\r\n`;
        state.compilationString += `${isWebGPU ? "fragmentOutputs.fragData0" : "gl_FragData[0]"} = ${outputString};\r\n`;
        state.compilationString += `#endif\r\n`;

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};\n`;
        codeString += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};\n`;
        codeString += `${this._codeVariableName}.useLogarithmicDepth = ${this.useLogarithmicDepth};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        serializationObject.useLogarithmicDepth = this.useLogarithmicDepth;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = !!serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;
        this.useLogarithmicDepth = serializationObject.useLogarithmicDepth ?? false;
    }
}

RegisterClass("BABYLON.FragmentOutputBlock", FragmentOutputBlock);
