import { SpinButton as FluentSpinButton, Input, makeStyles, mergeClasses, tokens, useId } from "@fluentui/react-components";
import type { SpinButtonOnChangeData, SpinButtonChangeEvent } from "@fluentui/react-components";
import { ArrowsBidirectionalRegular } from "@fluentui/react-icons";
import type { ChangeEvent, KeyboardEvent, PointerEvent } from "react";
import { forwardRef, useCallback, useEffect, useState, useRef, useContext } from "react";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";
import { CalculatePrecision, HandleKeyDown, HandleOnBlur, useInputStyles } from "./utils";
import { ToolContext } from "../hoc/fluentToolWrapper";
import { useKeyState } from "../hooks/keyboardHooks";
import { Clamp } from "core/Maths/math.scalar.functions";

function CoerceStepValue(step: number, isFineKeyPressed: boolean, isCourseKeyPressed: boolean): number {
    // When the alt or control key is pressed, decrease step by a factor of 10.
    if (isFineKeyPressed) {
        return step * 0.1;
    }

    // When the shift key is pressed, increase step by a factor of 10.
    if (isCourseKeyPressed) {
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
    /** Optional fixed precision (number of decimal digits). Overrides the automatically computed display precision. */
    precision?: number;
    /** Optional className for the input element */
    inputClassName?: string;
};

export const SpinButton1 = forwardRef<HTMLInputElement, SpinButtonProps>((props, ref) => {
    SpinButton1.displayName = "SpinButton";
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

const useStyles = makeStyles({
    icon: {
        transform: "rotate(90deg)",
        "&:hover": {
            color: tokens.colorBrandForeground1,
        },
    },
});

/**
 * A numeric input with a vertical drag-to-scrub icon (ArrowsBidirectionalRegular rotated 90°).
 * Click-and-drag up/down on the icon to increment/decrement the value.
 */
export const SpinButton2 = forwardRef<HTMLInputElement, SpinButtonProps>((props, ref) => {
    SpinButton2.displayName = "SpinButton2";
    const inputClasses = useInputStyles();
    const classes = useStyles();
    const { size } = useContext(ToolContext);

    const { min, max } = props;
    const baseStep = props.step ?? 1;

    // Modifier keys for step coercion (unfocused = global, focused = while input has focus)
    const isUnfocusedAltKeyPressed = useKeyState("Alt");
    const isUnfocusedCtrlKeyPressed = useKeyState("Control");
    const isUnfocusedShiftKeyPressed = useKeyState("Shift");
    const [isFocusedAltKeyPressed, setIsFocusedAltKeyPressed] = useState(false);
    const [isFocusedCtrlKeyPressed, setIsFocusedCtrlKeyPressed] = useState(false);
    const [isFocusedShiftKeyPressed, setIsFocusedShiftKeyPressed] = useState(false);

    const isFineKey = isUnfocusedAltKeyPressed || isFocusedAltKeyPressed || isUnfocusedCtrlKeyPressed || isFocusedCtrlKeyPressed;
    const isCourseKey = isUnfocusedShiftKeyPressed || isFocusedShiftKeyPressed;
    const step = CoerceStepValue(baseStep, isFineKey, isCourseKey);
    const stepPrecision = Math.max(0, CalculatePrecision(step));

    const [value, setValue] = useState<number>(props.value ?? 0);
    const lastCommittedValue = useRef(props.value);
    const [isDragging, setIsDragging] = useState(false);
    const scrubStartYRef = useRef(0);
    const scrubStartValueRef = useRef(0);
    const [isHovered, setIsHovered] = useState(false);

    // Editing state: when the user is typing, we show their raw text rather than the formatted value.
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState("");

    const valuePrecision = Math.max(0, CalculatePrecision(value));
    // Display precision: controls how many decimals are shown in the formatted displayValue. Cap at 4 to avoid wild numbers.
    // If a fixed precision prop is provided, use it instead.
    const displayPrecision = props.precision ?? Math.min(4, Math.max(stepPrecision, valuePrecision));

    // Format a number for display: toFixed, then trim trailing zeros and period unless a fixed precision is specified.
    const formatValue = useCallback(
        (v: number, precision?: number) => {
            const p = precision ?? displayPrecision;
            const fixed = v.toFixed(p);
            if (props.precision !== undefined) {
                return fixed;
            }
            return fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
        },
        [displayPrecision, props.precision]
    );

    useEffect(() => {
        if (!isDragging && props.value !== lastCommittedValue.current) {
            lastCommittedValue.current = props.value;
            setValue(props.value ?? 0);
        }
    }, [props.value, isDragging]);

    const validateValue = useCallback(
        (numericValue: number): boolean => {
            const outOfBounds = (min !== undefined && numericValue < min) || (max !== undefined && numericValue > max);
            const failsValidator = props.validator && !props.validator(numericValue);
            const failsIntCheck = props.forceInt ? !Number.isInteger(numericValue) : false;
            const invalid = !!outOfBounds || !!failsValidator || isNaN(numericValue) || !!failsIntCheck;
            return !invalid;
        },
        [min, max, props.validator, props.forceInt]
    );

    const clamp = useCallback((v: number) => Clamp(v, min ?? -Infinity, max ?? Infinity), [min, max]);

    const tryCommitValue = useCallback(
        (currVal: number) => {
            if (validateValue(currVal) && currVal !== lastCommittedValue.current) {
                lastCommittedValue.current = currVal;
                props.onChange(currVal);
            }
        },
        [validateValue, props.onChange]
    );

    const handleIconPointerDown = useCallback(
        (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
            scrubStartYRef.current = e.clientY;
            scrubStartValueRef.current = value;
            (e.target as Element).setPointerCapture(e.pointerId);
        },
        [value]
    );

    const handleIconPointerMove = useCallback(
        (e: PointerEvent) => {
            if (!isDragging) {
                return;
            }
            // Dragging up (negative dy) should increment, dragging down should decrement
            const dy = scrubStartYRef.current - e.clientY;
            const delta = (dy * step) / 5;
            const raw = scrubStartValueRef.current + delta;
            const rounded = Math.round(raw / step) * step;
            const clamped = clamp(rounded);
            setValue(clamped);
            tryCommitValue(clamped);
        },
        [isDragging, step, clamp, tryCommitValue]
    );

    const handleIconPointerUp = useCallback((e: PointerEvent) => {
        setIsDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);
    }, []);

    // Allow arbitrary expressions, primarily for math operations (e.g. 10*60 for 10 minutes in seconds).
    // Use Function constructor to safely evaluate the expression without allowing access to scope.
    // If the expression is invalid, fallback to NaN which will be caught by validateValue and prevent committing.
    const evaluateExpression = useCallback((rawValue: string): number => {
        const val = rawValue.trim();
        try {
            return Number(Function(`"use strict";return (${val})`)());
        } catch {
            return NaN;
        }
    }, []);

    const handleInputChange = useCallback((_: ChangeEvent, data: { value: string }) => {
        // Just update the raw text — no evaluation or commit until Enter/blur.
        setEditText(data.value);
    }, []);

    // Evaluate the current edit text and commit the value. Returns the clamped value if valid, or undefined.
    const commitEditText = useCallback(
        (text: string): number | undefined => {
            const numericValue = evaluateExpression(text);
            if (!isNaN(numericValue) && validateValue(numericValue)) {
                const clamped = clamp(numericValue);
                setValue(clamped);
                tryCommitValue(clamped);
                return clamped;
            }
            return undefined;
        },
        [evaluateExpression, validateValue, clamp, tryCommitValue]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Alt") {
                setIsFocusedAltKeyPressed(true);
            } else if (event.key === "Control") {
                setIsFocusedCtrlKeyPressed(true);
            } else if (event.key === "Shift") {
                setIsFocusedShiftKeyPressed(true);
            }

            // Commit on Enter, but stay in editing mode and update editText to the committed result.
            if (event.key === "Enter") {
                const committed = commitEditText((event.target as HTMLInputElement).value);
                if (committed !== undefined) {
                    const newPrecision = Math.min(4, Math.max(Math.max(0, CalculatePrecision(step)), Math.max(0, CalculatePrecision(committed))));
                    setEditText(formatValue(committed, newPrecision));
                }
            }

            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                const direction = event.key === "ArrowUp" ? 1 : -1;
                const newValue = clamp(Math.round((value + direction * step) / step) * step);
                setValue(newValue);
                tryCommitValue(newValue);
                // Update edit text to reflect the new value so the user sees the change
                const newPrecision = Math.min(4, Math.max(Math.max(0, CalculatePrecision(step)), Math.max(0, CalculatePrecision(newValue))));
                setEditText(formatValue(newValue, newPrecision));
            }

            HandleKeyDown(event);
        },
        [value, step, clamp, tryCommitValue, commitEditText, formatValue]
    );

    const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Alt") {
            setIsFocusedAltKeyPressed(false);
        } else if (event.key === "Control") {
            setIsFocusedCtrlKeyPressed(false);
        } else if (event.key === "Shift") {
            setIsFocusedShiftKeyPressed(false);
        }
    }, []);

    const id = useId("spin-button2");

    // Real-time validation: when editing, validate the expression; otherwise validate the committed value.
    const isInputInvalid = isEditing
        ? (() => {
              const evaluated = evaluateExpression(editText);
              return isNaN(evaluated) || !validateValue(evaluated);
          })()
        : !validateValue(value);

    const mergedClassName = mergeClasses(inputClasses.input, isInputInvalid ? inputClasses.invalid : "", props.className);
    const inputSlotClassName = mergeClasses(inputClasses.inputSlot, props.inputClassName);

    const formattedValue = formatValue(value);

    const handleFocus = useCallback(() => {
        setIsEditing(true);
        setEditText(formattedValue);
    }, [formattedValue]);

    const handleBlur = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            commitEditText(editText);
            setIsEditing(false);
            HandleOnBlur(event);
        },
        [editText, commitEditText]
    );

    const contentBefore =
        isHovered || isDragging ? (
            <ArrowsBidirectionalRegular
                className={classes.icon}
                style={{ cursor: isDragging ? "ns-resize" : "pointer" }}
                onPointerDown={handleIconPointerDown}
                onPointerMove={handleIconPointerMove}
                onPointerUp={handleIconPointerUp}
            />
        ) : undefined;

    const input = (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                if (!isDragging) {
                    setIsHovered(false);
                }
            }}
        >
            <Input
                ref={ref}
                id={id}
                appearance="outline"
                size={size}
                className={mergedClassName}
                input={{ className: inputSlotClassName }}
                value={isEditing ? editText : formattedValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onBlur={handleBlur}
                contentBefore={contentBefore}
                contentAfter={props.unit}
            />
        </div>
    );

    return props.infoLabel ? (
        <div className={inputClasses.container}>
            <InfoLabel {...props.infoLabel} htmlFor={id} />
            {input}
        </div>
    ) : (
        input
    );
});

export const SpinButton = SpinButton2;
