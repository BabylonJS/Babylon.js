import type { Nullable } from "core/types";
import { Dropdown } from "../primitives/dropdown";
import type { AcceptedDropdownValue, DropdownProps } from "../primitives/dropdown";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

/**
 * Wraps a dropdown in a property line
 * @param props - PropertyLineProps and DropdownProps
 * @returns property-line wrapped dropdown
 */
const DropdownPropertyLine: FunctionComponent<DropdownProps<AcceptedDropdownValue> & PropertyLineProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <Dropdown {...props} />
        </PropertyLine>
    );
};

export const NumberDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownProps<Nullable<number>> & PropertyLineProps>;
export const StringDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownProps<Nullable<string>> & PropertyLineProps>;
