import type { FC } from "react";
import { useCallback } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrag, useDrop } from "react-dnd";
import { ClassNames } from "../classNames";
import style from "./GraphConnectorHandle.modules.scss";
import { useGraphContext } from "./useGraphContext";

/**
 * Props for the connector
 */
export interface IGraphConnectorHandlerProps {
    /**
     * id of the parent node
     */
    parentId: string;
    /**
     * x position of the parent node
     */
    parentX: number;
    /**
     * y position of the parent node
     */
    parentY: number;
    /**
     * x position of the connector relative to the parent node
     */
    offsetX?: number;
    /**
     * y position of the connector relative to the parent node
     */
    offsetY?: number;
    /**
     * width of the parent node
     */
    parentWidth: number;
    /**
     * height of the parent node
     */
    parentHeight: number;
    /**
     * id of the container where its parent node is
     */
    parentContainerId: string;
}

/**
 * This component is used to initiate a connection between two nodes. Simply
 * drag the handle in a node and drop it in another node to create a connection.
 * @returns connector element
 */
export const GraphConnectorHandler: FC<IGraphConnectorHandlerProps> = ({ parentId, parentX, parentY, offsetX = 0, offsetY = 0, parentWidth, parentHeight, parentContainerId }) => {
    const { onNodesConnected } = useGraphContext();
    const centerX = offsetX + parentWidth / 2;
    const centerY = offsetY + parentHeight / 2;
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
    return <div ref={attachRef} className={ClassNames({ handle: true, hovered: isOver }, style)} style={{ top: centerY + "px", left: centerX + "px" }} />;
};
