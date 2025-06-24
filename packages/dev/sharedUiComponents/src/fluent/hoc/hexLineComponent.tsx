import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { InputHexField } from "../primitives/colorPicker";
import type { InputHexProps } from "../primitives/colorPicker";

/**
 * Wraps a hex input in a property line
 * @param props - PropertyLineProps and InputHexProps
 * @returns property-line wrapped input hex component
 */
export const HexPropertyLine: FunctionComponent<InputHexProps & PropertyLineProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <InputHexField {...props} />
        </PropertyLine>
    );
};
