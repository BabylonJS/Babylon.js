/** This file must only contain pure code and pure imports */

import { BezierCurveEase, type EasingFunction } from "core/Animations/easing";
import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeNumber, RichTypeVector2 } from "core/FlowGraph/flowGraphRichTypes.pure";
import { type Vector2 } from "core/Maths/math.vector.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Solves the CSS cubic-bezier easing for input progress `t`: find the curve parameter `u` where the
 * X coordinate equals `t` (implicit endpoints P0=(0,0), P3=(1,1)), then return the Y coordinate at `u`.
 *
 * This is a local solver rather than the shared `BezierCurve.Interpolate` on purpose: KHR_interactivity
 * needs a root finder that stays finite at stationary derivatives (e.g. control points (1,1)/(0,1), where
 * dX/du is 0 at the root). The shared solver uses plain Newton iteration and returns NaN there, so it must
 * not be changed for this consumer. Newton steps are taken when they stay inside the bracketing interval and
 * the derivative is non-negligible; otherwise the step falls back to bisection, which always converges.
 * @param t the input progress in [0, 1]
 * @param x1 X of the first control point
 * @param y1 Y of the first control point
 * @param x2 X of the second control point
 * @param y2 Y of the second control point
 * @returns the eased output progress
 */
function _SolveCssCubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
    if (t <= 0) {
        return 0;
    }
    if (t >= 1) {
        return 1;
    }
    const fx0 = 1 - 3 * x2 + 3 * x1;
    const fx1 = 3 * x2 - 6 * x1;
    const fx2 = 3 * x1;

    let lowerBound = 0;
    let upperBound = 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
        const u2 = u * u;
        const u3 = u2 * u;
        const x = fx0 * u3 + fx1 * u2 + fx2 * u;
        const error = x - t;
        if (Math.abs(error) < 1e-7) {
            break;
        }
        if (error > 0) {
            upperBound = u;
        } else {
            lowerBound = u;
        }
        const derivative = 3 * fx0 * u2 + 2 * fx1 * u + fx2;
        const newtonU = Math.abs(derivative) > 1e-7 ? u - error / derivative : NaN;
        u = Number.isFinite(newtonU) && newtonU > lowerBound && newtonU < upperBound ? newtonU : (lowerBound + upperBound) * 0.5;
    }

    const fy0 = 1 - 3 * y2 + 3 * y1;
    const fy1 = 3 * y2 - 6 * y1;
    const fy2 = 3 * y1;
    return fy0 * u * u * u + fy1 * u * u + fy2 * u;
}

/**
 * A {@link BezierCurveEase} that resolves the curve with {@link _SolveCssCubicBezier} so degenerate control
 * points (stationary X derivative) stay finite. It inherits the public `x1`/`y1`/`x2`/`y2` fields and the
 * easing-mode handling; only the core evaluation is replaced.
 */
class InteractivityBezierCurveEase extends BezierCurveEase {
    public override easeInCore(gradient: number): number {
        return _SolveCssCubicBezier(gradient, this.x1, this.y1, this.x2, this.y2);
    }
}

/**
 * An easing block that generates a cubic Bézier easing function based on the data provided.
 *
 * Follows CSS cubic-bezier semantics: for input progress `t`, solve the curve parameter where X
 * equals `t`, then use the corresponding Y coordinate as the eased output progress.
 */
export class FlowGraphBezierCurveEasingBlock extends FlowGraphBlock {
    /**
     * Input connection: The mode of the easing function.
     * EasingFunction.EASINGMODE_EASEIN, EasingFunction.EASINGMODE_EASEOUT, EasingFunction.EASINGMODE_EASEINOUT
     */
    public readonly mode: FlowGraphDataConnection<number>;

    /**
     * Input connection: Control point 1 for bezier curve.
     */
    public readonly controlPoint1: FlowGraphDataConnection<Vector2>;
    /**
     * Input connection: Control point 2 for bezier curve.
     */
    public readonly controlPoint2: FlowGraphDataConnection<Vector2>;

    /**
     * Output connection: The easing function object.
     */
    public readonly easingFunction: FlowGraphDataConnection<EasingFunction>;

    /**
     * Internal cache of reusable easing functions.
     * key is type-mode-properties
     */
    private _easingFunctions: { [key: string]: EasingFunction } = {};

    constructor(
        /**
         * the configuration of the block
         */
        public override config?: IFlowGraphBlockConfiguration
    ) {
        super(config);

        this.mode = this.registerDataInput("mode", RichTypeNumber, 0);
        this.controlPoint1 = this.registerDataInput("controlPoint1", RichTypeVector2);
        this.controlPoint2 = this.registerDataInput("controlPoint2", RichTypeVector2);

        this.easingFunction = this.registerDataOutput("easingFunction", RichTypeAny);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        const mode = this.mode.getValue(context);
        const controlPoint1 = this.controlPoint1.getValue(context);
        const controlPoint2 = this.controlPoint2.getValue(context);

        if (mode === undefined) {
            return;
        }

        const key = `${mode}-${controlPoint1.x}-${controlPoint1.y}-${controlPoint2.x}-${controlPoint2.y}`;
        if (!this._easingFunctions[key]) {
            const easing = new InteractivityBezierCurveEase(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y);
            easing.setEasingMode(mode);
            this._easingFunctions[key] = easing;
        }
        this.easingFunction.setValue(this._easingFunctions[key], context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.BezierCurveEasing;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphBezierCurveEasingBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphBezierCurveEasingBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.BezierCurveEasing, FlowGraphBezierCurveEasingBlock);
}
