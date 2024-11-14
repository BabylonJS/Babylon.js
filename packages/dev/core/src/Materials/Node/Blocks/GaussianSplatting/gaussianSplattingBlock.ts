import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { VertexBuffer } from "core/Meshes/buffer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

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
        this.registerInput("splatScale", NodeMaterialBlockConnectionPointTypes.Vector2, true, NodeMaterialBlockTargets.Vertex);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
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
     * Gets the View matrix input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the View matrix input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the projection matrix input component
     */
    public get projection(): NodeMaterialConnectionPoint {
        return this._inputs[4];
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
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("focal");
        state._excludeVariableName("invViewport");
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            return;
        }

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("gaussianSplattingVertexDeclaration", comments);
        state._emitFunctionFromInclude("gaussianSplatting", comments);
        state._emitUniformFromString("focal", NodeMaterialBlockConnectionPointTypes.Vector2);
        state._emitUniformFromString("invViewport", NodeMaterialBlockConnectionPointTypes.Vector2);
        state.attributes.push(VertexBuffer.PositionKind);
        state.sharedData.nodeMaterial.backFaceCulling = false;

        const splatPosition = this.splatPosition;
        const splatScale = this.splatScale;
        const world = this.world;
        const view = this.view;
        const projection = this.projection;
        const output = this.splatVertex;

        const addF = state.fSuffix;
        let splatScaleParameter = `vec2${addF}(1.,1.)`;
        if (splatScale.isConnected) {
            splatScaleParameter = splatScale.associatedVariableName;
        }

        let input = "position";
        let uniforms = "";
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            input = "input.position";
            uniforms = ", uniforms.focal, uniforms.invViewport";
        }
        state.compilationString += `${state._declareOutput(output)} = gaussianSplatting(${input}, ${splatPosition.associatedVariableName}, ${splatScaleParameter}, covA, covB, ${world.associatedVariableName}, ${view.associatedVariableName}, ${projection.associatedVariableName}${uniforms});\n`;
        return this;
    }
}

RegisterClass("BABYLON.GaussianSplattingBlock", GaussianSplattingBlock);
