import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { TBNBlock } from "../Fragment/TBNBlock";
import type { Mesh } from "../../../../Meshes/mesh";
import type { Effect } from "../../../effect";
import { Logger } from "core/Misc/logger";

/**
 * Block used to implement the anisotropy module of the PBR material
 */
export class AnisotropyBlock extends NodeMaterialBlock {
    private _tangentCorrectionFactorName = "";

    /**
     * The two properties below are set by the main PBR block prior to calling methods of this class.
     * This is to avoid having to add them as inputs here whereas they are already inputs of the main block, so already known.
     * It's less burden on the user side in the editor part.
     */

    /** @internal */
    public worldPositionConnectionPoint: NodeMaterialConnectionPoint;
    /** @internal */
    public worldNormalConnectionPoint: NodeMaterialConnectionPoint;

    /**
     * Create a new AnisotropyBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("direction", NodeMaterialBlockConnectionPointTypes.Vector2, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, true); // need this property and the next one in case there's no PerturbNormal block connected to the main PBR block
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput(
            "TBN",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("TBN", this, NodeMaterialConnectionPointDirection.Input, TBNBlock, "TBNBlock")
        );
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput(
            "anisotropy",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("anisotropy", this, NodeMaterialConnectionPointDirection.Output, AnisotropyBlock, "AnisotropyBlock")
        );
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("anisotropicOut");
        state._excludeVariableName("TBN");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "AnisotropyBlock";
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the direction input component
     */
    public get direction(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the worldTangent input component
     */
    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the TBN input component
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get TBN(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the roughness input component
     */
    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the anisotropy object output component
     */
    public get anisotropy(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    private _generateTBNSpace(state: NodeMaterialBuildState) {
        let code = "";

        const comments = `//${this.name}`;
        const uv = this.uv;
        const worldPosition = this.worldPositionConnectionPoint;
        const worldNormal = this.worldNormalConnectionPoint;
        const worldTangent = this.worldTangent;

        if (!uv.isConnected) {
            // we must set the uv input as optional because we may not end up in this method (in case a PerturbNormal block is linked to the PBR material)
            // in which case uv is not required. But if we do come here, we do need the uv, so we have to raise an error but not with throw, else
            // it will stop the building of the node material and will lead to errors in the editor!
            Logger.Error("You must connect the 'uv' input of the Anisotropy block!");
        }

        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");

        const tangentReplaceString = { search: /defined\(TANGENT\)/g, replace: worldTangent.isConnected ? "defined(TANGENT)" : "defined(IGNORE)" };

        const TBN = this.TBN;
        if (TBN.isConnected) {
            state.compilationString += `
            #ifdef TBNBLOCK
            mat3 vTBN = ${TBN.associatedVariableName};
            #endif
            `;
        } else if (worldTangent.isConnected) {
            code += `vec3 tbnNormal = normalize(${worldNormal.associatedVariableName}.xyz);\n`;
            code += `vec3 tbnTangent = normalize(${worldTangent.associatedVariableName}.xyz);\n`;
            code += `vec3 tbnBitangent = cross(tbnNormal, tbnTangent) * ${this._tangentCorrectionFactorName};\n`;
            code += `mat3 vTBN = mat3(tbnTangent, tbnBitangent, tbnNormal);\n`;
        }

        code += `
            #if defined(${worldTangent.isConnected ? "TANGENT" : "IGNORE"}) && defined(NORMAL)
                mat3 TBN = vTBN;
            #else
                mat3 TBN = cotangent_frame(${worldNormal.associatedVariableName + ".xyz"}, ${"v_" + worldPosition.associatedVariableName + ".xyz"}, ${
                    uv.isConnected ? uv.associatedVariableName : "vec2(0.)"
                }, vec2(1., 1.));
            #endif\n`;

        state._emitFunctionFromInclude("bumpFragmentMainFunctions", comments, {
            replaceStrings: [tangentReplaceString],
        });

        return code;
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @param generateTBNSpace if true, the code needed to create the TBN coordinate space is generated
     * @returns the shader code
     */
    public getCode(state: NodeMaterialBuildState, generateTBNSpace = false): string {
        let code = "";

        if (generateTBNSpace) {
            code += this._generateTBNSpace(state);
        }

        const intensity = this.intensity.isConnected ? this.intensity.associatedVariableName : "1.0";
        const direction = this.direction.isConnected ? this.direction.associatedVariableName : "vec2(1., 0.)";
        const roughness = this.roughness.isConnected ? this.roughness.associatedVariableName : "0.";

        code += `anisotropicOutParams anisotropicOut;
            anisotropicBlock(
                vec3(${direction}, ${intensity}),
                ${roughness},
            #ifdef ANISOTROPIC_TEXTURE
                vec3(0.),
            #endif
                TBN,
                normalW,
                viewDirectionW,
                anisotropicOut
            );\n`;

        return code;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("ANISOTROPIC", true);
        defines.setValue("ANISOTROPIC_TEXTURE", false, true);
        defines.setValue("ANISOTROPIC_LEGACY", !this.roughness.isConnected);
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        super.bind(effect, nodeMaterial, mesh);

        if (mesh) {
            effect.setFloat(this._tangentCorrectionFactorName, mesh.getWorldMatrix().determinant() < 0 ? -1 : 1);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
            state.sharedData.bindableBlocks.push(this);

            this._tangentCorrectionFactorName = state._getFreeDefineName("tangentCorrectionFactor");
            state._emitUniformFromString(this._tangentCorrectionFactorName, "float");
        }

        return this;
    }
}

RegisterClass("BABYLON.AnisotropyBlock", AnisotropyBlock);
