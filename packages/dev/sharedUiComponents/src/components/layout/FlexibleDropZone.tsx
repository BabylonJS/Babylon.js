import type { FC } from "react";
import style from "./FlexibleDropZone.modules.scss";
import { FlexibleResizeBar } from "./FlexibleResizeBar";
import { ResizeDirections } from "./types";

export interface IFlexibleDropZoneProps {
    rowNumber: number;
    columnNumber: number;
}

export const FlexibleDropZone: FC<IFlexibleDropZoneProps> = (props) => {
    return (
        <div className={style.flexibleDropZoneContainer}>
            {props.children}
            <FlexibleResizeBar rowNumber={props.rowNumber} columnNumber={props.columnNumber} direction={ResizeDirections.COLUMN} />
            <FlexibleResizeBar rowNumber={props.rowNumber} columnNumber={props.columnNumber} direction={ResizeDirections.ROW} />
        </div>
    );
};
