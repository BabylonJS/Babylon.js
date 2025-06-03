// eslint-disable-next-line import/no-internal-modules
import { type Color3, Color4 } from "core/index";

import { type PropertyLineProps, PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { SyncedSliderLine } from "./syncedSliderLine";
import type { FunctionComponent } from "react";

type ColorPropertyLineProps = Omit<PropertyLineProps, "children"> & {
    color: Color3 | Color4;
};

/**
 * Reusable component which renders a color property line containing a label, colorPicker popout, and expandable RGBA values
 * The expandable RGBA values are synced sliders that allow the user to modify the color's RGBA values directly
 * @param props - PropertyLine props, replacing children with a color object so that we can properly display the color
 * @returns Component wrapping a colorPicker component (coming soon) with a property line
 */
export const ColorPropertyLine: FunctionComponent<ColorPropertyLineProps> = (props: ColorPropertyLineProps) => {
    const renderRGBExpand = (color: Color3 | Color4) => {
        return (
            <>
                <SyncedSliderLine label="R" validKey="r" obj={color} min={0} max={255} />
                <SyncedSliderLine label="G" validKey="g" obj={color} min={0} max={255} />
                <SyncedSliderLine label="B" validKey="b" obj={color} min={0} max={255} />
                {color instanceof Color4 && <SyncedSliderLine label="A" validKey="a" obj={color} min={0} max={1} />}
            </>
        );
    };
    return (
        <PropertyLine {...props} renderExpandedContent={() => renderRGBExpand(props.color)}>
            {
                props.color.toString()
                // Will replace with colorPicker in future PR
            }
        </PropertyLine>
    );
};
