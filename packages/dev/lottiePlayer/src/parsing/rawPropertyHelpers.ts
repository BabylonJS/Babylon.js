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

/**
 * Gets the element-wise largest vector values across all keyframes.
 * For static properties (a === 0), returns the static value.
 * For animated properties (a === 1), returns the element-wise max of all keyframe values.
 * Used for rasterizing shapes at their largest size to prevent blurriness when scaling up.
 * @param property The raw vector or position property from the Lottie data.
 * @returns The element-wise maximum vector values.
 */
export function GetLargestVectorValues(property: RawVectorProperty | RawPositionProperty): number[] {
    const allValues = GetAllVectorKeyframeValues(property);
    if (allValues.length <= 1) {
        return allValues[0] ?? [0, 0];
    }

    const maxValues = [...allValues[0]];
    for (let i = 1; i < allValues.length; i++) {
        for (let j = 0; j < maxValues.length; j++) {
            maxValues[j] = Math.max(maxValues[j], allValues[i][j]);
        }
    }
    return maxValues;
}

/**
 * Gets the bezier data from the keyframe with the largest bounding extent.
 * For static properties, returns the static bezier.
 * For animated properties, picks the keyframe whose vertices span the largest area.
 * Used for rasterizing paths at their largest size to prevent blurriness when scaling up.
 * @param property The raw bezier shape property from the Lottie data.
 * @returns The largest bezier data, or undefined if no valid data is available.
 */
export function GetLargestBezierData(property: RawBezierShapeProperty): RawBezier | undefined {
    const allBeziers = GetAllBezierKeyframeData(property);
    if (allBeziers.length === 0) {
        return undefined;
    }
    if (allBeziers.length === 1) {
        return allBeziers[0];
    }

    let largest = allBeziers[0];
    let largestArea = 0;

    for (let b = 0; b < allBeziers.length; b++) {
        const bezier = allBeziers[b];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let v = 0; v < bezier.v.length; v++) {
            minX = Math.min(minX, bezier.v[v][0]);
            minY = Math.min(minY, bezier.v[v][1]);
            maxX = Math.max(maxX, bezier.v[v][0]);
            maxY = Math.max(maxY, bezier.v[v][1]);
        }
        const area = (maxX - minX) * (maxY - minY);
        if (area > largestArea) {
            largestArea = area;
            largest = bezier;
        }
    }

    return largest;
}
