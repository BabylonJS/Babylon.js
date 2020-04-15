import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";

export class AnisotropyBlock extends NodeMaterialBlock {

    public worldPositionConnectionPoint: NodeMaterialConnectionPoint;
    public worldNormalConnectionPoint: NodeMaterialConnectionPoint;

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("direction", NodeMaterialBlockConnectionPointTypes.Vector2, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, true);
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.Vector4, true);

        this.registerOutput("anisotropy", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("anisotropy", this, NodeMaterialConnectionPointDirection.Output, AnisotropyBlock, "AnisotropyBlock"));
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

    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get direction(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    public get anisotropy(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    private _generateTBNSpace(state: NodeMaterialBuildState) {
        let code = "";

        let comments = `//${this.name}`;
        let uv = this.uv;
        let worldPosition = this.worldPositionConnectionPoint;
        let worldNormal = this.worldNormalConnectionPoint;
        let worldTangent = this.worldTangent;

        if (!uv.isConnected) {
            // we must set the uv input as optional because we may not end up in this method (in case a PerturbNormal block is linked to the PBR material)
            // in which case uv is not required. But if we do come here, we do need the uv, so we have to throw an error
            console.error("You must connect the 'uv' input of the Anisotropy block!");
        }

        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");

        let tangentReplaceString = { search: /defined\(TANGENT\)/g, replace: worldTangent.isConnected ? "defined(TANGENT)" : "defined(IGNORE)" };

        if (worldTangent.isConnected) {
            code += `vec3 tbnNormal = normalize(${worldNormal.associatedVariableName}.xyz);\r\n`;
            code += `vec3 tbnTangent = normalize(${worldTangent.associatedVariableName}.xyz);\r\n`;
            code += `vec3 tbnBitangent = cross(tbnNormal, tbnTangent);\r\n`;
            code += `mat3 vTBN = mat3(tbnTangent, tbnBitangent, tbnNormal);\r\n`;
        }

        state._emitFunctionFromInclude("bumpFragmentFunctions", comments);

        code += state._emitCodeFromInclude("bumpFragment", comments, {
            replaceStrings: [
                { search: /vMainUV1/g, replace: uv.isConnected ? uv.associatedVariableName : "vec2(0.)"},
                { search: /vPositionW/g, replace: "v_" + worldPosition.associatedVariableName + ".xyz"},
                { search: /normalW=/g, replace: "NOTUSED=" },
                { search: /normalW/g, replace: worldNormal.associatedVariableName + ".xyz" },
                tangentReplaceString
            ]
        });

        return code;
    }

    public getCode(state: NodeMaterialBuildState, generateTBNSpace = false): string {
        let code = "";

        if (generateTBNSpace) {
            code += this._generateTBNSpace(state);
        }

        code += `anisotropicOutParams anisotropicOut;\r\n`;

        const intensity = this.intensity.isConnected ? this.intensity.associatedVariableName : "1.0";
        const direction = this.direction.isConnected ? this.direction.associatedVariableName : "vec2(1., 0.)";
        const texture = this.texture.isConnected ? this.texture.associatedVariableName : "vec3(0.)";

        code += `anisotropicBlock(
                vec3(${direction}, ${intensity}),
            #ifdef ANISOTROPIC_TEXTURE
                ${texture},
            #endif
                TBN,
                normalW,
                viewDirectionW,
                anisotropicOut
            );\r\n`;

        return code;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("ANISOTROPIC", true);
        defines.setValue("ANISOTROPIC_TEXTURE", this.texture.isConnected);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.AnisotropyBlock"] = AnisotropyBlock;