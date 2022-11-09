import { Vector2 } from "core/Maths/math";
import type { Nullable } from "core/types";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { useDragLayer } from "react-dnd";
/**
 * This component handles the rendering and interaction with nodes on the graph
 */
export interface IGraphContainerProps {
    onNodeMoved: (id: string, x: number, y: number) => void;
    id: string;
}

export const GraphNodesContainer: FC<IGraphContainerProps> = (props) => {
    const lastDragPos = useRef<Nullable<Vector2>>(null);

    const { currentOffset, item, isDragging } = useDragLayer((monitor) => ({
        currentOffset: monitor.getSourceClientOffset(),
        item: monitor.getItem(),
        isDragging: monitor.isDragging(),
    }));

    useEffect(() => {
        if (currentOffset && item) {
            // console.log("currentOffset", currentOffset);
            if (lastDragPos.current) {
                const delta = new Vector2(currentOffset.x, currentOffset.y).subtract(lastDragPos.current);
                console.log("delta", delta);
                props.onNodeMoved?.(item.id, delta.x, delta.y);
            }
            lastDragPos.current = new Vector2(currentOffset.x, currentOffset.y);
        }
    }, [currentOffset, item]);
    useEffect(() => {
        if (!isDragging) {
            // console.log("clear lastDragPos");
            lastDragPos.current = null;
        }
    }, [isDragging]);
    return <div>{props.children}</div>;
};
