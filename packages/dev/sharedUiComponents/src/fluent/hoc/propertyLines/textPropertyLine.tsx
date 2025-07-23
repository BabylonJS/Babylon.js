import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { PrimitiveProps, PropertyLineProps } from "../../index";
import type { FunctionComponent } from "react";

/**
 * Wraps text in a property line
 * @param props - PropertyLineProps and TextProps
 * @returns property-line wrapped text
 */
export const TextPropertyLine: FunctionComponent<PropertyLineProps<string> & PrimitiveProps<string, false>> = (props) => {
    const { value, title } = props;
    return (
        <PropertyLine {...props}>
            <Body1 title={title}>{value}</Body1>
        </PropertyLine>
    );
};
