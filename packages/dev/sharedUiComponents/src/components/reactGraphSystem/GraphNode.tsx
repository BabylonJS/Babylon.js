import type { FC } from "react";
import { useDrag } from "react-dnd";
import { ClassNames } from "../classNames";
import { GraphConnectorHandler } from "./GraphConnectorHandle";
import style from "./GraphNode.modules.scss";
import { useGraphContext } from "./useGraphContext";

export interface IGraphNodeProps {
    id: string;
    name: string;
    x: number;
    y: number;
    selected?: boolean;
}

export const GraphNode: FC<IGraphNodeProps> = (props) => {
    const { id, name, x, y, selected } = props;
    const { onNodeSelected } = useGraphContext();

    const [, dragRef] = useDrag(
        () => ({
            type: "node",
            item: { id },
            collect: (monitor) => ({
                isDrag: !!monitor.isDragging(),
            }),
        }),
        []
    );

    const onClick = () => {
        onNodeSelected && onNodeSelected(id);
    };

    return (
        <div ref={dragRef} className={ClassNames({ node: true, selected }, style)} style={{ left: x, top: y }} onClick={onClick}>
            <h2>{name}</h2>
            <GraphConnectorHandler parentId={id} parentX={x} parentY={y} />
        </div>
    );
};
