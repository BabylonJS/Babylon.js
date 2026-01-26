import { ExtensibleAccordion } from "../extensibleAccordion";
import type { Scene } from "core/scene";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

export const ToolsPane: typeof ExtensibleAccordion<Scene> = (props) => {
    return (
        <>
            <MessageBar
                intent="info"
                title="Looking for more tools?"
                message="Enable additional tools like Export, Capture, Import, and Reflector from the 'Manage Extensions' option in the toolbar."
            />
            <ExtensibleAccordion {...props} />
        </>
    );
};
