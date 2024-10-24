import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { Logger } from "core/Misc/logger";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
/**
 * Block used to write the fragment depth
 */
export class FragDepthBlock extends NodeMaterialBlock {
    /**
     * Create a new FragDepthBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("depth", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("viewProjection", NodeMaterialBlockConnectionPointTypes.Matrix, true);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FragDepthBlock";
    }

    /**
     * Gets the depth input component
     */
    public get depth(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the worldPos input component
     */
    public get worldPos(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the viewProjection input component
     */
    public get viewProjection(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const fragDepth = state.shaderLanguage === ShaderLanguage.GLSL ? "gl_FragDepth" : "fragmentOutputs.fragDepth";

        if (this.depth.isConnected) {
            state.compilationString += `${fragDepth} = ${this.depth.associatedVariableName};\n`;
        } else if (this.worldPos.isConnected && this.viewProjection.isConnected) {
            state.compilationString += `
                ${state._declareLocalVar("p", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this.viewProjection.associatedVariableName} * ${this.worldPos.associatedVariableName};
                ${state._declareLocalVar("v", NodeMaterialBlockConnectionPointTypes.Float)} = p.z / p.w;
                #ifndef IS_NDC_HALF_ZRANGE
                    v = v * 0.5 + 0.5;
                #endif
                ${fragDepth} = v;
    
            `;
        } else {
            Logger.Warn("FragDepthBlock: either the depth input or both the worldPos and viewProjection inputs must be connected!");
        }

        return this;
    }
}
