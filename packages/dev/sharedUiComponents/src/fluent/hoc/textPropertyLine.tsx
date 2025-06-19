import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

type TextProps = {
    value: string;
    tooltip?: string;
};

/**
 * Wraps text in a property line
 * @param props - PropertyLineProps and TextProps
 * @returns property-line wrapped text
 */
export const TextPropertyLine: FunctionComponent<PropertyLineProps & TextProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <Body1 title={props.tooltip}>{props.value}</Body1>
        </PropertyLine>
    );
};
