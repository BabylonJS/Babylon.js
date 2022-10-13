import type { FC } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ClassNames } from "../classNames";
import { ElementTypes } from "./types";
import style from "./FlexibleTab.modules.scss";

interface IFlexibleTabProps {
    title: string;
    selected: boolean;
    onClick: () => void;
    item: any;
    onTabDroppedAction: (item: any) => void;
}

export const FlexibleTab: FC<IFlexibleTabProps> = (props) => {
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: ElementTypes.TAB,
            item: props.item,
            collect(monitor) {
                return {
                    isDragging: !!monitor.isDragging(),
                };
            },
        }),
        [props.item]
    );

    const [{ isOver, canDrop }, drop] = useDrop(
        () => ({
            accept: ElementTypes.TAB,
            drop: (item: any, monitor) => {
                props.onTabDroppedAction(item);
            },
            collect(monitor) {
                return {
                    isOver: !!monitor.isOver(),
                    canDrop: !!monitor.canDrop(),
                };
            },
        }),
        [props.onTabDroppedAction]
    );
    return (
        <div className={ClassNames({ tab: true, tabSelected: props.selected, tabGrabbed: isDragging, tabNormal: !props.selected && !isDragging }, style)}>
            <div ref={drag} className={style.tabText} onClick={props.onClick}>
                {props.title}
            </div>
            <div className={ClassNames({ dropZone: true, dropZoneCanDrop: canDrop }, style)} ref={drop}></div>
            <div className={ClassNames({ dropBarIndicator: true, dropBarIndicatorOver: isOver }, style)}></div>
        </div>
    );
};
