import type { FlowGraphAssetType } from "core/FlowGraph/flowGraphAssetsContext";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphPathConverterComponent } from "core/FlowGraph/flowGraphPathConverterComponent";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import type { IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import type { IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";
import type { Animation } from "core/Animations/animation";
import type { EasingFunction } from "core/Animations/easing";
import { Vector3, Vector4 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";

/**
 * Configuration for the JSON pointer parser block.
 */
export interface IFlowGraphJsonPointerParserBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The JSON pointer to parse.
     */
    jsonPointer: string;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;

    /**
     * Whether to output the value of the property.
     */
    outputValue?: boolean;
}

/**
 * This block will take a JSON pointer and parse it to get the value from the JSON object.
 * The output is an object and a property name.
 * Optionally, the block can also output the value of the property. This is configurable.
 */
export class FlowGraphJsonPointerParserBlock<P extends any, O extends FlowGraphAssetType> extends FlowGraphCachedOperationBlock<P> {
    /**
     * Output connection: The object that contains the property.
     */
    public readonly object: FlowGraphDataConnection<O>;

    /**
     * Output connection: The property name.
     */
    public readonly propertyName: FlowGraphDataConnection<string>;

    /**
     * Output connection: A function that can be used to update the value of the property.
     */
    public readonly setterFunction: FlowGraphDataConnection<(target: O, propertyName: string, value: P, context: FlowGraphContext) => void>;

    /**
     * Output connection: A function that can be used to get the value of the property.
     */
    public readonly getterFunction: FlowGraphDataConnection<(target: O, propertyName: string, context: FlowGraphContext) => P | undefined>;

    /**
     * Output connection: A function that can be used to get the interpolation animation property info.
     */
    public readonly generateAnimationsFunction: FlowGraphDataConnection<() => (keys: any[], fps: number, easingFunction?: EasingFunction) => Animation[]>;

    /**
     * The component with the templated inputs for the provided path.
     */
    public readonly templateComponent: FlowGraphPathConverterComponent;

    constructor(
        /**
         * the configuration of the block
         */
        public override config: IFlowGraphJsonPointerParserBlockConfiguration
    ) {
        super(RichTypeAny, config);
        this.object = this.registerDataOutput("object", RichTypeAny);
        this.propertyName = this.registerDataOutput("propertyName", RichTypeAny);
        this.setterFunction = this.registerDataOutput("setFunction", RichTypeAny, this._setPropertyValue.bind(this));
        this.getterFunction = this.registerDataOutput("getFunction", RichTypeAny, this._getPropertyValue.bind(this));
        this.generateAnimationsFunction = this.registerDataOutput("generateAnimationsFunction", RichTypeAny, this._getInterpolationAnimationPropertyInfo.bind(this));
        this.templateComponent = new FlowGraphPathConverterComponent(config.jsonPointer, this);
    }

    public override _doOperation(context: FlowGraphContext): P {
        const accessor = this.templateComponent.getAccessor(this.config.pathConverter, context);
        const value = accessor.info.get(accessor.object, accessor.index) as P;
        const object = accessor.info.getTarget?.(accessor.object, accessor.index);
        const propertyName = accessor.info.getPropertyName?.[0](accessor.object);
        if (!object) {
            throw new Error("Object is undefined");
        } else {
            this.object.setValue(object, context);
            if (propertyName) {
                this.propertyName.setValue(propertyName, context);
            }
        }
        return value;
    }

    private _setPropertyValue(_target: O, _propertyName: string, value: P, context: FlowGraphContext): void {
        const accessor = this.templateComponent.getAccessor(this.config.pathConverter, context);
        const type = accessor.info.type;
        if (type.startsWith("Color")) {
            value = ToColor(value as Vector4, type) as unknown as P;
        }
        accessor.info.set?.(value, accessor.object, accessor.index);
    }

    private _getPropertyValue(_target: O, _propertyName: string, context: FlowGraphContext): P | undefined {
        const accessor = this.templateComponent.getAccessor(this.config.pathConverter, context);
        const type = accessor.info.type;
        const value = accessor.info.get(accessor.object, accessor.index);
        if (type.startsWith("Color")) {
            return FromColor(value as Color3 | Color4) as unknown as P;
        }
        return value as P | undefined;
    }

    private _getInterpolationAnimationPropertyInfo(
        _target: O,
        _propertyName: string,
        context: FlowGraphContext
    ): (keys: any[], fps: number, animationType: number, easingFunction?: EasingFunction) => Animation[] {
        const accessor = this.templateComponent.getAccessor(this.config.pathConverter, context);
        return (keys: any[], fps: number, animationType: number, easingFunction?: EasingFunction) => {
            const animations: Animation[] = [];
            // make sure keys are of the right type (in case of float3 color/vector)
            const type = accessor.info.type;
            if (type.startsWith("Color")) {
                keys = keys.map((key) => {
                    return {
                        frame: key.frame,
                        value: ToColor(key.value, type),
                    };
                });
            }
            accessor.info.interpolation?.forEach((info, index) => {
                const name = accessor.info.getPropertyName?.[index](accessor.object) || "Animation-interpolation-" + index;
                // generate the keys based on interpolation info
                let newKeys: any[] = keys;
                if (animationType !== info.type) {
                    // convert the keys to the right type
                    newKeys = keys.map((key) => {
                        return {
                            frame: key.frame,
                            value: info.getValue(undefined, key.value.asArray ? key.value.asArray() : [key.value], 0, 1),
                        };
                    });
                }
                const animationData = info.buildAnimations(accessor.object, name, 60, newKeys);
                for (const animation of animationData) {
                    if (easingFunction) {
                        animation.babylonAnimation.setEasingFunction(easingFunction);
                    }
                    animations.push(animation.babylonAnimation);
                }
            });

            return animations;
        };
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.JsonPointerParser;
    }
}

function ToColor(value: any, expectedValue: string) {
    if (value.getClassName().startsWith("Color")) {
        return value as unknown as Color3 | Color4;
    }
    if (expectedValue === "Color3") {
        return new Color3(value.x, value.y, value.z);
    } else if (expectedValue === "Color4") {
        return new Color4(value.x, value.y, value.z, value.w);
    }
    return value;
}

function FromColor(value: Color3 | Color4): Vector3 | Vector4 {
    if (value instanceof Color3) {
        return new Vector3(value.r, value.g, value.b);
    } else if (value instanceof Color4) {
        return new Vector4(value.r, value.g, value.b, value.a);
    }
    throw new Error("Invalid color type");
}

RegisterClass(FlowGraphBlockNames.JsonPointerParser, FlowGraphJsonPointerParserBlock);
