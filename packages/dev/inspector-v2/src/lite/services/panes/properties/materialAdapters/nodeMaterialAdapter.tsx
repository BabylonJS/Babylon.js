import { type FunctionComponent } from "react";

import { LiteMaterialAdapterSection, type LiteMaterialAdapterProps } from "./materialAdapterCore";

/**
 * Lazily loaded Node material section adapter.
 * @param props The selected material section and instance services.
 * @returns Node material property content.
 */
export const NodeMaterialAdapter: FunctionComponent<LiteMaterialAdapterProps> = (props) => {
    return <LiteMaterialAdapterSection {...props} family="node" getBindingSection={() => "inputs"} />;
};
