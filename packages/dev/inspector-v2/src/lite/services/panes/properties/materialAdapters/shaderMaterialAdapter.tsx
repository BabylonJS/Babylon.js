import { type FunctionComponent } from "react";

import { LiteMaterialAdapterSection, type LiteMaterialAdapterProps } from "./materialAdapterCore";

/**
 * Lazily loaded Shader material section adapter.
 * @param props The selected material section and instance services.
 * @returns Shader material property content.
 */
export const ShaderMaterialAdapter: FunctionComponent<LiteMaterialAdapterProps> = (props) => {
    return <LiteMaterialAdapterSection {...props} family="shader" />;
};
