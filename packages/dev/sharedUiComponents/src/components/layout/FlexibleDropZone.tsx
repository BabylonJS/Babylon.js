import type { FC } from "react";
import { DRAGCLASS } from "./FlexibleGridLayout";
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
                id="bottomDragHandler"
                className={style.bottomDragHandler + " " + DRAGCLASS}
                data-row-number={props.rowNumber}
                data-column-number={props.columnNumber}
            ></div>
        </div>
    );
};
