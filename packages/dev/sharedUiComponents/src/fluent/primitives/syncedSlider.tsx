import { InputProps, makeStyles, Slider, SliderProps } from "@fluentui/react-components";
import { Input } from "./input";
import { FunctionComponent, useState } from "react";

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
    onChange: (value: number) => void; // Callback to notify parent of value change, override both of the slider/input handlers
    value: number; // Controlled value for the slider and input
};

/**
 * Component which synchronizes a slider and an input field, allowing the user to change a value using either control
 * @param props
 * @returns
 */
export const SyncedSliderInput: FunctionComponent<SyncedSliderProps> = (props: SyncedSliderProps) => {
    const styles = useSyncedSliderStyles();
    const [value, setValue] = useState<number>(props.value);
    const handleSliderChange = (_: any, data: { value: number }) => {
        setValue(data.value);
        props.onChange(data.value); // Notify parent
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        if (!isNaN(newValue)) {
            setValue(newValue);
            props.onChange(newValue); // Notify parent
        }
    };

    return (
        <div className={styles.syncedSlider}>
            <Slider {...props} className={styles.slider} value={value} onChange={handleSliderChange} />
            <Input {...props} type="number" value={value.toString()} onChange={handleInputChange} />
        </div>
    );
};
