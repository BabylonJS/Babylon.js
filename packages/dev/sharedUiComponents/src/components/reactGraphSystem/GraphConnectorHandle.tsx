import type { FC } from "react";
import { useCallback } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrag, useDrop } from "react-dnd";
import { ClassNames } from "../classNames";
import style from "./GraphConnectorHandle.modules.scss";
import { useGraphContext } from "./useGraphContext";

export interface IGraphConnectorHandlerProps {
    parentId: string;
    parentX: number;
    parentY: number;
    offsetX?: number; //offset relative to the center of the parent
    offsetY?: number; //offset relative to the center of the parent
    parentWidth: number;
    parentHeight: number;
    parentContainerId: string;
}

export const GraphConnectorHandler: FC<IGraphConnectorHandlerProps> = (props) => {
    const { parentId, parentX, parentY, offsetX = 0, offsetY = 0, parentWidth, parentHeight, parentContainerId } = props;
    const { onNodesConnected } = useGraphContext();
    const centerX = offsetX + parentWidth / 2;
    const centerY = offsetY + parentHeight / 2;
    // console.log("centerX", centerX, "centerY", centerY);
    const [, dragRef] = useDrag(
        () => ({
            type: "connector",
            item: { parentId, x: parentX + centerX, y: parentY + centerY, parentContainerId },
            canDrag: () => parentX !== undefined && parentY !== undefined,
        }),
        [parentId, parentX, parentY]
    );
    const [{ isOver }, dropRef] = useDrop(() => ({
        accept: "connector",
        collect: (monitor: DropTargetMonitor) => ({
            isOver: monitor.isOver(),
        }),
        canDrop: (item: any) => {
            return item.parentContainerId === parentContainerId;
        },
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
    console.log("type of useDrag is", "connector" + props.parentContainerId);
    // console.log("parentX", parentX, "parentY", parentY);
    return <div ref={attachRef} className={ClassNames({ handle: true, hovered: isOver }, style)} style={{ top: centerY + "px", left: centerX + "px" }} />;
};
