import { NodeMaterial, NodeMaterialDefines } from '../../../nodeMaterial';
import { _TypeStore } from '../../../../../Misc/typeStore';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../nodeMaterialDecorator";
import { AbstractMesh } from '../../../../../Meshes/abstractMesh';
import { TextureBlock } from '../../Dual/textureBlock';
import { Nullable } from '../../../../../types';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';

export class MetallicRoughnessTextureBlock extends TextureBlock {

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
     * Create a new MetallicRoughnessTextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._outputs = [];

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Neutral, new NodeMaterialConnectionPointCustomObject("rgba", this, NodeMaterialConnectionPointDirection.Output, MetallicRoughnessTextureBlock, "MetallicRoughnessTextureBlock", "metalRoughText"));
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MetallicRoughnessTextureBlock";
    }

    /**
     * Gets the rgba output component
     */
    public get metalRoughTexture(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        defines.setValue("AOSTOREINMETALMAPRED", this.useAmbientOcclusionFromMetallicTextureRed);
        defines.setValue("METALLNESSSTOREINMETALMAPBLUE", this.useMetallnessFromMetallicTextureBlue);
        defines.setValue("ROUGHNESSSTOREINMETALMAPALPHA", this.useRoughnessFromMetallicTextureAlpha);
        defines.setValue("ROUGHNESSSTOREINMETALMAPGREEN",  !this.useRoughnessFromMetallicTextureAlpha && this.useRoughnessFromMetallicTextureGreen);
        defines.setValue("METALLICF0FACTORFROMMETALLICMAP", this.useMetallicF0FactorFromMetallicTexture);
    }

    public static getCode(block: Nullable<MetallicRoughnessTextureBlock>, metallicVarName: string, roughnessVarName: string, aoIntensityVarName: string): string {
        const metalRoughTexture = block?.metalRoughTexture.connectedBlocks && block?.metalRoughTexture.connectedBlocks.length > 0 ? block.metalRoughTexture.associatedVariableName : null;

        let code = `vec3 baseColor = surfaceAlbedo;\r\nreflectivityOutParams reflectivityOut;\r\n`;

        code += `reflectivityBlock(
            vec4(${metallicVarName}, ${roughnessVarName}, 0., 0.04),
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
}

_TypeStore.RegisteredTypes["BABYLON.MetallicRoughnessTextureBlock"] = MetallicRoughnessTextureBlock;
