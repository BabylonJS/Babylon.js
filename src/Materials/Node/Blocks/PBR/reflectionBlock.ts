import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { _TypeStore } from '../../../../Misc/typeStore';
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { ReflectionTextureBaseBlock } from '../Dual/reflectionTextureBaseBlock';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { Nullable } from '../../../../types';
import { Texture } from '../../../Textures/texture';
import { BaseTexture } from '../../../Textures/baseTexture';
import { Mesh } from '../../../../Meshes/mesh';
import { SubMesh } from '../../../../Meshes/subMesh';
import { Effect } from '../../../effect';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import { Scene } from '../../../../scene';

/**
 * Block used to implement the reflection module of the PBR material
 */
export class ReflectionBlock extends ReflectionTextureBaseBlock {

    /** @hidden */
    public _defineLODReflectionAlpha: string;
    /** @hidden */
    public _defineLinearSpecularReflection: string;
    private _vEnvironmentIrradianceName: string;
    /** @hidden */
    public _vReflectionMicrosurfaceInfosName: string;
    /** @hidden */
    public _vReflectionInfosName: string;
    private _scene: Scene;

    /**
     * The three properties below are set by the main PBR block prior to calling methods of this class.
     * This is to avoid having to add them as inputs here whereas they are already inputs of the main block, so already known.
     * It's less burden on the user side in the editor part.
    */

    /** @hidden */
    public worldPositionConnectionPoint: NodeMaterialConnectionPoint;
    /** @hidden */
    public worldNormalConnectionPoint: NodeMaterialConnectionPoint;
    /** @hidden */
    public cameraPositionConnectionPoint: NodeMaterialConnectionPoint;

    /**
     * Defines if the material uses spherical harmonics vs spherical polynomials for the
     * diffuse part of the IBL.
     */
    @editableInPropertyPage("Spherical Harmonics", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useSphericalHarmonics: boolean = true;

    /**
     * Force the shader to compute irradiance in the fragment shader in order to take bump in account.
     */
    @editableInPropertyPage("Force irradiance in fragment", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public forceIrradianceInFragment: boolean = false;

    /**
     * Create a new ReflectionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isUnique = true;

        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("reflection", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Output, ReflectionBlock, "ReflectionBlock"));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReflectionBlock";
    }

    /**
     * Gets the position input component
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

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the reflection object output component
     */
    public get reflection(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Returns true if the block has a texture (either its own texture or the environment texture from the scene, if set)
     */
    public get hasTexture(): boolean {
        return !!this._getTexture();
    }

    /**
     * Gets the reflection color (either the name of the variable if the color input is connected, else a default value)
     */
    public get reflectionColor(): string {
        return this.color.isConnected ? this.color.associatedVariableName : "vec3(1., 1., 1.)";
    }

    protected _getTexture(): Nullable<BaseTexture> {
        if (this.texture) {
            return this.texture;
        }

        return this._scene.environmentTexture;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        const reflectionTexture = this._getTexture();
        const reflection = reflectionTexture && reflectionTexture.getTextureMatrix;

        defines.setValue("REFLECTION", reflection, true);

        if (!reflection) {
            return;
        }

        defines.setValue(this._defineLODReflectionAlpha, reflectionTexture!.lodLevelInAlpha, true);
        defines.setValue(this._defineLinearSpecularReflection, reflectionTexture!.linearSpecularLOD, true);
        defines.setValue(this._defineOppositeZ, this._scene.useRightHandedSystem ? !reflectionTexture!.invertZ : reflectionTexture!.invertZ, true);

        defines.setValue("SPHERICAL_HARMONICS", this.useSphericalHarmonics, true);
        defines.setValue("GAMMAREFLECTION", reflectionTexture!.gammaSpace, true);
        defines.setValue("RGBDREFLECTION", reflectionTexture!.isRGBD, true);

        if (reflectionTexture && reflectionTexture.coordinatesMode !== Texture.SKYBOX_MODE) {
            if (reflectionTexture.isCube) {
                defines.setValue("USESPHERICALFROMREFLECTIONMAP", true);
                defines.setValue("USEIRRADIANCEMAP", false);
                if (this.forceIrradianceInFragment || this._scene.getEngine().getCaps().maxVaryingVectors <= 8) {
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

        const reflectionTexture = this._getTexture();

        if (!reflectionTexture || !subMesh) {
            return;
        }

        if (reflectionTexture.isCube) {
            effect.setTexture(this._cubeSamplerName, reflectionTexture);
        } else {
            effect.setTexture(this._2DSamplerName, reflectionTexture);
        }

        effect.setFloat3(this._vReflectionMicrosurfaceInfosName, reflectionTexture.getSize().width, reflectionTexture.lodGenerationScale, reflectionTexture.lodGenerationOffset);

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

    /**
     * Gets the code to inject in the vertex shader
     * @param state current state of the node material building
     * @returns the shader code
     */
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

        state._emitVaryingFromString(this._vEnvironmentIrradianceName, "vec3", "defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)");

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
                vec3 ${reflectionVectorName} = vec3(${this._reflectionMatrixName} * vec4(normalize(${this.worldNormal.associatedVariableName}).xyz, 0)).xyz;
                #ifdef ${this._defineOppositeZ}
                    ${reflectionVectorName}.z *= -1.0;
                #endif
                ${this._vEnvironmentIrradianceName} = computeEnvironmentIrradiance(${reflectionVectorName});
            #endif\r\n`;

        return code;
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @param normalVarName name of the existing variable corresponding to the normal
     * @returns the shader code
     */
    public getCode(state: NodeMaterialBuildState, normalVarName: string): string {
        let code = "";

        this.handleFragmentSideInits(state);

        state._emitFunctionFromInclude("harmonicsFunctions", `//${this.name}`, {
            replaceStrings: [
                { search: /uniform vec3 vSphericalL00;[\s\S]*?uniform vec3 vSphericalL22;/g, replace: "" },
                { search: /uniform vec3 vSphericalX;[\s\S]*?uniform vec3 vSphericalZX;/g, replace: "" },
            ]
        });

        state._emitFunction("sampleReflection", `
            #ifdef ${this._define3DName}
                #define sampleReflection(s, c) textureCube(s, c)
            #else
                #define sampleReflection(s, c) texture2D(s, c)
            #endif\r\n`, `//${this.name}`);

        state._emitFunction("sampleReflectionLod", `
            #ifdef ${this._define3DName}
                #define sampleReflectionLod(s, c, l) textureCubeLodEXT(s, c, l)
            #else
                #define sampleReflectionLod(s, c, l) texture2DLodEXT(s, c, l)
            #endif\r\n`, `//${this.name}`);

        const computeReflectionCoordsFunc = `
            vec3 computeReflectionCoordsPBR(vec4 worldPos, vec3 worldNormal) {
                ${this.handleFragmentSideCodeReflectionCoords('worldNormal', 'worldPos', true)}
                return ${this._reflectionVectorName};
            }\r\n`;

        state._emitFunction("computeReflectionCoordsPBR", computeReflectionCoordsFunc, `//${this.name}`);

        this._vReflectionMicrosurfaceInfosName = state._getFreeVariableName("vReflectionMicrosurfaceInfos");

        state._emitUniformFromString(this._vReflectionMicrosurfaceInfosName, "vec3");

        this._vReflectionInfosName = state._getFreeVariableName("vReflectionInfos");

        code += `#ifdef REFLECTION
            vec2 ${this._vReflectionInfosName} = vec2(1., 0.);

            reflectionOutParams reflectionOut;

            reflectionBlock(
                ${"v_" + this.worldPosition.associatedVariableName + ".xyz"},
                ${normalVarName},
                alphaG,
                ${this._vReflectionMicrosurfaceInfosName},
                ${this._vReflectionInfosName},
                ${this.reflectionColor},
            #ifdef ANISOTROPIC
                anisotropicOut,
            #endif
            #if defined(${this._defineLODReflectionAlpha}) && !defined(${this._defineSkyboxName})
                NdotVUnclamped,
            #endif
            #ifdef ${this._defineLinearSpecularReflection}
                roughness,
            #endif
            #ifdef ${this._define3DName}
                ${this._cubeSamplerName},
            #else
                ${this._2DSamplerName},
            #endif
            #if defined(NORMAL) && defined(USESPHERICALINVERTEX)
                ${this._vEnvironmentIrradianceName},
            #endif
            #ifdef USESPHERICALFROMREFLECTIONMAP
                #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                    ${this._reflectionMatrixName},
                #endif
            #endif
            #ifdef USEIRRADIANCEMAP
                irradianceSampler, // ** not handled **
            #endif
            #ifndef LODBASEDMICROSFURACE
                #ifdef ${this._define3DName}
                    ${this._cubeSamplerName},
                    ${this._cubeSamplerName},
                #else
                    ${this._2DSamplerName},
                    ${this._2DSamplerName},
                #endif
            #endif
                reflectionOut
            );
        #endif\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        this._scene = state.sharedData.scene;

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            this._defineLODReflectionAlpha = state._getFreeDefineName("LODINREFLECTIONALPHA");
            this._defineLinearSpecularReflection = state._getFreeDefineName("LINEARSPECULARREFLECTION");
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString: string = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.useSphericalHarmonics = ${this.useSphericalHarmonics};\r\n`;
        codeString += `${this._codeVariableName}.forceIrradianceInFragment = ${this.forceIrradianceInFragment};\r\n`;

        return codeString;
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
