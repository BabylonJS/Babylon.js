import { makeStyles, SpinButton as FluentSpinButton, useId } from "@fluentui/react-components";
import type { SpinButtonOnChangeData, SpinButtonChangeEvent } from "@fluentui/react-components";
import type { FunctionComponent, KeyboardEvent, FocusEvent } from "react";
import { useEffect, useState, useRef } from "react";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";

const useSpinStyles = makeStyles({
    base: {
        display: "flex",
        flexDirection: "column",
        width: "100px",
    },
});

export type SpinButtonProps = PrimitiveProps<number> & {
    precision?: number; // Optional precision for the spin button
    step?: number; // Optional step value for the spin button
    min?: number;
    max?: number;
    validator?: (value: number) => boolean;
};

export const SpinButton: FunctionComponent<SpinButtonProps> = (props) => {
    const classes = useSpinStyles();
    const { min, max } = props;

    const [value, setValue] = useState(props.value);
    const lastCommittedValue = useRef(props.value);

    useEffect(() => {
        if (props.value != lastCommittedValue.current) {
            setValue(props.value); // Update local state when props.value changes
            lastCommittedValue.current = props.value;
        }
    }, [props.value]);

    const validateValue = (numericValue: number): boolean => {
        const outOfBounds = (min !== undefined && numericValue < min) || (max !== undefined && numericValue > max);
        const failsValidator = props.validator && !props.validator(numericValue);
        const invalid = !!outOfBounds || !!failsValidator || isNaN(numericValue);
        return !invalid;
    };

    const tryCommitValue = (currVal: number) => {
        // Only commit if valid and different from last committed value
        if (validateValue(currVal) && currVal !== lastCommittedValue.current) {
            lastCommittedValue.current = currVal;
            props.onChange(currVal);
        }
    };

    const handleChange = (event: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
        event.stopPropagation(); // Prevent event propagation
        if (data.value != null) {
            setValue(data.value); // Update local state. Do not notify parent
            tryCommitValue(data.value);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation

        // Prevent Enter key from causing form submission or value reversion
        if (event.key === "Enter") {
            event.preventDefault();

            // // Update local state and try to commit the value if valid
            // const currVal = parseFloat((event.target as any).value);
            // setValue(currVal);
            // tryCommitValue(currVal);
        }
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation
        // Try to commit the current value when losing focus
        // const currVal = parseFloat(event.target.value);
        // setValue(currVal);
        // tryCommitValue(currVal);
    };

    const invalidStyle = !validateValue(value)
        ? {
              backgroundColor: "#fdeaea",
              borderColor: "#d13438",
          }
        : {};

    const id = useId("spin-button");
    return (
        <div className={classes.base}>
            {props.infoLabel && <InfoLabel {...props.infoLabel} htmlFor={id} />}
            <FluentSpinButton {...props} id={id} size="small" value={value} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} style={invalidStyle} />
        </div>
    );
};
