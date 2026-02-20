import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import { Slider } from "../../primitives/slider";
import type { SliderProps } from "../../primitives/slider";
import { forwardRef } from "react";

type SliderPropertyProps = SliderProps & PropertyLineProps<number>;
/**
 * Renders a simple wrapper around the Slider
 * @param props
 * @returns
 */
export const SliderPropertyLine = forwardRef<HTMLDivElement, SliderPropertyProps>((props, ref): React.ReactElement => {
    SliderPropertyLine.displayName = "SliderPropertyLine";
    const { label, description, ...sliderProps } = props;
    return (
        <PropertyLine ref={ref} {...props}>
            <Slider {...sliderProps} />
        </PropertyLine>
    );
});
