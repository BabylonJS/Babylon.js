import * as React from "react";
import type { GlobalState } from "../globalState";
import type { IScalePoint } from "./gizmoScalePoint";
import { GizmoScalePoint, ScalePointPosition } from "./gizmoScalePoint";
import { CoordinateHelper } from "./coordinateHelper";
import { Vector2 } from "core/Maths/math";
import type { Line } from "gui/2D/controls/line";

interface IGizmoLineProps {
    globalState: GlobalState;
    control: Line;
}

export function GizmoLine(props: IGizmoLineProps) {
    const { control, globalState } = props;

    const [scalePoints, setScalePoints] = React.useState<IScalePoint[]>([
        { position: new Vector2(), horizontalPosition: ScalePointPosition.Left, verticalPosition: ScalePointPosition.Center, rotation: 0, isPivot: false, defaultRotation: 0 },
        { position: new Vector2(), horizontalPosition: ScalePointPosition.Center, verticalPosition: ScalePointPosition.Center, rotation: 0, isPivot: true, defaultRotation: 0 },
        { position: new Vector2(), horizontalPosition: ScalePointPosition.Right, verticalPosition: ScalePointPosition.Center, rotation: 0, isPivot: false, defaultRotation: 0 },
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
        const line = control as any;
        const offsetX = line._cachedParentMeasure.width * 0.5;
        const offsetY = line._cachedParentMeasure.height * 0.5;
        const x1 = line._x1.getValue(control.host) - offsetX;
        const y1 = line._y1.getValue(control.host) - offsetY;
        const x2 = line._effectiveX2 - offsetX;
        const y2 = line._effectiveY2 - offsetY;

        const positions = [
            new Vector2(x1, y1),
            new Vector2((control.transformCenterX - 0.5) * control.widthInPixels, (control.transformCenterY - 0.5) * control.heightInPixels),
            new Vector2(x2, y2),
        ];
        setScalePoints(
            scalePoints.map((point, index) => {
                const position = positions[index];
                const rtt = CoordinateHelper.NodeToRTTSpace(control, position.x, position.y);
                const canvas = CoordinateHelper.RttToCanvasSpace(rtt.x, rtt.y);
                return {
                    ...point,
                    position: canvas,
                    rotation: control.rotation,
                };
            })
        );
    };
    return (
        <div className="gizmo">
            {scalePoints.map((point, index) => (
                <GizmoScalePoint
                    scalePoint={point}
                    clickable={true}
                    onDrag={() => {}}
                    onRotate={() => {}}
                    onUp={() => {}}
                    key={index}
                    overrideCursor="not-allowed"
                    canRotate={false}
                />
            ))}
        </div>
    );
}
