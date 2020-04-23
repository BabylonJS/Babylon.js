import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";

/**
 * Block used to implement the anisotropy module of the PBR material
 */
export class AnisotropyBlock extends NodeMaterialBlock {

    /**
     * The two properties below are set by the main PBR block prior to calling methods of this class.
     * This is to avoid having to add them as inputs here whereas they are already inputs of the main block, so already known.
     * It's less burden on the user side in the editor part.
    */

    /** @hidden */
    public worldPositionConnectionPoint: NodeMaterialConnectionPoint;
    /** @hidden */
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
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, true); // need this property and the next one in case there's no PerturbNormal block connected to the main PBR block
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.Vector4, true);

        this.registerOutput("anisotropy", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("anisotropy", this, NodeMaterialConnectionPointDirection.Output, AnisotropyBlock, "AnisotropyBlock"));
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
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the worldTangent input component
     */
    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the anisotropy object output component
     */
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
            // in which case uv is not required. But if we do come here, we do need the uv, so we have to raise an error but not with throw, else
            // it will stop the building of the node material and will lead to errors in the editor!
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

        code += `
            #if defined(${worldTangent.isConnected ? "TANGENT" : "IGNORE"}) && defined(NORMAL)
                mat3 TBN = vTBN;
            #else
                mat3 TBN = cotangent_frame(${worldNormal.associatedVariableName + ".xyz"}, ${"v_" + worldPosition.associatedVariableName + ".xyz"}, ${uv.isConnected ? uv.associatedVariableName : "vec2(0.)"}, vec2(1., 1.));
            #endif\r\n`;

        state._emitFunctionFromInclude("bumpFragmentMainFunctions", comments, {
            replaceStrings: [
                tangentReplaceString,
            ]
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
        const texture = this.texture.isConnected ? this.texture.associatedVariableName : "vec3(0.)";

        code += `anisotropicOutParams anisotropicOut;
            anisotropicBlock(
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
        defines.setValue("ANISOTROPIC_TEXTURE", this.texture.isConnected, true);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.AnisotropyBlock"] = AnisotropyBlock;