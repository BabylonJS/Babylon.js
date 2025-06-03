import { IPropertyLineProps, PropertyLine } from "./propertyLine";
import { SyncedSliderInput, SyncedSliderProps } from "../primitives/syncedSlider";

type KeyOf<O> = string & keyof O;
export type SyncedSliderLineProps<O, K extends KeyOf<O>> = Omit<IPropertyLineProps, "children"> &
    Omit<SyncedSliderProps, "value" | "onChange"> & {
        validKey: K;
        obj: O;
        onChange?: (value: number) => void;
    };

/**
 * Renders a SyncedSlider within a PropertyLine for a given key/value pair, where the value is number (ex: can be used for a color's RGBA values, a vector's XYZ values, etc)
 * When value changes, updates the object with the new value and calls the onChange callback.
 *
 * Example usage looks like
 *    <SyncedSliderLine key="x" obj={vector} />
 *    <SyncedSliderLine key="r" obj={color} />
 * @param param0
 * @returns
 */

export const SyncedSliderLine = <O extends Record<K, number>, K extends KeyOf<O>>(props: SyncedSliderLineProps<O, K>): React.ReactElement => {
    return (
        <PropertyLine {...props}>
            <SyncedSliderInput
                {...props}
                value={props.obj[props.validKey]}
                onChange={(val) => {
                    props.obj[props.validKey] = val as O[K];
                    props.onChange?.(val);
                }}
            />
        </PropertyLine>
    );
};
