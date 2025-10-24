import type { SliderOnChangeData } from "@fluentui/react-components";
import { makeStyles, Slider } from "@fluentui/react-components";
import { SpinButton } from "./spinButton";
import type { ChangeEvent, FunctionComponent } from "react";
import { useEffect, useState, useRef, useContext } from "react";
import type { PrimitiveProps } from "./primitive";
import { InfoLabel } from "./infoLabel";
import { CustomTokens } from "./utils";
import { ToolContext } from "../hoc/fluentToolWrapper";

const useSyncedSliderStyles = makeStyles({
    container: { display: "flex" },
    syncedSlider: {
        flex: "1 1 0",
        flexDirection: "row",
        display: "flex",
        alignItems: "center",
    },
    slider: {
        minWidth: CustomTokens.sliderMinWidth, // Minimum width for slider to remain usable
        maxWidth: CustomTokens.sliderMaxWidth,
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
    SyncedSliderInput.displayName = "SyncedSliderInput";
    const { infoLabel, ...passthroughProps } = props;
    const classes = useSyncedSliderStyles();
    const { size } = useContext(ToolContext);
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
        <div className={classes.container}>
            {infoLabel && <InfoLabel {...infoLabel} htmlFor={"syncedSlider"} />}
            <div id="syncedSlider" className={classes.syncedSlider}>
                {props.min !== undefined && props.max !== undefined && (
                    <Slider
                        {...passthroughProps}
                        className={classes.slider}
                        size={size}
                        min={min / step}
                        max={max / step}
                        step={undefined}
                        value={value / step}
                        onChange={handleSliderChange}
                        onPointerDown={handleSliderPointerDown}
                        onPointerUp={handleSliderPointerUp}
                    />
                )}
                <SpinButton {...passthroughProps} value={value} onChange={handleInputChange} step={props.step} />
            </div>
        </div>
    );
};
