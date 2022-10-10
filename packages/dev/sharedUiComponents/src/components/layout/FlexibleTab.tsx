import type { FC } from "react";
import { useDrag } from "react-dnd";
import { ClassNames } from "../classNames";
import { ElementTypes } from "./types";
import style from "./FlexibleTab.modules.scss";

interface IFlexibleTabProps {
    title: string;
    selected: boolean;
    onClick?: () => void;
}

export const FlexibleTab: FC<IFlexibleTabProps> = (props) => {
    const [, drag] = useDrag(() => ({
        type: ElementTypes.TAB,
        collect(monitor) {
            return {
                isDragging: !!monitor.isDragging(),
            };
        },
    }));
    return (
        <div ref={drag} className={ClassNames({ tab: true, selected: props.selected }, style)} onClick={props.onClick}>
            {props.title}
        </div>
    );
};
