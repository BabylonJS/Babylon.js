// Class that marks a draggable HTML element
export const DRAGCLASS = "draggable";

// Class that registers what is the element moused over
export const ELEMENTCLASS = "data-element-class";

// Class that registers what is the row and column of the element
export const ROWCLASS = "data-row-index";
export const COLCLASS = "data-column-index";

export enum ElementTypes {
    RESIZE_BAR = "0",
    TAB = "2",
    NONE = "3",
}

export enum ResizeDirections {
    ROW = "row",
    COLUMN = "column",
}
