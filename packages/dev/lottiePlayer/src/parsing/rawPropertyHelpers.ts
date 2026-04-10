import {
    type RawBezier,
    type RawBezierShapeKeyframe,
    type RawBezierShapeProperty,
    type RawPositionProperty,
    type RawScalarProperty,
    type RawVectorKeyframe,
    type RawVectorProperty,
} from "./rawTypes";

/**
 * Gets the initial (first keyframe or static) scalar value from a Lottie scalar property.
 * For static properties (a === 0), returns the value directly.
 * For animated properties (a === 1), returns the first keyframe's start value.
 * @param property The raw scalar property from the Lottie data.
 * @param defaultValue The default value to return if no valid data is available.
 * @returns The initial scalar value.
 */
export function GetInitialScalarValue(property: RawScalarProperty, defaultValue: number = 0): number {
    if (property.a === 0) {
        return property.k as number;
    }

    return (property.k as RawVectorKeyframe[])[0]?.s[0] ?? defaultValue;
}

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

    return (property.k as RawVectorKeyframe[])[0]?.s ?? [0, 0];
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
