import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import { SyncedSliderInput } from "../../primitives/syncedSlider";
import type { SyncedSliderProps } from "../../primitives/syncedSlider";
import { forwardRef } from "react";

type SyncedSliderPropertyProps = SyncedSliderProps & PropertyLineProps<number>;
/**
 * Renders a simple wrapper around the SyncedSliderInput
 * @param props
 * @returns
 */
export const SyncedSliderPropertyLine = forwardRef<HTMLDivElement, SyncedSliderPropertyProps>((props, ref): React.ReactElement => {
    const { label, description, ...sliderProps } = props;
    return (
        <PropertyLine ref={ref} {...props}>
            <SyncedSliderInput {...sliderProps} />
        </PropertyLine>
    );
});
