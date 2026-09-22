import {
    getMaterialFamily,
    getPbrAnisotropy,
    getPbrClearCoat,
    getPbrIridescence,
    getPbrMetallicReflectance,
    getPbrSheen,
    getPbrSubsurface,
    getPbrTransmission,
    getShaderTexture,
    getStandardAmbientTexture,
    getStandardBumpTexture,
    getStandardEmissiveTexture,
    getStandardLightmapTexture,
    getStandardOpacityTexture,
    getStandardReflectionCubeTexture,
    getStandardReflectionTexture,
    getStandardSpecularTexture,
    type Material,
    type NodeMaterial,
    type PbrMaterialProps,
    type ShaderMaterial,
    type StandardMaterialProps,
} from "@babylonjs/lite";

/** One Inspector-owned canonical texture edge used by the resource index. @internal */
export interface ILiteMaterialTopologyBinding {
    readonly id: string;
    readonly entity: object;
}

function Add(bindings: ILiteMaterialTopologyBinding[], id: string, entity: object | null | undefined): void {
    if (entity) {
        bindings.push({ id, entity });
    }
}

function GetStandardBindings(material: StandardMaterialProps): readonly ILiteMaterialTopologyBinding[] {
    const bindings: ILiteMaterialTopologyBinding[] = [];
    Add(bindings, "standard.diffuse", material.diffuseTexture);
    Add(bindings, "standard.emissive", getStandardEmissiveTexture(material));
    Add(bindings, "standard.bump", getStandardBumpTexture(material));
    Add(bindings, "standard.specular", getStandardSpecularTexture(material));
    Add(bindings, "standard.ambient", getStandardAmbientTexture(material));
    Add(bindings, "standard.lightmap", getStandardLightmapTexture(material));
    Add(bindings, "standard.opacity", getStandardOpacityTexture(material));
    Add(bindings, "standard.reflection2d", getStandardReflectionTexture(material));
    Add(bindings, "standard.reflectionCube", getStandardReflectionCubeTexture(material));
    return bindings;
}

function GetPbrBindings(material: PbrMaterialProps): readonly ILiteMaterialTopologyBinding[] {
    const bindings: ILiteMaterialTopologyBinding[] = [];
    Add(bindings, "pbr.baseColor", material.baseColorTexture);
    Add(bindings, "pbr.normal", material.normalTexture);
    Add(bindings, "pbr.orm", material.ormTexture);
    Add(bindings, "pbr.occlusion", material.occlusionTexture);
    Add(bindings, "pbr.emissive", material.emissiveTexture);
    Add(bindings, "pbr.specGloss", material.specGlossTexture);
    Add(bindings, "pbr.lightmap", material.lightmapTexture);

    const metallicReflectance = getPbrMetallicReflectance(material);
    Add(bindings, "pbr.metallicReflectance", metallicReflectance?.texture);
    Add(bindings, "pbr.reflectance", metallicReflectance?.reflectanceTexture);

    const clearCoat = getPbrClearCoat(material);
    Add(bindings, "pbr.clearCoat", clearCoat?.texture);
    Add(bindings, "pbr.clearCoatRoughness", clearCoat?.roughnessTexture);
    Add(bindings, "pbr.clearCoatBump", clearCoat?.bumpTexture);

    const sheen = getPbrSheen(material);
    Add(bindings, "pbr.sheen", sheen?.texture);
    Add(bindings, "pbr.sheenRoughness", sheen?.roughnessTexture);

    const iridescence = getPbrIridescence(material);
    Add(bindings, "pbr.iridescence", iridescence?.texture);
    Add(bindings, "pbr.iridescenceThickness", iridescence?.thicknessTexture);
    Add(bindings, "pbr.anisotropy", getPbrAnisotropy(material)?.texture);

    const subsurface = getPbrSubsurface(material);
    Add(bindings, "pbr.translucencyColor", subsurface?.translucency?.colorTexture);
    Add(bindings, "pbr.translucencyIntensity", subsurface?.translucency?.intensityTexture);
    Add(bindings, "pbr.thickness", subsurface?.thickness?.texture);
    Add(bindings, "pbr.transmission", getPbrTransmission(material)?.texture);
    return bindings;
}

function GetShaderBindings(material: ShaderMaterial): readonly ILiteMaterialTopologyBinding[] {
    const bindings: ILiteMaterialTopologyBinding[] = [];
    for (const declaration of material.samplerDecls) {
        Add(bindings, `shader.sampler:${declaration.name}`, getShaderTexture(material, declaration.name));
    }
    return bindings;
}

function GetNodeBindings(material: NodeMaterial): readonly ILiteMaterialTopologyBinding[] {
    const bindings: ILiteMaterialTopologyBinding[] = [];
    for (const [name, input] of Object.entries(material.inputs)) {
        if (input.type === "texture2d") {
            Add(bindings, `node.texture:${name}`, input.texture);
        }
    }
    return bindings;
}

/**
 * Builds canonical topology edges without retaining any UI descriptor implementation.
 * @param material The exact source material.
 * @returns Texture edges in canonical family order.
 * @internal
 */
export function GetLiteMaterialTopologyBindings(material: Material): readonly ILiteMaterialTopologyBinding[] {
    switch (getMaterialFamily(material)) {
        case "standard":
            return GetStandardBindings(material as StandardMaterialProps);
        case "pbr":
            return GetPbrBindings(material as PbrMaterialProps);
        case "shader":
            return GetShaderBindings(material as ShaderMaterial);
        case "node":
            return GetNodeBindings(material as NodeMaterial);
        default:
            return [];
    }
}
