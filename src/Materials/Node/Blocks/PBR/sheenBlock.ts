import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { ReflectionBlock } from './reflectionBlock';
import { Scene } from '../../../../scene';
import { Nullable } from '../../../../types';

/**
 * Block used to implement the sheen module of the PBR material
 */
export class SheenBlock extends NodeMaterialBlock {

    /**
     * Create a new SheenBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("sheen", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("sheen", this, NodeMaterialConnectionPointDirection.Output, SheenBlock, "SheenBlock"));
    }

    /**
     * If true, the sheen effect is layered above the base BRDF with the albedo-scaling technique.
     * It allows the strength of the sheen effect to not depend on the base color of the material,
     * making it easier to setup and tweak the effect
     */
    @editableInPropertyPage("Albedo scaling", PropertyTypeForEdition.Boolean, "PROPERTIES", { "notifiers": { "update": true }})
    public albedoScaling: boolean = false;

    /**
     * Defines if the sheen is linked to the sheen color.
     */
    @editableInPropertyPage("Link sheen with albedo", PropertyTypeForEdition.Boolean, "PROPERTIES", { "notifiers": { "update": true }})
    public linkSheenWithAlbedo: boolean = false;

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("sheenOut");
        state._excludeVariableName("sheenMapData");
        state._excludeVariableName("vSheenColor");
        state._excludeVariableName("vSheenRoughness");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SheenBlock";
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the roughness input component
     */
    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the sheen object output component
     */
    public get sheen(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("SHEEN", true);
        defines.setValue("SHEEN_LINKWITHALBEDO", this.linkSheenWithAlbedo, true);
        defines.setValue("SHEEN_ROUGHNESS", this.roughness.isConnected, true);
        defines.setValue("SHEEN_ALBEDOSCALING", this.albedoScaling, true);
        defines.setValue("SHEEN_TEXTURE", this.texture.isConnected, true);
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param reflectionBlock instance of a ReflectionBlock null if the code must be generated without an active reflection module
     * @returns the shader code
     */
    public getCode(reflectionBlock: Nullable<ReflectionBlock>): string {
        let code = "";

        const color = this.color.isConnected ? this.color.associatedVariableName : "vec3(1.)";
        const intensity = this.intensity.isConnected ? this.intensity.associatedVariableName : "1.";
        const roughness = this.roughness.isConnected ? this.roughness.associatedVariableName : "0.";
        const texture = this.texture.isConnected ? this.texture.associatedVariableName : "vec4(0.)";

        code = `#ifdef SHEEN
            sheenOutParams sheenOut;

            vec4 vSheenColor = vec4(${color}, ${intensity});

            sheenBlock(
                vSheenColor,
            #ifdef SHEEN_ROUGHNESS
                ${roughness},
            #endif
                roughness,
            #ifdef SHEEN_TEXTURE
                ${texture},
            #endif
                reflectance,
            #ifdef SHEEN_LINKWITHALBEDO
                baseColor,
                surfaceAlbedo,
            #endif
            #ifdef ENVIRONMENTBRDF
                NdotV,
                environmentBrdf,
            #endif
            #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
                AARoughnessFactors,
                ${reflectionBlock?._vReflectionMicrosurfaceInfosName},
                ${reflectionBlock?._vReflectionInfosName},
                ${reflectionBlock?.reflectionColor},
                vLightingIntensity,
                #ifdef ${reflectionBlock?._define3DName}
                    ${reflectionBlock?._cubeSamplerName},
                #else
                    ${reflectionBlock?._2DSamplerName},
                #endif
                reflectionOut.reflectionCoords,
                NdotVUnclamped,
                #ifndef LODBASEDMICROSFURACE
                    #ifdef ${reflectionBlock?._define3DName}
                        ${reflectionBlock?._cubeSamplerName},
                        ${reflectionBlock?._cubeSamplerName},
                    #else
                        ${reflectionBlock?._2DSamplerName},
                        ${reflectionBlock?._2DSamplerName},
                    #endif
                #endif
                #if !defined(${reflectionBlock?._defineSkyboxName}) && defined(RADIANCEOCCLUSION)
                    seo,
                #endif
                #if !defined(${reflectionBlock?._defineSkyboxName}) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(${reflectionBlock?._define3DName})
                    eho,
                #endif
            #endif
                sheenOut
            );

            #ifdef SHEEN_LINKWITHALBEDO
                surfaceAlbedo = sheenOut.surfaceAlbedo;
            #endif
        #endif\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString: string = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.albedoScaling = ${this.albedoScaling};\r\n`;
        codeString += `${this._codeVariableName}.linkSheenWithAlbedo = ${this.linkSheenWithAlbedo};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.albedoScaling = this.albedoScaling;
        serializationObject.linkSheenWithAlbedo = this.linkSheenWithAlbedo;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.albedoScaling = serializationObject.albedoScaling;
        this.linkSheenWithAlbedo = serializationObject.linkSheenWithAlbedo;
    }
}

_TypeStore.RegisteredTypes["BABYLON.SheenBlock"] = SheenBlock;