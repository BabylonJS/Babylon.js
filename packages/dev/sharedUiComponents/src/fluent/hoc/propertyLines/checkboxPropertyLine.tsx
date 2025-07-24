import { PropertyLine } from "./propertyLine";
import type { PrimitiveProps } from "../../primitives/primitive";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { Checkbox } from "../../primitives/checkbox";

/**
 * Wraps a checkbox in a property line
 * @param props - PropertyLineProps and CheckboxProps
 * @returns property-line wrapped checkbox
 */
export const CheckboxPropertyLine: FunctionComponent<PropertyLineProps<boolean> & PrimitiveProps<boolean>> = (props) => {
    return (
        <PropertyLine {...props}>
            <Checkbox {...props} />
        </PropertyLine>
    );
};
