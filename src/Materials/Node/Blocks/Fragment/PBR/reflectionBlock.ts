import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../../nodeMaterial';
import { _TypeStore } from '../../../../../Misc/typeStore';
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";
import { ReflectionTextureBaseBlock } from '../../Dual/reflectionTextureBaseBlock';
import { AbstractMesh } from '../../../../../Meshes/abstractMesh';
import { Engine } from '../../../../../Engines/engine';
import { Nullable } from '../../../../../types';
import { Texture } from '../../../../Textures/texture';
import { BaseTexture } from '../../../../Textures/baseTexture';
import { Mesh } from '../../../../../Meshes/mesh';
import { SubMesh } from '../../../../../Meshes/subMesh';
import { Effect } from '../../../../effect';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../nodeMaterialDecorator";
import { Scene } from '../../../../../scene';

export class ReflectionBlock extends ReflectionTextureBaseBlock {

    private _defineLODReflectionAlpha: string;
    private _defineLinearSpecularReflection: string;
    private _defineLODBasedMicroSurface: string;
    private _vEnvironmentIrradianceName: string;
    private _vReflectionMicrosurfaceInfosName: string;

    public worldPositionConnectionPoint: NodeMaterialConnectionPoint;
    public worldNormalConnectionPoint: NodeMaterialConnectionPoint;
    public cameraPositionConnectionPoint: NodeMaterialConnectionPoint;

    @editableInPropertyPage("Spherical Harmonics", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useSphericalHarmonics: boolean = true;

    @editableInPropertyPage("Force irradiance in fragment", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public forceIrradianceInFragment: boolean = false;

    public constructor(name: string) {
        super(name);

        this._isUnique = true;

        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("reflection", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Output, ReflectionBlock, "ReflectionBlock"));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReflectionBlock";
    }

    /**
     * Gets the world position input component
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this.worldPositionConnectionPoint;
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this.worldNormalConnectionPoint;
    }

    /**
     * Gets the world input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
    * Gets the camera (or eye) position component
    */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this.cameraPositionConnectionPoint;
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    public get reflection(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Returns the texture used for reflections.
     * @returns - Reflection texture if present.  Otherwise, returns the environment texture.
     */
    private _getReflectionTexture(): Nullable<BaseTexture> {
        if (this.texture) {
            return this.texture;
        }

        return Engine.LastCreatedScene!.environmentTexture;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        const reflection = this.texture && this.texture.getTextureMatrix;

        defines.setValue("REFLECTION", reflection);

        if (!reflection) {
            return;
        }

        defines.setValue(this._defineLODReflectionAlpha, this.texture!.lodLevelInAlpha);
        defines.setValue(this._defineLinearSpecularReflection, this.texture!.linearSpecularLOD);
        defines.setValue(this._defineLODBasedMicroSurface, Engine.LastCreatedScene?.getEngine()?.getCaps().textureLOD ?? false);

        defines.setValue("SPHERICAL_HARMONICS", this.useSphericalHarmonics);

        const reflectionTexture = this._getReflectionTexture();

        if (reflectionTexture && reflectionTexture.coordinatesMode !== Texture.SKYBOX_MODE) {
            if (reflectionTexture.isCube) {
                defines.setValue("USESPHERICALFROMREFLECTIONMAP", true);
                defines.setValue("USEIRRADIANCEMAP", false);
                if (this.forceIrradianceInFragment || Engine.LastCreatedScene!.getEngine().getCaps().maxVaryingVectors <= 8) {
                    defines.setValue("USESPHERICALINVERTEX", false);
                }
                else {
                    defines.setValue("USESPHERICALINVERTEX", true);
                }
            }
        }
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh, subMesh?: SubMesh) {
        super.bind(effect, nodeMaterial, mesh);

        const reflectionTexture = this._getReflectionTexture();

        if (!reflectionTexture || !subMesh) {
            return;
        }

        if (reflectionTexture.isCube) {
            effect.setTexture(this._cubeSamplerName, reflectionTexture);
        } else {
            effect.setTexture(this._2DSamplerName, reflectionTexture);
        }

        effect.setFloat3("vReflectionMicrosurfaceInfos", reflectionTexture.getSize().width, reflectionTexture.lodGenerationScale, reflectionTexture.lodGenerationOffset);

        const defines = subMesh._materialDefines as  NodeMaterialDefines;

        const polynomials = reflectionTexture.sphericalPolynomial;
        if (defines.USESPHERICALFROMREFLECTIONMAP && polynomials) {
            if (defines.SPHERICAL_HARMONICS) {
                const preScaledHarmonics = polynomials.preScaledHarmonics;
                effect.setVector3("vSphericalL00", preScaledHarmonics.l00);
                effect.setVector3("vSphericalL1_1", preScaledHarmonics.l1_1);
                effect.setVector3("vSphericalL10", preScaledHarmonics.l10);
                effect.setVector3("vSphericalL11", preScaledHarmonics.l11);
                effect.setVector3("vSphericalL2_2", preScaledHarmonics.l2_2);
                effect.setVector3("vSphericalL2_1", preScaledHarmonics.l2_1);
                effect.setVector3("vSphericalL20", preScaledHarmonics.l20);
                effect.setVector3("vSphericalL21", preScaledHarmonics.l21);
                effect.setVector3("vSphericalL22", preScaledHarmonics.l22);
            }
            else {
                effect.setFloat3("vSphericalX", polynomials.x.x, polynomials.x.y, polynomials.x.z);
                effect.setFloat3("vSphericalY", polynomials.y.x, polynomials.y.y, polynomials.y.z);
                effect.setFloat3("vSphericalZ", polynomials.z.x, polynomials.z.y, polynomials.z.z);
                effect.setFloat3("vSphericalXX_ZZ", polynomials.xx.x - polynomials.zz.x,
                    polynomials.xx.y - polynomials.zz.y,
                    polynomials.xx.z - polynomials.zz.z);
                effect.setFloat3("vSphericalYY_ZZ", polynomials.yy.x - polynomials.zz.x,
                    polynomials.yy.y - polynomials.zz.y,
                    polynomials.yy.z - polynomials.zz.z);
                effect.setFloat3("vSphericalZZ", polynomials.zz.x, polynomials.zz.y, polynomials.zz.z);
                effect.setFloat3("vSphericalXY", polynomials.xy.x, polynomials.xy.y, polynomials.xy.z);
                effect.setFloat3("vSphericalYZ", polynomials.yz.x, polynomials.yz.y, polynomials.yz.z);
                effect.setFloat3("vSphericalZX", polynomials.zx.x, polynomials.zx.y, polynomials.zx.z);
            }
        }
    }

    public handleVertexSide(state: NodeMaterialBuildState): string {
        let code = super.handleVertexSide(state);

        state._emitFunctionFromInclude("harmonicsFunctions", `//${this.name}`, {
            replaceStrings: [
                { search: /uniform vec3 vSphericalL00;[\s\S]*?uniform vec3 vSphericalL22;/g, replace: "" },
                { search: /uniform vec3 vSphericalX;[\s\S]*?uniform vec3 vSphericalZX;/g, replace: "" },
            ]
        });

        const reflectionVectorName = state._getFreeVariableName("reflectionVector");

        this._vEnvironmentIrradianceName = state._getFreeVariableName("vEnvironmentIrradiance");

        state._emitVaryingFromString(this._vEnvironmentIrradianceName, "vec3", "defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX");

        state._emitUniformFromString("vSphericalL00", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL1_1", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL10", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL11", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL2_2", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL2_1", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL20", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL21", "vec3", "SPHERICAL_HARMONICS");
        state._emitUniformFromString("vSphericalL22", "vec3", "SPHERICAL_HARMONICS");

        state._emitUniformFromString("vSphericalX", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalY", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalZ", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalXX_ZZ", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalYY_ZZ", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalZZ", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalXY", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalYZ", "vec3", "SPHERICAL_HARMONICS", true);
        state._emitUniformFromString("vSphericalZX", "vec3", "SPHERICAL_HARMONICS", true);

        code +=
            `#if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
                vec3 ${reflectionVectorName} = vec3(${this._reflectionMatrixName} * vec4(${this.worldNormal.associatedVariableName}.xyz, 0)).xyz;
                #ifdef REFLECTIONMAP_OPPOSITEZ
                    ${reflectionVectorName}.z *= -1.0;
                #endif
                ${this._vEnvironmentIrradianceName} = computeEnvironmentIrradiance(${reflectionVectorName});
            #endif\r\n`;

        return code;
    }

    public getCode(state: NodeMaterialBuildState, normalVarName: string, finalColorVarName: string, finalIrradianceVector: string, finalIrradianceVarName: string): string {
        let code = "";

        this.handleFragmentSideInits(state);

        state._emitFunctionFromInclude("harmonicsFunctions", `//${this.name}`, {
            replaceStrings: [
                { search: /uniform vec3 vSphericalL00;[\s\S]*?uniform vec3 vSphericalL22;/g, replace: "" },
                { search: /uniform vec3 vSphericalX;[\s\S]*?uniform vec3 vSphericalZX;/g, replace: "" },
            ]
        });

        code += this.handleFragmentSideCodeReflectionCoords(normalVarName);

        const varLOD = state._getFreeVariableName("reflectionLOD");
        const varRequestedLOD = state._getFreeVariableName("requestedReflectionLOD");
        const varAutomaticLOD = state._getFreeVariableName("automaticReflectionLOD");

        this._vReflectionMicrosurfaceInfosName = state._getFreeVariableName("vReflectionMicrosurfaceInfos");

        state._emitUniformFromString(this._vReflectionMicrosurfaceInfosName, "vec3");

        code += `
            vec4 ${finalColorVarName} = vec4(0.);

            #if defined(${this._defineLODReflectionAlpha}) && !defined(${this._defineSkyboxName})
                float ${varLOD} = getLodFromAlphaG(${this._vReflectionMicrosurfaceInfosName}.x, alphaG, NdotVUnclamped);
            #elif defined(${this._defineLinearSpecularReflection})
                float ${varLOD} = getLinearLodFromRoughness(${this._vReflectionMicrosurfaceInfosName}.x, roughness);
            #else
                float ${varLOD} = getLodFromAlphaG(${this._vReflectionMicrosurfaceInfosName}.x, alphaG);
            #endif

            #ifdef ${this._defineLODBasedMicroSurface}
                ${varLOD} = ${varLOD} * ${this._vReflectionMicrosurfaceInfosName}.y + ${this._vReflectionMicrosurfaceInfosName}.z;

                #ifdef ${this._defineLODReflectionAlpha}
                    #ifdef ${this._define3DName}
                        float ${varAutomaticLOD} = UNPACK_LOD(textureCube(${this._cubeSamplerName}, ${this._reflectionCoordsName}).a);
                    #else
                        float ${varAutomaticLOD} = UNPACK_LOD(texture2D(${this._2DSamplerName}, ${this._reflectionCoordsName}).a);
                    #endif
                    float ${varRequestedLOD} = max(${varAutomaticLOD}, ${varLOD});
                #else
                    float ${varRequestedLOD} = ${varLOD};
                #endif\r\n`;

        code += this.handleFragmentSideCodeReflectionColor(varRequestedLOD, "");

        code += `
                ${finalColorVarName} = ${this._reflectionColorName}${this.color.isConnected ? " * vec4(" + this.color.associatedVariableName + ", 1.)" : ""};
            #else
                // ***not handled***
            #endif\r\n`;

        code += `
            vec3 ${finalIrradianceVarName} = vec3(0.);
            #ifdef USESPHERICALFROMREFLECTIONMAP
                #if defined(USESPHERICALINVERTEX)
                    ${finalIrradianceVarName} = ${this._vEnvironmentIrradianceName};
                #else
                    #ifdef ANISOTROPIC
                        vec3 ${finalIrradianceVector} = vec3(${this._reflectionMatrixName} * vec4(anisotropicOut.anisotropicNormal, 0)).xyz;
                    #else
                        vec3 ${finalIrradianceVector} = vec3(${this._reflectionMatrixName} * vec4(${normalVarName}.xyz, 0)).xyz;
                    #endif

                    #ifdef REFLECTIONMAP_OPPOSITEZ
                    ${finalIrradianceVector}.z *= -1.0;
                    #endif

                    ${finalIrradianceVarName} = computeEnvironmentIrradiance(${finalIrradianceVector});
                #endif
            #endif\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            this._defineLODReflectionAlpha = state._getFreeDefineName("LODINREFLECTIONALPHA");
            this._defineLinearSpecularReflection = state._getFreeDefineName("LINEARSPECULARREFLECTION");
            this._defineLODBasedMicroSurface = state._getFreeDefineName("LODBASEDMICROSFURACE");
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.useSphericalHarmonics = this.useSphericalHarmonics;
        serializationObject.forceIrradianceInFragment = this.forceIrradianceInFragment;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.useSphericalHarmonics = serializationObject.useSphericalHarmonics;
        this.forceIrradianceInFragment = serializationObject.forceIrradianceInFragment;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectionBlock"] = ReflectionBlock;
