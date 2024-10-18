import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";

/**
 * Block used for the particle blend multiply section
 */
export class ParticleBlendMultiplyBlock extends NodeMaterialBlock {
    /**
     * Create a new ParticleBlendMultiplyBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("alphaTexture", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("alphaColor", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("blendColor", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleBlendMultiplyBlock";
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the alphaTexture input component
     */
    public get alphaTexture(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the alphaColor input component
     */
    public get alphaColor(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the blendColor output component
     */
    public get blendColor(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("sourceAlpha");
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }

        state.compilationString += `
            #ifdef BLENDMULTIPLYMODE
                ${state._declareOutput(this.blendColor)};
                ${state._declareLocalVar("sourceAlpha", NodeMaterialBlockConnectionPointTypes.Float)}  = ${this.alphaColor.associatedVariableName} * ${this.alphaTexture.associatedVariableName};
                ${this.blendColor.associatedVariableName} = vec4${state.fSuffix}(${this.color.associatedVariableName}.rgb * sourceAlpha + vec3(1.0) * (1.0 - sourceAlpha), ${this.color.associatedVariableName}.a);
            #else
                ${state._declareOutput(this.blendColor)} = ${this.color.associatedVariableName};
            #endif
        `;

        return this;
    }
}
