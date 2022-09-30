import type { FC } from "react";
import style from "./FlexibleGridLayout.modules.scss";

export interface IFlexibleColumnProps {
    width: string;
}

export const FlexibleColumn: FC<IFlexibleColumnProps> = (props) => {
    return (
        <div className={style.flexibleColumn} style={{ width: props.width }}>
            {props.children}
        </div>
    );
};
