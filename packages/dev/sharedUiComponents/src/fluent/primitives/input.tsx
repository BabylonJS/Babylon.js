import type { FunctionComponent, KeyboardEvent, ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { Input as FluentInput, makeStyles } from "@fluentui/react-components";
import type { PrimitiveProps } from "./primitive";

const useInputStyles = makeStyles({
    text: {
        height: "auto",
        textAlign: "right",
        minWidth: "100px", // Min width for text input
    },
    number: {
        height: "auto",
        minWidth: "40px", // Min width for number input
    },
});

export type InputProps<T extends string | number> = PrimitiveProps<T> & {
    step?: number;
    placeholder?: string;
    min?: number;
    max?: number;
};
/**
 * This is an input text box that stops propagation of change events and sets its width based on the type of input (text or number)
 * @param props
 * @returns
 */
const Input: FunctionComponent<InputProps<string | number> & { type: "text" | "number" }> = (props) => {
    const classes = useInputStyles();
    const [value, setValue] = useState(props.value ?? "");

    useEffect(() => {
        setValue(props.value ?? ""); // Update local state when props.value changes
    }, [props.value]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>, _: unknown) => {
        event.stopPropagation(); // Prevent event propagation
        const value = props.type === "number" ? Number(event.target.value) : String(event.target.value);
        props.onChange(value); // Call the original onChange handler passed as prop
        setValue(value); // Update local state with the new value
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation
    };

    return (
        <FluentInput
            {...props}
            size="small"
            value={value.toString()}
            className={props.type === "number" ? classes.number : classes.text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );
};

const NumberInputCast = Input as FunctionComponent<InputProps<number> & { type: "number" }>;
const TextInputCast = Input as FunctionComponent<InputProps<string> & { type: "text" }>;

export const NumberInput: FunctionComponent<InputProps<number>> = (props) => <NumberInputCast {...props} type="number" />;
export const TextInput: FunctionComponent<InputProps<string>> = (props) => <TextInputCast {...props} type="text" />;
