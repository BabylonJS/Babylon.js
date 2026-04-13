import { ExtensibleAccordion } from "shared-ui-components/modularTool/components/extensibleAccordion";
import { type Scene } from "core/scene";

export const ToolsPane: typeof ExtensibleAccordion<Scene> = (props) => {
    return <ExtensibleAccordion {...props} />;
};
