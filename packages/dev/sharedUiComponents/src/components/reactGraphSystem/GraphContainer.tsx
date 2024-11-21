import type { FC } from "react";
import * as style from "./GraphContainer.module.scss";

export interface IGraphContainerProps {}

/**
 * This component is just a simple container to keep the nodes and lines containers
 * together
 * @param props
 * @returns
 */
export const GraphContainer: FC<IGraphContainerProps> = (props) => {
    return <div className={style.container}>{props.children}</div>;
};
