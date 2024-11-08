import type { EasingFunction } from "core/Animations/easing";
import { Constants } from "core/Engines/constants";
import { FlowGraphBlock, type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { getRichTypeByAnimationType, RichTypeAny, RichTypeNumber } from "core/FlowGraph/flowGraphRichTypes";
import { Animation } from "core/Animations/animation";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { IAnimatable } from "core/Animations/animatable.interface";

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
    public readonly animation: FlowGraphDataConnection<Animation | Animation[]>;

    /**
     * Input connection: An optional easing function to use for the interpolation.
     */
    public readonly easingFunction: FlowGraphDataConnection<EasingFunction>;

    /**
     * Input connection: The name of the property that will be set
     */
    public readonly propertyName: FlowGraphDataConnection<string | string[]>;

    public readonly customBuildAnimation: FlowGraphDataConnection<
        (target: any, name: string, fps: number, keys: any[], callback: (_animatable: any, babylonAnimation: Animation) => void) => void
    >;

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

        const numberOfKeyFrames = config?.keyFramesCount ?? 1;
        const duration = this.registerDataInput(`duration-0`, RichTypeNumber, 0);
        const value = this.registerDataInput(`value-0`, type);
        this.keyFrames.push({ duration, value });
        for (let i = 1; i < numberOfKeyFrames + 1; i++) {
            const duration = this.registerDataInput(`duration-${i}`, RichTypeNumber, i === numberOfKeyFrames ? config.duration : undefined);
            const value = this.registerDataInput(`value-${i}`, type);
            this.keyFrames.push({ duration, value });
        }
        this.initialValue = this.keyFrames[0].value;
        this.endValue = this.keyFrames[numberOfKeyFrames].value;
        this.easingFunction = this.registerDataInput("easingFunction", RichTypeAny);
        this.animation = this.registerDataOutput("animation", RichTypeAny);
        this.propertyName = this.registerDataInput("propertyName", RichTypeAny, config?.propertyName);
    }

    public override _updateOutputs(context: FlowGraphContext): void {
        const propertyName = this.propertyName.getValue(context);
        const easingFunction = this.easingFunction.getValue(context);
        const animation = this._createAnimation(context, propertyName, easingFunction);
        this.animation.setValue(animation, context);
    }

    private _createAnimation(context: FlowGraphContext, propertyName: string | string[], easingFunction: EasingFunction): Animation | Animation[] {
        const type = this.initialValue.richType;
        const keys: { frame: number; value: T }[] = [];
        // add initial value
        const currentValue = this.initialValue.getValue(context) || type.defaultValue;
        keys.push({ frame: 0, value: currentValue });
        const numberOfKeyFrames = this.config?.numberOfKeyFrames ?? 1;
        for (let i = 1; i < numberOfKeyFrames + 1; i++) {
            const duration = this.keyFrames[i].duration?.getValue(context);
            let value = this.keyFrames[i].value?.getValue(context);
            if (i === numberOfKeyFrames - 1) {
                value = value || type.defaultValue;
            }
            if (duration !== undefined && value) {
                // convert duration to frames, based on 60 fps
                keys.push({ frame: duration * 60, value });
            }
        }
        if (typeof propertyName === "string") {
            const animation = Animation.CreateAnimation(propertyName, type.animationType, 60, easingFunction);
            animation.setKeys(keys);
            return animation;
        } else {
            const animations = propertyName.map((name) => {
                const animation = Animation.CreateAnimation(name, type.animationType, 60, easingFunction);
                animation.setKeys(keys);
                return animation;
            });
            return animations;
        }
    }

    public override getClassName(): string {
        return FlowGraphBlockNames.ValueInterpolation;
    }
}

RegisterClass(FlowGraphBlockNames.ValueInterpolation, FlowGraphInterpolationBlock);

// #L54P2C
