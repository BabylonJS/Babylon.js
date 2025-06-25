import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { VertexBuffer } from "core/Meshes/buffer";
import type { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";

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
        this.registerOutput("SH", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Vertex);
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
     * Gets the SH output contribution
     */
    public get SH(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("focal");
        state._excludeVariableName("invViewport");
        state._excludeVariableName("kernelSize");
        state._excludeVariableName("eyePosition");
    }
    /**
     * Update defines for shader compilation
     * @param defines defines the material defines to update
     * @param nodeMaterial defines the node material requesting the update
     * @param mesh defines the mesh to be rendered
     */
    public override prepareDefines(defines: NodeMaterialDefines, nodeMaterial: NodeMaterial, mesh?: AbstractMesh) {
        if (!mesh) {
            return;
        }

        if (mesh.getClassName() == "GaussianSplattingMesh") {
            defines.setValue("SH_DEGREE", (<GaussianSplattingMesh>mesh).shDegree, true);
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            return;
        }

        state.sharedData.blocksWithDefines.push(this);

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("gaussianSplattingVertexDeclaration", comments);
        state._emitFunctionFromInclude("gaussianSplatting", comments);
        state._emitFunctionFromInclude("helperFunctions", comments);
        state._emitUniformFromString("focal", NodeMaterialBlockConnectionPointTypes.Vector2);
        state._emitUniformFromString("invViewport", NodeMaterialBlockConnectionPointTypes.Vector2);
        state._emitUniformFromString("kernelSize", NodeMaterialBlockConnectionPointTypes.Float);
        state._emitUniformFromString("eyePosition", NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString("viewDirectionFactor", NodeMaterialBlockConnectionPointTypes.Vector3);
        state.attributes.push(VertexBuffer.PositionKind);
        state.sharedData.nodeMaterial.backFaceCulling = false;

        const splatPosition = this.splatPosition;
        const splatScale = this.splatScale;
        const world = this.world;
        const view = this.view;
        const projection = this.projection;
        const output = this.splatVertex;
        const sh = this.SH;

        const addF = state.fSuffix;
        let splatScaleParameter = `vec2${addF}(1.,1.)`;
        if (splatScale.isConnected) {
            splatScaleParameter = splatScale.associatedVariableName;
        }

        let input = "position";
        let uniforms = "";
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            input = "input.position";
            uniforms = ", uniforms.focal, uniforms.invViewport, uniforms.kernelSize";
        }
        if (this.SH.isConnected) {
            state.compilationString += `#if SH_DEGREE > 0\n`;

            if (state.shaderLanguage === ShaderLanguage.WGSL) {
                state.compilationString += `let worldRot: mat3x3f =  mat3x3f(${world.associatedVariableName}[0].xyz, ${world.associatedVariableName}[1].xyz, ${world.associatedVariableName}[2].xyz);`;
                state.compilationString += `let normWorldRot: mat3x3f = inverseMat3(worldRot);`;
                state.compilationString += `var dir: vec3f = normalize(normWorldRot * (${splatPosition.associatedVariableName}.xyz - uniforms.eyePosition));\n`;
                state.compilationString += `dir *= uniforms.viewDirectionFactor;\n`;
            } else {
                state.compilationString += `mat3 worldRot = mat3(${world.associatedVariableName});`;
                state.compilationString += `mat3 normWorldRot = inverseMat3(worldRot);`;
                state.compilationString += `vec3 dir = normalize(normWorldRot * (${splatPosition.associatedVariableName}.xyz - eyePosition));\n`;
                state.compilationString += `dir *= viewDirectionFactor;\n`;
            }

            state.compilationString += `${state._declareOutput(sh)} = computeSH(splat, dir);\n`;
            state.compilationString += `#else\n`;
            state.compilationString += `${state._declareOutput(sh)} = vec3${addF}(0.,0.,0.);\n`;
            state.compilationString += `#endif;\n`;
        } else {
            state.compilationString += `${state._declareOutput(sh)} = vec3${addF}(0.,0.,0.);`;
        }

        state.compilationString += `${state._declareOutput(output)} = gaussianSplatting(${input}, ${splatPosition.associatedVariableName}, ${splatScaleParameter}, covA, covB, ${world.associatedVariableName}, ${view.associatedVariableName}, ${projection.associatedVariableName}${uniforms});\n`;
        return this;
    }
}

RegisterClass("BABYLON.GaussianSplattingBlock", GaussianSplattingBlock);
