import { SerializationHelper, serialize, expandToProperty } from "../../Misc/decorators";
import { Scene } from '../../scene';

/**
 * @hidden
 */
export interface IMaterialBRDFDefines {
    BRDF_V_HEIGHT_CORRELATED: boolean;
    MS_BRDF_ENERGY_CONSERVATION: boolean;
    SPHERICAL_HARMONICS: boolean;
    SPECULAR_GLOSSINESS_ENERGY_CONSERVATION: boolean;

    /** @hidden */
    _areMiscDirty: boolean;
}

/**
 * Define the code related to the BRDF parameters of the pbr material.
 */
export class PBRBRDFConfiguration {

    /**
     * Default value used for the energy conservation.
     * This should only be changed to adapt to the type of texture in scene.environmentBRDFTexture.
     */
    public static DEFAULT_USE_ENERGY_CONSERVATION = true;

    /**
     * Default value used for the Smith Visibility Height Correlated mode.
     * This should only be changed to adapt to the type of texture in scene.environmentBRDFTexture.
     */
    public static DEFAULT_USE_SMITH_VISIBILITY_HEIGHT_CORRELATED = true;

    /**
     * Default value used for the IBL diffuse part.
     * This can help switching back to the polynomials mode globally which is a tiny bit
     * less GPU intensive at the drawback of a lower quality.
     */
    public static DEFAULT_USE_SPHERICAL_HARMONICS = true;

    /**
     * Default value used for activating energy conservation for the specular workflow.
     * If activated, the albedo color is multiplied with (1. - maxChannel(specular color)).
     * If deactivated, a material is only physically plausible, when (albedo color + specular color) < 1.
     */
    public static DEFAULT_USE_SPECULAR_GLOSSINESS_INPUT_ENERGY_CONSERVATION = true;

    private _useEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_ENERGY_CONSERVATION;
    /**
     * Defines if the material uses energy conservation.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public useEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_ENERGY_CONSERVATION;

    private _useSmithVisibilityHeightCorrelated = PBRBRDFConfiguration.DEFAULT_USE_SMITH_VISIBILITY_HEIGHT_CORRELATED;
    /**
     * LEGACY Mode set to false
     * Defines if the material uses height smith correlated visibility term.
     * If you intent to not use our default BRDF, you need to load a separate BRDF Texture for the PBR
     * You can either load https://assets.babylonjs.com/environments/uncorrelatedBRDF.png
     * or https://assets.babylonjs.com/environments/uncorrelatedBRDF.dds to have more precision
     * Not relying on height correlated will also disable energy conservation.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public useSmithVisibilityHeightCorrelated = PBRBRDFConfiguration.DEFAULT_USE_SMITH_VISIBILITY_HEIGHT_CORRELATED;

    private _useSphericalHarmonics = PBRBRDFConfiguration.DEFAULT_USE_SPHERICAL_HARMONICS;
    /**
     * LEGACY Mode set to false
     * Defines if the material uses spherical harmonics vs spherical polynomials for the
     * diffuse part of the IBL.
     * The harmonics despite a tiny bigger cost has been proven to provide closer results
     * to the ground truth.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public useSphericalHarmonics = PBRBRDFConfiguration.DEFAULT_USE_SPHERICAL_HARMONICS;

    private _useSpecularGlossinessInputEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_SPECULAR_GLOSSINESS_INPUT_ENERGY_CONSERVATION;
    /**
     * Defines if the material uses energy conservation, when the specular workflow is active.
     * If activated, the albedo color is multiplied with (1. - maxChannel(specular color)).
     * If deactivated, a material is only physically plausible, when (albedo color + specular color) < 1.
     * In the deactivated case, the material author has to ensure energy conservation, for a physically plausible rendering.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public useSpecularGlossinessInputEnergyConservation = PBRBRDFConfiguration.DEFAULT_USE_SPECULAR_GLOSSINESS_INPUT_ENERGY_CONSERVATION;

    /** @hidden */
    private _internalMarkAllSubMeshesAsMiscDirty: () => void;

    /** @hidden */
    public _markAllSubMeshesAsMiscDirty(): void {
        this._internalMarkAllSubMeshesAsMiscDirty();
    }

    /**
     * Instantiate a new istance of clear coat configuration.
     * @param markAllSubMeshesAsMiscDirty Callback to flag the material to dirty
     */
    constructor(markAllSubMeshesAsMiscDirty: () => void) {
        this._internalMarkAllSubMeshesAsMiscDirty = markAllSubMeshesAsMiscDirty;
    }

    /**
     * Checks to see if a texture is used in the material.
     * @param defines the list of "defines" to update.
     */
    public prepareDefines(defines: IMaterialBRDFDefines): void {
        defines.BRDF_V_HEIGHT_CORRELATED = this._useSmithVisibilityHeightCorrelated;
        defines.MS_BRDF_ENERGY_CONSERVATION = this._useEnergyConservation && this._useSmithVisibilityHeightCorrelated;
        defines.SPHERICAL_HARMONICS = this._useSphericalHarmonics;
        defines.SPECULAR_GLOSSINESS_ENERGY_CONSERVATION = this._useSpecularGlossinessInputEnergyConservation;
    }

    /**
    * Get the current class name of the texture useful for serialization or dynamic coding.
    * @returns "PBRClearCoatConfiguration"
    */
    public getClassName(): string {
        return "PBRBRDFConfiguration";
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param brdfConfiguration define the config where to copy the info
     */
    public copyTo(brdfConfiguration: PBRBRDFConfiguration): void {
        SerializationHelper.Clone(() => brdfConfiguration, this);
    }

    /**
     * Serializes this BRDF configuration.
     * @returns - An object with the serialized config.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a anisotropy Configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    public parse(source: any, scene: Scene, rootUrl: string): void {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}