import type { FC } from "react";
import { useContext } from "react";
import { LayoutContext } from "./LayoutContext";
import { FlexibleColumn } from "./FlexibleColumn";
import { FlexibleDropZone } from "./FlexibleDropZone";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import style from "./FlexibleGridContainer.modules.scss";

/**
 * Arguments for the GridContainer component.
 */
export interface IFlexibleGridContainerProps {}

/**
 * Component responsible for mapping the layout to the actual components
 * @returns GridContainer element
 */
export const FlexibleGridContainer: FC<IFlexibleGridContainerProps> = () => {
    const context = useContext(LayoutContext);
    const { layout } = context;
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
