import { SpinButton, type SpinButtonProps } from "@fluentui/react-components";
import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";

/**
 * Wraps text in a property line
 * @param props - PropertyLineProps and TextProps
 * @returns property-line wrapped text
 */
export const IntegerPropertyLine: FunctionComponent<PropertyLineProps & SpinButtonProps> = (props) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { label, ...spinProps } = props;

    return (
        <PropertyLine {...props}>
            <SpinButton {...spinProps} />
        </PropertyLine>
    );
};
