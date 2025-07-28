import { Dropdown } from "../../primitives/dropdown";
import type { AcceptedDropdownValue, DropdownProps } from "../../primitives/dropdown";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

// In a follow-up PR i will remove the nullAs concept from dropdown
type DropdownPropertyLineProps<V extends AcceptedDropdownValue> = Omit<DropdownProps<V>, "includeNullAs"> & PropertyLineProps<AcceptedDropdownValue>;

/**
 * Wraps a dropdown in a property line
 * @param props - PropertyLineProps and DropdownProps
 * @returns property-line wrapped dropdown
 */
const DropdownPropertyLine: FunctionComponent<DropdownProps<AcceptedDropdownValue> & PropertyLineProps<AcceptedDropdownValue>> = (props) => {
    return (
        <PropertyLine {...props}>
            <Dropdown {...props} />
        </PropertyLine>
    );
};

/**
 * Dropdown component for number values.
 */
export const NumberDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<number>>;
/**
 * Dropdown component for string values
 */
export const StringDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<string>>;
