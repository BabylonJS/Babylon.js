import type { FC } from "react";
import { useGraphContext } from "./useGraphContext";
/**
 * props for the GraphLine component
 */
export interface IGraphLineProps {
    /**
     * id of the line. temporary lines can have no id
     */
    id?: string;
    /**
     * starting x pos of the line
     */
    x1: number;
    /**
     * ending x pos of the line
     */
    x2: number;
    /**
     * starting y pos of the line
     */
    y1: number;
    /**
     * ending y pos of the line
     */
    y2: number;
    /**
     * is the line selected
     */
    selected?: boolean;
    /**
     * does the line have a direction
     */
    directional?: boolean;
}

export const MarkerArrowId = "arrow";

/**
 * This component draws a SVG line between two points, with an optional marker
 * indicating direction
 * @param props properties
 * @returns graph line element
 */
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
