import type { CurveData } from "../canvas/curve";

/**
 * Represents a key point on a curve
 */
export type KeyPoint = {
    /** The curve data this key point belongs to */
    curve: CurveData;
    /** The key index in the animation */
    keyId: number;
};
