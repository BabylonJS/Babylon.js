import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { _TypeStore } from '../../../../Misc/typeStore';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { Scene } from '../../../../scene';

export class ReflectivityBlock extends NodeMaterialBlock {

    @editableInPropertyPage("AO from red channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useAmbientOcclusionFromMetallicTextureRed: boolean = false;

    @editableInPropertyPage("Metallness from blue channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useMetallnessFromMetallicTextureBlue: boolean = true;

    @editableInPropertyPage("Roughness from alpha channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useRoughnessFromMetallicTextureAlpha: boolean = false;

    @editableInPropertyPage("Roughness from green channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useRoughnessFromMetallicTextureGreen: boolean = true;

    @editableInPropertyPage("Metallic F0 from alpha channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useMetallicF0FactorFromMetallicTexture: boolean = false;

    /**
     * Create a new ReflectivityBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("metallic", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("reflectivity", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflectivity", this, NodeMaterialConnectionPointDirection.Output, ReflectivityBlock, "ReflectivityBlock"));
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("baseColor");
        state._excludeVariableName("reflectivityOut");
        state._excludeVariableName("microSurface");
        state._excludeVariableName("roughness");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReflectivityBlock";
    }

    public get metallic(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the reflectivity output component
     */
    public get reflectivity(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public getCode(aoIntensityVarName: string): string {
        const metalRoughTexture = this.texture.isConnected ? this.texture.connectedPoint?.associatedVariableName : null;

        let code = `vec3 baseColor = surfaceAlbedo;\r\nreflectivityOutParams reflectivityOut;\r\n`;

        code += `reflectivityBlock(
            vec4(${this.metallic.associatedVariableName}, ${this.roughness.associatedVariableName}, 0., 0.04),
        #ifdef METALLICWORKFLOW
            surfaceAlbedo,
        #endif
        #ifdef REFLECTIVITY
            vec3(0., 0., ${aoIntensityVarName}),
            ${metalRoughTexture},
        #endif
        #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
            aoOut.ambientOcclusionColor,
        #endif
        #ifdef MICROSURFACEMAP
            microSurfaceTexel, <== not handled!
        #endif
            reflectivityOut
        );

        float microSurface = reflectivityOut.microSurface;
        float roughness = reflectivityOut.roughness;

        #ifdef METALLICWORKFLOW
            surfaceAlbedo = reflectivityOut.surfaceAlbedo;
        #endif
        #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY) && defined(AOSTOREINMETALMAPRED)
            aoOut.ambientOcclusionColor = reflectivityOut.ambientOcclusionColor;
        #endif\r\n`;

        return code;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("REFLECTIVITY", this.texture.isConnected);
        defines.setValue("AOSTOREINMETALMAPRED", this.useAmbientOcclusionFromMetallicTextureRed);
        defines.setValue("METALLNESSSTOREINMETALMAPBLUE", this.useMetallnessFromMetallicTextureBlue);
        defines.setValue("ROUGHNESSSTOREINMETALMAPALPHA", this.useRoughnessFromMetallicTextureAlpha);
        defines.setValue("ROUGHNESSSTOREINMETALMAPGREEN",  !this.useRoughnessFromMetallicTextureAlpha && this.useRoughnessFromMetallicTextureGreen);
        defines.setValue("METALLICF0FACTORFROMMETALLICMAP", this.useMetallicF0FactorFromMetallicTexture);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString: string = "";

        codeString += `${this._codeVariableName}.useAmbientOcclusionFromMetallicTextureRed = ${this.useAmbientOcclusionFromMetallicTextureRed};\r\n`;
        codeString += `${this._codeVariableName}.useMetallnessFromMetallicTextureBlue = ${this.useMetallnessFromMetallicTextureBlue};\r\n`;
        codeString += `${this._codeVariableName}.useRoughnessFromMetallicTextureAlpha = ${this.useRoughnessFromMetallicTextureAlpha};\r\n`;
        codeString += `${this._codeVariableName}.useRoughnessFromMetallicTextureGreen = ${this.useRoughnessFromMetallicTextureGreen};\r\n`;
        codeString += `${this._codeVariableName}.useMetallicF0FactorFromMetallicTexture = ${this.useMetallicF0FactorFromMetallicTexture};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.useAmbientOcclusionFromMetallicTextureRed = this.useAmbientOcclusionFromMetallicTextureRed;
        serializationObject.useMetallnessFromMetallicTextureBlue = this.useMetallnessFromMetallicTextureBlue;
        serializationObject.useRoughnessFromMetallicTextureAlpha = this.useRoughnessFromMetallicTextureAlpha;
        serializationObject.useRoughnessFromMetallicTextureGreen = this.useRoughnessFromMetallicTextureGreen;
        serializationObject.useMetallicF0FactorFromMetallicTexture = this.useMetallicF0FactorFromMetallicTexture;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.useAmbientOcclusionFromMetallicTextureRed = serializationObject.useAmbientOcclusionFromMetallicTextureRed;
        this.useMetallnessFromMetallicTextureBlue = serializationObject.useMetallnessFromMetallicTextureBlue;
        this.useRoughnessFromMetallicTextureAlpha = serializationObject.useRoughnessFromMetallicTextureAlpha;
        this.useRoughnessFromMetallicTextureGreen = serializationObject.useRoughnessFromMetallicTextureGreen;
        this.useMetallicF0FactorFromMetallicTexture = serializationObject.useMetallicF0FactorFromMetallicTexture;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectivityBlock"] = ReflectivityBlock;
