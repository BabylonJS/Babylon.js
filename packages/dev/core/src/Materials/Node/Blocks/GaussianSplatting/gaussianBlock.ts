import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used for the Gaussian Splatting Fragment part
 */
export class GaussianBlock extends NodeMaterialBlock {
    /**
     * Create a new GaussianBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = false;

        this.registerInput("splatColor", NodeMaterialBlockConnectionPointTypes.Color4, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("alpha", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GaussianBlock";
    }

    /**
     * Gets the color input component
     */
    public get splatColor(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rgba output component
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the rgb output component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the alpha output component
     */
    public get alpha(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vPosition");
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }

        // Emit code
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("clipPlaneFragmentDeclaration", comments);
        state._emitFunctionFromInclude("logDepthDeclaration", comments);
        state._emitFunctionFromInclude("fogFragmentDeclaration", comments);
        state._emitFunctionFromInclude("gaussianSplattingFragmentDeclaration", comments);
        state._emitVaryingFromString("vPosition", NodeMaterialBlockConnectionPointTypes.Vector2);

        const tempSplatColor = state._getFreeVariableName("tempSplatColor");
        const color = this.splatColor;
        const rgba = this._outputs[0];
        const rgb = this._outputs[1];
        const alpha = this._outputs[2];

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            state.compilationString += `let ${tempSplatColor}:vec4f = gaussianColor(${color.associatedVariableName}, input.vPosition);\n`;
        } else {
            state.compilationString += `vec4 ${tempSplatColor} = gaussianColor(${color.associatedVariableName});\n`;
        }

        state.compilationString += `${state._declareOutput(rgba)} = ${tempSplatColor}.rgba;`;
        state.compilationString += `${state._declareOutput(rgb)} = ${tempSplatColor}.rgb;`;
        state.compilationString += `${state._declareOutput(alpha)} = ${tempSplatColor}.a;`;

        return this;
    }
}

RegisterClass("BABYLON.GaussianBlock", GaussianBlock);
