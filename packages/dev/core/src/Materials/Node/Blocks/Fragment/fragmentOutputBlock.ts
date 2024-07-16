import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Scene } from "../../../../scene";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { NodeMaterialDefines, NodeMaterial } from "../../nodeMaterial";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { Effect } from "../../../effect";
import type { Mesh } from "../../../../Meshes/mesh";
import { BindLogDepth } from "../../../materialHelper.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    private _linearDefineName: string;
    private _gammaDefineName: string;

    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.rgb.addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Float
        );
    }

    /** Gets or sets a boolean indicating if content needs to be converted to gamma space */
    @editableInPropertyPage("Convert to gamma space", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: true } })
    public convertToGammaSpace = false;

    /** Gets or sets a boolean indicating if content needs to be converted to linear space */
    @editableInPropertyPage("Convert to linear space", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: true } })
    public convertToLinearSpace = false;

    /** Gets or sets a boolean indicating if logarithmic depth should be used */
    @editableInPropertyPage("Use logarithmic depth", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public useLogarithmicDepth = false;

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

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        defines.setValue(this._linearDefineName, this.convertToLinearSpace, true);
        defines.setValue(this._gammaDefineName, this.convertToGammaSpace, true);
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

        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        state.sharedData.hints.needAlphaBlending = rgba.isConnected || a.isConnected;
        state.sharedData.blocksWithDefines.push(this);
        if (this.useLogarithmicDepth || state.sharedData.nodeMaterial.useLogarithmicDepth) {
            state._emitUniformFromString("logarithmicDepthConstant", NodeMaterialBlockConnectionPointTypes.Float);
            state._emitVaryingFromString("vFragmentDepth", NodeMaterialBlockConnectionPointTypes.Float);
            state.sharedData.bindableBlocks.push(this);
        }
        this._linearDefineName = state._getFreeDefineName("CONVERTTOLINEAR");
        this._gammaDefineName = state._getFreeDefineName("CONVERTTOGAMMA");

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        let outputString = "gl_FragColor";
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            state.compilationString += `var fragmentOutputsColor : vec4<f32>;\r\n`;
            outputString = "fragmentOutputsColor";
        }

        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);

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

        state.compilationString += `#ifdef ${this._linearDefineName}\n`;
        state.compilationString += `${outputString}  = toLinearSpace(${outputString});\n`;
        state.compilationString += `#endif\n`;

        state.compilationString += `#ifdef ${this._gammaDefineName}\n`;
        state.compilationString += `${outputString}  = toGammaSpace(${outputString});\n`;
        state.compilationString += `#endif\n`;

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            state.compilationString += `#if !defined(PREPASS)\r\n`;
            state.compilationString += `fragmentOutputs.color = fragmentOutputsColor;\r\n`;
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
