import type { FC } from "react";
import { useState, useRef } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import { Vector2 } from "core/Maths/math";
import { FlexibleDropZone } from "./FlexibleDropZone";
import type { Nullable } from "core/types";
import { COLCLASS, DRAGCLASS, ELEMENTCLASS, ElementTypes, ROWCLASS } from "./constants";
import { addPercentageStringToNumber, getPercentageInsideRect, parsePercentage } from "./unitTools";

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

    const processDragTab = (pos: Vector2, args: { target: HTMLDivElement }) => {
        if (!args.target.classList.contains(style.dragging)) {
            args.target.classList.add(style.dragging);
        }
        // Check which element is being dragged over. For that, we need to get the position as a percentage of the container
        const containerRect = containerDiv.current!.getBoundingClientRect();
        const { xPercentage, yPercentage } = getPercentageInsideRect(pos.x, pos.y, containerRect);
        const { row } = getColumnAndRowByPercentage(xPercentage, yPercentage);

        layout.draggedOverRowId = row?.id;
        console.log("set dragged over row id to", layout.draggedOverRowId);
        setLayout({ ...layout });
    };

    const processReleaseTab = (args: { target: HTMLDivElement }) => {
        if (args.target.classList.contains(style.dragging)) {
            args.target.classList.remove(style.dragging);
        }
    };

    const onDragMove = (pos: Vector2) => {
        console.log("operationinformation", operationInformation.current);
        if (operationInformation.current.purpose === ElementTypes.RESIZE_ROW) {
            processResizeRow(pos, operationInformation.current.args);
        } else if (operationInformation.current.purpose === ElementTypes.RESIZE_COLUMN) {
            processResizeColumn(pos, operationInformation.current.args);
        } else if (operationInformation.current.purpose === ElementTypes.TAB) {
            processDragTab(pos, operationInformation.current.args);
        }

        pointerPos.current = pos;
    };

    const onDragRelease = () => {
        isDragging.current = false;
        if (operationInformation.current.purpose === ElementTypes.TAB) {
            processReleaseTab(operationInformation.current.args);
        }
    };

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

    const getRowAndColumnNumberFromElement = (target: HTMLElement) => {
        const rowNumber = target.getAttribute(ROWCLASS);
        const row = rowNumber ? parseInt(rowNumber) : undefined;
        const columnNumber = target.getAttribute(COLCLASS);
        const column = columnNumber ? parseInt(columnNumber) : undefined;
        return { row, column };
    };

    const getRowByPercentage = (yPercentage: number, column: any) => {
        let ySum = 0;

        for (let r = 0; r < column.rows.length; r++) {
            const row = column.rows[r];
            ySum += parsePercentage(row.height);

            if (ySum >= yPercentage) {
                return row;
            }
        }

        return undefined;
    };

    // According to the position ocupied by the element, get the row and column to which it belongs
    const getColumnAndRowByPercentage = (xPercentage: number, yPercentage: number) => {
        let xSum = 0;

        let c = 0;
        for (; c < layout.columns.length; c++) {
            const column = layout.columns[c];
            xSum += parsePercentage(column.width);

            // Found the column in which the element belongs
            if (xSum >= xPercentage) {
                break;
            }
        }

        const column = layout.columns[c];
        const row = getRowByPercentage(yPercentage, column);

        return { column, row };
    };

    const pointerDownHandler = (event: React.PointerEvent<HTMLDivElement>) => {
        const target = event.target;

        // Check if we're clicking on an element that can be dragged
        if (target instanceof HTMLElement && target.classList.contains(DRAGCLASS)) {
            isPointerDown.current = true;

            pointerPos.current.x = event.clientX;
            pointerPos.current.y = event.clientY;

            // Figure out the purpose of the element through its "data-drag-type" attribute
            const purpose = target.getAttribute(ELEMENTCLASS);
            const { row, column } = getRowAndColumnNumberFromElement(target);

            if (purpose === ElementTypes.RESIZE_ROW || purpose === ElementTypes.RESIZE_COLUMN) {
                if (row !== undefined && column !== undefined) {
                    operationInformation.current = {
                        purpose,
                        args: {
                            column,
                            row,
                        },
                    };
                }
            } else if (purpose === ElementTypes.TAB) {
                const tabIndex = target.getAttribute("data-tab-index");

                if (tabIndex !== undefined && row !== undefined && column !== undefined) {
                    operationInformation.current = {
                        purpose,
                        args: {
                            target,
                            tabIndex,
                            row,
                            column,
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

    const onClick = () => {
        if (operationInformation.current.purpose === ElementTypes.TAB) {
            const tabIndex = operationInformation.current.args.tabIndex;
            const layoutElement = getPosInLayout(operationInformation.current.args.column, operationInformation.current.args.row);
            if (layoutElement) {
                layoutElement.selectedTab = tabIndex;

                setLayout({ ...layout });
            }
        }
    };

    const pointerUpHandler = (event: React.PointerEvent<HTMLDivElement>) => {
        // If pointer was dragging, stop drag. If not, consider it a click
        if (isDragging.current) {
            onDragRelease();
        } else {
            // Perform click function
            onClick();
        }
        operationInformation.current = { purpose: ElementTypes.NONE };
        isPointerDown.current = false;
    };

    const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
        // Treat pointer out as if releasing drag
        if (isDragging.current) {
            isDragging.current = false;
        }
        operationInformation.current = { purpose: ElementTypes.NONE };
    };

    return (
        <div
            ref={containerDiv}
            onPointerDown={pointerDownHandler}
            onPointerMove={pointerMoveHandler}
            onPointerUp={pointerUpHandler}
            onPointerLeave={onPointerLeave}
            className={style.flexibleGrid}
        >
            {columns}
        </div>
    );
};
