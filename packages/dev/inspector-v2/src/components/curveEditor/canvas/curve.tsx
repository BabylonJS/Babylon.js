import type { FunctionComponent } from "react";

import * as React from "react";
import { Animation } from "core/Animations/animation";
import type { CurveData } from "./curveData";

type CurveProps = {
    curve: CurveData;
    convertX: (frame: number) => number;
    convertY: (value: number) => number;
};

/**
 * Curve component that renders an animation curve path
 * @param props - The curve props
 * @returns The rendered curve SVG element
 */
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
