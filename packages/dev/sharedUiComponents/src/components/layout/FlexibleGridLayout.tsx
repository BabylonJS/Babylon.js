import type { FC, MutableRefObject } from "react";
import { useState, useRef } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import { Vector2 } from "core/Maths/math";
import { FlexibleDropZone } from "./FlexibleDropZone";
import type { Nullable } from "core/types";
import { DRAGCLASS } from "./constants";
import { addPercentages } from "./unitTools";

export interface IFlexibleGridLayoutProps {
    layoutDefinition: any;
}

export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout, setLayout] = useState(props.layoutDefinition);
    const containerDiv = useRef<Nullable<HTMLDivElement>>(null);
    // DRAGGING INFORMATION
    const initialPointerPos = useRef(new Vector2(0, 0));
    const startDragRow: MutableRefObject<Nullable<number>> = useRef(null);
    const startDragColumn: MutableRefObject<Nullable<number>> = useRef(null);
    const hasClicked = useRef(false);
    const isDragging = useRef(false);

    const getPosInLayout = (row: number, column: number) => {
        const columnLayout = layout.columns[column];
        if (!columnLayout) {
            throw new Error("Attempted to get an invalid layout column");
        }
        return columnLayout.rows[row];
    };

    const onDragMove = (pos: Vector2) => {
        // Vertical drag
        if (startDragRow.current !== null && startDragColumn.current != null) {
            // Check y axis difference
            const yDiff = pos.y - initialPointerPos.current.y;

            // Get layout rows
            const layoutRow0 = getPosInLayout(startDragRow.current, startDragColumn.current);
            const layoutRow1 = getPosInLayout(startDragRow.current + 1, startDragColumn.current);
            console.log("layout row 0", layoutRow0, "layout row 1", layoutRow1);

            if (layoutRow0 && layoutRow1 && containerDiv.current) {
                // Convert y diff to percentage values
                const totalHeight = containerDiv.current.clientHeight;
                const percHeight = (yDiff / totalHeight) * 100;

                layoutRow0.height = addPercentages(layoutRow0.height, percHeight + "%");
                layoutRow1.height = addPercentages(layoutRow1.height, -percHeight + "%");

                setLayout({ ...layout });
            }
        }

        initialPointerPos.current = pos;
    };

    const columns = layout.columns.map((column: any, columnIdx: number) => {
        return (
            <FlexibleColumn width={column.width}>
                {column.rows.map((row: any, rowIdx: number) => {
                    return (
                        <div style={{ height: row.height }}>
                            <FlexibleDropZone rowNumber={rowIdx} columnNumber={columnIdx}>
                                <FlexibleTabsContainer tabs={row.tabs} selectedTab={row.selectedTab} />
                            </FlexibleDropZone>
                        </div>
                    );
                })}
            </FlexibleColumn>
        );
    });

    const pointerDownHandler = (event: React.PointerEvent<HTMLDivElement>) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.classList.contains(DRAGCLASS)) {
            hasClicked.current = true;
            // Store initial pointer pos
            initialPointerPos.current.x = event.clientX;
            initialPointerPos.current.y = event.clientY;
            const rowNumber = target.getAttribute("data-row-number");
            // Store possible row of where drag happened
            startDragRow.current = rowNumber ? parseInt(rowNumber) : null;
            const columnNumber = target.getAttribute("data-column-number");
            startDragColumn.current = columnNumber ? parseInt(columnNumber) : null;
            console.log("clicked on divider of row number", rowNumber, "and column number", columnNumber);
        }
    };

    const pointerMoveHandler = (event: React.PointerEvent<HTMLDivElement>) => {
        // Check pointer distance moved
        const newPos = new Vector2(event.clientX, event.clientY);
        if (hasClicked.current && !isDragging.current) {
            const distance = newPos.subtract(initialPointerPos.current).length();
            // If distance greater than a threshold, start drag
            if (distance > 3) {
                isDragging.current = true;
                onDragMove(newPos);
            }
        } else if (hasClicked.current) {
            onDragMove(newPos);
        }
    };

    const pointerUpHandler = (event: React.PointerEvent<HTMLDivElement>, clickFn: () => void) => {
        // If pointer was dragging, stop drag. If not, consider it a click
        if (isDragging.current) {
            isDragging.current = false;
        } else {
            clickFn();
        }
        hasClicked.current = false;
    };

    return (
        <div
            ref={containerDiv}
            onPointerDown={pointerDownHandler}
            onPointerMove={pointerMoveHandler}
            onPointerUp={(event) => pointerUpHandler(event, () => console.log("click"))}
            className={style.flexibleGrid}
        >
            {columns}
        </div>
    );
};
