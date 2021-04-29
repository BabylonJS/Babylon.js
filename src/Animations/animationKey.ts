/**
 * Defines an interface which represents an animation key frame
 */
export interface IAnimationKey {
    /**
     * Frame of the key frame
     */
    frame: number;
    /**
     * Value at the specifies key frame
     */
    value: any;
    /**
     * The input tangent for the cubic hermite spline
     */
    inTangent?: any;
    /**
     * The output tangent for the cubic hermite spline
     */
    outTangent?: any;
    /**
     * The animation interpolation type
     */
    interpolation?: AnimationKeyInterpolation;
    /**
     * Property defined by UI tools to link (or not ) the tangents
     */
    lockedTangent?: boolean;
}

/**
 * Enum for the animation key frame interpolation type
 */
export enum AnimationKeyInterpolation {
    /**
     * Do not interpolate between keys and use the start key value only. Tangents are ignored
     */
    STEP = 1
}