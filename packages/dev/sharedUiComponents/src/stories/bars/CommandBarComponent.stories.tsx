import { CommandBarComponent } from "../../components/bars/CommandBarComponent";

export default { component: CommandBarComponent };

// Default rendering function.
export const Default = {};

const artBoardColorChange = (color: string) => {
    console.log("new color", color);
};

// With Artboard color
export const WithArtboardColor = {
    ...Default,
    parameters: { onArtboardColorChanged: artBoardColorChange },
};
