import { Vector2 } from "core/Maths/math";
import type { Nullable } from "core/types";
import type { FC, ReactElement } from "react";
import { useRef } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
import style from "./GraphContainer.modules.scss";
import { GraphLine } from "./GraphLine";

export interface IGraphContainerProps {
    onNodeMoved?: (id: string, x: number, y: number) => void;
    nodes: ReactElement[];
    edges: ReactElement[];
}

export const GraphContainer: FC<IGraphContainerProps> = (props) => {
    const lastDragPos = useRef<Nullable<Vector2>>(null);

    const [{ lineFrom, lineTo }, dropRef] = useDrop(() => ({
        accept: ["node", "connector"],
        collect: (monitor: DropTargetMonitor) => ({
            lineFrom: monitor.getItemType() === "connector" ? monitor.getItem() : null,
            lineTo: monitor.getItemType() === "connector" ? monitor.getClientOffset() : null,
        }),
        hover: (item: any, monitor: DropTargetMonitor) => {
            if (monitor.getItemType() === "node") {
                const posXY = monitor.getClientOffset();
                const pos = new Vector2(posXY!.x, posXY!.y);

                if (lastDragPos.current) {
                    const delta = pos.subtract(lastDragPos.current);
                    props.onNodeMoved?.(item.id, delta.x, delta.y);
                }

                lastDragPos.current = pos;
            }
        },
        drop: () => {
            lastDragPos.current = null;
        },
    }));
    const edges = props.edges;
    if (lineFrom && lineTo) {
        const l1 = lineFrom as any;
        const l2 = lineTo as any;
        edges.push(<GraphLine key="line" x1={l1.x} y1={l1.y} x2={l2.x} y2={l2.y} selected={false} />);
    }
    return (
        <div ref={dropRef} className={style.container}>
            <svg width="100%" height="100%">
                {edges}
            </svg>
            {props.nodes}
        </div>
    );
};
