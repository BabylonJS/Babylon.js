import { NodeMaterialBlock } from '../../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../../nodeMaterial';
import { Nullable } from '../../../../../types';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../nodeMaterialDecorator";
import { _TypeStore } from '../../../../../Misc/typeStore';
import { AbstractMesh } from '../../../../../Meshes/abstractMesh';
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";

export class AmbientOcclusionBlock extends NodeMaterialBlock {

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("directLightIntensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("ambientOcclusion", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("ambientOcclusion", this, NodeMaterialConnectionPointDirection.Output, AmbientOcclusionBlock, "AOBlock"));
    }

    @editableInPropertyPage("Ambient in gray scale", PropertyTypeForEdition.Boolean, "AMBIENT")
    public useAmbientInGrayScale: boolean = false;

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("aoOut");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ambientOcclusionBlock";
    }

    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    public get directLightIntensity(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get ambientOcclusion(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public static getCode(block: Nullable<AmbientOcclusionBlock>): string {
        let code = `ambientOcclusionOutParams aoOut;\r\n`;

        const aoTexture = block?.texture.isConnected ? block.texture.associatedVariableName : "vec2(0., 0.)";
        const aoLevel = "1.";
        const aoIntensity = block?.intensity.isConnected ? block.intensity.associatedVariableName : "1.";

        code += `ambientOcclusionBlock(
            #ifdef AMBIENT
                ${aoTexture},
                vec4(0., ${aoLevel}, ${aoIntensity}, 0.),
            #endif
                aoOut
            );\r\n`;

        return code;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        defines.setValue("AMBIENTINGRAYSCALE", this.useAmbientInGrayScale);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ambientOcclusionBlock"] = AmbientOcclusionBlock;