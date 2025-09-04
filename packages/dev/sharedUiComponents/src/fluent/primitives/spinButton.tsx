import { makeStyles, SpinButton as FluentSpinButton, useId, tokens } from "@fluentui/react-components";
import type { SpinButtonOnChangeData, SpinButtonChangeEvent } from "@fluentui/react-components";
import type { FunctionComponent, KeyboardEvent, FocusEvent } from "react";
import { useEffect, useState, useRef } from "react";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";

const useSpinStyles = makeStyles({
    base: {
        display: "flex",
        flexDirection: "column",
        minWidth: "55px",
    },
    invalid: { backgroundColor: tokens.colorPaletteRedBackground2 },
});

export type SpinButtonProps = PrimitiveProps<number> & {
    min?: number;
    max?: number;
    /** Determines how much the spinbutton increments with the arrow keys. Note this also determines the precision value (# of decimals in display value)
     * i.e. if step = 1, precision = 0. step = 0.0089, precision = 4. step = 300, precision = 2. step = 23.00, precision = 2. */
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
        if (props.value !== lastCommittedValue.current) {
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
            setValue(data.value);
            tryCommitValue(data.value);
        }
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation

        if (event.key !== "Enter") {
            const currVal = parseFloat((event.target as any).value); // Cannot use currentTarget.value as it won't have the most recently typed value
            setValue(currVal);
            tryCommitValue(currVal);
        }
    };

    const id = useId("spin-button");
    return (
        <div className={classes.base}>
            {props.infoLabel && <InfoLabel {...props.infoLabel} htmlFor={id} />}
            <FluentSpinButton
                {...props}
                step={step}
                id={id}
                size="small"
                precision={CalculatePrecision(step ?? 1.01)}
                displayValue={props.unit ? `${PrecisionRound(value, CalculatePrecision(step ?? 1.01))} ${props.unit}` : undefined}
                value={value}
                onChange={handleChange}
                onKeyUp={handleKeyUp}
                onKeyDown={HandleKeyDown}
                onBlur={HandleOnBlur}
                className={`${!validateValue(value) ? classes.invalid : ""}`}
            />
        </div>
    );
};

/**
 * Fluent's CalculatePrecision function
 * https://github.com/microsoft/fluentui/blob/dcbf775d37938eacffa37922fc0b43a3cdd5753f/packages/utilities/src/math.ts#L91C1
 *
 * Calculates a number's precision based on the number of trailing
 * zeros if the number does not have a decimal indicated by a negative
 * precision. Otherwise, it calculates the number of digits after
 * the decimal point indicated by a positive precision.
 *
 * @param value - the value to determine the precision of
 * @returns the calculated precision
 */
function CalculatePrecision(value: number) {
    /**
     * Group 1:
     * [1-9]([0]+$) matches trailing zeros
     * Group 2:
     * \.([0-9]*) matches all digits after a decimal point.
     */ const groups = /[1-9]([0]+$)|\.([0-9]*)/.exec(String(value));
    if (!groups) {
        return 0;
    }
    if (groups[1]) {
        return -groups[1].length;
    }
    if (groups[2]) {
        return groups[2].length;
    }
    return 0;
}
/**
 * Fluent's PrecisionRound function
 * https://github.com/microsoft/fluentui/blob/dcbf775d37938eacffa37922fc0b43a3cdd5753f/packages/utilities/src/math.ts#L116
 *
 * Rounds a number to a certain level of precision. Accepts negative precision.
 * @param value - The value that is being rounded.
 * @param precision - The number of decimal places to round the number to
 * @returns The rounded number.
 */
function PrecisionRound(value: number, precision: number) {
    const exp = Math.pow(10, precision);
    return Math.round(value * exp) / exp;
}

export function HandleOnBlur(event: FocusEvent<HTMLInputElement>) {
    event.stopPropagation();
    event.preventDefault();
}

export function HandleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation(); // Prevent event propagation

    // Prevent Enter key from causing form submission or value reversion
    if (event.key === "Enter") {
        event.preventDefault();
    }
}
