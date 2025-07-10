import type { Nullable } from "core/types";
import { Dropdown } from "../primitives/dropdown";
import type { AcceptedDropdownValue, DropdownProps } from "../primitives/dropdown";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

type DropdownPropertyLineProps<V extends AcceptedDropdownValue> = Omit<DropdownProps<V>, "includeNullAs"> & PropertyLineProps;

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

const NullableDropdownPropertyLine: FunctionComponent<DropdownPropertyLineProps<AcceptedDropdownValue>> = (props) => <DropdownPropertyLine {...props} includeNullAs="null" />;
const OptionalDropdownPropertyLine: FunctionComponent<DropdownPropertyLineProps<AcceptedDropdownValue>> = (props) => <DropdownPropertyLine {...props} includeNullAs="undefined" />;

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

/**
 * Dropdown component for Nullable<number> values.
 */
export const NullableNumberDropdownPropertyLine = NullableDropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<Nullable<number>>>;
/**
 * Dropdown component for Nullable<string> values.
 */
export const NullableStringDropdownPropertyLine = NullableDropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<Nullable<string>>>;

/**
 * Dropdown component for number | undefined values
 */
export const OptionalNumberDropdownPropertyLine = OptionalDropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<number | undefined>>;
/**
 * Dropdown component for string | undefined values
 */
export const OptionalStringDropdownPropertyLine = OptionalDropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<string | undefined>>;
