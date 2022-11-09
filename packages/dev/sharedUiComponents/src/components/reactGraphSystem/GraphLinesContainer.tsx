import type { FC } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
// @ts-ignore
import { GraphLine, MarkerArrowId } from "./GraphLine";

export interface IGraphLinesContainerProps {
    id: string; // id of the container
}

export const GraphLinesContainer: FC<IGraphLinesContainerProps> = (props) => {
    const [{ start, delta }, dropRef] = useDrop(() => ({
        accept: "connector",
        canDrop: (item: any) => {
            return item.parentContainerId === props.id;
        },
        collect: (monitor: DropTargetMonitor) => ({
            start: monitor.getItem() as any,
            delta: monitor.getDifferenceFromInitialOffset() as any,
        }),
    }));
    // console.log("accept connector with item", start);
    return (
        <svg width="100%" height="100%" ref={dropRef}>
            <defs>
                <marker id={MarkerArrowId} markerWidth="15" markerHeight="15" refX="5" refY="5" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" stroke="black" />
                </marker>
            </defs>
            {props.children}
            {start && start.parentContainerId === props.id && start.x !== undefined && start.y !== undefined && delta && (
                <GraphLine x1={start.x} y1={start.y} x2={start.x + delta.x} y2={start.y + delta.y} selected={false} />
            )}
        </svg>
    );
};
