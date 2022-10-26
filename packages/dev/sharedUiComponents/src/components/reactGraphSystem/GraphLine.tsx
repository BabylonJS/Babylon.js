import type { FC } from "react";
export interface IGraphLineProps {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    selected: boolean;
}

export const GraphLine: FC<IGraphLineProps> = (props: IGraphLineProps) => {
    const { x1, x2, y1, y2, selected } = props;

    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={selected ? "yellow" : "black"}></line>;
};
