import type { FunctionComponent, KeyboardEvent, ChangeEvent } from "react";
import { useEffect, useState } from "react";

import type { InputProps as FluentInputProps } from "@fluentui/react-components";
import { Input as FluentInput, makeStyles } from "@fluentui/react-components";

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

/**
 * This is an input text box that stops propagation of change events and sets its width based on the type of input (text or number)
 * @param props
 * @returns
 */
export const Input: FunctionComponent<FluentInputProps> = (props) => {
    const classes = useInputStyles();
    const [value, setValue] = useState(props.value ?? "");

    useEffect(() => {
        setValue(props.value ?? ""); // Update local state when props.value changes
    }, [props.value]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>, data: any) => {
        event.stopPropagation(); // Prevent event propagation
        if (props.onChange) {
            props.onChange(event, data); // Call the original onChange handler passed as prop
        }
        setValue(event.target.value); // Update local state with the new value
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation
        if (props.onKeyDown) {
            props.onKeyDown(event); // Call the original onKeyDown handler passed as prop
        }
    };

    return <FluentInput {...props} value={value} className={props.type === "number" ? classes.float : classes.text} onChange={handleChange} onKeyDown={handleKeyDown} />;
};
