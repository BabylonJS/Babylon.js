import { CommandBarComponent } from "../../components/bars/CommandBarComponent";
import type { StoryObj } from "@storybook/react";

export default { component: CommandBarComponent };

// Default rendering function.
export const Default: StoryObj<typeof CommandBarComponent> = {};

const artBoardColorChange = (color: string) => {
    // eslint-disable-next-line no-console
    console.log("new color", color);
};

// With Artboard color
export const WithArtboardColor: StoryObj<typeof CommandBarComponent> = {
    ...Default,
    parameters: { onArtboardColorChanged: artBoardColorChange },
};
