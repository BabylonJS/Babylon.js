import type { FC } from "react";
import { useDrag } from "react-dnd";
import type { ElementTypes, TabDrag } from "./types";

/**
 * Arguments for the DraggableIcon component.
 */
export interface IDraggableIconProps {
    /**
     * Icon source
     */
    src: string;
    /**
     * Object that will be passed to the drag event
     */
    item: TabDrag;
    /**
     * Type of drag event
     */
    type: ElementTypes;
}

/**
 * An icon that can be dragged by the user
 * @param props properties
 * @returns draggable icon element
 */
export const DraggableIcon: FC<IDraggableIconProps> = (props) => {
    const [, drag] = useDrag(() => ({
        type: props.type,
        item: props.item,
        collect(monitor) {
            return {
                isDragging: !!monitor.isDragging(),
            };
        },
    }));
    return <img ref={drag} src={props.src} />;
};
