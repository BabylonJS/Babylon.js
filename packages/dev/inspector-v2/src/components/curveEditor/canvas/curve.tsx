import type { FunctionComponent } from "react";

import * as React from "react";
import { Animation } from "core/Animations/animation";
import type { Curve as SharedCurve } from "shared-ui-components/curveEditor/curve";

type CurveProps = {
    curve: SharedCurve;
    convertX: (frame: number) => number;
    convertY: (value: number) => number;
};

export const Curve: FunctionComponent<CurveProps> = ({ curve, convertX, convertY }) => {
    const isQuaternion = curve.animation.dataType === Animation.ANIMATIONTYPE_QUATERNION;

    // Path style - same as v1
    const pathStyle: React.CSSProperties = {
        stroke: curve.color,
        fill: "none",
        strokeWidth: "2",
    };

    if (isQuaternion) {
        (pathStyle as Record<string, unknown>)["strokeDasharray"] = "5";
        (pathStyle as Record<string, unknown>)["strokeOpacity"] = "0.5";
    }

    return (
        <svg style={{ cursor: "pointer", overflow: "auto" }}>
            <path d={curve.getPathData(convertX, convertY)} style={pathStyle} />
        </svg>
    );
};
