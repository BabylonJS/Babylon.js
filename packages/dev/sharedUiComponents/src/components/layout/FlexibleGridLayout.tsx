import type { FC } from "react";
import { useState, useRef } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import { Vector2 } from "core/Maths/math";
import { FlexibleDropZone } from "./FlexibleDropZone";
import type { Nullable } from "core/types";
import { DRAGCLASS, DragOperationTypes } from "./constants";
import { addPercentages } from "./unitTools";

export interface IFlexibleGridLayoutProps {
    layoutDefinition: any;
}

export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout, setLayout] = useState(props.layoutDefinition);
    const containerDiv = useRef<Nullable<HTMLDivElement>>(null);
    // CLICK/DRAG INFORMATION
    const pointerPos = useRef(new Vector2(0, 0));
    const isPointerDown = useRef(false);
    const isDragging = useRef(false);
    const operationInformation = useRef<{ purpose?: string; args?: any }>({});

    const getPosInLayout = (row: number, column: number) => {
        const columnLayout = layout.columns[column];
        if (!columnLayout) {
            throw new Error("Attempted to get an invalid layout column");
        }
        return columnLayout.rows[row];
    };

    const processResizeRow = (pos: Vector2, args: { row: number; column: number }) => {
        // Check y axis difference
        const yDiff = pos.y - pointerPos.current.y;

        // Get layout rows
        const layoutRow0 = getPosInLayout(args.row, args.column);
        const layoutRow1 = getPosInLayout(args.row + 1, args.column);
        console.log("layout row 0", layoutRow0, "layout row 1", layoutRow1);

        if (layoutRow0 && layoutRow1 && containerDiv.current) {
            // Convert y diff to percentage values
            const totalHeight = containerDiv.current.clientHeight;
            const percHeight = (yDiff / totalHeight) * 100;

            layoutRow0.height = addPercentages(layoutRow0.height, percHeight + "%");
            layoutRow1.height = addPercentages(layoutRow1.height, -percHeight + "%");

            setLayout({ ...layout });
        }
    };

    const onDragMove = (pos: Vector2) => {
        // Vertical drag
        if (operationInformation.current.purpose === DragOperationTypes.RESIZE_ROW) {
            processResizeRow(pos, operationInformation.current.args);
        }

        pointerPos.current = pos;
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
        // Check if we're clicking on an element that can be dragged
        if (target instanceof HTMLElement && target.classList.contains(DRAGCLASS)) {
            isPointerDown.current = true;

            pointerPos.current.x = event.clientX;
            pointerPos.current.y = event.clientY;

            // Figure out the purpose of the element through its "data-drag-type" attribute
            const purpose = target.getAttribute("data-drag-type");
            if (purpose === DragOperationTypes.RESIZE_ROW || purpose === DragOperationTypes.RESIZE_COLUMN) {
                const rowNumber = target.getAttribute("data-row-number");
                // Store possible row of where drag happened
                const row = rowNumber ? parseInt(rowNumber) : undefined;
                const columnNumber = target.getAttribute("data-column-number");
                const column = columnNumber ? parseInt(columnNumber) : undefined;
                console.log("clicked on divider of row number", rowNumber, "and column number", columnNumber);
                if (row !== undefined && column !== undefined) {
                    operationInformation.current = {
                        purpose,
                        args: {
                            column,
                            row,
                        },
                    };
                }
            }
        }
    };

    const pointerMoveHandler = (event: React.PointerEvent<HTMLDivElement>) => {
        // Check pointer distance moved
        const newPos = new Vector2(event.clientX, event.clientY);
        if (isPointerDown.current && !isDragging.current) {
            const distance = newPos.subtract(pointerPos.current).length();
            // If distance greater than a threshold, start drag
            if (distance > 3) {
                isDragging.current = true;
                onDragMove(newPos);
            }
        } else if (isPointerDown.current) {
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
        isPointerDown.current = false;
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
