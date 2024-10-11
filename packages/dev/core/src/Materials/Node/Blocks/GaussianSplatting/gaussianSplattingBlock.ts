import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used for the Gaussian Splatting
 */
export class GaussianSplattingBlock extends NodeMaterialBlock {
    /**
     * Create a new GaussianSplattingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this._isUnique = true;

        this.registerInput("splatPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("splatScale", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("projection", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);

        this.registerOutput("splatVertex", NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockTargets.Vertex);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GaussianSplattingBlock";
    }

    /**
     * Gets the position input component
     */
    public get splatPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the scale input component
     */
    public get splatScale(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the view matrix input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the projection matrix input component
     */
    public get projection(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the splatVertex output component
     */
    public get splatVertex(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {}

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            return;
        }

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("gaussianSplattingVertexDeclaration", comments);
        state._emitUniformFromString("focal", NodeMaterialBlockConnectionPointTypes.Vector2);

        const splatPosition = this.splatPosition;
        const splatScale = this.splatScale;
        const view = this.view;
        const projection = this.projection;
        const output = this._outputs[0];

        state.compilationString += `${state._declareOutput(output)} = gaussianSplatting(${splatPosition.associatedVariableName}, ${splatScale.associatedVariableName}, covA, covB, ${view.associatedVariableName}, ${projection.associatedVariableName});\n`;

        return this;
    }
}

RegisterClass("BABYLON.GaussianSplattingBlock", GaussianSplattingBlock);
