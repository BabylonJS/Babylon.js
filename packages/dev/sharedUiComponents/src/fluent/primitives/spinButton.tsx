import { SpinButton as FluentSpinButton, mergeClasses, useId } from "@fluentui/react-components";
import type { SpinButtonOnChangeData, SpinButtonChangeEvent } from "@fluentui/react-components";
import type { KeyboardEvent } from "react";
import { forwardRef, useEffect, useState, useRef, useContext } from "react";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";
import { CalculatePrecision, HandleKeyDown, HandleOnBlur, useInputStyles } from "./utils";
import { ToolContext } from "../hoc/fluentToolWrapper";
import { useKeyState } from "../hooks/keyboardHooks";

function CoerceStepValue(step: number, isAltKeyPressed: boolean, isShiftKeyPressed: boolean): number {
    // When the alt key is pressed, decrease step by a factor of 10.
    if (isAltKeyPressed) {
        return step * 0.1;
    }

    // When the shift key is pressed, increase step by a factor of 10.
    if (isShiftKeyPressed) {
        return step * 10;
    }

    return step;
}

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

export const SpinButton = forwardRef<HTMLInputElement, SpinButtonProps>((props, ref) => {
    SpinButton.displayName = "SpinButton";
    const classes = useInputStyles();
    const { size } = useContext(ToolContext);

    const { min, max } = props;

    const [value, setValue] = useState(props.value);
    const lastCommittedValue = useRef(props.value);

    // When the input does not have keyboard focus
    const isUnfocusedAltKeyPressed = useKeyState("Alt");
    const isUnfocusedShiftKeyPressed = useKeyState("Shift");

    // When the input does have keyboard focus
    const [isFocusedAltKeyPressed, setIsFocusedAltKeyPressed] = useState(false);
    const [isFocusedShiftKeyPressed, setIsFocusedShiftKeyPressed] = useState(false);

    // step and forceInt are not mutually exclusive since there could be cases where you want to forceInt but have spinButton jump >1 int per spin
    const step = CoerceStepValue(props.step ?? 1, isUnfocusedAltKeyPressed || isFocusedAltKeyPressed, isUnfocusedShiftKeyPressed || isFocusedShiftKeyPressed);
    const stepPrecision = Math.max(0, CalculatePrecision(step));
    const valuePrecision = Math.max(0, CalculatePrecision(value));
    // Display precision: controls how many decimals are shown in the formatted displayValue. Cap at 4 to avoid wild numbers
    const displayPrecision = Math.min(4, Math.max(stepPrecision, valuePrecision));
    // Set to large const to prevent Fluent from rounding user-entered values on commit
    // We control display formatting ourselves via displayValue, so this only affects internal rounding. The value stored internally will still have max precision
    const fluentPrecision = 20;

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

    // Strip the unit suffix (e.g. "deg" or " deg") from the raw input value before evaluating expressions.
    const stripUnit = (val: string): string => {
        if (!props.unit) {
            return val;
        }

        const regex = new RegExp("\\s*" + props.unit + "$");
        const match = val.match(regex);

        if (match) {
            return val.slice(0, -match[0].length);
        }
        return val;
    };

    // Allow arbitrary expressions, primarily for math operations (e.g. 10*60 for 10 minutes in seconds).
    // Use Function constructor to safely evaluate the expression without allowing access to scope.
    // If the expression is invalid, fallback to NaN which will be caught by validateValue and prevent committing.
    const evaluateExpression = (rawValue: string): number => {
        const val = stripUnit(rawValue).trim();
        try {
            return Number(Function(`"use strict";return (${val})`)());
        } catch {
            return NaN;
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Alt") {
            setIsFocusedAltKeyPressed(true);
        } else if (event.key === "Shift") {
            setIsFocusedShiftKeyPressed(true);
        }

        // Evaluate on Enter in keyDown (before Fluent's internal commit clears the raw text
        // and re-renders with the truncated displayValue).
        if (event.key === "Enter") {
            const currVal = evaluateExpression((event.target as HTMLInputElement).value);
            if (!isNaN(currVal)) {
                setValue(currVal);
                tryCommitValue(currVal);
            }
        }

        HandleKeyDown(event);
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation(); // Prevent event propagation

        if (event.key === "Alt") {
            setIsFocusedAltKeyPressed(false);
        } else if (event.key === "Shift") {
            setIsFocusedShiftKeyPressed(false);
        }

        // Skip Enter — it's handled in keyDown before Fluent's internal commit
        // clears the raw text and replaces it with the truncated displayValue.
        if (event.key === "Enter") {
            return;
        }

        const currVal = evaluateExpression((event.target as any).value);

        if (!isNaN(currVal)) {
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
            ref={ref}
            {...props}
            appearance="outline"
            input={inputSlot}
            step={step}
            id={id}
            size={size}
            precision={fluentPrecision}
            displayValue={`${value.toFixed(displayPrecision)}${props.unit ? " " + props.unit : ""}`}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
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
});
