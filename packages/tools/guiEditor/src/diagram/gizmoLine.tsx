import * as React from "react";
import type { GlobalState } from "../globalState";
import type { IScalePoint } from "./gizmoScalePoint";
import { GizmoScalePoint, ScalePointPosition } from "./gizmoScalePoint";
import { Vector2 } from "core/Maths/math";
import type { Line } from "gui/2D/controls/line";
import { CoordinateHelper } from "./coordinateHelper";
import { Matrix2D, MathTools } from "gui/2D/math2D";
import type { ValueAndUnit } from "gui/2D/valueAndUnit";
import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";

interface IGizmoLineProps {
    globalState: GlobalState;
    control: Line;
}

function getPivotToRef(x1: number, y1: number, x2: number, y2: number, centerX: number, centerY: number, ref: Vector2) {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);
    const width = maxX - minX;
    const height = maxY - minY;

    // Get pivot
    const xm = minX + width * centerX;
    const ym = minY + height * centerY;

    ref.x = xm;
    ref.y = ym;
}

const TmpVectors = [new Vector2(), new Vector2(), new Vector2()];

/**
 * This class represents the gizmo drawn on a line Control.
 * It is used to scale and rotate the control around a pivot point
 * @param props the properties of the gizmo
 * @returns a gizmo line
 */
export function GizmoLine(props: IGizmoLineProps) {
    const { control, globalState } = props;
    const isPivotMoving = React.useRef(false);
    const isDragging = React.useRef(false);
    const isRotating = React.useRef(false);
    const movedScalePoint = React.useRef<number>();
    const lastCursor = React.useRef(new Vector2());
    const pivot = React.useRef(new Vector2());

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
        const x1 = line._cachedParentMeasure.left + line._x1.getValue(line._host);
        const y1 = line._cachedParentMeasure.top + line._y1.getValue(line._host);
        const x2 = line._cachedParentMeasure.left + line._effectiveX2;
        const y2 = line._cachedParentMeasure.top + line._effectiveY2;

        const v1 = TmpVectors[0].set(x1, y1);
        const v2 = TmpVectors[1].set(x2, y2);
        const vm = TmpVectors[2];
        getPivotToRef(x1, y1, x2, y2, line.transformCenterX, line.transformCenterY, vm);

        const matrix = line._transformMatrix;

        matrix.transformCoordinates(v1.x, v1.y, v1);
        matrix.transformCoordinates(v2.x, v2.y, v2);
        matrix.transformCoordinates(vm.x, vm.y, vm);

        pivot.current = vm;

        const positions = [v1, vm, v2];

        setScalePoints(
            scalePoints.map((point, index) => {
                const position = positions[index];
                return {
                    ...point,
                    position,
                    rotation: line.rotation,
                };
            })
        );
    };

    const _getAddAndRound = (value: ValueAndUnit, host: AdvancedDynamicTexture, delta: number) => {
        return MathTools.Round(value.getValue(host) + delta);
    };

    const _getDeltasToRef = (currentPointer: Vector2, ref: Vector2) => {
        // We have to compute the difference in movement in the local node
        // coordintes, so that it accounts for zoom
        const rttClientCoords = CoordinateHelper.MousePointerToRTTSpace(control, currentPointer.x, currentPointer.y);
        const localClientCoords = CoordinateHelper.RttToLocalNodeSpace(control, rttClientCoords.x, rttClientCoords.y);

        const rttLastCoordinates = CoordinateHelper.MousePointerToRTTSpace(control, lastCursor.current.x, lastCursor.current.y);
        const localLastCoordinates = CoordinateHelper.RttToLocalNodeSpace(control, rttLastCoordinates.x, rttLastCoordinates.y);

        const delta = TmpVectors[0];
        localClientCoords.subtractToRef(localLastCoordinates, delta);

        const rotatedDelta = TmpVectors[1];
        delta.rotateToRef(control.rotation, rotatedDelta);

        ref.x = rotatedDelta.x;
        ref.y = rotatedDelta.y;
    };

    const _dragPivot = (currentPointer: Vector2) => {
        const deltas = TmpVectors[0];
        _getDeltasToRef(currentPointer, deltas);

        control.x1 = _getAddAndRound(control._x1, control._host, deltas.x);
        control.y1 = _getAddAndRound(control._y1, control._host, deltas.y);
        control.x2 = _getAddAndRound(control._x2, control._host, deltas.x);
        control.y2 = _getAddAndRound(control._y2, control._host, deltas.y);

        globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
    };

    const _dragEndpoint = (currentPointer: Vector2) => {
        const deltas = TmpVectors[0];
        _getDeltasToRef(currentPointer, deltas);

        // Move only the scale point that was touched
        const movedPointIndex = movedScalePoint.current;

        if (movedPointIndex === 0) {
            // Moved first point, (x1, y1)
            control.x1 = _getAddAndRound(control._x1, control._host, deltas.x);
            control.y1 = _getAddAndRound(control._y1, control._host, deltas.y);
        } else if (movedPointIndex === 2) {
            // Moved second point, (x2, y2)
            control.x2 = _getAddAndRound(control._x2, control._host, deltas.x);
            control.y2 = _getAddAndRound(control._y2, control._host, deltas.y);
        }
        globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
    };

    const _rotateEndpoint = (currentPointer: Vector2) => {
        const currentToPivot = currentPointer.subtract(pivot.current);
        currentToPivot.normalize();
        const lastToPivot = lastCursor.current.subtract(pivot.current);
        lastToPivot.normalize();

        const dotProd = Vector2.Dot(currentToPivot, lastToPivot);
        const angle = Math.acos(dotProd);

        const direction = -Math.sign(currentToPivot.x * lastToPivot.y - currentToPivot.y * lastToPivot.x);

        if (!isNaN(angle)) {
            control.rotation += direction * angle;
            control.rotation = MathTools.Round(control.rotation);
            globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        }
    };

    const onMove = () => {
        const scene = globalState.workbench._scene;
        const currentPointer = new Vector2(scene.pointerX, scene.pointerY);
        if (isDragging.current && isPivotMoving.current) {
            _dragPivot(currentPointer);
        } else if (isDragging.current) {
            _dragEndpoint(currentPointer);
        } else if (isRotating.current) {
            _rotateEndpoint(currentPointer);
        }
        lastCursor.current = currentPointer;
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
            const scene = globalState.workbench._scene;
            lastCursor.current = new Vector2(scene.pointerX, scene.pointerY);
            isPivotMoving.current = scalePoint.isPivot;
            // If the control has any rotation, reset the
            // rotation, modifying the so the scale behave as expected
            if (!scalePoint.isPivot && control.rotation) {
                const line = control as Line;
                const x1 = line._x1.getValue(line._host);
                const y1 = line._y1.getValue(line._host);
                const x2 = line._x2.getValue(line._host);
                const y2 = line._y2.getValue(line._host);

                const v1 = TmpVectors[0].set(x1, y1);
                const v2 = TmpVectors[1].set(x2, y2);
                const vm = TmpVectors[2];

                getPivotToRef(x1, y1, x2, y2, line.transformCenterX, line.transformCenterY, vm);

                const finalTransform = Matrix2D.Identity();
                const currentTransform = Matrix2D.Identity();
                Matrix2D.TranslationToRef(-vm.x, -vm.y, currentTransform);
                finalTransform.multiplyToRef(currentTransform, finalTransform);
                Matrix2D.RotationToRef(control.rotation, currentTransform);
                finalTransform.multiplyToRef(currentTransform, finalTransform);
                Matrix2D.TranslationToRef(vm.x, vm.y, currentTransform);
                finalTransform.multiplyToRef(currentTransform, finalTransform);

                finalTransform.transformCoordinates(v1.x, v1.y, v1);
                finalTransform.transformCoordinates(v2.x, v2.y, v2);

                control.rotation = 0;
                control.x1 = MathTools.Round(v1.x);
                control.y1 = MathTools.Round(v1.y);
                control.x2 = MathTools.Round(v2.x);
                control.y2 = MathTools.Round(v2.y);
                globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
            isDragging.current = true;
            isRotating.current = false;
            movedScalePoint.current = scalePoint.id!;
        }
    };

    const onRotate = (event?: React.PointerEvent<HTMLDivElement>) => {
        if (event) {
            isRotating.current = true;
            isDragging.current = false;

            const scene = globalState.workbench._scene;
            lastCursor.current = new Vector2(scene.pointerX, scene.pointerY);
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
