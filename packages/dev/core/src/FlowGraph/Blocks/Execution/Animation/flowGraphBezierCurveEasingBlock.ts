import type { EasingFunction } from "core/Animations/easing";
import { BezierCurveEase } from "core/Animations/easing";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber, RichTypeVector2 } from "core/FlowGraph/flowGraphRichTypes";
import type { Vector2 } from "core/Maths/math.vector";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * An easing block that generates a BezierCurveEase easingFunction object based on the data provided.
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
            const easing = new BezierCurveEase(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y);
            easing.setEasingMode(mode);
            this._easingFunctions[key] = easing;
        }
        this.easingFunction.setValue(this._easingFunctions[key], context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.BezierCurveEasing;
    }
}

RegisterClass(FlowGraphBlockNames.BezierCurveEasing, FlowGraphBezierCurveEasingBlock);
