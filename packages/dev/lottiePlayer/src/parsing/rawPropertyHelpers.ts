import type { RawBezier, RawBezierShapeKeyframe, RawBezierShapeProperty, RawPositionProperty, RawVectorKeyframe, RawVectorProperty } from "./rawTypes";

/**
 * Gets the initial (first keyframe or static) vector values from a Lottie vector or position property.
 * For static properties (a === 0), returns the value directly.
 * For animated properties (a === 1), returns the first keyframe's start value.
 * @param property The raw vector or position property from the Lottie data.
 * @returns The initial vector values as a number array.
 */
export function GetInitialVectorValues(property: RawVectorProperty | RawPositionProperty): number[] {
    if (property.a === 0) {
        return property.k as number[];
    }

    return ((property.k as Array<{ s: number[] }>)[0]?.s ?? [0, 0]) as number[];
}

/**
 * Gets all vector values across all keyframes from a Lottie vector or position property.
 * For static properties (a === 0), returns a single-element array with the static value.
 * For animated properties (a === 1), returns all keyframe start values.
 * Used for computing the union bounding box across all animation states.
 * @param property The raw vector or position property from the Lottie data.
 * @returns An array of all vector values, one per keyframe (or one for static).
 */
export function GetAllVectorKeyframeValues(property: RawVectorProperty | RawPositionProperty): number[][] {
    if (property.a === 0) {
        return [property.k as number[]];
    }

    return (property.k as RawVectorKeyframe[]).map((kf) => kf.s);
}

/**
 * Gets the initial (first keyframe or static) bezier data from a Lottie bezier shape property.
 * For static properties (a === 0 or undefined), returns the bezier directly.
 * For animated properties (a === 1), returns the first keyframe's first bezier, or undefined if empty.
 * @param property The raw bezier shape property from the Lottie data.
 * @returns The initial bezier data, or undefined if no valid data is available.
 */
export function GetInitialBezierData(property: RawBezierShapeProperty): RawBezier | undefined {
    if (property.a === 0 || property.a === undefined) {
        return property.k as RawBezier;
    }

    return (property.k as RawBezierShapeKeyframe[])[0]?.s[0];
}

/**
 * Gets all bezier data across all keyframes from a Lottie bezier shape property.
 * For static properties (a === 0 or undefined), returns a single-element array with the static bezier.
 * For animated properties (a === 1), returns the first bezier from each keyframe.
 * Used for computing the union bounding box across all animation states.
 * @param property The raw bezier shape property from the Lottie data.
 * @returns An array of all bezier data, one per keyframe (or one for static).
 */
export function GetAllBezierKeyframeData(property: RawBezierShapeProperty): RawBezier[] {
    if (property.a === 0 || property.a === undefined) {
        return [property.k as RawBezier];
    }

    return (property.k as RawBezierShapeKeyframe[]).map((kf) => kf.s[0]).filter(Boolean);
}
