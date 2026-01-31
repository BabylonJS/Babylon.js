import { PresenceBadge } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { PropertyLine } from "./propertyLine";
import type { ImmutablePrimitiveProps } from "../../primitives/primitive";
import type { PropertyLineProps } from "./propertyLine";
/**
 * Displays an icon indicating enabled (green check) or disabled (red cross) state
 * @param props - The properties for the PropertyLine, including the boolean value to display.
 * @returns A PropertyLine component with a PresenceBadge indicating the boolean state.
 */
export const BooleanBadgePropertyLine: FunctionComponent<PropertyLineProps<boolean> & ImmutablePrimitiveProps<boolean>> = (props) => {
    BooleanBadgePropertyLine.displayName = "BooleanBadgePropertyLine";
    // For now assume BooleanBadge is used for readonly properties and disable copy. In future we could enable with a different copy string
    return (
        <PropertyLine {...props} onCopy={undefined}>
            <PresenceBadge status={props.value ? "available" : "do-not-disturb"} outOfOffice={true} />
        </PropertyLine>
    );
};
