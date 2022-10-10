import type { FC } from "react";
import { useContext } from "react";
import { LayoutContext } from "./LayoutContext";
import { FlexibleColumn } from "./FlexibleColumn";
import { FlexibleDropZone } from "./FlexibleDropZone";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import style from "./FlexibleGridContainer.modules.scss";

export interface IFlexibleGridContainerProps {}

export const FlexibleGridContainer: FC<IFlexibleGridContainerProps> = (props) => {
    const context = useContext(LayoutContext);
    const { layout } = context;
    console.log(context, "context layout is", layout);
    const columns =
        layout && layout.columns
            ? layout.columns.map((column: any, columnIdx: number) => {
                  return (
                      <FlexibleColumn key={column.id} width={column.width}>
                          {column.rows.map((row: any, rowIdx: number) => {
                              return (
                                  <div style={{ height: row.height }} key={row.id}>
                                      <FlexibleDropZone rowNumber={rowIdx} columnNumber={columnIdx}>
                                          <FlexibleTabsContainer tabs={row.tabs} selectedTab={row.selectedTab} rowIndex={rowIdx} columnIndex={columnIdx} />
                                      </FlexibleDropZone>
                                  </div>
                              );
                          })}
                      </FlexibleColumn>
                  );
              })
            : [];
    return <div className={style.flexibleGrid}>{columns}</div>;
};
