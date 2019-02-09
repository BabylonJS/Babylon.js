import { SerializationHelper, serialize, expandToProperty } from "../../Misc/decorators";

/**
 * @hidden
 */
export interface IMaterialBRDFDefines {
    BRDF_V_HEIGHT_CORRELATED: boolean;
    MS_BRDF_ENERGY_CONSERVATION: boolean;

    /** @hidden */
    _areMiscDirty: boolean;
}

/**
 * Define the code related to the BRDF parameters of the pbr material.
 */
export class PBRBRDFConfiguration {

    @serialize()
    private _useEnergyConservation = true;
    /**
     * Defines if the material uses energy conservation.
     */
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public useEnergyConservation = true;

    @serialize()
    private _useSmithVisibilityHeightCorrelated = true;
    /**
     * LEGACY Mode set to false
     * Defines if the material uses height smith correlated visibility term.
     * If you intent to not use our default BRDF, you need to load a separate BRDF Texture for the PBR
     * You can either load https://assets.babylonjs.com/environments/uncorrelatedBRDF.png
     * or https://assets.babylonjs.com/environments/uncorrelatedBRDF.dds to have more precision
     * Not relying on height correlated will also disable energy conservation.
     */
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public useSmithVisibilityHeightCorrelated = true;

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
    }

    /**
    * Get the current class name of the texture useful for serialization or dynamic coding.
    * @returns "PBRClearCoatConfiguration"
    */
    public getClassName(): string {
        return "PBRClearCoatConfiguration";
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
     * Parses a BRDF Configuration from a serialized object.
     * @param source - Serialized object.
     */
    public parse(source: any): void {
        SerializationHelper.Parse(() => this, source, null);
    }
}