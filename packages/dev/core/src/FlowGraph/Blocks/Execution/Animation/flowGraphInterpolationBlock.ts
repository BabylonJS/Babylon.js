import type { EasingFunction } from "core/Animations/easing";
import { Constants } from "core/Engines/constants";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { getRichTypeByAnimationType, RichTypeAny, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { Animation } from "core/Animations/animation";

export interface IFlowGraphInterpolationBlockConfiguration<T> extends IFlowGraphBlockConfiguration {
    /**
     * The number of keyframes to interpolate between.
     * Will default to 1 if not provided (i.e. from currentValue to a provided value in the time provided)
     */
    numberOfKeyFrames?: number;

    /**
     * The value to interpolate to.
     * If number of keyframes is more than 1, this will be the last value.
     */
    endValue?: T;

    /**
     * The duration of the interpolation.
     */
    duration?: number;

    /**
     * The name of the property that will be interpolated.
     */
    propertyName?: string;

    /**
     * The easing function to use for the interpolation.
     */
    easingFunction?: EasingFunction;

    /**
     * The type of the animation to create.
     * Default is ANIMATIONTYPE_FLOAT
     * This cannot be changed after set, so make sure to pass the right value.
     */
    animationType?: number;
}

/**
 * This block is responsible for interpolating between two values.
 * The babylon concept used is Animation, and it is the output of this block.
 *
 * Note that values will be parsed when the in connection is triggered. until then changing the value will not trigger a new interpolation.
 *
 * Internally this block uses the Animation class from Babylon.js. It evaluates the interpolation
 */
export class FlowGraphInterpolationBlock<T> extends FlowGraphBlock {
    /**
     * Input connection: The value to interpolate from.
     * Optional. If not provided, the current value will be used.
     * Note that if provided, every time the animation is created this value will be used!
     */
    public readonly from: FlowGraphDataConnection<T>;

    /**
     * output connection: The animation that will be created when in is triggered.
     */
    public readonly animation: FlowGraphDataConnection<Animation>;

    /**
     * Input connection: An optional easing function to use for the interpolation.
     */
    public readonly easingFunction: FlowGraphDataConnection<EasingFunction>;

    /**
     * Input connection: The name of the property that will be set
     */
    public readonly propertyName: FlowGraphDataConnection<string>;

    constructor(config: IFlowGraphInterpolationBlockConfiguration<T> = {}) {
        super(config);
        const type = getRichTypeByAnimationType(config.animationType ?? Constants.ANIMATIONTYPE_FLOAT);
        this.from = this.registerDataInput("from", type);
        this.easingFunction = this.registerDataInput("easingFunction", RichTypeAny, config?.easingFunction);

        const numberOfKeyFrames = config?.numberOfKeyFrames ?? 1;
        for (let i = 0; i < numberOfKeyFrames; i++) {
            this.registerDataInput(`Duration-${i + 1}`, RichTypeNumber, i === numberOfKeyFrames - 1 ? config.duration : undefined);
            this.registerDataInput(`Value-${i + 1}`, type, i === numberOfKeyFrames - 1 ? config.endValue : undefined);
        }
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        const propertyName = this.propertyName.getValue(context);
        const easingFunction = this.easingFunction.getValue(context);
        const animation = this._createAnimation(context, propertyName, easingFunction);
        this.animation.setValue(animation, context);
    }

    private _createAnimation(context: FlowGraphContext, propertyName: string, easingFunction: EasingFunction): Animation {
        const type = this.from.richType;
        const keys: { frame: number; value: T }[] = [];
        const numberOfKeyFrames = this.config?.numberOfKeyFrames ?? 1;
        for (let i = 0; i < numberOfKeyFrames; i++) {
            const duration = this.getDataInput(`Duration-${i + 1}`)?.getValue(context);
            const value = this.getDataInput(`Value-${i + 1}`)?.getValue(context);
            if (duration && value) {
                // convert duration to frames, based on 60 fps
                keys.push({ frame: duration * 60, value });
            }
        }
        const animation = Animation.CreateAnimation(propertyName, 60, type.animationType, easingFunction);
        animation.setKeys(keys);
        return animation;
    }
}
