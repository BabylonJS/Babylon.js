import type { FC } from "react";
import style from "./FlexibleColumn.modules.scss";

/**
 * Arguments for the Column component.
 */
export interface IFlexibleColumnProps {
    /**
     * Width of column
     */
    width: string;
}

/**
 * This component represents a single column in the layout. It receives a width
 * that it occupies and the content to display
 * @param props
 * @returns
 */
export const FlexibleColumn: FC<IFlexibleColumnProps> = (props) => {
    return (
        <div style={{ width: props.width }} className={style.flexibleColumn}>
            {props.children}
        </div>
    );
};
