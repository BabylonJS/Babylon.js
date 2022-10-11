import type { FC } from "react";
import { useDrag } from "react-dnd";

export interface IDraggableIconProps {
    src: any;
    item: any;
    type: any;
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
