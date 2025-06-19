import type { InputProps, SliderOnChangeData, SliderProps } from "@fluentui/react-components";
import { makeStyles, Slider } from "@fluentui/react-components";
import { Input } from "./input";
import type { ChangeEvent, FunctionComponent } from "react";
import { useEffect, useState } from "react";

const useSyncedSliderStyles = makeStyles({
    syncedSlider: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
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

export type SyncedSliderProps = Omit<InputProps & SliderProps, "onChange" | "value"> & {
    /**
     * Callback to notify parent of value change, override both of the slider/input handlers
     */
    onChange: (value: number) => void;
    /**
     * Controlled value for the slider and input
     */
    value: number;
};

/**
 * Component which synchronizes a slider and an input field, allowing the user to change a value using either control
 * @param props
 * @returns SyncedSlider component
 */
export const SyncedSliderInput: FunctionComponent<SyncedSliderProps> = (props) => {
    const { value: valueProp, ...otherProps } = props;
    const classes = useSyncedSliderStyles();
    const [value, setValue] = useState<number>(valueProp);

    useEffect(() => {
        setValue(valueProp ?? ""); // Update local state when props.value changes
    }, [valueProp]);

    const handleSliderChange = (_: ChangeEvent<HTMLInputElement>, data: SliderOnChangeData) => {
        setValue(data.value);
        props.onChange(data.value); // Notify parent
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        if (!isNaN(newValue)) {
            setValue(newValue);
            props.onChange(newValue); // Notify parent
        }
    };

    return (
        <div className={classes.syncedSlider}>
            {props.min != undefined && props.max != undefined && <Slider {...props} className={classes.slider} value={value} onChange={handleSliderChange} step={undefined} />}
            <Input {...otherProps} className={classes.input} type="number" appearance="filled-lighter" value={value.toFixed(2)} onChange={handleInputChange} />
        </div>
    );
};
