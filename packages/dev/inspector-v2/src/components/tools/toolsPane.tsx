import { ExtensibleAccordion } from "../extensibleAccordion";
import type { Scene } from "core/scene";

export const ToolsPane: typeof ExtensibleAccordion<Scene> = (props) => {
    return <ExtensibleAccordion {...props} />;
};
