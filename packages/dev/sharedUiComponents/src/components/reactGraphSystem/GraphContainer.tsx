import type { FC } from "react";
import style from "./GraphContainer.modules.scss";

export interface IGraphContainerProps {}

export const GraphContainer: FC<IGraphContainerProps> = (props) => {
    return <div className={style.container}>{props.children}</div>;
};
