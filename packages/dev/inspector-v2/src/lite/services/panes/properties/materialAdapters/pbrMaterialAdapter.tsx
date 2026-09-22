import { type MaterialInspectionPropertyId, type MaterialInspectionSection, type MaterialTextureBinding } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { LiteMaterialAdapterSection, type LiteMaterialAdapterProps } from "./materialAdapterCore";

const ColorProperties = new Set<MaterialInspectionPropertyId>([
    "pbr.baseColorFactor",
    "pbr.emissiveColor",
    "pbr.metallicReflectanceColor",
    "pbr.sheen.color",
    "pbr.translucency.color",
    "pbr.translucency.diffusionDistance",
    "pbr.tint.color",
    "pbr.mode.unlitColor",
    "pbr.mode.shadowOnlyColor",
]);

function GetBindingSection(binding: MaterialTextureBinding): MaterialInspectionSection {
    if (binding.id === "pbr.lightmap") {
        return "lightmap";
    }
    if (binding.id === "pbr.metallicReflectance" || binding.id === "pbr.reflectance") {
        return "metallic-reflectance";
    }
    if (binding.id.startsWith("pbr.clearCoat")) {
        return "clear-coat";
    }
    if (binding.id.startsWith("pbr.sheen")) {
        return "sheen";
    }
    if (binding.id.startsWith("pbr.iridescence")) {
        return "iridescence";
    }
    if (binding.id === "pbr.anisotropy") {
        return "anisotropy";
    }
    if (binding.id.startsWith("pbr.translucency")) {
        return "subsurface-translucency";
    }
    if (binding.id === "pbr.thickness") {
        return "subsurface-thickness";
    }
    if (binding.id === "pbr.transmission") {
        return "transmission";
    }
    return "textures";
}

/**
 * Lazily loaded PBR material section adapter.
 * @param props The selected material section and instance services.
 * @returns PBR material property content.
 */
export const PbrMaterialAdapter: FunctionComponent<LiteMaterialAdapterProps> = (props) => {
    return <LiteMaterialAdapterSection {...props} family="pbr" colorProperties={ColorProperties} getBindingSection={GetBindingSection} />;
};
