import type { FC } from "react";
import { useGraphContext } from "./useGraphContext";
export interface IGraphLineProps {
    id?: string;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    selected?: boolean;
    directional?: boolean;
}

export const MarkerArrowId = "arrow";

export const GraphLine: FC<IGraphLineProps> = (props: IGraphLineProps) => {
    const { id, x1, x2, y1, y2, selected, directional = true } = props;
    const { onLineSelected } = useGraphContext();

    // Line is only selectable when it has an id
    const onClick = () => {
        id && onLineSelected && onLineSelected(id);
    };

    const xm = (x1 + x2) / 2;
    const ym = (y1 + y2) / 2;

    return (
        <path
            d={`M ${x1} ${y1} L ${xm} ${ym} L ${x2} ${y2}`}
            strokeWidth={3}
            stroke={selected ? "yellow" : "black"}
            onClick={onClick}
            markerMid={directional ? `url(#${MarkerArrowId})` : ""}
        />
    );
};
