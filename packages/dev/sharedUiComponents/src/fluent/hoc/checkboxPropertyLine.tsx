import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { Checkbox } from "../primitives/checkbox";
import type { CheckboxProps } from "../primitives/checkbox";

/**
 * Wraps a checkbox in a property line
 * @param props - PropertyLineProps and CheckboxProps
 * @returns property-line wrapped checkbox
 */
export const CheckboxPropertyLine: FunctionComponent<PropertyLineProps & CheckboxProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <Checkbox {...props} />
        </PropertyLine>
    );
};
