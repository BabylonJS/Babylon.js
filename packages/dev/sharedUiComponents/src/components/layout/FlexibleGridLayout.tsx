import type { FC } from "react";
import { useState, useRef } from "react";
import { FlexibleColumn } from "./FlexibleColumn";
import style from "./FlexibleGridLayout.modules.scss";
import { FlexibleTabsContainer } from "./FlexibleTabsContainer";
import { Vector2 } from "core/Maths/math";

export interface IFlexibleGridLayoutProps {
    layoutDefinition: any;
}

export const DRAGCLASS = "draggable";

export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout] = useState(props.layoutDefinition);
    const initialPointerPos = useRef(new Vector2(0, 0));
    const hasClicked = useRef(false);
    const isDragging = useRef(false);

    /*const onDragStart = (pos: Vector2) => {
        console.log(`onDragStart(${pos})`);
    };

    const onDragMove = (pos: Vector2) => {
        console.log(`onDragMove(${pos})`);
    };

    const onDragEnd = (pos: Vector2) => {
        console.log(`onDragEnd(${pos})`);
    };*/

    const columns = layout.columns.map((column: any) => {
        return (
            <FlexibleColumn width={column.width}>
                {column.rows.map((row: any) => {
                    return (
                        <div style={{ height: row.height }}>
                            <FlexibleTabsContainer tabs={row.tabs} selectedTab={row.selectedTab} />
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
                isDragging.current = true;
            }
        } else if (hasClicked.current) {
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
            onPointerDown={pointerDownHandler}
            onPointerMove={pointerMoveHandler}
            onPointerUp={(event) => pointerUpHandler(event, () => console.log("click"))}
            className={style.flexibleGrid}
        >
            {columns}
        </div>
    );
};
