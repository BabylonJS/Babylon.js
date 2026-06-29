/** This file must only contain pure code and pure imports */

import { EasingFunction } from "core/Animations/easing";
import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeNumber, RichTypeVector2 } from "core/FlowGraph/flowGraphRichTypes.pure";
import { type Vector2 } from "core/Maths/math.vector.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Cubic Bézier easing used by the KHR_interactivity `variable/interpolate` and
 * `pointer/interpolate` operations.
 *
 * Per the KHR_interactivity specification, the eased output progress `q` is the
 * Y coordinate of the cubic Bézier curve — with implicit endpoints `P0 = (0, 0)`
 * and `P3 = (1, 1)` and the provided control points `P1`/`P2` — evaluated with the
 * input progress `t` used **directly as the curve parameter**:
 *
 *   q(t) = 3·(1 − t)²·t·p1y + 3·(1 − t)·t²·p2y + t³
 *
 * This differs from the CSS-style `BezierCurveEase` (which solves for the curve
 * parameter where X equals `t` before reading Y). Only the Y components of the
 * control points influence the eased progress; the X components are validated by the
 * interpolate operation (and can trigger its `err` flow) but do not affect the curve.
 */
class FlowGraphCubicBezierParametricEase extends EasingFunction {
    public constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number
    ) {
        super();
    }

    public override easeInCore(gradient: number): number {
        const t = gradient;
        const oneMinusT = 1 - t;
        return 3 * oneMinusT * oneMinusT * t * this.y1 + 3 * oneMinusT * t * t * this.y2 + t * t * t;
    }
}

/**
 * An easing block that generates a cubic Bézier easing function based on the data provided.
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

        // Include the X components in the cache key so control points that differ
        // only in X (e.g. a valid vs NaN X) map to distinct easing instances; the
        // X components are not used by the curve but are validated downstream
        // (FlowGraphPlayAnimationBlock checks the easing for NaN control points).
        const key = `${mode}-${controlPoint1.x}-${controlPoint1.y}-${controlPoint2.x}-${controlPoint2.y}`;
        if (!this._easingFunctions[key]) {
            // KHR_interactivity evaluates the cubic Bézier easing parametrically
            // (input progress used directly as the curve parameter), so only the
            // Y components of the control points affect the eased progress.
            const easing = new FlowGraphCubicBezierParametricEase(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y);
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
