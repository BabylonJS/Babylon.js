import { type FunctionComponent } from "react";

import { ShaderMaterialDescriptor } from "../descriptors/shaderDescriptor";
import { MaterialAdapterSection, type MaterialAdapterProps } from "./materialAdapterCore";

/**
 * Lazily loaded Shader material section adapter.
 * @param props The selected material section and instance services.
 * @returns Shader material property content.
 */
export const ShaderMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    return <MaterialAdapterSection {...props} family="shader" familyDescriptor={ShaderMaterialDescriptor} />;
};
