import type { Node } from "core/index";
import { Dropdown } from "../../primitives/dropdown";
import type { AcceptedDropdownValue, DropdownProps } from "../../primitives/dropdown";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import { forwardRef } from "react";
import type { FunctionComponent } from "react";

type DropdownPropertyLineProps<V extends AcceptedDropdownValue> = DropdownProps<V> & PropertyLineProps<V>;

/**
 * Wraps a dropdown in a property line
 * @param props - PropertyLineProps and DropdownProps
 * @returns property-line wrapped dropdown
 */

const DropdownPropertyLine = forwardRef<HTMLDivElement, DropdownPropertyLineProps<AcceptedDropdownValue>>((props, ref) => {
    return (
        <PropertyLine {...props} ref={ref}>
            <Dropdown {...props} />
        </PropertyLine>
    );
});

/**
 * Dropdown component for number values.
 */
export const NumberDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<number>>;
/**
 * Dropdown component for string values
 */
export const StringDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<string>>;
/**
 * Dropdown component for Node values
 */
export const NodeDropdownPropertyLine = DropdownPropertyLine as FunctionComponent<DropdownPropertyLineProps<Node>>;
