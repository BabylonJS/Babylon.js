// eslint-disable-next-line import/no-internal-modules
import { Color3, Color4 } from "core/index";

import { IPropertyLineProps, PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { SyncedSliderLine } from "./syncedSliderLine";
import { FunctionComponent } from "react";

type IColorPropertyLineProps = Omit<IPropertyLineProps, "children"> & {
    color: Color3 | Color4;
};

/**
 * Reusable component which renders a color property line containing a label, colorPicker popout, and expandable RGBA values
 * The expandable RGBA values are synced sliders that allow the user to modify the color's RGBA values directly
 */
export const ColorPropertyLine: FunctionComponent<IColorPropertyLineProps> = (props: IColorPropertyLineProps) => {
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
            {props.color.toString()}
        </PropertyLine>
    );
};
