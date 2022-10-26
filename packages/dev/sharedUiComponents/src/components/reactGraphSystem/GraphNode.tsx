import type { FC } from "react";
import style from "./GraphNode.modules.scss";

export interface IGraphNodeProps {
    name: string;
    x: number;
    y: number;
}

export const GraphNode: FC<IGraphNodeProps> = (props) => {
    const { name, x, y } = props;
    return (
        <div className={style.node} style={{ left: x, top: y }}>
            <h2>{name}</h2>
        </div>
    );
};
