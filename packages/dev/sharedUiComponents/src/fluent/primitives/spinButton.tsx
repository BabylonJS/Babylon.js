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
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    forceInt?: boolean;
    validator?: (value: number) => boolean;
};

export const SpinButton: FunctionComponent<SpinButtonProps> = (props) => {
    const classes = useSpinStyles();
    const { min, max } = props;

    const [value, setValue] = useState(props.value);
    const lastCommittedValue = useRef(props.value);
    // step and forceInt are not mutually exclusive since there could be cases where you want to forceInt but have spinButton jump >1 int per spin
    const step = props.step != undefined ? props.step : props.forceInt ? 1 : undefined;

    useEffect(() => {
        if (props.value != lastCommittedValue.current) {
            lastCommittedValue.current = props.value;
            setValue(props.value); // Update local state when props.value changes
        }
    }, [props.value]);

    const validateValue = (numericValue: number): boolean => {
        const outOfBounds = (min !== undefined && numericValue < min) || (max !== undefined && numericValue > max);
        const failsValidator = props.validator && !props.validator(numericValue);
        const failsIntCheck = props.forceInt ? !Number.isInteger(numericValue) : false;
        const invalid = !!outOfBounds || !!failsValidator || isNaN(numericValue) || !!failsIntCheck;
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
        if (data.value != null && !Number.isNaN(data.value)) {
            setValue(data.value); // Update local state. Do not notify parent
            tryCommitValue(data.value);
        }
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation

        if (event.key !== "Enter") {
            // Update local state and try to commit the value if valid, applying styling if not
            const currVal = parseFloat((event.target as any).value);
            setValue(currVal);
            tryCommitValue(currVal);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation

        // Prevent Enter key from causing form submission or value reversion
        if (event.key === "Enter") {
            event.preventDefault();
        }
    };

    const handleOnBlur = (event: FocusEvent<HTMLInputElement>) => {
        event.stopPropagation();
        event.preventDefault();
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
            <FluentSpinButton
                {...props}
                step={step}
                id={id}
                size="small"
                displayValue={props.unit ? `${value} ${props.unit}` : `${value}`} // round?
                value={value}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                onBlur={handleOnBlur}
                style={invalidStyle}
            />
        </div>
    );
};
