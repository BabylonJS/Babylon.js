import { PropertyLine, type PropertyLineProps } from "./propertyLine";
import { type FunctionComponent } from "react";
import { type TextInputProps, TextInput } from "../../primitives/textInput";
import { type SpinButtonProps, SpinButton } from "../../primitives/spinButton";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { UniformWidthStyling } from "../../primitives/utils";

const useStyles = makeStyles({
    uniformWidth: {
        ...UniformWidthStyling,
    },
});

/**
 * Wraps a text input in a property line
 * @param props - PropertyLineProps and InputProps
 * @returns property-line wrapped input component
 */
export const TextInputPropertyLine: FunctionComponent<TextInputProps & PropertyLineProps<string>> = (props) => {
    TextInputPropertyLine.displayName = "TextInputPropertyLine";
    const classes = useStyles();
    return (
        <PropertyLine {...props}>
            <TextInput {...props} className={mergeClasses(classes.uniformWidth, props.className)} />
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
    const classes = useStyles();
    return (
        <PropertyLine {...props}>
            <SpinButton {...props} className={mergeClasses(classes.uniformWidth, props.className)} />
        </PropertyLine>
    );
};
