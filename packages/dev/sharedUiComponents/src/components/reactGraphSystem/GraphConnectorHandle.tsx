import type { FC } from "react";
import { useCallback } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrag, useDrop } from "react-dnd";
import style from "./GraphConnectorHandle.modules.scss";
import { useGraphContext } from "./useGraphContext";

export interface IGraphConnectorHandlerProps {
    parentId: string;
    parentX: number;
    parentY: number;
}

export const GraphConnectorHandler: FC<IGraphConnectorHandlerProps> = (props) => {
    const { parentId, parentX, parentY } = props;
    const { onNodesConnected } = useGraphContext();
    const [, dragRef] = useDrag(
        () => ({
            type: "connector",
            item: { parentId, x: parentX, y: parentY },
            canDrag: () => parentX !== undefined && parentY !== undefined,
        }),
        [parentId, parentX, parentY]
    );
    const [{ isOver }, dropRef] = useDrop(() => ({
        accept: "connector",
        collect: (monitor: DropTargetMonitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (item: any) => {
            // When drop, update the existing graph context?
            onNodesConnected && onNodesConnected(item.parentId, parentId);
        },
    }));
    const attachRef = useCallback(
        (ref) => {
            dragRef(ref);
            dropRef(ref);
        },
        [dragRef, dropRef]
    );
    // console.log("parentX", parentX, "parentY", parentY);
    return <div ref={attachRef} className={style.handle} style={{ backgroundColor: isOver ? "yellow" : "gray" }} />;
};
