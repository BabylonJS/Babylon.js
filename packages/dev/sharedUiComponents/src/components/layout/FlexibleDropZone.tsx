import type { FC } from "react";
import { DRAGCLASS, ELEMENTCLASS, ROWCLASS, ElementTypes, COLCLASS } from "./constants";
import style from "./FlexibleDropZone.modules.scss";

export interface IFlexibleDropZoneProps {
    rowNumber: number;
    columnNumber: number;
}

export const FlexibleDropZone: FC<IFlexibleDropZoneProps> = (props) => {
    return (
        <div className={style.flexibleDropZoneContainer}>
            {/* <div id="topDropZone" className={style.topDropZone}></div>
            <div id="bottomDropZone" className={style.bottomDropZone}></div>
            <div id="leftDropZone" className={style.leftDropZone}></div>
            <div id="rightDropZone" className={style.rightDropZone}></div>
            <div id="centerDropZone" className={style.centerDropZone}></div> */}
            {props.children}
            <div
                draggable={false}
                className={style.rowDragHandler + " " + DRAGCLASS}
                {...{ [ELEMENTCLASS]: ElementTypes.RESIZE_ROW, [ROWCLASS]: props.rowNumber, [COLCLASS]: props.columnNumber }}
            />
            <div
                draggable={false}
                className={style.columnDragHandler + " " + DRAGCLASS}
                {...{ [ELEMENTCLASS]: ElementTypes.RESIZE_COLUMN, [ROWCLASS]: props.rowNumber, [COLCLASS]: props.columnNumber }}
            />
        </div>
    );
};
