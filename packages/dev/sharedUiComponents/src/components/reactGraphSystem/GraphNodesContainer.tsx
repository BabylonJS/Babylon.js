import { Vector2 } from "core/Maths/math";
import type { Nullable } from "core/types";
import type { FC } from "react";
import { useRef } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
/**
 * This component handles the rendering and interaction with nodes on the graph
 */
export interface IGraphContainerProps {
    onNodeMoved: (id: string, x: number, y: number) => void;
    id: string;
}

export const GraphNodesContainer: FC<IGraphContainerProps> = (props) => {
    const lastDragPos = useRef<Nullable<Vector2>>(null);

    const [, dropRef] = useDrop(() => ({
        accept: "node",
        canDrop: (item: any) => {
            return item.parentContainerId === props.id;
        },
        hover: (item: any, monitor: DropTargetMonitor) => {
            const posXY = monitor.getClientOffset();
            const pos = new Vector2(posXY!.x, posXY!.y);

            if (lastDragPos.current) {
                const delta = pos.subtract(lastDragPos.current);
                props.onNodeMoved?.(item.id, delta.x, delta.y);
            }

            lastDragPos.current = pos;
        },
        drop: () => {
            lastDragPos.current = null;
        },
    }));
    return <div ref={dropRef}>{props.children}</div>;
};
