import { type MaterialInspectionPropertyId } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { LiteMaterialAdapterSection, type LiteMaterialAdapterProps } from "./materialAdapterCore";

const ColorProperties = new Set<MaterialInspectionPropertyId>(["standard.diffuseColor", "standard.specularColor", "standard.emissiveColor", "standard.ambientColor"]);

/**
 * Lazily loaded Standard material section adapter.
 * @param props The selected material section and instance services.
 * @returns Standard material property content.
 */
export const StandardMaterialAdapter: FunctionComponent<LiteMaterialAdapterProps> = (props) => {
    return <LiteMaterialAdapterSection {...props} family="standard" colorProperties={ColorProperties} />;
};
