import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used for the particle ramp gradient section
 */
export class ParticleRampGradientBlock extends NodeMaterialBlock {

    /**
     * Create a new ParticleRampGradientBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color4, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("rampColor", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ParticleRampGradientBlock";
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rampColor output component
     */
    public get rampColor(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("remapRanges");
        state._excludeVariableName("rampSampler");
        state._excludeVariableName("baseColor");
        state._excludeVariableName("alpha");
        state._excludeVariableName("remappedColorIndex");
        state._excludeVariableName("rampColor");
        state._excludeVariableName("finalAlpha");
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }

        state._emit2DSampler("rampSampler");
        state._emitVaryingFromString("remapRanges", "vec4", "RAMPGRADIENT");

        state.compilationString += `
            #ifdef RAMPGRADIENT
                vec4 baseColor = ${this.color.associatedVariableName};
                float alpha = ${this.color.associatedVariableName}.a;

                float remappedColorIndex = clamp((alpha - remapRanges.x) / remapRanges.y, 0.0, 1.0);

                vec4 rampColor = texture2D(rampSampler, vec2(1.0 - remappedColorIndex, 0.));
                baseColor.rgb *= rampColor.rgb;

                // Remapped alpha
                float finalAlpha = baseColor.a;
                baseColor.a = clamp((alpha * rampColor.a - remapRanges.z) / remapRanges.w, 0.0, 1.0);

                ${this._declareOutput(this.rampColor, state)} = baseColor;
            #else
                ${this._declareOutput(this.rampColor, state)} = ${this.color.associatedVariableName};
            #endif
        `;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ParticleRampGradientBlock"] = ParticleRampGradientBlock;