import { Color3 } from "core/Maths/math.color";
import { ColorPickerLineComponent } from "../../components/lines/ColorPickerLineComponent";

export default {
    component: ColorPickerLineComponent,
};

export const Default = { args: { value: new Color3(1, 0, 0) } };
