import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import type { FunctionComponent } from "react";
import type { TextInputProps } from "../../primitives/textInput";
import { TextInput } from "../../primitives/textInput";
import type { SpinButtonProps } from "../../primitives/spinButton";
import { SpinButton } from "../../primitives/spinButton";
/**
 * Wraps a text input in a property line
 * @param props - PropertyLineProps and InputProps
 * @returns property-line wrapped input component
 */
export const TextInputPropertyLine: FunctionComponent<TextInputProps & PropertyLineProps<string>> = (props) => {
    TextInputPropertyLine.displayName = "TextInputPropertyLine";
    return (
        <PropertyLine {...props}>
            <TextInput {...props} />
        </PropertyLine>
    );
};

export type NumberInputPropertyLineProps = SpinButtonProps & PropertyLineProps<number>;
/**
 * Wraps a number input in a property line
 * To force integer values, use forceInt param (this is distinct from the 'step' param, which will still allow submitting an integer value. forceInt will not)
 * @param props - PropertyLineProps and InputProps
 * @returns property-line wrapped input component
 */
export const NumberInputPropertyLine: FunctionComponent<NumberInputPropertyLineProps> = (props) => {
    NumberInputPropertyLine.displayName = "NumberInputPropertyLine";
    return (
        <PropertyLine {...props}>
            <SpinButton {...props} />
        </PropertyLine>
    );
};
