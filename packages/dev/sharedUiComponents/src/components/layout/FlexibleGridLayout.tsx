import type { FC } from "react";
import { useState, useRef } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import { Vector2 } from "core/Maths/math";
import { FlexibleDropZone } from "./FlexibleDropZone";
import type { Nullable } from "core/types";
import { DRAGCLASS, DragOperationTypes } from "./constants";
import { addPercentageStringToNumber } from "./unitTools";

export interface IFlexibleGridLayoutProps {
    layoutDefinition: any;
}

const MinColumnWidth = 5;
const MinColumnHeight = 5;

type Axis2 = "x" | "y";

export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout, setLayout] = useState(props.layoutDefinition);
    const containerDiv = useRef<Nullable<HTMLDivElement>>(null);
    // CLICK/DRAG INFORMATION
    const pointerPos = useRef(new Vector2(0, 0));
    const isPointerDown = useRef(false);
    const isDragging = useRef(false);
    const operationInformation = useRef<{ purpose?: string; args?: any }>({});

    const getPosInLayout = (column: number, row?: number) => {
        const columnLayout = layout.columns[column];
        if (!columnLayout) {
            throw new Error("Attempted to get an invalid layout column");
        }
        if (row === undefined) {
            return columnLayout;
        }
        return columnLayout.rows[row];
    };

    const processResize = (
        pos: Vector2,
        row0: number | undefined,
        column0: number,
        row1: number | undefined,
        column1: number,
        axis: Axis2,
        maxAxisValue: number,
        property: string,
        minFinalValue: number
    ) => {
        // Check axis difference
        const axisDiff = pos[axis] - pointerPos.current[axis];

        // Get layout rows
        const layoutElement0 = getPosInLayout(column0, row0);
        const layoutElement1 = getPosInLayout(column1, row1);
        console.log("layout row 0", layoutElement0, "layout row 1", layoutElement1);

        if (layoutElement0 && layoutElement1 && containerDiv.current) {
            const percDiff = (axisDiff / maxAxisValue) * 100;

            const newValue0 = addPercentageStringToNumber(layoutElement0[property], percDiff);
            const newValue1 = addPercentageStringToNumber(layoutElement1[property], -percDiff);

            if (newValue0 >= minFinalValue && newValue1 >= minFinalValue) {
                layoutElement0[property] = newValue0.toFixed(2) + "%";
                layoutElement1[property] = newValue1.toFixed(2) + "%";
            }

            setLayout({ ...layout });
        }
    };

    const processResizeRow = (pos: Vector2, args: { row: number; column: number }) => {
        processResize(pos, args.row, args.column, args.row + 1, args.column, "y", containerDiv.current!.clientHeight, "height", MinColumnHeight);
    };

    const processResizeColumn = (pos: Vector2, args: { row: number; column: number }) => {
        processResize(pos, undefined, args.column, undefined, args.column + 1, "x", containerDiv.current!.clientWidth, "width", MinColumnWidth);
    };

    const onDragMove = (pos: Vector2) => {
        // Vertical drag
        if (operationInformation.current.purpose === DragOperationTypes.RESIZE_ROW) {
            processResizeRow(pos, operationInformation.current.args);
        } else if (operationInformation.current.purpose === DragOperationTypes.RESIZE_COLUMN) {
            processResizeColumn(pos, operationInformation.current.args);
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
