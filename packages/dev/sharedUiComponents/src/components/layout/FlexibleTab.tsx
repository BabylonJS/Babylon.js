import type { FC } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ClassNames } from "../classNames";
import { ElementTypes } from "./types";
import type { TabDrag } from "./types";
import style from "./FlexibleTab.modules.scss";

/**
 * Arguments for the FlexibleTab component.
 */
export interface IFlexibleTabProps {
    /**
     * The tab's title.
     */
    title: string;
    /**
     * If the tab is currently selected or not
     */
    selected: boolean;
    /**
     * What happens when the user clicks on the tab
     */
    onClick: () => void;
    /**
     * The object that will be sent to the drag event
     */
    item: TabDrag;
    /**
     * What happens when the user drops another tab after this one
     */
    onTabDroppedAction: (item: TabDrag) => void;
}

/**
 * A component that renders a tab that the user can click
 * to activate or drag to reorder. It also listens for
 * drop events if the user wants to drop another tab
 * after it.
 * @param props properties
 * @returns FlexibleTab element
 */
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
