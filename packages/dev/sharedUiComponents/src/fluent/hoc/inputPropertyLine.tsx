import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { Input } from "../primitives/input";
import type { InputProps } from "../primitives/input";

type InputPropertyLineProps = InputProps<string | number> & PropertyLineProps;

/**
 * Wraps an input in a property line
 * @param props - PropertyLineProps and InputProps
 * @returns property-line wrapped input component
 */
const InputPropertyLine: FunctionComponent<InputPropertyLineProps> = (props) => {
    return (
        <PropertyLine {...props}>
            <Input {...props} />
        </PropertyLine>
    );
};

export const TextInputPropertyLine = InputPropertyLine as FunctionComponent<InputProps<string> & PropertyLineProps>;
export const FloatInputPropertyLine = InputPropertyLine as FunctionComponent<InputProps<number> & PropertyLineProps>;
