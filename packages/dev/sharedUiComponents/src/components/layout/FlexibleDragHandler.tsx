import type { FC } from "react";
import { useRef } from "react";
import { Vector2 } from "core/Maths/math";
import type { Nullable } from "core/types";
import { useDrop } from "react-dnd";
import { ElementTypes } from "./constants";
import { addPercentageStringToNumber } from "./unitTools";
import style from "./FlexibleDragHandler.modules.scss";

interface IFlexibleDragHandlerProps {
    layout: any;
    updateLayout: (layout: any) => void;
    containerSize: { width: number; height: number };
}

export const FlexibleDragHandler: FC<IFlexibleDragHandlerProps> = (props) => {
    // CLICK/DRAG INFORMATION
    const pointerPos = useRef<Nullable<Vector2>>(null);
    const [_, drop] = useDrop(() => ({
        accept: [ElementTypes.RESIZE_BAR],
        hover(item, monitor) {
            const anyitem = item as any;
            console.log("anyitem", anyitem);

            const xy = monitor.getClientOffset();
            const pos = new Vector2(xy!.x, xy!.y);
            if (pointerPos.current) {
                console.log("call onresize for", anyitem.rowNumber, anyitem.columnNumber, pos, pointerPos.current, anyitem.direction);
                onResize(anyitem.rowNumber, anyitem.columnNumber, pos, pointerPos.current, anyitem.direction);
            }
            pointerPos.current = pos;
        },
        drop(item, monitor) {
            console.log("drop");
            pointerPos.current = null;
        },
    }));

    const getPosInLayout = (column: number, row?: number) => {
        const columnLayout = props.layout.columns[column];
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
        prevPos: Vector2,
        row0: number | undefined,
        column0: number,
        row1: number | undefined,
        column1: number,
        axis: "x" | "y",
        maxAxisValue: number,
        property: string,
        minFinalValue: number
    ) => {
        // Check axis difference
        const axisDiff = pos[axis] - prevPos[axis];

        // Get layout rows
        const layoutElement0 = getPosInLayout(column0, row0);
        const layoutElement1 = getPosInLayout(column1, row1);

        if (layoutElement0 && layoutElement1) {
            const percDiff = (axisDiff / maxAxisValue) * 100;

            const newValue0 = addPercentageStringToNumber(layoutElement0[property], percDiff);
            const newValue1 = addPercentageStringToNumber(layoutElement1[property], -percDiff);

            if (newValue0 >= minFinalValue && newValue1 >= minFinalValue) {
                layoutElement0[property] = newValue0.toFixed(2) + "%";
                layoutElement1[property] = newValue1.toFixed(2) + "%";
            }

            // setLayout({ ...layout });
            console.log("call update layout");
            props.updateLayout({ ...props.layout });
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
        <div ref={drop} className={style.flexibleDragHandler}>
            {props.children}
        </div>
    );
};
