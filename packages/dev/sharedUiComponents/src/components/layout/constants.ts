// Class that marks a draggable HTML element
export const DRAGCLASS = "draggable";

// Class that registers what operation this element executes
export const OPERATIONCLASS = "data-operation-type";

// Class that registers what is the row and column of the element
export const ROWCLASS = "data-row-index";
export const COLCLASS = "data-column-index";

export enum OperationTypes {
    RESIZE_ROW = "0",
    RESIZE_COLUMN = "1",
    CLICK_TAB = "2",
    NONE = "3",
}
