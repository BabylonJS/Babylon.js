import { type FunctionComponent } from "react";

import { type MaterialDescriptorPropertyId } from "../descriptors/descriptorTypes";
import { StandardMaterialDescriptor } from "../descriptors/standardDescriptor";
import { LiteMaterialAdapterSection, type LiteMaterialAdapterProps } from "./materialAdapterCore";

const ColorProperties = new Set<MaterialDescriptorPropertyId>(["standard.diffuseColor", "standard.specularColor", "standard.emissiveColor", "standard.ambientColor"]);

/**
 * Lazily loaded Standard material section adapter.
 * @param props The selected material section and instance services.
 * @returns Standard material property content.
 */
export const StandardMaterialAdapter: FunctionComponent<LiteMaterialAdapterProps> = (props) => {
    return <LiteMaterialAdapterSection {...props} family="standard" familyDescriptor={StandardMaterialDescriptor} colorProperties={ColorProperties} />;
};
