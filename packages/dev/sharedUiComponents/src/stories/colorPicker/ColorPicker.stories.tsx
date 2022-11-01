import { Color3 } from "core/Maths/math.color";
import { ColorPicker } from "../../components/colorPicker/ColorPicker";
import type { ComponentStory } from "@storybook/react";

export default { component: ColorPicker };

export const Default: ComponentStory<typeof ColorPicker> = { args: { color: new Color3(1, 0, 0) } };
