import * as React from "react";
import type { GlobalState } from "../globalState";
import type { IScalePoint } from "./gizmoScalePoint";
import { GizmoScalePoint, ScalePointPosition } from "./gizmoScalePoint";
import { Vector2 } from "core/Maths/math";
import type { Line } from "gui/2D/controls/line";
import { CoordinateHelper } from "./coordinateHelper";
import { Matrix2D } from "gui/2d/math2D";

interface IGizmoLineProps {
    globalState: GlobalState;
    control: Line;
}

function getPivot(x1: number, y1: number, x2: number, y2: number, centerX: number, centerY: number) {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);
    const width = maxX - minX;
    const height = maxY - minY;

    // Get pivot
    const xm = minX + width * centerX;
    const ym = minY + height * centerY;

    return new Vector2(xm, ym);
}

export function GizmoLine(props: IGizmoLineProps) {
    const { control, globalState } = props;
    const lastCursor = React.useRef({ x: 0, y: 0 });
    const isPivotBeingMoved = React.useRef(false);
    const isDragging = React.useRef(false);
    const movedScalePoint = React.useRef<number>();
    const isRotating = React.useRef(false);
    const pivot = React.useRef<Vector2>();
    const initialAngleToPivot = React.useRef<number>(0);
    const firstRotationChange = React.useRef(true);

    const [scalePoints, setScalePoints] = React.useState<IScalePoint[]>([
        {
            position: new Vector2(),
            horizontalPosition: ScalePointPosition.Left,
            verticalPosition: ScalePointPosition.Top,
            rotation: 0,
            isPivot: false,
            defaultRotation: 0,
            id: 0,
        },
        {
            position: new Vector2(),
            horizontalPosition: ScalePointPosition.Center,
            verticalPosition: ScalePointPosition.Center,
            rotation: 0,
            isPivot: true,
            defaultRotation: 0,
            id: 1,
        },
        {
            position: new Vector2(),
            horizontalPosition: ScalePointPosition.Right,
            verticalPosition: ScalePointPosition.Bottom,
            rotation: 0,
            isPivot: false,
            defaultRotation: 0,
            id: 2,
        },
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
        const vm = getPivot(x1, y1, x2, y2, control.transformCenterX, control.transformCenterY);

        const matrix = control._transformMatrix;

        const p1 = new Vector2();
        const p2 = new Vector2();
        const pm = new Vector2();

        matrix.transformCoordinates(v1.x, v1.y, p1);
        matrix.transformCoordinates(v2.x, v2.y, p2);
        matrix.transformCoordinates(vm.x, vm.y, pm);

        // pivot.current = new Vector2(pm.x, pm.y);

        const positions = [new Vector2(p1.x, p1.y), new Vector2(pm.x, pm.y), new Vector2(p2.x, p2.y)];

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
        // Pivot movement corresponds to moving the control itself
        if (isDragging.current && isPivotBeingMoved.current) {
            // We have to compute the difference in movement in the local node
            // coordintes, so that it accounts for zoom
            const rttClientCoords = CoordinateHelper.MousePointerToRTTSpace(control, pointerEvent.clientX, pointerEvent.clientY);
            const localClientCoords = CoordinateHelper.RttToLocalNodeSpace(control, rttClientCoords.x, rttClientCoords.y);

            const rttLastCoordinates = CoordinateHelper.MousePointerToRTTSpace(control, lastCursor.current.x, lastCursor.current.y);
            const localLastCoordinates = CoordinateHelper.RttToLocalNodeSpace(control, rttLastCoordinates.x, rttLastCoordinates.y);

            const delta = new Vector2(localClientCoords.x - localLastCoordinates.x, localClientCoords.y - localLastCoordinates.y);

            const rotatedDelta = new Vector2();
            delta.rotateToRef(control.rotation, rotatedDelta);

            const deltaX = rotatedDelta.x;
            const deltaY = rotatedDelta.y;

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

            globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        } else if (isDragging.current) {
            // Moving the scale points
            const rttClientCoords = CoordinateHelper.MousePointerToRTTSpace(control, pointerEvent.clientX, pointerEvent.clientY);
            const localClientCoords = CoordinateHelper.RttToLocalNodeSpace(control, rttClientCoords.x, rttClientCoords.y);

            const rttLastCoordinates = CoordinateHelper.MousePointerToRTTSpace(control, lastCursor.current.x, lastCursor.current.y);
            const localLastCoordinates = CoordinateHelper.RttToLocalNodeSpace(control, rttLastCoordinates.x, rttLastCoordinates.y);

            const delta = new Vector2(localClientCoords.x - localLastCoordinates.x, localClientCoords.y - localLastCoordinates.y);

            const rotatedDelta = new Vector2();
            delta.rotateToRef(control.rotation, rotatedDelta);

            const deltaX = rotatedDelta.x;
            const deltaY = rotatedDelta.y;

            // Move only the scale point that was touched
            const movedPointIndex = movedScalePoint.current;

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
            globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        } else if (isRotating.current && pivot.current) {
            // Rotation
            // Get the angle formed from the pivot to last and current cursor position
            // const pivotRtt = CoordinateHelper.NodeToRTTSpace(control, pivot.current.x, pivot.current.y);
            // const pivotCanvas = CoordinateHelper.RttToCanvasSpace(pivotRtt.x, pivotRtt.y);

            // const anglePivotLast = Math.atan2(lastCursor.current.y - pivotCanvas.y, lastCursor.current.x - pivotCanvas.x);
            // const anglePivotClient = Math.atan2(pointerEvent.clientY - pivotCanvas.y, pointerEvent.clientX - pivotCanvas.x);
            // const angle = (anglePivotClient - anglePivotLast) * ROTATION_SENSITIVITY;

            // control.rotation += angle;
            // globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            // const scene = props.globalState.workbench._scene;
            // console.log("scene", scene.pointerX, scene.pointerY, "event", pointerEvent.clientX, pointerEvent.clientY);
            const angle = Math.atan2(pointerEvent.clientY - pivot.current.y, pointerEvent.clientX - pivot.current.x);
            if (firstRotationChange.current) {
                firstRotationChange.current = false;
            } else {
                for (const control of globalState.selectedControls) {
                    console.log("rotation change", angle - initialAngleToPivot.current);

                    control.rotation += angle - initialAngleToPivot.current;
                }
            }
            initialAngleToPivot.current = angle;
            globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        }
        lastCursor.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };
    };

    const onUp = () => {
        isDragging.current = false;
        isRotating.current = false;
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
            // If the control has any rotation, reset the
            // rotation, modifying the so the scale behave as expected
            if (!scalePoint.isPivot && control.rotation) {
                const line = control as Line;
                const x1 = line._x1.getValue(line._host);
                const y1 = line._y1.getValue(line._host);
                const x2 = line._x2.getValue(line._host);
                const y2 = line._y2.getValue(line._host);

                const v1 = new Vector2(x1, y1);
                const v2 = new Vector2(x2, y2);

                const vm = getPivot(x1, y1, x2, y2, line.transformCenterX, line.transformCenterY);

                const finalTransform = Matrix2D.Identity();
                const currentTransform = Matrix2D.Identity();
                Matrix2D.TranslationToRef(-vm.x, -vm.y, currentTransform);
                finalTransform.multiplyToRef(currentTransform, finalTransform);
                Matrix2D.RotationToRef(control.rotation, currentTransform);
                finalTransform.multiplyToRef(currentTransform, finalTransform);
                Matrix2D.TranslationToRef(vm.x, vm.y, currentTransform);
                finalTransform.multiplyToRef(currentTransform, finalTransform);

                const p1 = new Vector2();
                const p2 = new Vector2();

                finalTransform.transformCoordinates(v1.x, v1.y, p1);
                finalTransform.transformCoordinates(v2.x, v2.y, p2);

                control.rotation = 0;
                control.x1 = p1.x;
                control.y1 = p1.y;
                control.x2 = p2.x;
                control.y2 = p2.y;
                globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
            isDragging.current = true;
            isRotating.current = false;
            movedScalePoint.current = scalePoint.id!;
        }
    };

    const onRotate = (event?: React.PointerEvent<HTMLDivElement>) => {
        if (event) {
            // const scene = props.globalState.workbench._scene;
            // lastCursor.current = { x: event.clientX, y: event.clientY };
            isRotating.current = true;
            isDragging.current = false;
            const nodeSpace = new Vector2(control.transformCenterX, control.transformCenterY);
            const rtt = CoordinateHelper.NodeToRTTSpace(control, nodeSpace.x, nodeSpace.y, undefined);
            const canvas = CoordinateHelper.RttToCanvasSpace(rtt.x, rtt.y);
            pivot.current = new Vector2(canvas.x, canvas.y);
            console.log("pivot", pivot.current.x, pivot.current.y);
            // console.log("scene", scene.pointerX, scene.pointerY, "pointer event", pointerEvent?.clientX, pointerEvent?.clientY);
            // initialAngleToPivot.current = Math.atan2(scene.pointerY - pivot.current.y, scene.pointerX - pivot.current.x);
            initialAngleToPivot.current = Math.atan2(event.clientY - pivot.current.y, event.clientX - pivot.current.x);
            console.log("initialAngleToPivot", initialAngleToPivot.current);
            firstRotationChange.current = true;
        }
    };

    return (
        <div className="gizmo">
            {scalePoints.map((point, index) => (
                <GizmoScalePoint scalePoint={point} allowClickOnPivot={true} clickable={true} onDrag={onDrag} onRotate={onRotate} onUp={onUp} key={index} canRotate={true} />
            ))}
        </div>
    );
}
