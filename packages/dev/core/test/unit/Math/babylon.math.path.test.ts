import { describe, expect, it } from "vitest";
import { BezierCurve } from "../../../src/Maths/math.path";
import { BezierCurveEase } from "../../../src/Animations/easing";

// The y value of the curve at x = t, found by bisection on the curve parameter
const reference = (t: number, x1: number, y1: number, x2: number, y2: number) => {
    const bezier = (s: number, p1: number, p2: number) => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 60; i++) {
        const mid = (low + high) / 2;
        if (bezier(mid, x1, x2) < t) {
            low = mid;
        } else {
            high = mid;
        }
    }
    return bezier((low + high) / 2, y1, y2);
};

describe("BezierCurve.Interpolate", () => {
    it("reaches 1 at the end of curves that end with a flat slope in x", () => {
        // x2 = 1: the CSS "ease-in" family, e.g. Material's accelerate curve (0.4, 0, 1, 1)
        expect(BezierCurve.Interpolate(1, 0.4, 0, 1, 1)).toBe(1);
        expect(BezierCurve.Interpolate(1, 0.42, 0, 1, 1)).toBe(1);
        expect(BezierCurve.Interpolate(1, 0, 0, 1, 1)).toBe(1);
        expect(BezierCurve.Interpolate(1, 0.04, 0, 1, 1)).toBe(1);
    });

    it("stays finite where the slope in x is 0 inside the curve", () => {
        expect(BezierCurve.Interpolate(0.5, 1, 0, 0, 1)).toBeCloseTo(0.5, 6);
    });

    it("is accurate near a nearly-flat asymmetric x slope (the 0.05-step grid misses this case)", () => {
        // x1=0.99999, x2=0.0000102: the x slope is about 1.5e-5 at the midpoint.
        // A residual-only convergence check exits with an error > 0.003; bracket-based
        // convergence drives the error below 1e-5.
        const got = BezierCurve.Interpolate(0.5, 0.99999, 0, 0.0000102, 1);
        const ref = reference(0.5, 0.99999, 0, 0.0000102, 1);
        expect(Math.abs(got - ref)).toBeLessThan(1e-4);
    });

    it("matches the curve for any x1 and x2 in [0, 1]", () => {
        let worst = 0;
        for (let a = 0; a <= 20; a++) {
            for (let b = 0; b <= 20; b++) {
                for (let i = 0; i <= 100; i++) {
                    const x1 = a / 20;
                    const x2 = b / 20;
                    const t = i / 100;
                    const value = BezierCurve.Interpolate(t, x1, 0.2, x2, 0.9);
                    const error = Number.isFinite(value) ? Math.abs(value - reference(t, x1, 0.2, x2, 0.9)) : Infinity;
                    worst = Math.max(worst, error);
                }
            }
        }
        expect(worst).toBeLessThan(1e-5);
    });
});

describe("BezierCurveEase", () => {
    it("ends on 1 for an ease-in curve", () => {
        const ease = new BezierCurveEase(0.4, 0, 1, 1);
        expect(ease.ease(1)).toBe(1);
        expect(ease.ease(0)).toBe(0);
    });
});
