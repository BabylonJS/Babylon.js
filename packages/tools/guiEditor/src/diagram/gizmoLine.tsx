import * as React from "react";
import type { GlobalState } from "../globalState";
import type { IScalePoint } from "./gizmoScalePoint";
import { GizmoScalePoint, ScalePointPosition } from "./gizmoScalePoint";
import { Vector2 } from "core/Maths/math";
import type { Line } from "gui/2D/controls/line";

interface IGizmoLineProps {
    globalState: GlobalState;
    control: Line;
}

export function GizmoLine(props: IGizmoLineProps) {
    const { control, globalState } = props;

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
        const x1 = control._currentMeasure.left;
        const y1 = control._currentMeasure.top;
        const x2 = control._currentMeasure.width + x1;
        const y2 = control._currentMeasure.height + y1;

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
    return (
        <div className="gizmo">
            {scalePoints.map((point, index) => (
                <GizmoScalePoint scalePoint={point} clickable={true} onDrag={() => {}} onRotate={() => {}} onUp={() => {}} key={index} canRotate={true} />
            ))}
        </div>
    );
}
