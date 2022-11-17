import { Color3 } from "core/Maths/math.color";
import type { IColorPickerComponentProps } from "../../components/lines/ColorPickerLineComponent";
import { ColorPickerLineComponent } from "../../components/lines/ColorPickerLineComponent";
import type { StoryObj } from "@storybook/react";

export default {
    component: ColorPickerLineComponent,
};

export const Default: StoryObj<typeof ColorPickerLineComponent> = {
    render: (args: IColorPickerComponentProps) => (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <ColorPickerLineComponent {...args} />
        </div>
    ),
    args: { value: new Color3(1, 0, 0) },
};
