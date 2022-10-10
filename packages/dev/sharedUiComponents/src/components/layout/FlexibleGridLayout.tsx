import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import { FlexibleDropZone } from "./FlexibleDropZone";
import type { Nullable } from "core/types";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { FlexibleDragHandler } from "./FlexibleDragHandler";

export interface IFlexibleGridLayoutProps {
    layoutDefinition: any;
}

export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout, setLayout] = useState(props.layoutDefinition);
    const containerDiv = useRef<Nullable<HTMLDivElement>>(null);
    const containerSize = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (containerDiv.current) {
            console.log("fill in width and height");
            containerSize.current.width = containerDiv.current.clientWidth;
            containerSize.current.height = containerDiv.current.clientHeight;
        }
    }, [containerDiv]);

    const columns = layout.columns.map((column: any, columnIdx: number) => {
        return (
            <FlexibleColumn key={column.id} width={column.width}>
                {column.rows.map((row: any, rowIdx: number) => {
                    return (
                        <div style={{ height: row.height }} key={row.id}>
                            <FlexibleDropZone rowNumber={rowIdx} columnNumber={columnIdx}>
                                <FlexibleTabsContainer
                                    tabs={row.tabs}
                                    selectedTab={row.selectedTab}
                                    rowIndex={rowIdx}
                                    columnIndex={columnIdx}
                                    draggedOver={row.id === layout.draggedOverRowId}
                                />
                            </FlexibleDropZone>
                        </div>
                    );
                })}
            </FlexibleColumn>
        );
    });

    return (
        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
            <FlexibleDragHandler layout={layout} updateLayout={setLayout} containerSize={containerSize.current}>
                <div className={style.flexibleGrid} ref={containerDiv}>
                    {columns}
                </div>
            </FlexibleDragHandler>
        </DndProvider>
    );
};
