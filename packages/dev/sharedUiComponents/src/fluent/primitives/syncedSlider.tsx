import type { SliderOnChangeData } from "@fluentui/react-components";
import { makeStyles, Slider, tokens } from "@fluentui/react-components";
import { Input } from "./input";
import type { ChangeEvent, FunctionComponent } from "react";
import { useEffect, useState } from "react";
import type { BaseComponentProps } from "../hoc/propertyLine";

const useSyncedSliderStyles = makeStyles({
    syncedSlider: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXXS, // 2px
        width: "100%", // Only fill available space
    },
    slider: {
        flexGrow: 1, // Let slider grow
        minWidth: 0, // Allow shrink if needed
    },
    input: {
        width: "80px", // Fixed width for number input
        flexShrink: 0,
    },
});

export type SyncedSliderProps = BaseComponentProps<number> & {
    min?: number;
    max?: number;
    step?: number;
};

/**
 * Component which synchronizes a slider and an input field, allowing the user to change a value using either control
 * @param props
 * @returns SyncedSlider component
 */
export const SyncedSliderInput: FunctionComponent<SyncedSliderProps> = (props) => {
    const classes = useSyncedSliderStyles();
    const [value, setValue] = useState<number>(props.value);

    // NOTE: The Fluent slider will add tick marks if the step prop is anything other than undefined.
    // To avoid this, we scale the min/max based on the step so we can always make step undefined.
    // The actual step size in the Fluent slider is 1 when it is ste to undefined.
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const step = props.step ?? 1;

    useEffect(() => {
        setValue(props.value ?? ""); // Update local state when props.value changes
    }, [props.value]);

    const handleSliderChange = (_: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
        const value = data.value * step;
        setValue(value);
        props.onChange(value); // Notify parent
    };

    const handleInputChange = (value: string | number) => {
        const newValue = Number(value);
        if (!isNaN(newValue)) {
            setValue(newValue);
            props.onChange(newValue); // Notify parent
        }
    };

    return (
        <div className={classes.syncedSlider}>
            {props.min !== undefined && props.max !== undefined && (
                <Slider {...props} size="small" className={classes.slider} min={min / step} max={max / step} step={undefined} value={value / step} onChange={handleSliderChange} />
            )}
            <Input {...props} className={classes.input} value={Math.round(value / step) * step} onChange={handleInputChange} step={step} />
        </div>
    );
};
