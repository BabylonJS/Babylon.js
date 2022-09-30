import type { FC } from "react";
import { useState } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";

export interface IFlexibleGridLayoutProps {
    layoutDefinition: any;
}

export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout, setLayout] = useState(props.layoutDefinition);

    const columns = layout.columns.map((column: any) => {
        return (
            <FlexibleColumn width={column.width}>
                {column.rows.map((row: any) => {
                    return <div style={{ height: row.height }}>{row.component}</div>;
                })}
            </FlexibleColumn>
        );
    });

    return <div className={style.flexibleGrid}>{columns}</div>;
};
