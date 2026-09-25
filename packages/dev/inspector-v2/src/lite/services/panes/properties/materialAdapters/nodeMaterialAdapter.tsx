import { type FunctionComponent } from "react";

import { NodeMaterialDescriptor } from "../descriptors/nodeDescriptor";
import { MaterialAdapterSection, type MaterialAdapterProps } from "./materialAdapterCore";

/**
 * Lazily loaded Node material section adapter.
 * @param props The selected material section and instance services.
 * @returns Node material property content.
 */
export const NodeMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    return <MaterialAdapterSection {...props} family="node" familyDescriptor={NodeMaterialDescriptor} getBindingSection={() => "inputs"} />;
};
