import { SpinButton as FluentSpinButton, mergeClasses, useId } from "@fluentui/react-components";
import type { SpinButtonOnChangeData, SpinButtonChangeEvent } from "@fluentui/react-components";
import type { FunctionComponent, KeyboardEvent } from "react";
import { useEffect, useState, useRef, useContext } from "react";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";
import { CalculatePrecision, HandleKeyDown, HandleOnBlur, useInputStyles } from "./utils";
import { ToolContext } from "../hoc/fluentToolWrapper";

export type SpinButtonProps = PrimitiveProps<number> & {
    min?: number;
    max?: number;
    /** Determines how much the spinbutton increments with the arrow keys. Note this also determines the precision value (# of decimals in display value)
     * i.e. if step = 1, precision = 0. step = 0.0089, precision = 4. step = 300, precision = 2. step = 23.00, precision = 2. */
    step?: number;
    unit?: string;
    forceInt?: boolean;
    validator?: (value: number) => boolean;
    /** Optional className for the input element */
    inputClassName?: string;
};

export const SpinButton: FunctionComponent<SpinButtonProps> = (props) => {
    SpinButton.displayName = "SpinButton";
    const classes = useInputStyles();
    const { size } = useContext(ToolContext);

    const { min, max } = props;

    const [value, setValue] = useState(props.value);
    const lastCommittedValue = useRef(props.value);
    // step and forceInt are not mutually exclusive since there could be cases where you want to forceInt but have spinButton jump >1 int per spin
    const step = props.step != undefined ? props.step : props.forceInt ? 1 : undefined;
    const precision = Math.min(4, step !== undefined ? Math.max(0, CalculatePrecision(step)) : 2); // If no step, set precision to 2. Regardless, cap precision at 4 to avoid wild numbers

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
    const mergedClassName = mergeClasses(classes.input, !validateValue(value) ? classes.invalid : "", props.className);

    // Build input slot from inputClassName
    const inputSlot = {
        className: mergeClasses(classes.inputSlot, props.inputClassName),
    };

    const spinButton = (
        <FluentSpinButton
            {...props}
            appearance="outline"
            input={inputSlot}
            step={step}
            id={id}
            size={size}
            precision={precision}
            displayValue={`${value.toFixed(precision)}${props.unit ? " " + props.unit : ""}`}
            value={value}
            onChange={handleChange}
            onKeyUp={handleKeyUp}
            onKeyDown={HandleKeyDown}
            onBlur={HandleOnBlur}
            className={mergedClassName}
        />
    );

    return props.infoLabel ? (
        <div className={classes.container}>
            <InfoLabel {...props.infoLabel} htmlFor={id} />
            {spinButton}
        </div>
    ) : (
        spinButton
    );
};
