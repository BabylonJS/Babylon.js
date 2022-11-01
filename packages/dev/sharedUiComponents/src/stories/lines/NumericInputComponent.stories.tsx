import { NumericInputComponent } from "../../components/lines/NumericInputComponent";
import type { ComponentStory } from "@storybook/react";

export default { component: NumericInputComponent };

export const Default: ComponentStory<typeof NumericInputComponent> = {
    args: { label: "test", value: 1 },
};
