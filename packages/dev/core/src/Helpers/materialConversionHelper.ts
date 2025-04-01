import { Vector2 } from "core/Maths/math.vector";

/**
 * Given the control points, solve for x based on a given t for a cubic bezier curve
 * @param t a value between 0 and 1
 * @param p0 first control point
 * @param p1 second control point
 * @param p2 third control point
 * @param p3 fourth control point
 * @returns number result of cubic bezier curve at the specified t
 */
function CubicBezierCurve(t: number, p0: number, p1: number, p2: number, p3: number): number {
    return (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3;
}

/**
 * Evaluates a specified specular power value to determine the appropriate roughness value,
 * based on a pre-defined cubic bezier curve with specular on the abscissa axis (x-axis)
 * and roughness on the ordinant axis (y-axis)
 * @param specularPower specular power of standard material
 * @param p0 first control point
 * @param p1 second control point
 * @param p2 third control point
 * @param p3 fourth control point
 * @returns Number representing the roughness value
 */
export function SpecularPowerToRoughness(specularPower: number, p0 = new Vector2(0, 1), p1 = new Vector2(0, 0.1), p2 = new Vector2(0, 0.1), p3 = new Vector2(1300, 0.1)): number {
    // Given P0.x = 0, P1.x = 0, P2.x = 0
    //   x = t * t * t * P3.x
    //   t = (x / P3.x)^(1/3)
    const t = Math.pow(specularPower / p3.x, 0.333333);
    return CubicBezierCurve(t, p0.y, p1.y, p2.y, p3.y);
}
