import type { FC } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
import { GraphLine } from "./GraphLine";

export const GraphLinesContainer: FC = (props) => {
    const [{ lineFrom, lineTo }, dropRef] = useDrop(() => ({
        accept: "connector",
        collect: (monitor: DropTargetMonitor) => ({
            lineFrom: monitor.getItem() as any,
            lineTo: monitor.getClientOffset() as any,
        }),
    }));
    return (
        <svg width="100%" height="100%" ref={dropRef}>
            {props.children}
            {lineFrom && lineTo && <GraphLine x1={lineFrom.x} y1={lineFrom.y} x2={lineTo.x} y2={lineTo.y} selected={false} />}
        </svg>
    );
};
