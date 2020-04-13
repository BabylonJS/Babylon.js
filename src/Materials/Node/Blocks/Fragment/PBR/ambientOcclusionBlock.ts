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
import { Scene } from '../../../../../scene';

export class AmbientOcclusionBlock extends NodeMaterialBlock {

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("directLightIntensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("ambientOcclusion", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("ambientOcclusion", this, NodeMaterialConnectionPointDirection.Output, AmbientOcclusionBlock, "AOBlock"));
    }

    @editableInPropertyPage("Ambient in gray scale", PropertyTypeForEdition.Boolean, "AMBIENT", { "notifiers": { "update": true }})
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

        const aoTexture = block?.texture.isConnected ? block.texture.associatedVariableName : "vec3(0.)";
        const aoIntensity = block?.intensity.isConnected ? block.intensity.associatedVariableName : "1.";

        code += `ambientOcclusionBlock(
            #ifdef AMBIENT
                ${aoTexture},
                vec4(0., 1.0, ${aoIntensity}, 0.),
            #endif
                aoOut
            );\r\n`;

        return code;
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("AMBIENT", this.texture.isConnected);
        defines.setValue("AMBIENTINGRAYSCALE", this.useAmbientInGrayScale);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.useAmbientInGrayScale = this.useAmbientInGrayScale;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.useAmbientInGrayScale = serializationObject.useAmbientInGrayScale;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ambientOcclusionBlock"] = AmbientOcclusionBlock;