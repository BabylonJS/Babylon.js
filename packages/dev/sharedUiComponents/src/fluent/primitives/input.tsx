import type { FunctionComponent, KeyboardEvent, ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { Input as FluentInput, makeStyles } from "@fluentui/react-components";
import type { BaseComponentProps } from "../hoc/propertyLine";

const useInputStyles = makeStyles({
    text: {
        height: "auto",
    },
    float: {
        height: "auto",
        width: "80px", // Fixed width for number input
        flexShrink: 0,
    },
});

type InputProps = BaseComponentProps<string | number> & {
    step?: number;
    placeholder?: string;
    type?: "number" | "text";
    min?: number;
    max?: number;
};
/**
 * This is an input text box that stops propagation of change events and sets its width based on the type of input (text or number)
 * @param props
 * @returns
 */
export const Input: FunctionComponent<InputProps> = (props) => {
    const classes = useInputStyles();
    const [value, setValue] = useState(props.value ?? "");

    useEffect(() => {
        setValue(props.value ?? ""); // Update local state when props.value changes
    }, [props.value]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>, _: unknown) => {
        event.stopPropagation(); // Prevent event propagation
        props.onChange(event.target.value); // Call the original onChange handler passed as prop
        setValue(event.target.value); // Update local state with the new value
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation
    };

    return (
        <FluentInput
            {...props}
            size="small"
            value={value.toString()}
            className={props.type === "number" ? classes.float : classes.text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );
};
