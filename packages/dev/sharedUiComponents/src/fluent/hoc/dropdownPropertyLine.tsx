import { Dropdown } from "../primitives/dropdown";
import type { DropdownProps } from "../primitives/dropdown";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

/**
 * Wraps a dropdown in a property line
 * @param props - PropertyLineProps and DropdownProps
 * @returns property-line wrapped dropdown
 */
export const DropdownPropertyLine: FunctionComponent<PropertyLineProps & DropdownProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <Dropdown {...props} />
        </PropertyLine>
    );
};
