import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { Mesh } from "../../../../Meshes/mesh";
import { InputBlock } from "../Input/inputBlock";
import type { Effect } from "../../../effect";
import type { Scene } from "../../../../scene";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { TextureBlock } from "../Dual/textureBlock";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { TBNBlock } from "./TBNBlock";

import { ShaderLanguage } from "../../../../Materials/shaderLanguage";
import { Constants } from "../../../../Engines/constants";

/**
 * Block used to perturb normals based on a normal map
 */
export class PerturbNormalBlock extends NodeMaterialBlock {
    private _tangentSpaceParameterName = "";
    private _tangentCorrectionFactorName = "";
    private _worldMatrixName = "";

    /** Gets or sets a boolean indicating that normal should be inverted on X axis */
    @editableInPropertyPage("Invert X axis", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: false } })
    public invertX = false;
    /** Gets or sets a boolean indicating that normal should be inverted on Y axis */
    @editableInPropertyPage("Invert Y axis", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: false } })
    public invertY = false;
    /** Gets or sets a boolean indicating that parallax occlusion should be enabled */
    @editableInPropertyPage("Use parallax occlusion", PropertyTypeForEdition.Boolean)
    public useParallaxOcclusion = false;
    /** Gets or sets a boolean indicating that sampling mode is in Object space */
    @editableInPropertyPage("Object Space Mode", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: false } })
    public useObjectSpaceNormalMap = false;

    /**
     * Create a new PerturbNormalBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        // Vertex
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, false);
        this.registerInput("normalMapColor", NodeMaterialBlockConnectionPointTypes.Color3, false);
        this.registerInput("strength", NodeMaterialBlockConnectionPointTypes.Float, false);
        this.registerInput("viewDirection", NodeMaterialBlockConnectionPointTypes.Vector3, true);
        this.registerInput("parallaxScale", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("parallaxHeight", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput(
            "TBN",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("TBN", this, NodeMaterialConnectionPointDirection.Input, TBNBlock, "TBNBlock")
        );
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, true);

        // Fragment
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("uvOffset", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PerturbNormalBlock";
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the world tangent input component
     */
    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the normal map color input component
     */
    public get normalMapColor(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the strength input component
     */
    public get strength(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the view direction input component
     */
    public get viewDirection(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the parallax scale input component
     */
    public get parallaxScale(): NodeMaterialConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the parallax height input component
     */
    public get parallaxHeight(): NodeMaterialConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the TBN input component
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get TBN(): NodeMaterialConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the World input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[10];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the uv offset output component
     */
    public get uvOffset(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    public override initialize(state: NodeMaterialBuildState) {
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([
                import("../../../../ShadersWGSL/ShadersInclude/bumpFragment"),
                import("../../../../ShadersWGSL/ShadersInclude/bumpFragmentMainFunctions"),
                import("../../../../ShadersWGSL/ShadersInclude/bumpFragmentFunctions"),
            ]);
        } else {
            await Promise.all([
                import("../../../../Shaders/ShadersInclude/bumpFragment"),
                import("../../../../Shaders/ShadersInclude/bumpFragmentMainFunctions"),
                import("../../../../Shaders/ShadersInclude/bumpFragmentFunctions"),
            ]);
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        const normalSamplerName = (this.normalMapColor.connectedPoint!._ownerBlock as TextureBlock).samplerName;
        const useParallax = this.viewDirection.isConnected && ((this.useParallaxOcclusion && normalSamplerName) || (!this.useParallaxOcclusion && this.parallaxHeight.isConnected));

        defines.setValue("BUMP", true);
        defines.setValue("PARALLAX", useParallax, true);
        defines.setValue("PARALLAX_RHS", nodeMaterial.getScene().useRightHandedSystem, true);
        defines.setValue("PARALLAXOCCLUSION", this.useParallaxOcclusion, true);
        defines.setValue("OBJECTSPACE_NORMALMAP", this.useObjectSpaceNormalMap, true);
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (nodeMaterial.getScene()._mirroredCameraPosition) {
            effect.setFloat2(this._tangentSpaceParameterName, this.invertX ? 1.0 : -1.0, this.invertY ? 1.0 : -1.0);
        } else {
            effect.setFloat2(this._tangentSpaceParameterName, this.invertX ? -1.0 : 1.0, this.invertY ? -1.0 : 1.0);
        }

        if (mesh) {
            effect.setFloat(this._tangentCorrectionFactorName, mesh.getWorldMatrix().determinant() < 0 ? -1 : 1);

            if (this.useObjectSpaceNormalMap && !this.world.isConnected) {
                // World default to the mesh world matrix
                effect.setMatrix(this._worldMatrixName, mesh.getWorldMatrix());
            }
        }
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "uv" && additionalFilteringInfo(b));

            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute();
            }
            uvInput.output.connectTo(this.uv);
        }

        if (!this.strength.isConnected) {
            const strengthInput = new InputBlock("strength");
            strengthInput.value = 1.0;
            strengthInput.output.connectTo(this.strength);
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const comments = `//${this.name}`;
        const uv = this.uv;
        const worldPosition = this.worldPosition;
        const worldNormal = this.worldNormal;
        const worldTangent = this.worldTangent;
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        const mat3 = isWebGPU ? "mat3x3f" : "mat3";
        const fSuffix = isWebGPU ? "f" : "";
        const uniformPrefix = isWebGPU ? "uniforms." : "";

        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.bindableBlocks.push(this);

        this._tangentSpaceParameterName = state._getFreeDefineName("tangentSpaceParameter");

        state._emitUniformFromString(this._tangentSpaceParameterName, NodeMaterialBlockConnectionPointTypes.Vector2);

        this._tangentCorrectionFactorName = state._getFreeDefineName("tangentCorrectionFactor");

        state._emitUniformFromString(this._tangentCorrectionFactorName, NodeMaterialBlockConnectionPointTypes.Float);

        this._worldMatrixName = state._getFreeDefineName("perturbNormalWorldMatrix");

        state._emitUniformFromString(this._worldMatrixName, NodeMaterialBlockConnectionPointTypes.Matrix);

        let normalSamplerName = null;
        if (this.normalMapColor.connectedPoint) {
            normalSamplerName = (this.normalMapColor.connectedPoint!._ownerBlock as TextureBlock).samplerName;
        }
        const useParallax = this.viewDirection.isConnected && ((this.useParallaxOcclusion && normalSamplerName) || (!this.useParallaxOcclusion && this.parallaxHeight.isConnected));

        const replaceForParallaxInfos = !this.parallaxScale.isConnectedToInputBlock
            ? "0.05"
            : this.parallaxScale.connectInputBlock!.isConstant
              ? state._emitFloat(this.parallaxScale.connectInputBlock!.value)
              : this.parallaxScale.associatedVariableName;

        const replaceForBumpInfos =
            this.strength.isConnectedToInputBlock && this.strength.connectInputBlock!.isConstant
                ? `\n#if !defined(NORMALXYSCALE)\n1.0/\n#endif\n${state._emitFloat(this.strength.connectInputBlock!.value)}`
                : `\n#if !defined(NORMALXYSCALE)\n1.0/\n#endif\n${this.strength.associatedVariableName}`;

        if (!isWebGPU) {
            state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");
        }

        const tangentReplaceString = { search: /defined\(TANGENT\)/g, replace: worldTangent.isConnected ? "defined(TANGENT)" : "defined(IGNORE)" };
        const tbnVarying = { search: /varying mat3 vTBN;/g, replace: "" };
        const normalMatrixReplaceString = { search: /uniform mat4 normalMatrix;/g, replace: "" };

        const TBN = this.TBN;
        if (TBN.isConnected) {
            state.compilationString += `
            #ifdef TBNBLOCK
            ${isWebGPU ? "var" : "mat3"} vTBN = ${TBN.associatedVariableName};
            #endif
            `;
        } else if (worldTangent.isConnected) {
            state.compilationString += `${state._declareLocalVar("tbnNormal", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${worldNormal.associatedVariableName}.xyz);\n`;
            state.compilationString += `${state._declareLocalVar("tbnTangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${worldTangent.associatedVariableName}.xyz);\n`;
            state.compilationString += `${state._declareLocalVar("tbnBitangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = cross(tbnNormal, tbnTangent) * ${isWebGPU ? "uniforms." : ""}${this._tangentCorrectionFactorName};\n`;
            state.compilationString += `${isWebGPU ? "var" : "mat3"} vTBN = ${mat3}(tbnTangent, tbnBitangent, tbnNormal);\n`;
        }

        let replaceStrings = [tangentReplaceString, tbnVarying, normalMatrixReplaceString];

        if (isWebGPU) {
            replaceStrings.push({ search: /varying vTBN0: vec3f;/g, replace: "" });
            replaceStrings.push({ search: /varying vTBN1: vec3f;/g, replace: "" });
            replaceStrings.push({ search: /varying vTBN2: vec3f;/g, replace: "" });
        }

        state._emitFunctionFromInclude("bumpFragmentMainFunctions", comments, {
            replaceStrings: replaceStrings,
        });

        const replaceString0 = isWebGPU
            ? "fn parallaxOcclusion(vViewDirCoT: vec3f, vNormalCoT: vec3f, texCoord: vec2f, parallaxScale:f32, bump: texture_2d<f32>, bumpSampler: sampler)"
            : "#define inline\nvec2 parallaxOcclusion(vec3 vViewDirCoT, vec3 vNormalCoT, vec2 texCoord, float parallaxScale, sampler2D bumpSampler)";

        const searchExp0 = isWebGPU
            ? /fn parallaxOcclusion\(vViewDirCoT: vec3f,vNormalCoT: vec3f,texCoord: vec2f,parallaxScale: f32\)/g
            : /vec2 parallaxOcclusion\(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale\)/g;

        const replaceString1 = isWebGPU
            ? "fn parallaxOffset(viewDir: vec3f, heightScale: f32, height_: f32)"
            : "vec2 parallaxOffset(vec3 viewDir, float heightScale, float height_)";

        const searchExp1 = isWebGPU ? /fn parallaxOffset\(viewDir: vec3f,heightScale: f32\)/g : /vec2 parallaxOffset\(vec3 viewDir,float heightScale\)/g;

        state._emitFunctionFromInclude("bumpFragmentFunctions", comments, {
            replaceStrings: [
                { search: /#include<samplerFragmentDeclaration>\(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_SAMPLERNAME_,bump\)/g, replace: "" },
                { search: /uniform sampler2D bumpSampler;/g, replace: "" },
                {
                    search: searchExp0,
                    replace: replaceString0,
                },
                { search: searchExp1, replace: replaceString1 },
                { search: /texture.+?bumpSampler,vBumpUV\)\.w/g, replace: "height_" },
            ],
        });

        const normalRead = isWebGPU ? `textureSample(${normalSamplerName}, ${normalSamplerName + Constants.AUTOSAMPLERSUFFIX}` : `texture2D(${normalSamplerName}`;

        const uvForPerturbNormal = !useParallax || !normalSamplerName ? this.normalMapColor.associatedVariableName : `${normalRead}, ${uv.associatedVariableName} + uvOffset).xyz`;

        const tempOutput = state._getFreeVariableName("tempOutput");
        state.compilationString += state._declareLocalVar(tempOutput, NodeMaterialBlockConnectionPointTypes.Vector3) + ` = vec3${fSuffix}(0.);\n`;

        replaceStrings = [
            { search: new RegExp(`texture.+?bumpSampler${isWebGPU ? "Sampler,fragmentInputs." : ","}vBumpUV\\)`, "g"), replace: `${uvForPerturbNormal}` },
            {
                search: /#define CUSTOM_FRAGMENT_BUMP_FRAGMENT/g,
                replace: `${state._declareLocalVar("normalMatrix", NodeMaterialBlockConnectionPointTypes.Matrix)} = toNormalMatrix(${this.world.isConnected ? this.world.associatedVariableName : this._worldMatrixName});`,
            },
            {
                search: new RegExp(
                    `perturbNormal\\(TBN,texture.+?bumpSampler${isWebGPU ? "Sampler,fragmentInputs." : ","}vBumpUV\\+uvOffset\\).xyz,${isWebGPU ? "uniforms." : ""}vBumpInfos.y\\)`,
                    "g"
                ),
                replace: `perturbNormal(TBN, ${uvForPerturbNormal}, vBumpInfos.y)`,
            },
            {
                search: /parallaxOcclusion\(invTBN\*-viewDirectionW,invTBN\*normalW,vBumpUV,vBumpInfos.z\)/g,
                replace: `parallaxOcclusion((invTBN * -viewDirectionW), (invTBN * normalW), vBumpUV, vBumpInfos.z, ${
                    isWebGPU
                        ? useParallax && this.useParallaxOcclusion
                            ? `${normalSamplerName}, ${normalSamplerName + Constants.AUTOSAMPLERSUFFIX}`
                            : "bump, bumpSampler"
                        : useParallax && this.useParallaxOcclusion
                          ? normalSamplerName
                          : "bumpSampler"
                })`,
            },
            {
                search: /parallaxOffset\(invTBN\*viewDirectionW,vBumpInfos\.z\)/g,
                replace: `parallaxOffset(invTBN * viewDirectionW, vBumpInfos.z, ${useParallax ? this.parallaxHeight.associatedVariableName : "0."})`,
            },
            { search: /vBumpInfos.y/g, replace: replaceForBumpInfos },
            { search: /vBumpInfos.z/g, replace: replaceForParallaxInfos },
            { search: /normalW=/g, replace: tempOutput + " = " },
            { search: /mat3\(normalMatrix\)\*normalW/g, replace: `${mat3}(normalMatrix) * ` + tempOutput },
            { search: /normalW/g, replace: worldNormal.associatedVariableName + ".xyz" },
            { search: /viewDirectionW/g, replace: useParallax ? this.viewDirection.associatedVariableName : `vec3${fSuffix}(0.)` },
            tangentReplaceString,
        ];

        if (isWebGPU) {
            replaceStrings.push({ search: /fragmentInputs.vBumpUV/g, replace: uv.associatedVariableName });
            replaceStrings.push({ search: /input.vPositionW/g, replace: worldPosition.associatedVariableName + ".xyz" });
            replaceStrings.push({ search: /uniforms.vTangentSpaceParams/g, replace: uniformPrefix + this._tangentSpaceParameterName });
            replaceStrings.push({ search: /var TBN: mat3x3f=mat3x3<f32>\(input.vTBN0,input.vTBN1,input.vTBN2\);/g, replace: `var TBN = vTBN;` });
        } else {
            replaceStrings.push({ search: /vBumpUV/g, replace: uv.associatedVariableName });
            replaceStrings.push({ search: /vPositionW/g, replace: worldPosition.associatedVariableName + ".xyz" });
            replaceStrings.push({ search: /vTangentSpaceParams/g, replace: uniformPrefix + this._tangentSpaceParameterName });
        }

        state.compilationString += state._emitCodeFromInclude("bumpFragment", comments, {
            replaceStrings: replaceStrings,
        });

        state.compilationString += state._declareOutput(this.output) + ` = vec4${fSuffix}(${tempOutput}, 0.);\n`;

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.invertX = ${this.invertX};\n`;

        codeString += `${this._codeVariableName}.invertY = ${this.invertY};\n`;
        codeString += `${this._codeVariableName}.useParallaxOcclusion = ${this.useParallaxOcclusion};\n`;
        codeString += `${this._codeVariableName}.useObjectSpaceNormalMap = ${this.useObjectSpaceNormalMap};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.invertX = this.invertX;
        serializationObject.invertY = this.invertY;
        serializationObject.useParallaxOcclusion = this.useParallaxOcclusion;
        serializationObject.useObjectSpaceNormalMap = this.useObjectSpaceNormalMap;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.invertX = serializationObject.invertX;
        this.invertY = serializationObject.invertY;
        this.useParallaxOcclusion = !!serializationObject.useParallaxOcclusion;
        this.useObjectSpaceNormalMap = !!serializationObject.useObjectSpaceNormalMap;
    }
}

RegisterClass("BABYLON.PerturbNormalBlock", PerturbNormalBlock);
