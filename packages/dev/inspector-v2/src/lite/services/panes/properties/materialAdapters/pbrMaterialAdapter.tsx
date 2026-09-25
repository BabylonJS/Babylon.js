import { type FunctionComponent } from "react";

import { type MaterialDescriptorPropertyId, type MaterialDescriptorSection, type IMaterialTextureBinding } from "../descriptors/descriptorTypes";
import { PbrMaterialDescriptor } from "../descriptors/pbrDescriptor";
import { MaterialAdapterSection, type MaterialAdapterProps } from "./materialAdapterCore";

const ColorProperties = new Set<MaterialDescriptorPropertyId>([
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

function GetBindingSection(binding: IMaterialTextureBinding): MaterialDescriptorSection {
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
export const PbrMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    return <MaterialAdapterSection {...props} family="pbr" familyDescriptor={PbrMaterialDescriptor} colorProperties={ColorProperties} getBindingSection={GetBindingSection} />;
};
