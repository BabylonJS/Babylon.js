import { SerializationHelper, serialize, expandToProperty } from "../../Misc/decorators";
import { EffectFallbacks } from "../../Materials/effect";
import { UniformBuffer } from "../../Materials/uniformBuffer";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { VertexBuffer } from "../../Meshes/buffer";

/**
 * @hidden
 */
export interface IMaterialAnisotropicDefines {
    ANISOTROPIC: boolean;
    MAINUV1: boolean;

    _areMiscDirty: boolean;
    _needUVs: boolean;
}

/**
 * Define the code related to the anisotropic parameters of the pbr material.
 */
export class PBRAnisotropicConfiguration {

    @serialize()
    private _isEnabled = false;
    /**
     * Defines if the anisotropy is enabled in the material.
     */
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public isEnabled = false;

    /**
     * Defines the anisotropy strength (between 0 and 1) it defaults to 1.
     */
    @serialize()
    public intensity: number = 1;

    /**
     * Defines if the effect is along the tangents or bitangents.
     * By default, the effect is "strectching" the highlights along the tangents.
     */
    @serialize()
    public followTangents = true;

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
     * @param mesh the mesh we are preparing the defines for.
     */
    public prepareDefines(defines: IMaterialAnisotropicDefines, mesh: AbstractMesh): void {
        defines.ANISOTROPIC = this._isEnabled;
        if (this._isEnabled && !mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
            defines._needUVs = true;
            defines.MAINUV1 = true;
        }
    }

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     * @param isFrozen defines wether the material is frozen or not.
     */
    public bindForSubMesh(uniformBuffer: UniformBuffer, isFrozen: boolean): void {
        if (!uniformBuffer.useUbo || !isFrozen || !uniformBuffer.isSync) {
            // Clear Coat
            uniformBuffer.updateFloat("anisotropy", this.followTangents ? this.intensity : -this.intensity);
        }
    }

    /**
    * Get the current class name of the texture useful for serialization or dynamic coding.
    * @returns "PBRAnisotropicConfiguration"
    */
    public getClassName(): string {
        return "PBRAnisotropicConfiguration";
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param anisotropicConfiguration define the config where to copy the info
     */
    public copyTo(anisotropicConfiguration: PBRAnisotropicConfiguration): void {
        SerializationHelper.Clone(() => anisotropicConfiguration, this);
    }

    /**
     * Serializes this clear coat configuration.
     * @returns - An object with the serialized config.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a Clear Coat Configuration from a serialized object.
     * @param source - Serialized object.
     */
    public parse(source: any): void {
        SerializationHelper.Parse(() => this, source, null);
    }

    /**
     * Add fallbacks to the effect fallbacks list.
     * @param defines defines the Base texture to use.
     * @param fallbacks defines the current fallback list.
     * @param currentRank defines the current fallback rank.
     * @returns the new fallback rank.
     */
    public static AddFallbacks(defines: IMaterialAnisotropicDefines, fallbacks: EffectFallbacks, currentRank: number): number {
        if (defines.ANISOTROPIC) {
            fallbacks.addFallback(currentRank++, "ANISOTROPIC");
        }
        return currentRank;
    }

    /**
     * Add the required uniforms to the current list.
     * @param uniforms defines the current uniform list.
     */
    public static AddUniforms(uniforms: string[]): void {
        uniforms.push("anisotropy");
    }

    /**
     * Add the required uniforms to the current buffer.
     * @param uniformBuffer defines the current uniform buffer.
     */
    public static PrepareUniformBuffer(uniformBuffer: UniformBuffer): void {
        uniformBuffer.addUniform("anisotropy", 1);
    }
}