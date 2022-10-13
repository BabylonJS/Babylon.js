import type { FC } from "react";
import { useDrag } from "react-dnd";
import { ResizeDirections, ElementTypes } from "./types";
import { ClassNames } from "../classNames";
import style from "./FlexibleResizeBar.modules.scss";

export interface IFlexibleRowResizerProps {
    rowNumber: number;
    columnNumber: number;
    direction: ResizeDirections;
}

export type ResizeItem = {
    direction: ResizeDirections;
    rowNumber: number;
    columnNumber: number;
};

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
