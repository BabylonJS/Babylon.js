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
    id?: number;
}

interface IGizmoScalePointProps {
    scalePoint: IScalePoint;
    clickable: boolean;
    key: number;
    onDrag: (event?: React.PointerEvent<HTMLDivElement>, scalePoint?: IScalePoint) => void;
    onRotate: (event?: React.PointerEvent<HTMLDivElement>, scalePoint?: IScalePoint) => void;
    onUp: () => void;
    overrideCursor?: string;
    canRotate: boolean;
    allowClickOnPivot?: boolean;
}

import gizmoPivotIcon from "../imgs/gizmoPivotIcon.svg";

// load in custom cursor icons
import cursorScaleDiagonalLeftIcon from "../imgs/cursor_scaleDiagonalLeft.svg";
import cursorScaleDiagonalRightIcon from "../imgs/cursor_scaleDiagonalRight.svg";
import cursorScaleHorizontalIcon from "../imgs/cursor_scaleHorizontal.svg";
import cursorScaleVerticalIcon from "../imgs/cursor_scaleVertical.svg";

import cursorRotate0 from "../imgs/cursor_rotate0.svg";
import cursorRotate1 from "../imgs/cursor_rotate1.svg";
import cursorRotate2 from "../imgs/cursor_rotate2.svg";
import cursorRotate3 from "../imgs/cursor_rotate3.svg";
import cursorRotate4 from "../imgs/cursor_rotate4.svg";
import cursorRotate5 from "../imgs/cursor_rotate5.svg";
import cursorRotate6 from "../imgs/cursor_rotate6.svg";
import cursorRotate7 from "../imgs/cursor_rotate7.svg";

// load in custom cursor icons
const cursorScaleDiagonaLeft: string = `url("${cursorScaleDiagonalLeftIcon}") 12 12, nwse-resize`;
const cursorScaleDiagonalRight: string = `url("${cursorScaleDiagonalRightIcon}") 12 12, nesw-resize`;
const cursorScaleHorizontal: string = `url("${cursorScaleHorizontalIcon}") 12 12, pointer`;
const cursorScaleVertical: string = `url("${cursorScaleVerticalIcon}") 12 12, ns-resize`;
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
const rotateCursors = [cursorRotate0, cursorRotate1, cursorRotate2, cursorRotate3, cursorRotate4, cursorRotate5, cursorRotate6, cursorRotate7].map(
    (cursor) => `url("${cursor}") 12 12, pointer`
);

const modulo = (dividend: number, divisor: number) => ((dividend % divisor) + divisor) % divisor;

export function GizmoScalePoint(props: IGizmoScalePointProps) {
    const { scalePoint, clickable, onDrag, onRotate, onUp, overrideCursor, canRotate, allowClickOnPivot } = props;

    const style: React.CSSProperties = {
        left: `${scalePoint.position.x}px`,
        top: `${scalePoint.position.y}px`,
        transform: "translate(-50%, -50%) rotate(" + scalePoint.rotation + "deg)",
        pointerEvents: clickable ? "auto" : "none",
    };

    if (scalePoint.isPivot) {
        return (
            <img
                className="pivot-point"
                src={gizmoPivotIcon}
                style={style}
                onDragStart={(evt) => evt.preventDefault()}
                onPointerDown={(event) => {
                    if (allowClickOnPivot) {
                        onDrag(event, scalePoint);
                    }
                }}
                onPointerUp={() => {
                    if (allowClickOnPivot) {
                        onUp();
                    }
                }}
            />
        );
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
            {canRotate && (
                <div
                    className="rotate-click-area"
                    onPointerDown={(event) => {
                        onRotate(event, scalePoint);
                    }}
                    style={rotateClickAreaStyle}
                ></div>
            )}
            <div
                className="scale-click-area"
                draggable={true}
                onDragStart={(evt) => evt.preventDefault()}
                onPointerDown={(event) => {
                    // if left mouse button down
                    if (event.buttons & 1) {
                        onDrag(event, scalePoint);
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
                        onDrag(event, scalePoint);
                    }
                }}
                onPointerUp={onUp}
                style={{ cursor }}
            ></div>
        </div>
    );
}
