import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import { SyncedSliderInput } from "../primitives/syncedSlider";
import type { SyncedSliderProps } from "../primitives/syncedSlider";

export type SyncedSliderLineProps<O, K> = PropertyLineProps &
    Omit<SyncedSliderProps, "value" | "onChange"> & {
        /**
         * String key
         */
        propertyKey: K;
        /**
         * target where O[K] is a number
         */
        target: O;
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
 *    \<SyncedSliderLine propertyKey="x" target=\{vector\} /\>
 *    \<SyncedSliderLine propertyKey="r" target=\{color\} /\>
 * @param props
 * @returns
 */
export const SyncedSliderLine = <O extends Record<K, number>, K extends PropertyKey>(props: SyncedSliderLineProps<O, K>): React.ReactElement => {
    return (
        <PropertyLine {...props}>
            <SyncedSliderInput
                {...props}
                value={props.target[props.propertyKey]}
                onChange={(val) => {
                    props.target[props.propertyKey] = val as O[K];
                    props.onChange?.(val);
                }}
            />
        </PropertyLine>
    );
};
