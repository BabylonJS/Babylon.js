import type { FC } from "react";
import { useContext, useRef } from "react";
import { Vector2 } from "core/Maths/math";
import type { Nullable } from "core/types";
import { useDrop } from "react-dnd";
import { ElementTypes } from "./types";
import { LayoutTabsRow, LayoutColumn } from "./types";
import { addPercentageStringToNumber, getPosInLayout } from "./utils";
import { LayoutContext } from "./LayoutContext";

interface IFlexibleDragHandlerProps {
    containerSize: { width: number; height: number };
}

export const FlexibleDragHandler: FC<IFlexibleDragHandlerProps> = (props) => {
    const { layout, setLayout } = useContext(LayoutContext);
    // CLICK/DRAG INFORMATION
    const pointerPos = useRef<Nullable<Vector2>>(null);
    const [_, drop] = useDrop(() => ({
        accept: [ElementTypes.RESIZE_BAR],
        hover(item, monitor) {
            const anyitem = item as any;

            const xy = monitor.getClientOffset();
            const pos = new Vector2(xy!.x, xy!.y);
            if (pointerPos.current) {
                if (monitor.getItemType() === ElementTypes.RESIZE_BAR) {
                    onResize(anyitem.rowNumber, anyitem.columnNumber, pos, pointerPos.current, anyitem.direction);
                }
            }
            pointerPos.current = pos;
        },
        drop(item, monitor) {
            pointerPos.current = null;
        },
    }));

    const getLayoutProperty = (layout: LayoutColumn | LayoutTabsRow, property: "width" | "height") => {
        if (property === "width") {
            return (layout as LayoutColumn)[property];
        } else {
            return (layout as LayoutTabsRow)[property];
        }
    };

    const setLayoutProperty = (layout: LayoutColumn | LayoutTabsRow, property: "width" | "height", value: string) => {
        if (property === "width") {
            (layout as LayoutColumn)[property] = value;
        } else {
            (layout as LayoutTabsRow)[property] = value;
        }
    };

    const processResize = (
        pos: Vector2,
        prevPos: Vector2,
        row0: number | undefined,
        column0: number,
        row1: number | undefined,
        column1: number,
        axis: "x" | "y",
        maxAxisValue: number,
        property: "width" | "height",
        minFinalValue: number
    ) => {
        // Check axis difference
        const axisDiff = pos[axis] - prevPos[axis];

        // Get layout rows
        const layoutElement0 = getPosInLayout(layout, column0, row0);
        const layoutElement1 = getPosInLayout(layout, column1, row1);

        if (layoutElement0 && layoutElement1) {
            const percDiff = (axisDiff / maxAxisValue) * 100;

            const newValue0 = addPercentageStringToNumber(getLayoutProperty(layoutElement0, property), percDiff);
            const newValue1 = addPercentageStringToNumber(getLayoutProperty(layoutElement1, property), -percDiff);

            if (newValue0 >= minFinalValue && newValue1 >= minFinalValue) {
                setLayoutProperty(layoutElement0, property, newValue0.toFixed(2) + "%");
                setLayoutProperty(layoutElement1, property, newValue1.toFixed(2) + "%");
            }

            setLayout({ ...layout });
        }
    };

    const processResizeRow = (pos: Vector2, prevPos: Vector2, args: { row: number; column: number }) => {
        // console.log("containerDiv", props.containerDiv);
        processResize(pos, prevPos, args.row, args.column, args.row + 1, args.column, "y", props.containerSize.height, "height", 5);
    };

    const processResizeColumn = (pos: Vector2, prevPos: Vector2, args: { row: number; column: number }) => {
        // console.log("containerDiv", props.containerDiv);
        processResize(pos, prevPos, undefined, args.column, undefined, args.column + 1, "x", props.containerSize.width, "width", 5);
    };

    const onResize = (row: number, column: number, pos: Vector2, prevPos: Vector2, type: "row" | "column") => {
        if (type === "row") {
            processResizeRow(pos, prevPos, { row, column });
        } else {
            processResizeColumn(pos, prevPos, { row, column });
        }
        pointerPos.current = pos;
    };

    return (
        <div ref={drop} style={{ width: "100%", height: "100%" }}>
            {props.children}
        </div>
    );
};
