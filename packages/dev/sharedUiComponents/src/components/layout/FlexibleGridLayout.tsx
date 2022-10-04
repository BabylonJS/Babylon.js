import type { FC, MutableRefObject } from "react";
import { useState, useRef } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import { Vector2 } from "core/Maths/math";
import { FlexibleDropZone } from "./FlexibleDropZone";
import { Nullable } from "core/types";

export interface IFlexibleGridLayoutProps {
    layoutDefinition: any;
}

export const DRAGCLASS = "draggable";

export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout, setLayout] = useState(props.layoutDefinition);
    const containerDiv = useRef<Nullable<HTMLDivElement>>(null);
    // DRAGGING INFORMATION
    const initialPointerPos = useRef(new Vector2(0, 0));
    const startDragRow: MutableRefObject<Nullable<number>> = useRef(null);
    const startDragColumn: MutableRefObject<Nullable<number>> = useRef(null);
    const hasClicked = useRef(false);
    const isDragging = useRef(false);

    /*const onDragStart = (pos: Vector2) => {
        console.log(`onDragStart(${pos})`);
    };*/

    const onDragMove = (pos: Vector2) => {
        console.log(`onDragMove(${pos})`);
        // Vertical drag
        if (startDragRow.current !== null && startDragColumn.current != null) {
            // Check y axis difference
            const yDiff = pos.y - initialPointerPos.current.y;

            // Get layout column
            const layoutColumn = layout.columns[startDragColumn.current];
            console.log("layout column", layoutColumn);

            // Get layout rows
            const layoutRow0 = layoutColumn.rows[startDragColumn.current];
            const layoutRow1 = layoutColumn.rows[startDragColumn.current + 1];

            if (layoutRow0 && layoutRow1 && containerDiv.current) {
                // Convert y diff to percentage values
                const totalHeight = containerDiv.current.clientHeight;
                const percHeight = (yDiff / totalHeight) * 100;
                console.log("perc height increase is", percHeight);
                layoutRow0.height = Number.parseInt(layoutRow0.height.replace("%", "")) - percHeight + "%";
                layoutRow1.height = Number.parseInt(layoutRow1.height.replace("%", "")) + percHeight + "%";
                console.log("new heights", layoutRow0.height, layoutRow1.height);

                setLayout({ ...layout });
            }
        }

        initialPointerPos.current = pos;
    };

    /*const onDragEnd = (pos: Vector2) => {
        console.log(`onDragEnd(${pos})`);
    };*/

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
            console.log("target", target, "has row number", target.getAttribute("data-row-number"), "and column number", target.getAttribute("data-column-number"));
            hasClicked.current = true;
            // Store initial pointer pos
            initialPointerPos.current.x = event.clientX;
            initialPointerPos.current.y = event.clientY;
            const rowNumber = target.getAttribute("data-row-number");
            // Store possible row of where drag happened
            startDragRow.current = rowNumber ? parseInt(rowNumber) : null;
            const columnNumber = target.getAttribute("data-column-number");
            startDragColumn.current = columnNumber ? parseInt(columnNumber) : null;

            console.log("pt down handler, pointerpos", initialPointerPos.current);
        }
    };

    const pointerMoveHandler = (event: React.PointerEvent<HTMLDivElement>) => {
        // Check pointer distance moved
        const newPos = new Vector2(event.clientX, event.clientY);
        if (hasClicked.current && !isDragging.current) {
            const distance = newPos.subtract(initialPointerPos.current).length();
            console.log(newPos, newPos, "distance", distance);
            // If distance greater than a threshold, start drag
            if (distance > 3) {
                console.log("start dragging");
                // console.log("target", event.target, (event.target as HTMLElement).getAttribute("data-row-number"));
                isDragging.current = true;
                onDragMove(newPos);
            }
        } else if (hasClicked.current) {
            console.log("continue dragging");
            onDragMove(newPos);
        }
        //initialPointerPos.current = newPos;
    };

    const pointerUpHandler = (event: React.PointerEvent<HTMLDivElement>, clickFn: () => void) => {
        // If pointer was dragging, stop drag. If not, consider it a click
        console.log("pt up handler");
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
