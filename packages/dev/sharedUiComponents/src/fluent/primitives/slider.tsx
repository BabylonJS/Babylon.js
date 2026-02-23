import type { SliderOnChangeData } from "@fluentui/react-components";
import { Slider as FluentSlider } from "@fluentui/react-components";
import type { ChangeEvent, FunctionComponent } from "react";
import { useEffect, useState, useRef, useContext } from "react";
import type { PrimitiveProps } from "./primitive";
import { ToolContext } from "../hoc/fluentToolWrapper";

export type SliderProps = PrimitiveProps<number> & {
    /** Minimum value for the slider */
    min?: number;
    /** Maximum value for the slider */
    max?: number;
    /** Step size for the slider */
    step?: number;
    /** When true, onChange is only called when the user releases the slider, not during drag */
    notifyOnlyOnRelease?: boolean;
    /** Optional pointer down handler */
    onPointerDown?: () => void;
    /** Optional pointer up handler */
    onPointerUp?: () => void;
};

/**
 * A slider primitive that wraps the Fluent UI Slider with step scaling, drag tracking, and optional notify-on-release behavior.
 * Follows the same pattern as other primitives (e.g. Switch) — no wrapper divs, just the Fluent component with logic.
 * @param props
 * @returns Slider component
 */
export const Slider: FunctionComponent<SliderProps> = (props) => {
    Slider.displayName = "Slider";
    const { size } = useContext(ToolContext);
    const [value, setValue] = useState<number>(props.value ?? 0);
    const pendingValueRef = useRef<number>(undefined);
    const isDraggingRef = useRef(false);

    // NOTE: The Fluent slider will add tick marks if the step prop is anything other than undefined.
    // To avoid this, we scale the min/max based on the step so we can always make step undefined.
    // The actual step size in the Fluent slider is 1 when it is set to undefined.
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const step = props.step ?? 1;

    useEffect(() => {
        !isDraggingRef.current && setValue(props.value ?? 0); // Update local state when props.value changes as long as user is not actively dragging
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

    return (
        <FluentSlider
            className={props.className}
            size={size}
            min={min / step}
            max={max / step}
            step={undefined}
            value={value / step}
            disabled={props.disabled}
            onChange={handleSliderChange}
            onPointerDown={() => {
                handleSliderPointerDown();
                props.onPointerDown?.();
            }}
            onPointerUp={() => {
                handleSliderPointerUp();
                props.onPointerUp?.();
            }}
        />
    );
};
