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
 * Dropdown component for explicitly defined number values.
 * If value can be undefined, use OptionalNumberDropdownPropertyLine instead.
 * If value can be null, use NullableNumberDropdownPropertyLine instead.
 */
export const NumberDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<number>>;
/**
 * Dropdown component for explicitly defined string values.
 * If value can be undefined, use OptionalStringDropdownPropertyLine instead.
 * If value can be null, use NullableStringDropdownPropertyLine instead.
 */
export const StringDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<string>>;
