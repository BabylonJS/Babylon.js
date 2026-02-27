import type { FunctionComponent } from "react";

import * as React from "react";
import { useCallback } from "react";
import { Animation } from "core/Animations/animation";
import type { CurveData } from "./curveData";
import { useObservableState } from "../../../hooks/observableHooks";

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

    // Derive path data, recomputing whenever the curve's key data changes
    const pathData = useObservableState(
        useCallback(() => curve.getPathData(convertX, convertY), [curve, convertX, convertY]),
        curve.onDataUpdatedObservable
    );

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
            <path d={pathData} style={pathStyle} />
        </svg>
    );
};
