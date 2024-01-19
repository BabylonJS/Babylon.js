import { Vector2 } from "core/Maths/math";
import type { Nullable } from "core/types";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { useDragLayer } from "react-dnd";
export interface IGraphContainerProps {
    onNodeMoved: (id: string, x: number, y: number) => void;
    id: string;
}

/**
 * This component contains all the nodes and handles their dragging
 * @param props properties
 * @returns graph node container element
 */
export const GraphNodesContainer: FC<IGraphContainerProps> = (props) => {
    const lastDragPos = useRef<Nullable<Vector2>>(null);

    const { currentOffset, item, isDragging } = useDragLayer((monitor) => ({
        currentOffset: monitor.getSourceClientOffset(),
        item: monitor.getItem(),
        isDragging: monitor.isDragging(),
    }));

    useEffect(() => {
        if (currentOffset && item) {
            if (lastDragPos.current) {
                const delta = new Vector2(currentOffset.x, currentOffset.y).subtract(lastDragPos.current);
                props.onNodeMoved?.(item.id, delta.x, delta.y);
            }
            lastDragPos.current = new Vector2(currentOffset.x, currentOffset.y);
        }
    }, [currentOffset, item]);
    useEffect(() => {
        if (!isDragging) {
            lastDragPos.current = null;
        }
    }, [isDragging]);
    return <div>{props.children}</div>;
};
