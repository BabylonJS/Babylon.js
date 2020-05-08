import { serialize, SerializationHelper, serializeAsColor3, expandToProperty, serializeAsTexture } from "../../Misc/decorators";
import { Scene } from "../../scene";
import { Color3 } from "../../Maths/math.color";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { PBRBaseSimpleMaterial } from "./pbrBaseSimpleMaterial";
import { _TypeStore } from '../../Misc/typeStore';

/**
 * The PBR material of BJS following the metal roughness convention.
 *
 * This fits to the PBR convention in the GLTF definition:
 * https://github.com/KhronosGroup/glTF/tree/2.0/specification/2.0
 */
export class PBRMetallicRoughnessMaterial extends PBRBaseSimpleMaterial {

    /**
     * The base color has two different interpretations depending on the value of metalness.
     * When the material is a metal, the base color is the specific measured reflectance value
     * at normal incidence (F0). For a non-metal the base color represents the reflected diffuse color
     * of the material.
     */
    @serializeAsColor3()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoColor")
    public baseColor: Color3;

    /**
     * Base texture of the metallic workflow. It contains both the baseColor information in RGB as
     * well as opacity information in the alpha channel.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoTexture")
    public baseTexture: BaseTexture;

    /**
     * Specifies the metallic scalar value of the material.
     * Can also be used to scale the metalness values of the metallic texture.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public metallic: number;

    /**
     * Specifies the roughness scalar value of the material.
     * Can also be used to scale the roughness values of the metallic texture.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public roughness: number;

    /**
     * Texture containing both the metallic value in the B channel and the
     * roughness value in the G channel to keep better precision.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_metallicTexture")
    public metallicRoughnessTexture: BaseTexture;

    /**
     * Instantiates a new PBRMetalRoughnessMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     */
    constructor(name: string, scene: Scene) {
        super(name, scene);
        this._useRoughnessFromMetallicTextureAlpha = false;
        this._useRoughnessFromMetallicTextureGreen = true;
        this._useMetallnessFromMetallicTextureBlue = true;
        this.metallic = 1.0;
        this.roughness = 1.0;
    }

    /**
     * Return the currrent class name of the material.
     */
    public getClassName(): string {
        return "PBRMetallicRoughnessMaterial";
    }

    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     */
    public clone(name: string): PBRMetallicRoughnessMaterial {
        var clone = SerializationHelper.Clone(() => new PBRMetallicRoughnessMaterial(name, this.getScene()), this);

        clone.id = name;
        clone.name = name;

        this.clearCoat.copyTo(clone.clearCoat);
        this.anisotropy.copyTo(clone.anisotropy);
        this.brdf.copyTo(clone.brdf);
        this.sheen.copyTo(clone.sheen);
        this.subSurface.copyTo(clone.subSurface);

        return clone;
    }

    /**
     * Serialize the material to a parsable JSON object.
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.PBRMetallicRoughnessMaterial";

        serializationObject.clearCoat = this.clearCoat.serialize();
        serializationObject.anisotropy = this.anisotropy.serialize();
        serializationObject.brdf = this.brdf.serialize();
        serializationObject.sheen = this.sheen.serialize();
        serializationObject.subSurface = this.subSurface.serialize();

        return serializationObject;
    }

    /**
     * Parses a JSON object correponding to the serialize function.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): PBRMetallicRoughnessMaterial {
        const material = SerializationHelper.Parse(() => new PBRMetallicRoughnessMaterial(source.name, scene), source, scene, rootUrl);
        if (source.clearCoat) {
            material.clearCoat.parse(source.clearCoat, scene, rootUrl);
        }
        if (source.anisotropy) {
            material.anisotropy.parse(source.anisotropy, scene, rootUrl);
        }
        if (source.brdf) {
            material.brdf.parse(source.brdf, scene, rootUrl);
        }
        if (source.sheen) {
            material.sheen.parse(source.sheen, scene, rootUrl);
        }
        if (source.subSurface) {
            material.subSurface.parse(source.subSurface, scene, rootUrl);
        }
        return material;
    }
}

_TypeStore.RegisteredTypes["BABYLON.PBRMetallicRoughnessMaterial"] = PBRMetallicRoughnessMaterial;
