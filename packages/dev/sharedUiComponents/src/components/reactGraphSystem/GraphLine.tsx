import type { FC } from "react";
import { useGraphContext } from "./useGraphContext";
export interface IGraphLineProps {
    id?: string;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    selected?: boolean;
}

export const GraphLine: FC<IGraphLineProps> = (props: IGraphLineProps) => {
    const { id, x1, x2, y1, y2, selected } = props;
    const { onLineSelected } = useGraphContext();

    // Line is only selectable when it has an id
    const onClick = () => {
        console.log("clicked line", id);
        id && onLineSelected && onLineSelected(id);
    };

    return <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={3} stroke={selected ? "yellow" : "black"} onClick={onClick}></line>;
};
