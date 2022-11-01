import { CommandBarComponent } from "../../components/bars/CommandBarComponent";
import type { ComponentStory } from "@storybook/react";

export default { component: CommandBarComponent };

// Default rendering function.
export const Default: ComponentStory<typeof CommandBarComponent> = {};

const artBoardColorChange = (color: string) => {
    console.log("new color", color);
};

// With Artboard color
export const WithArtboardColor: ComponentStory<typeof CommandBarComponent> = {
    ...Default,
    parameters: { onArtboardColorChanged: artBoardColorChange },
};
