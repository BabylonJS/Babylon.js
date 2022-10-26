import { Vector2 } from "core/Maths/math";
import { Nullable } from "core/types";
import { FC, useRef } from "react";
import type { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
import style from "./GraphContainer.modules.scss";

export interface IGraphContainerProps {
    onNodeMoved?: (id: string, x: number, y: number) => void;
}

export const GraphContainer: FC<IGraphContainerProps> = (props) => {
    const lastDragPos = useRef<Nullable<Vector2>>(null);
    // const dragStarted = useRef<boolean>(false);

    const [, dropRef] = useDrop(() => ({
        accept: "node",
        hover: (item: any, monitor: DropTargetMonitor) => {
            // console.log("client offset", monitor.getClientOffset());
            const posXY = monitor.getClientOffset();
            const pos = new Vector2(posXY!.x, posXY!.y);
            // console.log("drag started", dragStarted.current, "pos", pos, "last pos", lastDragPos.current);

            if (lastDragPos.current) {
                const delta = pos.subtract(lastDragPos.current);
                props.onNodeMoved?.(item.id, delta.x, delta.y);
            }

            // dragStarted.current = true;
            lastDragPos.current = pos;
            // props.onNodeMoved && props.onNodeMoved(item.id, pos!.x, pos!.y);
        },
        drop: () => {
            lastDragPos.current = null;
        },
    }));
    return (
        <div ref={dropRef} className={style.container}>
            {props.children}
        </div>
    );
};
