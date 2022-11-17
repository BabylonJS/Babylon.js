import { NumericInputComponent } from "../../components/lines/NumericInputComponent";
import type { StoryObj } from "@storybook/react";

export default { component: NumericInputComponent };

export const Default: StoryObj<typeof NumericInputComponent> = {
    args: { label: "test", value: 1 },
};
