/**
 * Represents a Babylon.js thin version of a cubic bezier curve
 * We are only exposing what we truly need in the scope of
 * the Lottie Renderer project preventing the dependency on the full
 * Babylon.js animation system.
 */
export class BezierCurve {
    /**
     * X of the first control point
     */
    public readonly x1: number;
    /**
     * Y of the first control point
     */
    public readonly y1: number;
    /**
     * X of the second control point
     */
    public readonly x2: number;
    /**
     * Y of the second control point
     */
    public readonly y2: number;

    private readonly _easingSteps: number;

    private readonly _f0: number;
    private readonly _f1: number;
    private readonly _f2: number;

    /**
     * Instantiates a bezier function
     * @see http://cubic-bezier.com/#.17,.67,.83,.67
     * @param x1 Defines the x component of the start tangent in the bezier curve
     * @param y1 Defines the y component of the start tangent in the bezier curve
     * @param x2 Defines the x component of the end tangent in the bezier curve
     * @param y2 Defines the y component of the end tangent in the bezier curve
     * @param easingSteps Number of steps to sample the bezier curve for easing
     */
    constructor(x1: number = 0, y1: number = 0, x2: number = 1, y2: number = 1, easingSteps: number) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this._easingSteps = easingSteps;

        // Pre-calculate coefficients
        this._f0 = 1 - 3 * this.x2 + 3 * this.x1;
        this._f1 = 3 * this.x2 - 6 * this.x1;
        this._f2 = 3 * this.x1;
    }

    /**
     * Interpolates the bezier curve at a given time
     * @param t Defines the time to evaluate the bezier curve at, between 0 and 1
     * @returns The interpolated value at time t
     */
    public interpolate(t: number): number {
        if (t === 0) {
            return 0;
        }

        if (t === 1) {
            return 1;
        }

        let refinedT = t;

        for (let i = 0; i < this._easingSteps; i++) {
            const refinedT2 = refinedT * refinedT;
            const refinedT3 = refinedT2 * refinedT;
            const x = this._f0 * refinedT3 + this._f1 * refinedT2 + this._f2 * refinedT;
            const slope = 1.0 / (3.0 * this._f0 * refinedT2 + 2.0 * this._f1 * refinedT + this._f2);
            refinedT -= (x - t) * slope;
            refinedT = Math.min(1, Math.max(0, refinedT));
        }

        // Resolve cubic bezier for the given x
        return 3 * (1 - refinedT) * (1 - refinedT) * refinedT * this.y1 + 3 * (1 - refinedT) * refinedT * refinedT * this.y2 + refinedT * refinedT * refinedT;
    }
}
