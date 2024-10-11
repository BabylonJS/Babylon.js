import type { EasingFunction } from "core/Animations/easing";
import { Constants } from "core/Engines/constants";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { getRichTypeByAnimationType, RichTypeAny, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { Animation } from "core/Animations/animation";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

export interface IFlowGraphInterpolationBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The number of keyframes to interpolate between.
     * Will default to 1 if not provided (i.e. from currentValue to a provided value in the time provided)
     */
    keyFramesCount?: number;

    /**
     * The duration of the interpolation.
     */
    duration?: number;

    /**
     * The name of the property that will be interpolated.
     */
    propertyName?: string;

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
    public readonly initialValue: FlowGraphDataConnection<T>;

    /**
     * Input connection: The value to interpolate to.
     * Optional. This can also be set using the KeyFrames input!
     * If provided it will be set to the last keyframe value.
     */
    public readonly endValue: FlowGraphDataConnection<T>;

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

    /**
     * The keyframes to interpolate between.
     * Each keyframe has a duration input and a value input.
     */
    public readonly keyFrames: {
        duration: FlowGraphDataConnection<number>;
        value: FlowGraphDataConnection<T>;
    }[] = [];

    constructor(config: IFlowGraphInterpolationBlockConfiguration = {}) {
        super(config);
        const type = getRichTypeByAnimationType(config?.animationType ?? Constants.ANIMATIONTYPE_FLOAT);
        this.initialValue = this.registerDataInput("initialValue", type);
        this.easingFunction = this.registerDataInput("easingFunction", RichTypeAny);
        this.animation = this.registerDataOutput("animation", RichTypeAny);
        this.propertyName = this.registerDataInput("propertyName", RichTypeAny, config?.propertyName);

        const numberOfKeyFrames = config?.keyFramesCount ?? 1;
        for (let i = 0; i < numberOfKeyFrames; i++) {
            const duration = this.registerDataInput(`Duration-${i + 1}`, RichTypeNumber, i === numberOfKeyFrames - 1 ? config.duration : undefined);
            const value = this.registerDataInput(`Value-${i + 1}`, type);
            this.keyFrames.push({ duration, value });
        }
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        const propertyName = this.propertyName.getValue(context);
        const easingFunction = this.easingFunction.getValue(context);
        const animation = this._createAnimation(context, propertyName, easingFunction);
        this.animation.setValue(animation, context);
    }

    private _createAnimation(context: FlowGraphContext, propertyName: string, easingFunction: EasingFunction): Animation {
        const type = this.initialValue.richType;
        const keys: { frame: number; value: T }[] = [];
        // add initial value
        const currentValue = this.initialValue.getValue(context) || type.defaultValue;
        keys.push({ frame: 0, value: currentValue });
        const numberOfKeyFrames = this.config?.numberOfKeyFrames ?? 1;
        for (let i = 0; i < numberOfKeyFrames; i++) {
            const duration = this.getDataInput(`Duration-${i + 1}`)?.getValue(context);
            let value = this.getDataInput(`Value-${i + 1}`)?.getValue(context);
            if (i === numberOfKeyFrames - 1) {
                value = this.endValue.getValue(context) || value || type.defaultValue;
            }
            if (duration && value) {
                // convert duration to frames, based on 60 fps
                keys.push({ frame: duration * 60, value });
            }
        }
        const animation = Animation.CreateAnimation(propertyName, type.animationType, 60, easingFunction);
        animation.setKeys(keys);
        return animation;
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ValueInterpolation;
    }
}

RegisterClass(FlowGraphBlockNames.ValueInterpolation, FlowGraphInterpolationBlock);
