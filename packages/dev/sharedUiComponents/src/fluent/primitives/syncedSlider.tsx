import { type FunctionComponent, useEffect, useState, useRef } from "react";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { SpinButton } from "./spinButton";
import { Slider } from "./slider";
import { type PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";

const useSyncedSliderStyles = makeStyles({
    container: { display: "flex", minWidth: 0 },
    syncedSlider: {
        flex: "1 1 0",
        flexDirection: "row",
        display: "flex",
        alignItems: "center",
        minWidth: 0,
    },
    // Default: 50/50 split between slider and spinbutton
    slider: {
        flex: "1 1 0",
        minWidth: 0,
    },
    spinButton: {
        flex: "1 1 0",
        minWidth: 0,
    },
    spinButtonInput: {
        minWidth: "0",
    },
    // compact/growSlider overrides for standalone (non-PropertyLine) usage
    compactSlider: {
        flex: "1 1 auto",
        minWidth: "50px",
        maxWidth: "75px",
    },
    growSlider: {
        flex: "1 1 auto",
        minWidth: "50px",
    },
    compactSpinButton: {
        width: "65px",
        minWidth: "65px",
        maxWidth: "65px",
    },
    compactSpinButtonInput: {
        minWidth: "0",
    },
});

export type SyncedSliderProps = PrimitiveProps<number> & {
    /** Minimum value for the slider */
    min?: number;
    /** Maximum value for the slider */
    max?: number;
    /** Step size for the slider */
    step?: number;
    /** Optional fixed precision (number of decimal digits). Overrides the automatically computed display precision. */
    precision?: number;
    /** Displayed in the ux to indicate unit of measurement */
    unit?: string;
    /** When true, onChange is only called when the user releases the slider, not during drag */
    notifyOnlyOnRelease?: boolean;
    /** When true, slider grows to fill space and SpinButton is fixed at 65px */
    compact?: boolean;
    /** When true, slider grows to fill all available space (no maxWidth constraint) */
    growSlider?: boolean;
};

/**
 * Component which synchronizes a slider and an input field, allowing the user to change the value using either control
 * @param props
 * @returns SyncedSlider component
 */
export const SyncedSliderInput: FunctionComponent<SyncedSliderProps> = (props) => {
    SyncedSliderInput.displayName = "SyncedSliderInput";
    const { infoLabel, ...passthroughProps } = props;
    const classes = useSyncedSliderStyles();
    const [value, setValue] = useState<number>(props.value ?? 0);
    const pendingValueRef = useRef<number>(undefined);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        !isDraggingRef.current && setValue(props.value ?? 0); // Update local state when props.value changes as long as user is not actively dragging
    }, [props.value]);

    const handleSliderChange = (newValue: number) => {
        setValue(newValue);

        if (props.notifyOnlyOnRelease) {
            // Store the value but don't notify parent yet
            pendingValueRef.current = newValue;
        } else {
            // Notify parent as slider changes
            props.onChange(newValue);
        }
    };

    const handleSliderPointerDown = () => {
        isDraggingRef.current = true;
    };

    const handleSliderPointerUp = () => {
        if (props.notifyOnlyOnRelease && isDraggingRef.current && pendingValueRef.current !== undefined) {
            props.onChange(pendingValueRef.current);
            pendingValueRef.current = undefined;
        }
        isDraggingRef.current = false;
    };

    const handleInputChange = (value: number) => {
        setValue(value);
        props.onChange(value); // Input always updates immediately
    };

    const hasSlider = props.min !== undefined && props.max !== undefined;
    const useCompactSizing = props.compact || props.growSlider;

    const getSliderClassName = () => {
        if (props.growSlider) {
            return classes.growSlider;
        }
        if (props.compact) {
            return classes.compactSlider;
        }
        return classes.slider;
    };

    return (
        <div className={mergeClasses(classes.container, props.className)}>
            {infoLabel && <InfoLabel {...infoLabel} htmlFor={"syncedSlider"} />}
            <div id="syncedSlider" className={classes.syncedSlider}>
                {hasSlider && (
                    <Slider
                        className={getSliderClassName()}
                        value={value}
                        onChange={handleSliderChange}
                        min={props.min}
                        max={props.max}
                        step={props.step}
                        disabled={props.disabled}
                        onPointerDown={handleSliderPointerDown}
                        onPointerUp={handleSliderPointerUp}
                    />
                )}
                <SpinButton
                    {...passthroughProps}
                    className={useCompactSizing ? classes.compactSpinButton : classes.spinButton}
                    inputClassName={useCompactSizing ? classes.compactSpinButtonInput : classes.spinButtonInput}
                    value={value}
                    onChange={handleInputChange}
                    step={props.step}
                    disabled={props.disabled}
                    disableDragButton
                />
            </div>
        </div>
    );
};
