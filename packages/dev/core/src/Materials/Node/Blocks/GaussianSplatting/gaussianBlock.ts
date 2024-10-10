import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";

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

        this._isUnique = true;

        this.registerInput("splatColor", NodeMaterialBlockConnectionPointTypes.Color4, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
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
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        //state._excludeVariableName("splatColor");
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }
        /*
        state._emit2DSampler("rampSampler", "RAMPGRADIENT");
        state._emitVaryingFromString("remapRanges", NodeMaterialBlockConnectionPointTypes.Vector4, "RAMPGRADIENT");

        state.compilationString += `
            #ifdef RAMPGRADIENT
                ${state._declareLocalVar("baseColor", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.color.associatedVariableName};
                ${state._declareLocalVar("alpha", NodeMaterialBlockConnectionPointTypes.Float)} = ${this.color.associatedVariableName}.a;

                ${state._declareLocalVar("remappedColorIndex", NodeMaterialBlockConnectionPointTypes.Float)} = clamp((alpha - remapRanges.x) / remapRanges.y, 0.0, 1.0);

                ${state._declareLocalVar("rampColor", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${state._generateTextureSample("vec2(1.0 - remappedColorIndex, 0.)", "rampSampler")};

                // Remapped alpha
                ${state._declareOutput(this.rampColor)} = vec4${state.fSuffix}(baseColor.rgb * rampColor.rgb, clamp((alpha * rampColor.a - remapRanges.z) / remapRanges.w, 0.0, 1.0));
            #else
                ${state._declareOutput(this.rampColor)} = ${this.color.associatedVariableName};
            #endif
        `;
*/
        return this;
    }
}

RegisterClass("BABYLON.GaussianBlock", GaussianBlock);
