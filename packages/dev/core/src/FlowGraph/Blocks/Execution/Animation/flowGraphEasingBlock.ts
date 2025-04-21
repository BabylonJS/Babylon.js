import type { EasingFunction } from "core/Animations/easing";
import { BackEase, BezierCurveEase, BounceEase, CircleEase, CubicEase, ElasticEase, ExponentialEase } from "core/Animations/easing";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * The type of the easing function.
 */
export const enum EasingFunctionType {
    CircleEase = 0,
    BackEase = 1,
    BounceEase = 2,
    CubicEase = 3,
    ElasticEase = 4,
    ExponentialEase = 5,
    PowerEase = 6,
    QuadraticEase = 7,
    QuarticEase = 8,
    QuinticEase = 9,
    SineEase = 10,
    BezierCurveEase = 11,
}

/**
 * @internal
 * Creates an easing function object based on the type and parameters provided.
 * This is not tree-shaking friendly, so if you need cubic bezier, use the dedicated bezier block.
 * @param type The type of the easing function.
 * @param controlPoint1 The first control point for the bezier curve.
 * @param controlPoint2 The second control point for the bezier curve.
 * @returns The easing function object.
 */
function CreateEasingFunction(type: EasingFunctionType, ...parameters: number[]): EasingFunction {
    switch (type) {
        case EasingFunctionType.BezierCurveEase:
            return new BezierCurveEase(...parameters);
        case EasingFunctionType.CircleEase:
            return new CircleEase();
        case EasingFunctionType.BackEase:
            return new BackEase(...parameters);
        case EasingFunctionType.BounceEase:
            return new BounceEase(...parameters);
        case EasingFunctionType.CubicEase:
            return new CubicEase();
        case EasingFunctionType.ElasticEase:
            return new ElasticEase(...parameters);
        case EasingFunctionType.ExponentialEase:
            return new ExponentialEase(...parameters);
        default:
            throw new Error("Easing type not yet implemented");
    }
}

/**
 * An easing block that generates an easingFunction object based on the data provided.
 */
export class FlowGraphEasingBlock extends FlowGraphBlock {
    /**
     * Input connection: The type of the easing function.
     */
    public readonly type: FlowGraphDataConnection<EasingFunctionType>;

    /**
     * Input connection: The mode of the easing function.
     * EasingFunction.EASINGMODE_EASEIN, EasingFunction.EASINGMODE_EASEOUT, EasingFunction.EASINGMODE_EASEINOUT
     */
    public readonly mode: FlowGraphDataConnection<number>;

    /**
     * Input connection:parameters for easing. for example control points for BezierCurveEase.
     */
    public readonly parameters: FlowGraphDataConnection<number[]>;

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

        this.type = this.registerDataInput("type", RichTypeAny, 11);
        this.mode = this.registerDataInput("mode", RichTypeNumber, 0);
        this.parameters = this.registerDataInput("parameters", RichTypeAny, [1, 0, 0, 1]);

        this.easingFunction = this.registerDataOutput("easingFunction", RichTypeAny);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        const type = this.type.getValue(context);
        const mode = this.mode.getValue(context);
        const parameters = this.parameters.getValue(context);

        if (type === undefined || mode === undefined) {
            return;
        }

        const key = `${type}-${mode}-${parameters.join("-")}`;
        if (!this._easingFunctions[key]) {
            const easing = CreateEasingFunction(type, ...parameters);
            easing.setEasingMode(mode);
            this._easingFunctions[key] = easing;
        }
        this.easingFunction.setValue(this._easingFunctions[key], context);
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.Easing;
    }
}

RegisterClass(FlowGraphBlockNames.Easing, FlowGraphEasingBlock);
