import { PropertyLine, type PropertyLineProps } from "./propertyLine";
import { type FunctionComponent } from "react";
import { Switch, type SwitchProps } from "../../primitives/switch";

/**
 * Wraps a switch in a property line
 * @param props - The properties for the switch and property line
 * @returns A React element representing the property line with a switch
 */
export const SwitchPropertyLine: FunctionComponent<PropertyLineProps<boolean> & SwitchProps> = (props) => {
    SwitchPropertyLine.displayName = "SwitchPropertyLine";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { label, ...switchProps } = props;
    // Ensure the label gets passed to the PropertyLine component and not to the underlying switch
    return (
        <PropertyLine {...props}>
            <Switch {...switchProps} />
        </PropertyLine>
    );
};
