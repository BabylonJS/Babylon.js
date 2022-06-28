import type { Vector2 } from "core/Maths/math";
import * as React from "react";

// which side of the bounding box are we on?
export enum ScalePointPosition {
    Top = -1,
    Left = -1,
    Center = 0,
    Right = 1,
    Bottom = 1,
}

// a single gizmo scale point on the bounding box
export interface IScalePoint {
    position: Vector2;
    horizontalPosition: ScalePointPosition;
    verticalPosition: ScalePointPosition;
    rotation: number;
    isPivot: boolean;
    defaultRotation: number;
}

interface IGizmoScalePointProps {
    scalePoint: IScalePoint;
    clickable: boolean;
    key: number;
    onDrag: () => void;
    onRotate: () => void;
    onUp: () => void;
    overrideCursor?: string;
    canRotate: boolean;
}

import gizmoPivotIcon from "../imgs/gizmoPivotIcon.svg";

// load in custom cursor icons
import cursor_scaleDiagonalLeft from "../imgs/cursor_scaleDiagonalLeft.svg";
import cursor_scaleDiagonalRight from "../imgs/cursor_scaleDiagonalRight.svg";
import cursor_scaleHorizontal from "../imgs/cursor_scaleHorizontal.svg";
import cursor_scaleVertical from "../imgs/cursor_scaleVertical.svg";

import cursor_rotate0 from "../imgs/cursor_rotate0.svg";
import cursor_rotate1 from "../imgs/cursor_rotate1.svg";
import cursor_rotate2 from "../imgs/cursor_rotate2.svg";
import cursor_rotate3 from "../imgs/cursor_rotate3.svg";
import cursor_rotate4 from "../imgs/cursor_rotate4.svg";
import cursor_rotate5 from "../imgs/cursor_rotate5.svg";
import cursor_rotate6 from "../imgs/cursor_rotate6.svg";
import cursor_rotate7 from "../imgs/cursor_rotate7.svg";

// load in custom cursor icons
const cursorScaleDiagonaLeft: string = `url("${cursor_scaleDiagonalLeft}") 12 12, nwse-resize`;
const cursorScaleDiagonalRight: string = `url("${cursor_scaleDiagonalRight}") 12 12, nesw-resize`;
const cursorScaleHorizontal: string = `url("${cursor_scaleHorizontal}") 12 12, pointer`;
const cursorScaleVertical: string = `url("${cursor_scaleVertical}") 12 12, ns-resize`;
const scalePointCursors = [
    cursorScaleVertical,
    cursorScaleDiagonalRight,
    cursorScaleHorizontal,
    cursorScaleDiagonaLeft,
    cursorScaleVertical,
    cursorScaleDiagonalRight,
    cursorScaleHorizontal,
    cursorScaleDiagonaLeft,
];
const rotateCursors = [cursor_rotate0, cursor_rotate1, cursor_rotate2, cursor_rotate3, cursor_rotate4, cursor_rotate5, cursor_rotate6, cursor_rotate7].map(
    (cursor) => `url("${cursor}") 12 12, pointer`
);

const modulo = (dividend: number, divisor: number) => ((dividend % divisor) + divisor) % divisor;

export function GizmoScalePoint(props: IGizmoScalePointProps) {
    const { scalePoint, clickable, onDrag, onRotate, onUp, overrideCursor, canRotate } = props;

    const style: React.CSSProperties = {
        left: `${scalePoint.position.x}px`,
        top: `${scalePoint.position.y}px`,
        transform: "translate(-50%, -50%) rotate(" + scalePoint.rotation + "deg)",
        pointerEvents: clickable ? "auto" : "none",
    };

    if (scalePoint.isPivot) {
        return <img className="pivot-point" src={gizmoPivotIcon} style={style} onDragStart={(evt) => evt.preventDefault()} />;
    }
    // compute which cursor icon to use on hover
    const angleOfCursor = scalePoint.defaultRotation + scalePoint.rotation;
    const angleAdjusted = modulo(angleOfCursor, 360);
    const increment = 45;
    const cursorIndex = Math.round(angleAdjusted / increment) % 8;
    const cursor = overrideCursor || scalePointCursors[cursorIndex];
    const scalePointContainerSize = 30; // .scale-point-container width/height in px
    const rotateClickAreaSize = 20; // .rotate-click-area width/height
    const rotateClickAreaOffset = 7; // how much to offset the invisible rotate click area from the center
    const rotateClickAreaStyle = {
        top: (scalePointContainerSize - rotateClickAreaSize) / 2 + rotateClickAreaOffset * scalePoint.verticalPosition,
        left: (scalePointContainerSize - rotateClickAreaSize) / 2 + rotateClickAreaOffset * scalePoint.horizontalPosition,
        cursor: rotateCursors[cursorIndex],
    };
    const scaleClickAreaSize = 20; // .scale-click-area width/height
    const scaleClickAreaOffset = 5; // how much to offset the invisible scale click area from the center
    const scaleClickAreaStyle = {
        top: (scalePointContainerSize - scaleClickAreaSize) / 2 - scaleClickAreaOffset * scalePoint.verticalPosition,
        left: (scalePointContainerSize - scaleClickAreaSize) / 2 - scaleClickAreaOffset * scalePoint.horizontalPosition,
        cursor,
    };
    return (
        <div style={style} className="scale-point-container">
            {canRotate && <div className="rotate-click-area" onPointerDown={onRotate} style={rotateClickAreaStyle}></div>}
            <div
                className="scale-click-area"
                draggable={true}
                onDragStart={(evt) => evt.preventDefault()}
                onPointerDown={(event) => {
                    // if left mouse button down
                    if (event.buttons & 1) {
                        onDrag();
                    }
                }}
                onPointerUp={onUp}
                style={scaleClickAreaStyle}
            ></div>
            <div
                className="scale-point"
                draggable={true}
                onDragStart={(evt) => evt.preventDefault()}
                onPointerDown={(event) => {
                    if (event.buttons & 1) {
                        onDrag();
                    }
                }}
                onPointerUp={onUp}
                style={{ cursor }}
            ></div>
        </div>
    );
}
