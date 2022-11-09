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
    width?: number;
    height?: number;
    highlighted?: boolean;
    parentContainerId: string;
}

export const GraphNode: FC<IGraphNodeProps> = (props) => {
    const { id, name, x, y, selected, width = 100, height = 40, highlighted, parentContainerId } = props;
    const { onNodeSelected } = useGraphContext();

    const [, dragRef] = useDrag(
        () => ({
            type: "node",
            item: { id, parentContainerId },
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
        <div
            ref={dragRef}
            className={ClassNames({ node: true, selected, highlighted }, style)}
            style={{ left: x, top: y, minWidth: width + "px", minHeight: height + "px" }}
            onClick={onClick}
        >
            <div className={style.container}>
                <h2>{name}</h2>
                <GraphConnectorHandler
                    parentContainerId={parentContainerId}
                    parentId={id}
                    parentX={x}
                    parentY={y}
                    offsetY={-height / 2}
                    parentWidth={width}
                    parentHeight={height}
                />
                {props.children}
            </div>
        </div>
    );
};
