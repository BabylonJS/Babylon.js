import { serialize, SerializationHelper, serializeAsColor3, expandToProperty, serializeAsTexture } from "../../Misc/decorators";
import { Scene } from "../../scene";
import { Color3 } from "../../Maths/math.color";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { PBRBaseSimpleMaterial } from "./pbrBaseSimpleMaterial";
import { _TypeStore } from '../../Misc/typeStore';

/**
 * The PBR material of BJS following the specular glossiness convention.
 *
 * This fits to the PBR convention in the GLTF definition:
 * https://github.com/KhronosGroup/glTF/tree/2.0/extensions/Khronos/KHR_materials_pbrSpecularGlossiness
 */
export class PBRSpecularGlossinessMaterial extends PBRBaseSimpleMaterial {

    /**
     * Specifies the diffuse color of the material.
     */
    @serializeAsColor3("diffuse")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoColor")
    public diffuseColor: Color3;

    /**
     * Specifies the diffuse texture of the material. This can also contains the opcity value in its alpha
     * channel.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoTexture")
    public diffuseTexture: BaseTexture;

    /**
     * Specifies the specular color of the material. This indicates how reflective is the material (none to mirror).
     */
    @serializeAsColor3("specular")
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_reflectivityColor")
    public specularColor: Color3;

    /**
     * Specifies the glossiness of the material. This indicates "how sharp is the reflection".
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_microSurface")
    public glossiness: number;

    /**
     * Specifies both the specular color RGB and the glossiness A of the material per pixels.
     */
    @serializeAsTexture()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_reflectivityTexture")
    public specularGlossinessTexture: BaseTexture;

    /**
     * Instantiates a new PBRSpecularGlossinessMaterial instance.
     *
     * @param name The material name
     * @param scene The scene the material will be use in.
     */
    constructor(name: string, scene: Scene) {
        super(name, scene);
        this._useMicroSurfaceFromReflectivityMapAlpha = true;
    }

    /**
     * Return the currrent class name of the material.
     */
    public getClassName(): string {
        return "PBRSpecularGlossinessMaterial";
    }

    /**
     * Makes a duplicate of the current material.
     * @param name - name to use for the new material.
     */
    public clone(name: string): PBRSpecularGlossinessMaterial {
        var clone = SerializationHelper.Clone(() => new PBRSpecularGlossinessMaterial(name, this.getScene()), this);

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
        serializationObject.customType = "BABYLON.PBRSpecularGlossinessMaterial";

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
    public static Parse(source: any, scene: Scene, rootUrl: string): PBRSpecularGlossinessMaterial {
        const material = SerializationHelper.Parse(() => new PBRSpecularGlossinessMaterial(source.name, scene), source, scene, rootUrl);
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

_TypeStore.RegisteredTypes["BABYLON.PBRSpecularGlossinessMaterial"] = PBRSpecularGlossinessMaterial;
