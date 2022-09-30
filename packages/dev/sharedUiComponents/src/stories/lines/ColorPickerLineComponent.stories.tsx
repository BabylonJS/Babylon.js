import { Color3 } from "core/Maths/math.color";
import type { IColorPickerComponentProps } from "../../components/lines/ColorPickerLineComponent";
import { ColorPickerLineComponent } from "../../components/lines/ColorPickerLineComponent";

export default {
    component: ColorPickerLineComponent,
};

export const Default = {
    render: (args: IColorPickerComponentProps) => (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <ColorPickerLineComponent {...args} />
        </div>
    ),
    args: { value: new Color3(1, 0, 0) },
};
