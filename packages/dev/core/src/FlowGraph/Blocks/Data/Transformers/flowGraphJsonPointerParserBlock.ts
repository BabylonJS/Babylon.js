import type { FlowGraphAssetType } from "core/FlowGraph/flowGraphAssetsContext";
import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
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
export class FlowGraphJsonPointerParserBlock<P extends any, O extends FlowGraphAssetType> extends FlowGraphBlock {
    /**
     * Output connection: The object that contains the property.
     */
    public readonly object: FlowGraphDataConnection<O>;

    /**
     * Output connection: The property name.
     */
    public readonly propertyName: FlowGraphDataConnection<string>;

    /**
     * Output connection: The value of the property.
     */
    public readonly value: FlowGraphDataConnection<P>;

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
     * Output connection: Whether the value is valid.
     */
    public readonly isValid: FlowGraphDataConnection<boolean>;

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
        super(config);
        this.object = this.registerDataOutput("object", RichTypeAny);
        this.propertyName = this.registerDataOutput("propertyName", RichTypeAny);
        this.isValid = this.registerDataOutput("isValid", RichTypeAny);
        if (config.outputValue) {
            this.value = this.registerDataOutput("value", RichTypeAny);
        }
        this.setterFunction = this.registerDataOutput("setFunction", RichTypeAny, this._setPropertyValue.bind(this));
        this.getterFunction = this.registerDataOutput("getFunction", RichTypeAny, this._getPropertyValue.bind(this));
        this.generateAnimationsFunction = this.registerDataOutput("generateAnimationsFunction", RichTypeAny, this._getInterpolationAnimationPropertyInfo.bind(this));
        this.templateComponent = new FlowGraphPathConverterComponent(config.jsonPointer, this);
    }

    public override _updateOutputs(context: FlowGraphContext) {
        try {
            const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
            const value = accessorContainer.info.get(accessorContainer.object);
            const object = accessorContainer.info.getTarget?.(accessorContainer.object);
            const propertyName = accessorContainer.info.getPropertyName?.[0](accessorContainer.object);
            if (!object) {
                this.isValid.setValue(false, context);
                return;
            } else {
                this.object.setValue(object, context);
                if (propertyName) {
                    this.propertyName.setValue(propertyName, context);
                }
                this.isValid.setValue(true, context);
            }
            if (this.config.outputValue) {
                if (value === undefined) {
                    this.isValid.setValue(false, context);
                } else {
                    this.value.setValue(value, context);
                    this.isValid.setValue(true, context);
                }
            }
        } catch (e) {
            this.isValid.setValue(false, context);
            return;
        }
    }

    private _setPropertyValue(_target: O, _propertyName: string, value: P, context: FlowGraphContext): void {
        const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
        accessorContainer.info.set?.(value, accessorContainer.object);
    }

    private _getPropertyValue(_target: O, _propertyName: string, context: FlowGraphContext): P | undefined {
        const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
        return accessorContainer.info.get(accessorContainer.object);
    }

    private _getInterpolationAnimationPropertyInfo(
        _target: O,
        _propertyName: string,
        context: FlowGraphContext
    ): (keys: any[], fps: number, easingFunction?: EasingFunction) => Animation[] {
        const accessorContainer = this.templateComponent.getAccessor(this.config.pathConverter, context);
        return (keys: any[], fps: number, easingFunction?: EasingFunction) => {
            const animations: Animation[] = [];
            const object = accessorContainer.info.getTarget?.(accessorContainer.object);
            accessorContainer.info.interpolation?.forEach((info, index) => {
                const name = accessorContainer.info.getPropertyName?.[index](accessorContainer.object) || "Animation-interpolation-" + index;
                const animationData = info.buildAnimations(object, name, 60, keys);
                animationData.forEach((animation) => {
                    if (easingFunction) {
                        animation.babylonAnimation.setEasingFunction(easingFunction);
                    }
                    animations.push(animation.babylonAnimation);
                });
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

RegisterClass(FlowGraphBlockNames.JsonPointerParser, FlowGraphJsonPointerParserBlock);
