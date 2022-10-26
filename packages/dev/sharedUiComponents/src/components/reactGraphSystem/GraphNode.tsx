import type { FC } from "react";
import { useDrag } from "react-dnd";
import { GraphConnectorHandler } from "./GraphConnectorHandle";
import style from "./GraphNode.modules.scss";

export interface IGraphNodeProps {
    id: string;
    name: string;
    x: number;
    y: number;
}

export const GraphNode: FC<IGraphNodeProps> = (props) => {
    const { id, name, x, y } = props;
    // @ts-ignore
    const [{ isDrag }, dragRef] = useDrag(
        () => ({
            type: "node",
            item: { id },
            collect: (monitor) => ({
                isDrag: !!monitor.isDragging(),
            }),
        }),
        []
    );
    return (
        <div ref={dragRef} className={style.node} style={{ left: x, top: y }}>
            <h2>{name}</h2>
            <GraphConnectorHandler parentId={id} parentX={x} parentY={y} />
        </div>
    );
};
