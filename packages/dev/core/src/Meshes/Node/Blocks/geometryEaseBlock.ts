import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import type { EasingFunction } from "core/Animations/easing";
import { BackEase, CircleEase, CubicEase, ElasticEase, ExponentialEase, QuadraticEase, QuarticEase, QuinticEase, SineEase } from "core/Animations/easing";

/**
 * Types of easing function supported by the Ease block
 */
export enum GeometryEaseBlockTypes {
    /** EaseInSine */
    EaseInSine,
    /** EaseOutSine */
    EaseOutSine,
    /** EaseInOutSine */
    EaseInOutSine,
    /** EaseInQuad */
    EaseInQuad,
    /** EaseOutQuad */
    EaseOutQuad,
    /** EaseInOutQuad */
    EaseInOutQuad,
    /** EaseInCubic */
    EaseInCubic,
    /** EaseOutCubic */
    EaseOutCubic,
    /** EaseInOutCubic */
    EaseInOutCubic,
    /** EaseInQuart */
    EaseInQuart,
    /** EaseOutQuart */
    EaseOutQuart,
    /** EaseInOutQuart */
    EaseInOutQuart,
    /** EaseInQuint */
    EaseInQuint,
    /** EaseOutQuint */
    EaseOutQuint,
    /** EaseInOutQuint */
    EaseInOutQuint,
    /** EaseInExpo */
    EaseInExpo,
    /** EaseOutExpo */
    EaseOutExpo,
    /** EaseInOutExpo */
    EaseInOutExpo,
    /** EaseInCirc */
    EaseInCirc,
    /** EaseOutCirc */
    EaseOutCirc,
    /** EaseInOutCirc */
    EaseInOutCirc,
    /** EaseInBack */
    EaseInBack,
    /** EaseOutBack */
    EaseOutBack,
    /** EaseInOutBack */
    EaseInOutBack,
    /** EaseInElastic */
    EaseInElastic,
    /** EaseOutElastic */
    EaseOutElastic,
    /** EaseInOutElastic */
    EaseInOutElastic,
}

/**
 * Block used to apply an easing function to floats
 */
export class GeometryEaseBlock extends NodeGeometryBlock {
    private _easingFunction: EasingFunction = new SineEase();
    private _type = GeometryEaseBlockTypes.EaseInOutSine;
    /**
     * Gets or sets the type of the easing functions applied by the block
     */
    @editableInPropertyPage("Type", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "EaseInSine", value: GeometryEaseBlockTypes.EaseInSine },
            { label: "EaseOutSine", value: GeometryEaseBlockTypes.EaseOutSine },
            { label: "EaseInOutSine", value: GeometryEaseBlockTypes.EaseInOutSine },
            { label: "EaseInQuad", value: GeometryEaseBlockTypes.EaseInQuad },
            { label: "EaseOutQuad", value: GeometryEaseBlockTypes.EaseOutQuad },
            { label: "EaseInOutQuad", value: GeometryEaseBlockTypes.EaseInOutQuad },
            { label: "EaseInCubic", value: GeometryEaseBlockTypes.EaseInCubic },
            { label: "EaseOutCubic", value: GeometryEaseBlockTypes.EaseOutCubic },
            { label: "EaseInOutCubic", value: GeometryEaseBlockTypes.EaseInOutCubic },
            { label: "EaseInQuart", value: GeometryEaseBlockTypes.EaseInQuart },
            { label: "EaseOutQuart", value: GeometryEaseBlockTypes.EaseOutQuart },
            { label: "EaseInOutQuart", value: GeometryEaseBlockTypes.EaseInOutQuart },
            { label: "EaseInQuint", value: GeometryEaseBlockTypes.EaseInQuint },
            { label: "EaseOutQuint", value: GeometryEaseBlockTypes.EaseOutQuint },
            { label: "EaseInOutQuint", value: GeometryEaseBlockTypes.EaseInOutQuint },
            { label: "EaseInExpo", value: GeometryEaseBlockTypes.EaseInExpo },
            { label: "EaseOutExpo", value: GeometryEaseBlockTypes.EaseOutExpo },
            { label: "EaseInOutExpo", value: GeometryEaseBlockTypes.EaseInOutExpo },
            { label: "EaseInCirc", value: GeometryEaseBlockTypes.EaseInCirc },
            { label: "EaseOutCirc", value: GeometryEaseBlockTypes.EaseOutCirc },
            { label: "EaseInOutCirc", value: GeometryEaseBlockTypes.EaseInOutCirc },
            { label: "EaseInBack", value: GeometryEaseBlockTypes.EaseInBack },
            { label: "EaseOutBack", value: GeometryEaseBlockTypes.EaseOutBack },
            { label: "EaseInOutBack", value: GeometryEaseBlockTypes.EaseInOutBack },
            { label: "EaseInElastic", value: GeometryEaseBlockTypes.EaseInElastic },
            { label: "EaseOutElastic", value: GeometryEaseBlockTypes.EaseOutElastic },
            { label: "EaseInOutElastic", value: GeometryEaseBlockTypes.EaseInOutElastic },
        ],
    })
    public get type() {
        return this._type;
    }

    public set type(value: GeometryEaseBlockTypes) {
        if (this._type === value) {
            return;
        }
        this._type = value;

        switch (this._type) {
            case GeometryEaseBlockTypes.EaseInSine:
                this._easingFunction = new SineEase();
                this._easingFunction.setEasingMode(SineEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutSine:
                this._easingFunction = new SineEase();
                this._easingFunction.setEasingMode(SineEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutSine:
                this._easingFunction = new SineEase();
                this._easingFunction.setEasingMode(SineEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInQuad:
                this._easingFunction = new QuadraticEase();
                this._easingFunction.setEasingMode(QuadraticEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutQuad:
                this._easingFunction = new QuadraticEase();
                this._easingFunction.setEasingMode(QuadraticEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutQuad:
                this._easingFunction = new QuadraticEase();
                this._easingFunction.setEasingMode(QuadraticEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInCubic:
                this._easingFunction = new CubicEase();
                this._easingFunction.setEasingMode(CubicEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutCubic:
                this._easingFunction = new CubicEase();
                this._easingFunction.setEasingMode(CubicEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutCubic:
                this._easingFunction = new CubicEase();
                this._easingFunction.setEasingMode(CubicEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInQuart:
                this._easingFunction = new QuarticEase();
                this._easingFunction.setEasingMode(QuarticEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutQuart:
                this._easingFunction = new QuarticEase();
                this._easingFunction.setEasingMode(QuarticEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutQuart:
                this._easingFunction = new QuarticEase();
                this._easingFunction.setEasingMode(QuarticEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInQuint:
                this._easingFunction = new QuinticEase();
                this._easingFunction.setEasingMode(QuinticEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutQuint:
                this._easingFunction = new QuinticEase();
                this._easingFunction.setEasingMode(QuinticEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutQuint:
                this._easingFunction = new QuinticEase();
                this._easingFunction.setEasingMode(QuinticEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInExpo:
                this._easingFunction = new ExponentialEase();
                this._easingFunction.setEasingMode(ExponentialEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutExpo:
                this._easingFunction = new ExponentialEase();
                this._easingFunction.setEasingMode(ExponentialEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutExpo:
                this._easingFunction = new ExponentialEase();
                this._easingFunction.setEasingMode(ExponentialEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInCirc:
                this._easingFunction = new CircleEase();
                this._easingFunction.setEasingMode(CircleEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutCirc:
                this._easingFunction = new CircleEase();
                this._easingFunction.setEasingMode(CircleEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutCirc:
                this._easingFunction = new CircleEase();
                this._easingFunction.setEasingMode(CircleEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInBack:
                this._easingFunction = new BackEase();
                this._easingFunction.setEasingMode(BackEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutBack:
                this._easingFunction = new BackEase();
                this._easingFunction.setEasingMode(BackEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutBack:
                this._easingFunction = new BackEase();
                this._easingFunction.setEasingMode(BackEase.EASINGMODE_EASEINOUT);
                break;
            case GeometryEaseBlockTypes.EaseInElastic:
                this._easingFunction = new ElasticEase();
                this._easingFunction.setEasingMode(ElasticEase.EASINGMODE_EASEIN);
                break;
            case GeometryEaseBlockTypes.EaseOutElastic:
                this._easingFunction = new ElasticEase();
                this._easingFunction.setEasingMode(ElasticEase.EASINGMODE_EASEOUT);
                break;
            case GeometryEaseBlockTypes.EaseInOutElastic:
                this._easingFunction = new ElasticEase();
                this._easingFunction.setEasingMode(ElasticEase.EASINGMODE_EASEINOUT);
                break;
        }
    }

    /**
     * Creates a new GeometryEaseBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryEaseBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        if (!this._easingFunction) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        switch (this.input.type) {
            case NodeGeometryBlockConnectionPointTypes.Int:
            case NodeGeometryBlockConnectionPointTypes.Float: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return this._easingFunction.ease(source);
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector2: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector2(this._easingFunction.ease(source.x), this._easingFunction.ease(source.y));
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector3: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector3(this._easingFunction.ease(source.x), this._easingFunction.ease(source.y), this._easingFunction.ease(source.z));
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector4: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector4(
                        this._easingFunction.ease(source.x),
                        this._easingFunction.ease(source.y),
                        this._easingFunction.ease(source.z),
                        this._easingFunction.ease(source.w)
                    );
                };
                break;
            }
        }

        return this;
    }

    /** @internal */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.type = this.type;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.type = serializationObject.type;
    }

    protected override _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.type = BABYLON.GeometryEaseBlockTypes.${GeometryEaseBlockTypes[this.type]};\n`;
        return codeString;
    }
}

RegisterClass("BABYLON.GeometryEaseBlock", GeometryEaseBlock);
