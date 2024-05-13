import { Color3 } from "core/Maths/math.color";
import { ColorPickerComponent } from "../../components/colorPicker/ColorPicker";
import type { StoryObj } from "@storybook/react";

export default { component: ColorPickerComponent };

export const Default: StoryObj<typeof ColorPickerComponent> = { args: { color: new Color3(1, 0, 0) } };
