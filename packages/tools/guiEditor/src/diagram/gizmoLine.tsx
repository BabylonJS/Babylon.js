import * as React from "react";
import type { GlobalState } from "../globalState";
import type { IScalePoint } from "./gizmoScalePoint";
import { GizmoScalePoint, ScalePointPosition } from "./gizmoScalePoint";
import { Vector2 } from "core/Maths/math";
import type { Line } from "gui/2D/controls/line";
import { CoordinateHelper } from "./coordinateHelper";

interface IGizmoLineProps {
    globalState: GlobalState;
    control: Line;
}

export function GizmoLine(props: IGizmoLineProps) {
    const { control, globalState } = props;
    const lastCursor = React.useRef({ x: 0, y: 0 });
    const isPivotBeingMoved = React.useRef(false);
    const isDragging = React.useRef(false);
    const movedScalePoint = React.useRef<IScalePoint>();

    const [scalePoints, setScalePoints] = React.useState<IScalePoint[]>([
        { position: new Vector2(), horizontalPosition: ScalePointPosition.Left, verticalPosition: ScalePointPosition.Top, rotation: 0, isPivot: false, defaultRotation: 0 },
        { position: new Vector2(), horizontalPosition: ScalePointPosition.Center, verticalPosition: ScalePointPosition.Center, rotation: 0, isPivot: true, defaultRotation: 0 },
        { position: new Vector2(), horizontalPosition: ScalePointPosition.Right, verticalPosition: ScalePointPosition.Bottom, rotation: 0, isPivot: false, defaultRotation: 0 },
    ]);

    React.useEffect(() => {
        // setup
        const gizmoUpdateObserver = globalState.onGizmoUpdateRequireObservable.add(() => {
            update();
        });
        return () => {
            // cleanup
            globalState.onGizmoUpdateRequireObservable.remove(gizmoUpdateObserver);
        };
    }, []);

    const update = () => {
        const line = control as Line;
        const x1 = control._cachedParentMeasure.left + line._x1.getValue(line._host);
        const y1 = control._cachedParentMeasure.top + line._y1.getValue(line._host);
        const x2 = control._cachedParentMeasure.left + line._effectiveX2;
        const y2 = control._cachedParentMeasure.top + line._effectiveY2;

        const v1 = new Vector2(x1, y1);
        const v2 = new Vector2(x2, y2);

        const matrix = control._transformMatrix;

        const p1 = new Vector2();
        const p2 = new Vector2();

        matrix.transformCoordinates(v1.x, v1.y, p1);
        matrix.transformCoordinates(v2.x, v2.y, p2);

        // Get middle
        const xm = (p1.x + p2.x) * 0.5;
        const ym = (p1.y + p2.y) * 0.5;

        const positions = [new Vector2(p1.x, p1.y), new Vector2(xm, ym), new Vector2(p2.x, p2.y)];

        setScalePoints(
            scalePoints.map((point, index) => {
                const position = positions[index];
                return {
                    ...point,
                    position,
                    rotation: control.rotation,
                };
            })
        );
    };

    const onMove = (pointerEvent: React.PointerEvent<HTMLCanvasElement>) => {
        // console.log("on move", pointerEvent);
        // Pivot movement corresponds to moving the control itself
        if (isDragging.current && isPivotBeingMoved.current) {
            // We have to compute the difference in movement in the local node
            // coordintes, so that it accounts for zoom
            const rttClientCoords = CoordinateHelper.MousePointerToRTTSpace(control, pointerEvent.clientX, pointerEvent.clientY);
            const localClientCoords = CoordinateHelper.RttToLocalNodeSpace(control, rttClientCoords.x, rttClientCoords.y);

            const rttLastCoordinates = CoordinateHelper.MousePointerToRTTSpace(control, lastCursor.current.x, lastCursor.current.y);
            const localLastCoordinates = CoordinateHelper.RttToLocalNodeSpace(control, rttLastCoordinates.x, rttLastCoordinates.y);

            const deltaX = localClientCoords.x - localLastCoordinates.x;
            const deltaY = localClientCoords.y - localLastCoordinates.y;

            let x1 = control._x1.getValue(control._host);
            x1 += deltaX;
            control.x1 = x1;

            let y1 = control._y1.getValue(control._host);
            y1 += deltaY;
            control.y1 = y1;

            let x2 = control._x2.getValue(control._host);
            x2 += deltaX;
            control.x2 = x2;

            let y2 = control._y2.getValue(control._host);
            y2 += deltaY;
            control.y2 = y2;
        } else if (isDragging.current) {
            // Moving the scale points
            const rttClientCoords = CoordinateHelper.MousePointerToRTTSpace(control, pointerEvent.clientX, pointerEvent.clientY);
            const localClientCoords = CoordinateHelper.RttToLocalNodeSpace(control, rttClientCoords.x, rttClientCoords.y);

            const rttLastCoordinates = CoordinateHelper.MousePointerToRTTSpace(control, lastCursor.current.x, lastCursor.current.y);
            const localLastCoordinates = CoordinateHelper.RttToLocalNodeSpace(control, rttLastCoordinates.x, rttLastCoordinates.y);

            const deltaX = localClientCoords.x - localLastCoordinates.x;
            const deltaY = localClientCoords.y - localLastCoordinates.y;

            // Move only the scale point that was touched
            const movedPointIndex = scalePoints.findIndex((point) => point === movedScalePoint.current);
            if (movedPointIndex === 0) {
                // Moved first point, (x1, y1)
                let x1 = control._x1.getValue(control._host);
                x1 += deltaX;
                control.x1 = x1;

                let y1 = control._y1.getValue(control._host);
                y1 += deltaY;
                control.y1 = y1;
            } else if (movedPointIndex === 2) {
                let x2 = control._x2.getValue(control._host);
                x2 += deltaX;
                control.x2 = x2;

                let y2 = control._y2.getValue(control._host);
                y2 += deltaY;
                control.y2 = y2;
            }
        }
        lastCursor.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };
    };

    const onUp = () => {
        isDragging.current = false;
    };

    React.useEffect(() => {
        const pointerMoveObserver = props.globalState.onPointerMoveObservable.add(onMove);
        const pointerUpObserver = props.globalState.onPointerUpObservable.add(onUp);
        return () => {
            props.globalState.onPointerMoveObservable.remove(pointerMoveObserver);
            props.globalState.onPointerUpObservable.remove(pointerUpObserver);
        };
    }, []);

    const onDrag = (event?: React.PointerEvent<HTMLDivElement>, scalePoint?: IScalePoint) => {
        if (event && scalePoint) {
            lastCursor.current = { x: event.clientX, y: event.clientY };
            isPivotBeingMoved.current = scalePoint.isPivot;
            isDragging.current = true;
            movedScalePoint.current = scalePoint;
        }
    };

    return (
        <div className="gizmo">
            {scalePoints.map((point, index) => (
                <GizmoScalePoint scalePoint={point} allowClickOnPivot={true} clickable={true} onDrag={onDrag} onRotate={() => {}} onUp={onUp} key={index} canRotate={true} />
            ))}
        </div>
    );
}
