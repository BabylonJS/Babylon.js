import { Body1 } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { ImmutablePrimitiveProps } from "../../primitives/primitive";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

/**
 * Wraps text in a property line
 * @param props - PropertyLineProps and TextProps
 * @returns property-line wrapped text
 */
export const TextPropertyLine: FunctionComponent<PropertyLineProps<string> & ImmutablePrimitiveProps<string>> = (props) => {
    TextPropertyLine.displayName = "TextPropertyLine";
    const { value, title } = props;
    return (
        <PropertyLine {...props}>
            <Body1 title={title}>{value ?? ""}</Body1>
        </PropertyLine>
    );
};
