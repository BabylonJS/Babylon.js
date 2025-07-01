import { PropertyLine } from "./propertyLine";
import type { PropertyLineProps } from "./propertyLine";
import { SyncedSliderInput } from "../primitives/syncedSlider";
import type { SyncedSliderProps } from "../primitives/syncedSlider";
import type { FunctionComponent } from "react";

type SyncedSliderLineProps = SyncedSliderProps & PropertyLineProps;
/**
 * Renders a simple wrapper around the SyncedSliderInput
 * @param props
 * @returns
 */
export const SyncedSliderLine: FunctionComponent<SyncedSliderLineProps> = (props): React.ReactElement => {
    const { label, description, ...sliderProps } = props;
    return (
        <PropertyLine label={label} description={description}>
            <SyncedSliderInput {...sliderProps} />
        </PropertyLine>
    );
};
