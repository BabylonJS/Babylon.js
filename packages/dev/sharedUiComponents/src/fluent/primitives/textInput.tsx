import type { FunctionComponent, FocusEvent, KeyboardEvent, ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { Input as FluentInput, makeStyles, useId } from "@fluentui/react-components";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";

const useInputStyles = makeStyles({
    base: {
        display: "flex",
        flexDirection: "column",
        width: "100px",
    },
});

export type TextInputProps = PrimitiveProps<string> & {
    validator?: (value: string) => boolean;
};

export const TextInput: FunctionComponent<TextInputProps> = (props) => {
    const classes = useInputStyles();

    const [value, setValue] = useState(props.value);
    const lastCommittedValue = useRef(props.value);

    useEffect(() => {
        if (props.value != lastCommittedValue.current) {
            setValue(props.value); // Update local state when props.value changes
            lastCommittedValue.current = props.value;
        }
    }, [props.value]);

    const validateValue = (val: string): boolean => {
        const failsValidator = props.validator && !props.validator(val);
        return !failsValidator;
    };

    const tryCommitValue = (currVal: string) => {
        // Only commit if valid and different from last committed value
        if (validateValue(currVal) && currVal !== lastCommittedValue.current) {
            lastCommittedValue.current = currVal;
            props.onChange(currVal);
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>, _: unknown) => {
        event.stopPropagation(); // Prevent event propagation
        setValue(event.target.value); // Update local state. Do not notify parent
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation

        // Prevent Enter key from causing form submission or value reversion
        if (event.key === "Enter") {
            event.preventDefault();

            // Update local state and try to commit the value if valid
            const currVal = (event.target as any).value;
            setValue(currVal);
            tryCommitValue(currVal);
        }
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation
        // Update local state and try to commit the value if valid
        const currVal = (event.target as any).value;
        setValue(currVal);
        tryCommitValue(currVal);
    };

    const invalidStyle = !validateValue(value)
        ? {
              backgroundColor: "#fdeaea",
              borderColor: "#d13438",
          }
        : {};

    const id = useId("input-button");
    return (
        <div className={classes.base}>
            {props.infoLabel && <InfoLabel {...props.infoLabel} htmlFor={id} />}
            <FluentInput {...props} id={id} size="small" value={value} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} style={invalidStyle} />
        </div>
    );
};
