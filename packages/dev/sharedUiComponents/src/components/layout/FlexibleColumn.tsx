import type { FC } from "react";
import style from "./FlexibleColumn.modules.scss";

export interface IFlexibleColumnProps {
    width: string;
}

export const FlexibleColumn: FC<IFlexibleColumnProps> = (props) => {
    return (
        <div style={{ width: props.width }} className={style.flexibleColumn}>
            {props.children}
        </div>
    );
};
