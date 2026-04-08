import { PropertyLine, type PropertyLineProps } from "./propertyLine";
import { SyncedSliderInput, type SyncedSliderProps } from "../../primitives/syncedSlider";
import { forwardRef } from "react";
import { makeStyles, mergeClasses } from "@fluentui/react-components";
import { UniformWidthStyling } from "../../primitives/utils";

const useStyles = makeStyles({
    uniformWidth: {
        ...UniformWidthStyling,
    },
});

type SyncedSliderPropertyProps = SyncedSliderProps & PropertyLineProps<number>;
/**
 * Renders a simple wrapper around the SyncedSliderInput
 * @param props
 * @returns
 */
export const SyncedSliderPropertyLine = forwardRef<HTMLDivElement, SyncedSliderPropertyProps>((props, ref): React.ReactElement => {
    SyncedSliderPropertyLine.displayName = "SyncedSliderPropertyLine";
    const classes = useStyles();
    const { label, description, ...sliderProps } = props;
    return (
        <PropertyLine ref={ref} {...props}>
            <SyncedSliderInput {...sliderProps} className={mergeClasses(classes.uniformWidth, props.className)} />
        </PropertyLine>
    );
});
