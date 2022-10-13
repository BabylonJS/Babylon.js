import type { FC } from "react";
import { useDrag } from "react-dnd";
import type { ElementTypes, TabDrag } from "./types";

export interface IDraggableIconProps {
    src: string;
    item: TabDrag;
    type: ElementTypes;
}

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
