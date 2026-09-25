import { type FunctionComponent } from "react";

import { type MaterialDescriptorPropertyId } from "../descriptors/descriptorTypes";
import { StandardMaterialDescriptor } from "../descriptors/standardDescriptor";
import { MaterialAdapterSection, type MaterialAdapterProps } from "./materialAdapterCore";

const ColorProperties = new Set<MaterialDescriptorPropertyId>(["standard.diffuseColor", "standard.specularColor", "standard.emissiveColor", "standard.ambientColor"]);

/**
 * Lazily loaded Standard material section adapter.
 * @param props The selected material section and instance services.
 * @returns Standard material property content.
 */
export const StandardMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    return <MaterialAdapterSection {...props} family="standard" familyDescriptor={StandardMaterialDescriptor} colorProperties={ColorProperties} />;
};
