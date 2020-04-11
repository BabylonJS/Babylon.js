import { NodeMaterial, NodeMaterialDefines } from '../../../nodeMaterial';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialBlock } from '../../../nodeMaterialBlock';
import { _TypeStore } from '../../../../../Misc/typeStore';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../nodeMaterialDecorator";
import { AbstractMesh } from '../../../../../Meshes/abstractMesh';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';

export class ReflectivityBlock extends NodeMaterialBlock {

    @editableInPropertyPage("AO from red channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW")
    public useAmbientOcclusionFromMetallicTextureRed: boolean = false;

    @editableInPropertyPage("Metallness from blue channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW")
    public useMetallnessFromMetallicTextureBlue: boolean = true;

    @editableInPropertyPage("Roughness from alpha channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW")
    public useRoughnessFromMetallicTextureAlpha: boolean = false;

    @editableInPropertyPage("Roughness from green channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW")
    public useRoughnessFromMetallicTextureGreen: boolean = true;

    @editableInPropertyPage("Metallic F0 from alpha channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW")
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
        defines.setValue("REFLECTIVITY", this.texture.isConnected);
        defines.setValue("AOSTOREINMETALMAPRED", this.useAmbientOcclusionFromMetallicTextureRed);
        defines.setValue("METALLNESSSTOREINMETALMAPBLUE", this.useMetallnessFromMetallicTextureBlue);
        defines.setValue("ROUGHNESSSTOREINMETALMAPALPHA", this.useRoughnessFromMetallicTextureAlpha);
        defines.setValue("ROUGHNESSSTOREINMETALMAPGREEN",  !this.useRoughnessFromMetallicTextureAlpha && this.useRoughnessFromMetallicTextureGreen);
        defines.setValue("METALLICF0FACTORFROMMETALLICMAP", this.useMetallicF0FactorFromMetallicTexture);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectivityBlock"] = ReflectivityBlock;
