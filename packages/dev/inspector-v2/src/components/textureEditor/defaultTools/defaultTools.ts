import { Paintbrush } from "./paintbrush";
import { Eyedropper } from "./eyedropper";
import { Floodfill } from "./floodfill";
import { RectangleSelect } from "./rectangleSelect";
import { Contrast } from "./contrast";

export { Paintbrush, Eyedropper, Floodfill, RectangleSelect, Contrast };

/**
 * Default tools for the texture editor
 */
export const DefaultTools = [RectangleSelect, Paintbrush, Eyedropper, Floodfill, Contrast];
