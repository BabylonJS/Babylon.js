import type { SliderOnChangeData } from "@fluentui/react-components";
import { makeStyles, Slider, tokens } from "@fluentui/react-components";
import { SpinButton } from "./spinButton";
import type { ChangeEvent, FunctionComponent } from "react";
import { useEffect, useState, useRef } from "react";
import type { PrimitiveProps } from "./primitive";

const useSyncedSliderStyles = makeStyles({
    syncedSlider: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXXS, // 2px
        width: "100%", // Only fill available space
    },
    slider: {
        flexGrow: 1, // Let slider grow
        minWidth: "40px", // Minimum width for slider to remain usable
    },
    spinButton: {
        width: "60px",
    },
});

export type SyncedSliderProps = PrimitiveProps<number> & {
    /** Minimum value for the slider */
    min?: number;
    /** Maximum value for the slider */
    max?: number;
    /** Step size for the slider */
    step?: number;
    /** Displayed in the ux to indicate unit of measurement */
    unit?: string;
    /** When true, onChange is only called when the user releases the slider, not during drag */
    notifyOnlyOnRelease?: boolean;
};

/**
 * Component which synchronizes a slider and an input field, allowing the user to change the value using either control
 * @param props
 * @returns SyncedSlider component
 */
export const SyncedSliderInput: FunctionComponent<SyncedSliderProps> = (props) => {
    const classes = useSyncedSliderStyles();
    const [value, setValue] = useState<number>(props.value);
    const pendingValueRef = useRef<number>(undefined);
    const isDraggingRef = useRef(false);

    // NOTE: The Fluent slider will add tick marks if the step prop is anything other than undefined.
    // To avoid this, we scale the min/max based on the step so we can always make step undefined.
    // The actual step size in the Fluent slider is 1 when it is ste to undefined.
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const step = props.step ?? 1;

    useEffect(() => {
        !isDraggingRef.current && setValue(props.value ?? ""); // Update local state when props.value changes as long as user is not actively dragging
    }, [props.value]);

    const handleSliderChange = (_: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
        const newValue = data.value * step;
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

    return (
        <div className={classes.syncedSlider}>
            {props.min !== undefined && props.max !== undefined && (
                <Slider
                    {...props}
                    size="small"
                    className={classes.slider}
                    min={min / step}
                    max={max / step}
                    step={undefined}
                    value={value / step}
                    onChange={handleSliderChange}
                    onPointerDown={handleSliderPointerDown}
                    onPointerUp={handleSliderPointerUp}
                />
            )}
            <SpinButton {...props} className={classes.spinButton} value={Math.round(value / step) * step} onChange={handleInputChange} step={props.step} />
        </div>
    );
};
