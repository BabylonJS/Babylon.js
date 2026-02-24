import type { ChangeEvent, FocusEvent, KeyboardEvent, PointerEvent } from "react";

import type { PrimitiveProps } from "./primitive";

import { Input, makeStyles, mergeClasses, tokens, useId, useMergedRefs } from "@fluentui/react-components";
import { ArrowBidirectionalUpDownFilled } from "@fluentui/react-icons";

import { Clamp } from "core/Maths/math.scalar.functions";
import { forwardRef, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ToolContext } from "../hoc/fluentToolWrapper";
import { useKeyState } from "../hooks/keyboardHooks";
import { InfoLabel } from "./infoLabel";
import { CalculatePrecision, HandleKeyDown, HandleOnBlur, useInputStyles } from "./utils";

function CoerceStepValue(step: number, isFineKeyPressed: boolean, isCourseKeyPressed: boolean): number {
    // When the fine key is pressed, decrease step by a factor of 10.
    if (isFineKeyPressed) {
        return step * 0.1;
    }

    // When the course key is pressed, increase step by a factor of 10.
    if (isCourseKeyPressed) {
        return step * 10;
    }

    return step;
}

// Allow arbitrary expressions, primarily for math operations (e.g. 10*60 for 10 minutes in seconds).
// Use Function constructor to safely evaluate the expression without allowing access to scope.
// If the expression is invalid, fallback to NaN which will be caught by validateValue and prevent committing.
function EvaluateExpression(rawValue: string): number {
    const val = rawValue.trim();
    try {
        return Number(Function(`"use strict";return (${val})`)());
    } catch {
        return NaN;
    }
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
    /** When true, hides the drag-to-scrub button */
    disableDragButton?: boolean;
};

const useStyles = makeStyles({
    icon: {
        "&:hover": {
            color: tokens.colorBrandForeground1,
        },
    },
});

/**
 * A numeric input with a vertical drag-to-scrub icon (ArrowsBidirectionalRegular rotated 90°).
 * Click-and-drag up/down on the icon to increment/decrement the value.
 */
export const SpinButton = forwardRef<HTMLInputElement, SpinButtonProps>((props, ref) => {
    SpinButton.displayName = "SpinButton2";
    const inputClasses = useInputStyles();
    const classes = useStyles();
    const { size } = useContext(ToolContext);

    const { min, max } = props;
    const baseStep = props.step ?? 1;

    // Local ref for the input element so we can blur it programmatically (e.g. when a drag starts while editing).
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mergedRef = useMergedRefs(ref, inputRef);

    // Modifier keys for step coercion.
    const isAltKeyPressed = useKeyState("Alt", { preventDefault: true });
    const isShiftKeyPressed = useKeyState("Shift");

    const step = CoerceStepValue(baseStep, isAltKeyPressed, isShiftKeyPressed);
    const stepPrecision = Math.max(0, CalculatePrecision(step));

    const [value, setValue] = useState<number>(props.value ?? 0);
    const lastCommittedValue = useRef(props.value);
    const [isDragging, setIsDragging] = useState(false);
    const scrubStartYRef = useRef(0);
    const scrubStartValueRef = useRef(0);
    const lastPointerYRef = useRef(0);
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
        (v: number) => {
            const fixed = v.toFixed(displayPrecision);
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

    // Constrain a value to the valid range by clamping to [min, max].
    const constrainValue = useCallback((v: number) => Clamp(v, min ?? -Infinity, max ?? Infinity), [min, max]);

    const tryCommitValue = useCallback(
        (currVal: number) => {
            if (validateValue(currVal) && currVal !== lastCommittedValue.current) {
                lastCommittedValue.current = currVal;
                props.onChange(currVal);
            }
        },
        [validateValue, props.onChange]
    );

    const handleInputChange = useCallback((_: ChangeEvent, data: { value: string }) => {
        // Just update the raw text — no evaluation or commit until Enter/blur.
        setEditText(data.value);
    }, []);

    // Evaluate the current edit text and commit the value. Returns the clamped value if valid, or undefined.
    const commitEditText = useCallback(
        (text: string): number | undefined => {
            const numericValue = EvaluateExpression(text);
            if (!isNaN(numericValue) && validateValue(numericValue)) {
                const constrained = constrainValue(numericValue);
                setValue(constrained);
                tryCommitValue(constrained);
                return constrained;
            }
            return undefined;
        },
        [validateValue, constrainValue, tryCommitValue]
    );

    const handleIconPointerDown = useCallback(
        (e: PointerEvent<Element>) => {
            e.preventDefault();
            e.stopPropagation();
            // If the input was being edited, commit the current text and blur the input
            // so the focus state stays consistent after the drag ends.
            let startValue = value;
            if (isEditing) {
                const committed = commitEditText(editText);
                if (committed !== undefined) {
                    startValue = committed;
                }
                setIsEditing(false);
            }
            // Blur the active element to ensure we can observe document level modifier keys.
            (inputRef.current?.ownerDocument.activeElement as Partial<HTMLElement>)?.blur?.();
            setIsDragging(true);
            scrubStartYRef.current = e.clientY;
            scrubStartValueRef.current = startValue;
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        [value, isEditing, editText, commitEditText]
    );

    // When the step size changes during a drag (e.g. Shift/Alt pressed or released), reset the scrub reference point
    // to the current value and pointer position so only future movement uses the new step.
    useEffect(() => {
        if (isDragging) {
            scrubStartValueRef.current = value;
            scrubStartYRef.current = lastPointerYRef.current;
        }
    }, [step]);

    const handleIconPointerMove = useCallback(
        (e: PointerEvent) => {
            if (!isDragging) {
                return;
            }
            lastPointerYRef.current = e.clientY;
            // Dragging up (negative dy) should increment, dragging down should decrement.
            // Scale delta by step but round to display precision (not step) for smooth fine-grained control.
            const dy = scrubStartYRef.current - e.clientY;
            // 5 is just a number that "feels right" for the drag sensitivity — it determines how far the user needs to drag to change the value by 1 step.
            const delta = (dy * step) / 5;
            const raw = scrubStartValueRef.current + delta;
            const precisionFactor = Math.pow(10, displayPrecision);
            const rounded = Math.round(raw * precisionFactor) / precisionFactor;
            const constrained = constrainValue(rounded);
            setValue(constrained);
            tryCommitValue(constrained);
        },
        [isDragging, step, displayPrecision, constrainValue, tryCommitValue]
    );

    const handleIconPointerUp = useCallback((e: PointerEvent<Element>) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    }, []);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            // Commit on Enter and blur the input if the value is valid.
            if (event.key === "Enter") {
                const committed = commitEditText(event.currentTarget.value);
                if (committed !== undefined) {
                    inputRef.current?.blur();
                }
            }

            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                const direction = event.key === "ArrowUp" ? 1 : -1;
                const newValue = constrainValue(Math.round((value + direction * step) / step) * step);
                setValue(newValue);
                tryCommitValue(newValue);
                // Update edit text to reflect the new value so the user sees the change
                setEditText(formatValue(newValue));
            }

            HandleKeyDown(event);
        },
        [value, step, constrainValue, tryCommitValue, commitEditText, formatValue]
    );

    const id = useId("spin-button2");

    // Real-time validation: when editing, validate the expression; otherwise validate the committed value.
    // (validateValue already handles NaN, so no separate isNaN check needed.)
    const isInputInvalid = !validateValue(isEditing ? EvaluateExpression(editText) : value);

    const mergedClassName = mergeClasses(inputClasses.input, isInputInvalid ? inputClasses.invalid : "", props.className);
    const inputSlotClassName = mergeClasses(inputClasses.inputSlot, props.inputClassName);

    const formattedValue = formatValue(value);

    const handleFocus = useCallback(() => {
        setIsEditing(true);
        setEditText(formattedValue);
    }, [formattedValue]);

    const handleBlur = useCallback(
        (event: FocusEvent<HTMLInputElement>) => {
            // Skip blur handling if a drag just started (icon pointerDown already committed).
            if (isDragging) {
                return;
            }
            commitEditText(event.target.value);
            setIsEditing(false);
            HandleOnBlur(event);
        },
        [commitEditText, isDragging]
    );

    const contentBefore =
        !props.disableDragButton && (isHovered || isDragging) && !isInputInvalid ? (
            <ArrowBidirectionalUpDownFilled
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
                ref={mergedRef}
                id={id}
                appearance="outline"
                size={size}
                className={mergedClassName}
                input={{ className: inputSlotClassName }}
                value={isEditing ? editText : formattedValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
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
