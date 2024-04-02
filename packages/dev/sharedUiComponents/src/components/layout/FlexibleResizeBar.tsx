import type { FC } from "react";
import { useDrag } from "react-dnd";
import { ResizeDirections, ElementTypes } from "./types";
import { ClassNames } from "../classNames";
import style from "./FlexibleResizeBar.modules.scss";

/**
 * Arguments for the ResizeBar component.
 */
export interface IFlexibleRowResizerProps {
    /**
     * Row number of the component that is being resized
     */
    rowNumber: number;
    /**
     * Column number of the component being resized
     */
    columnNumber: number;
    /**
     * If the resizing happens in row or column direction
     */
    direction: ResizeDirections;
}

/**
 * The item that will be sent to the drag event
 */
export type ResizeItem = {
    /**
     * If the resizing happens in row or column direction
     */
    direction: ResizeDirections;
    /**
     * The row number of the component that is being resized
     */
    rowNumber: number;
    /**
     * the column number of the component being resized
     */
    columnNumber: number;
};

/**
 * A component that renders a bar that the user can drag to resize.
 * @param props properties
 * @returns resize bar element
 */
export const FlexibleResizeBar: FC<IFlexibleRowResizerProps> = (props) => {
    const [_, drag] = useDrag(() => ({
        type: ElementTypes.RESIZE_BAR,
        item: { direction: props.direction, rowNumber: props.rowNumber, columnNumber: props.columnNumber },
        collect(monitor) {
            return {
                isDragging: !!monitor.isDragging(),
            };
        },
    }));
    return (
        <div
            className={ClassNames({ rowDragHandler: props.direction === ResizeDirections.ROW, columnDragHandler: props.direction === ResizeDirections.COLUMN }, style)}
            ref={drag}
        />
    );
};
