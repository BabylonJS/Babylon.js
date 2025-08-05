import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import { NumberInput, TextInput } from "../../primitives/input";
import type { InputProps } from "../../primitives/input";

/**
 * Wraps a text input in a property line
 * @param props - PropertyLineProps and InputProps
 * @returns property-line wrapped input component
 */
export const TextInputPropertyLine: FunctionComponent<InputProps<string> & PropertyLineProps<string>> = (props) => (
    <PropertyLine {...props}>
        <TextInput {...props} />
    </PropertyLine>
);

/**
 * Wraps a number input in a property line
 * @param props - PropertyLineProps and InputProps
 * @returns property-line wrapped input component
 */
export const NumberInputPropertyLine: FunctionComponent<InputProps<number> & PropertyLineProps<number>> = (props) => (
    <PropertyLine {...props}>
        <NumberInput {...props} />
    </PropertyLine>
);
