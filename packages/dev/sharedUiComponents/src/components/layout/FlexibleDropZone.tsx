import type { FC } from "react";
import style from "./FlexibleDropZone.modules.scss";
import { FlexibleResizeBar } from "./FlexibleResizeBar";
import { ResizeDirections } from "./types";

/**
 * Arguments for the FlexibleDropZone component.
 */
export interface IFlexibleDropZoneProps {
    /**
     * The row number of the component in the layout
     */
    rowNumber: number;
    /**
     * The column number of the component in the layout
     */
    columnNumber: number;
}

/**
 * This component contains the drag and drop zone for the resize bars that
 * allow redefining width and height of layout elements
 * @param props properties
 * @returns drop zone element
 */
export const FlexibleDropZone: FC<IFlexibleDropZoneProps> = (props) => {
    return (
        <div className={style.flexibleDropZoneContainer}>
            {props.children}
            <FlexibleResizeBar rowNumber={props.rowNumber} columnNumber={props.columnNumber} direction={ResizeDirections.COLUMN} />
            <FlexibleResizeBar rowNumber={props.rowNumber} columnNumber={props.columnNumber} direction={ResizeDirections.ROW} />
        </div>
    );
};
