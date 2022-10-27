import type { FC } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
import { GraphLine } from "./GraphLine";

export const GraphLinesContainer: FC = (props) => {
    // const [{ lineFrom, lineTo }, dropRef] = useDrop(() => ({
    const [{ start, delta }, dropRef] = useDrop(() => ({
        accept: "connector",
        collect: (monitor: DropTargetMonitor) => ({
            // lineFrom: monitor.getItem() as any,
            start: monitor.getItem() as any,
            // lineTo: monitor.getClientOffset() as any,
            delta: monitor.getDifferenceFromInitialOffset() as any,
        }),
    }));
    // console.log("start", start, "delta", delta);
    return (
        <svg width="100%" height="100%" ref={dropRef}>
            {props.children}
            {/* {lineFrom && lineTo && <GraphLine x1={lineFrom.x} y1={lineFrom.y} x2={lineTo.x} y2={lineTo.y} selected={false} />} */}
            {start && start.x !== undefined && start.y !== undefined && delta && (
                <GraphLine x1={start.x} y1={start.y} x2={start.x + delta.x} y2={start.y + delta.y} selected={false} />
            )}
        </svg>
    );
};
