import type { FC } from "react";
import type { DragSourceMonitor } from "react-dnd";
import { useDrag } from "react-dnd";
import style from "./GraphConnectorHandle.modules.scss";

export interface IGraphConnectorHandlerProps {
    parentId: string;
    parentX: number;
    parentY: number;
}

export const GraphConnectorHandler: FC<IGraphConnectorHandlerProps> = (props) => {
    const { parentId, parentX, parentY } = props;
    // const lastDragPos = useRef<Nullable<Vector2>>(null);
    const [{ lineTo }, dragRef] = useDrag(
        () => ({
            type: "connector",
            item: { parentId },
            collect: (monitor: DragSourceMonitor) => ({
                visibility: monitor.isDragging() ? 1 : 0,
                lineTo: monitor.getClientOffset(),
            }),
        }),
        []
    );
    console.log("draw line from", parentX, parentY, "to", lineTo?.x, lineTo?.y);
    return (
        <div ref={dragRef} className={style.handle}>
            {/* <svg>{lineTo && <line stroke="black" x1={parentX} y1={parentY} x2={lineTo.x} y2={lineTo.y}></line>}</svg> */}
            {/* <svg>{lineTo && <line stroke="black" x1={0} y1={0} x2={100} y2={100}></line>}</svg> */}
            <svg>{lineTo && <line stroke="black" x1={0} y1={0} x2={lineTo.x - parentX} y2={lineTo.y - parentY}></line>}</svg>
        </div>
    );
};
