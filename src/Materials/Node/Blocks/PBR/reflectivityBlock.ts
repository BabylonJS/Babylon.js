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
import { Nullable } from '../../../../types';
import { Color3 } from '../../../../Maths/math.color';
import { TmpColors } from '../../../../Maths/math.color';
import { Mesh } from '../../../../Meshes/mesh';
import { SubMesh } from '../../../../Meshes/subMesh';
import { Effect } from '../../../effect';

/**
 * Block used to implement the reflectivity module of the PBR material
 */
export class ReflectivityBlock extends NodeMaterialBlock {

    private _metallicReflectanceColor: Color3 = Color3.White();
    private _metallicF0Factor = 1;

    /** @hidden */
    public _vMetallicReflectanceFactorsName: string;

    /**
     * The property below is set by the main PBR block prior to calling methods of this class.
    */

    /** @hidden */
    public indexOfRefractionConnectionPoint: Nullable<NodeMaterialConnectionPoint>;

    /**
     * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
     */
    @editableInPropertyPage("AO from red channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useAmbientOcclusionFromMetallicTextureRed: boolean = false;

    /**
     * Specifies if the metallic texture contains the metallness information in its blue channel.
     */
    @editableInPropertyPage("Metallness from blue channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useMetallnessFromMetallicTextureBlue: boolean = true;

    /**
     * Specifies if the metallic texture contains the roughness information in its alpha channel.
     */
    @editableInPropertyPage("Roughness from alpha channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useRoughnessFromMetallicTextureAlpha: boolean = false;

    /**
     * Specifies if the metallic texture contains the roughness information in its green channel.
     */
    @editableInPropertyPage("Roughness from green channel", PropertyTypeForEdition.Boolean, "METALLIC WORKFLOW", { "notifiers": { "update": true }})
    public useRoughnessFromMetallicTextureGreen: boolean = true;

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

        this.registerOutput("reflectivity", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("reflectivity", this, NodeMaterialConnectionPointDirection.Output, ReflectivityBlock, "ReflectivityBlock"));
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

    /**
     * Gets the metallic input component
     */
    public get metallic(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the roughness input component
     */
    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the reflectivity object output component
     */
    public get reflectivity(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh, subMesh?: SubMesh) {
        super.bind(effect, nodeMaterial, mesh);

        const outside_ior = 1; // consider air as clear coat and other layers would remap in the shader.
        const ior = this.indexOfRefractionConnectionPoint?.connectInputBlock?.value ?? 1.5;

        // We are here deriving our default reflectance from a common value for none metallic surface.
        // Based of the schlick fresnel approximation model
        // for dielectrics.
        const f0 = Math.pow((ior - outside_ior) / (ior + outside_ior), 2);

        // Tweak the default F0 and F90 based on our given setup
        this._metallicReflectanceColor.scaleToRef(f0 * this._metallicF0Factor, TmpColors.Color3[0]);
        const metallicF90 = this._metallicF0Factor;

        effect.setColor4(this._vMetallicReflectanceFactorsName, TmpColors.Color3[0], metallicF90);
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @param aoIntensityVarName name of the variable with the ambient occlusion intensity
     * @returns the shader code
     */
    public getCode(state: NodeMaterialBuildState, aoIntensityVarName: string): string {
        const metalRoughTexture = this.texture.isConnected ? this.texture.connectedPoint?.associatedVariableName : null;

        this._vMetallicReflectanceFactorsName = state._getFreeVariableName("vMetallicReflectanceFactors");

        state._emitUniformFromString(this._vMetallicReflectanceFactorsName, "vec4");

        // note: metallic F0 factor = 1
        let code = `vec3 baseColor = surfaceAlbedo;
            reflectivityOutParams reflectivityOut;

            reflectivityBlock(
                vec4(${this.metallic.associatedVariableName}, ${this.roughness.associatedVariableName}, 0., 0.),
            #ifdef METALLICWORKFLOW
                surfaceAlbedo,
                ${this._vMetallicReflectanceFactorsName},
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

        defines.setValue("REFLECTIVITY", this.texture.isConnected, true);
        defines.setValue("AOSTOREINMETALMAPRED", this.useAmbientOcclusionFromMetallicTextureRed, true);
        defines.setValue("METALLNESSSTOREINMETALMAPBLUE", this.useMetallnessFromMetallicTextureBlue, true);
        defines.setValue("ROUGHNESSSTOREINMETALMAPALPHA", this.useRoughnessFromMetallicTextureAlpha, true);
        defines.setValue("ROUGHNESSSTOREINMETALMAPGREEN",  !this.useRoughnessFromMetallicTextureAlpha && this.useRoughnessFromMetallicTextureGreen, true);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
            state.sharedData.bindableBlocks.push(this);
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString: string = "";

        codeString += `${this._codeVariableName}.useAmbientOcclusionFromMetallicTextureRed = ${this.useAmbientOcclusionFromMetallicTextureRed};\r\n`;
        codeString += `${this._codeVariableName}.useMetallnessFromMetallicTextureBlue = ${this.useMetallnessFromMetallicTextureBlue};\r\n`;
        codeString += `${this._codeVariableName}.useRoughnessFromMetallicTextureAlpha = ${this.useRoughnessFromMetallicTextureAlpha};\r\n`;
        codeString += `${this._codeVariableName}.useRoughnessFromMetallicTextureGreen = ${this.useRoughnessFromMetallicTextureGreen};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.useAmbientOcclusionFromMetallicTextureRed = this.useAmbientOcclusionFromMetallicTextureRed;
        serializationObject.useMetallnessFromMetallicTextureBlue = this.useMetallnessFromMetallicTextureBlue;
        serializationObject.useRoughnessFromMetallicTextureAlpha = this.useRoughnessFromMetallicTextureAlpha;
        serializationObject.useRoughnessFromMetallicTextureGreen = this.useRoughnessFromMetallicTextureGreen;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.useAmbientOcclusionFromMetallicTextureRed = serializationObject.useAmbientOcclusionFromMetallicTextureRed;
        this.useMetallnessFromMetallicTextureBlue = serializationObject.useMetallnessFromMetallicTextureBlue;
        this.useRoughnessFromMetallicTextureAlpha = serializationObject.useRoughnessFromMetallicTextureAlpha;
        this.useRoughnessFromMetallicTextureGreen = serializationObject.useRoughnessFromMetallicTextureGreen;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectivityBlock"] = ReflectivityBlock;
