import { type PropertyLineProps, PropertyLine, SplitPropertyLineProps } from "./propertyLine";
import { type SyncedSliderProps, SyncedSliderInput } from "../primitives/syncedSlider";

export type SyncedSliderLineProps<O, K> = PropertyLineProps &
    Omit<SyncedSliderProps, "value" | "onChange"> & {
        /**
         * String key
         */
        validKey: K;
        /**
         * Object where O[K] is a number
         */
        obj: O;
        /**
         * Callback when either the slider or input value changes
         */
        onChange?: (value: number) => void;
    };

/**
 * Renders a SyncedSlider within a PropertyLine for a given key/value pair, where the value is number (ex: can be used for a color's RGBA values, a vector's XYZ values, etc)
 * When value changes, updates the object with the new value and calls the onChange callback.
 *
 * Example usage looks like
 *    \<SyncedSliderLine validKey="x" obj=\{vector\} /\>
 *    \<SyncedSliderLine validKey="r" obj=\{color\} /\>
 * @param props
 * @returns
 */
export const SyncedSliderLine = <O extends Record<K, number>, K extends string>(props: SyncedSliderLineProps<O, K>): React.ReactElement => {
    const [property, slider] = SplitPropertyLineProps(props);
    return (
        <PropertyLine {...property}>
            <SyncedSliderInput
                {...slider}
                value={props.obj[props.validKey]}
                onChange={(val) => {
                    props.obj[props.validKey] = val as O[K];
                    props.onChange?.(val);
                }}
            />
        </PropertyLine>
    );
};
