import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { Nullable } from '../../../../types';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import { _TypeStore } from '../../../../Misc/typeStore';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { Scene } from '../../../../scene';

/**
 * Block used to implement the ambient occlusion module of the PBR material
 */
export class AmbientOcclusionBlock extends NodeMaterialBlock {

    /**
     * Create a new AmbientOcclusionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("directLightIntensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("ambientOcclusion", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("ambientOcclusion", this, NodeMaterialConnectionPointDirection.Output, AmbientOcclusionBlock, "AOBlock"));
    }

    /**
     * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
     */
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
        return "AmbientOcclusionBlock";
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the texture intensity component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the direct light intensity input component
     */
    public get directLightIntensity(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the ambient occlusion object output component
     */
    public get ambientOcclusion(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param block instance of an AmbientOcclusionBlock or null if the code must be generated without an active ambient occlusion module
     * @returns the shader code
     */
    public static GetCode(block: Nullable<AmbientOcclusionBlock>): string {
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

        defines.setValue("AMBIENT", this.texture.isConnected, true);
        defines.setValue("AMBIENTINGRAYSCALE", this.useAmbientInGrayScale, true);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString: string;

        codeString = `${this._codeVariableName}.useAmbientInGrayScale = ${this.useAmbientInGrayScale};\r\n`;

        return codeString;
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

_TypeStore.RegisteredTypes["BABYLON.AmbientOcclusionBlock"] = AmbientOcclusionBlock;