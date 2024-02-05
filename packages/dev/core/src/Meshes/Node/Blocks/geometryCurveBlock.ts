import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import type { float } from "core/types";
import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";

/**
 * Types of curves supported by the Curve block
 */
export enum GeometryCurveBlockTypes {
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
 * Block used to apply curve operation
 */
export class GeometryCurveBlock extends NodeGeometryBlock {
    /**
     * Gets or sets the type of the curve applied by the block
     */
    @editableInPropertyPage("Type", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        options: [
            { label: "EaseInSine", value: GeometryCurveBlockTypes.EaseInSine },
            { label: "EaseOutSine", value: GeometryCurveBlockTypes.EaseOutSine },
            { label: "EaseInOutSine", value: GeometryCurveBlockTypes.EaseInOutSine },
            { label: "EaseInQuad", value: GeometryCurveBlockTypes.EaseInQuad },
            { label: "EaseOutQuad", value: GeometryCurveBlockTypes.EaseOutQuad },
            { label: "EaseInOutQuad", value: GeometryCurveBlockTypes.EaseInOutQuad },
            { label: "EaseInCubic", value: GeometryCurveBlockTypes.EaseInCubic },
            { label: "EaseOutCubic", value: GeometryCurveBlockTypes.EaseOutCubic },
            { label: "EaseInOutCubic", value: GeometryCurveBlockTypes.EaseInOutCubic },
            { label: "EaseInQuart", value: GeometryCurveBlockTypes.EaseInQuart },
            { label: "EaseOutQuart", value: GeometryCurveBlockTypes.EaseOutQuart },
            { label: "EaseInOutQuart", value: GeometryCurveBlockTypes.EaseInOutQuart },
            { label: "EaseInQuint", value: GeometryCurveBlockTypes.EaseInQuint },
            { label: "EaseOutQuint", value: GeometryCurveBlockTypes.EaseOutQuint },
            { label: "EaseInOutQuint", value: GeometryCurveBlockTypes.EaseInOutQuint },
            { label: "EaseInExpo", value: GeometryCurveBlockTypes.EaseInExpo },
            { label: "EaseOutExpo", value: GeometryCurveBlockTypes.EaseOutExpo },
            { label: "EaseInOutExpo", value: GeometryCurveBlockTypes.EaseInOutExpo },
            { label: "EaseInCirc", value: GeometryCurveBlockTypes.EaseInCirc },
            { label: "EaseOutCirc", value: GeometryCurveBlockTypes.EaseOutCirc },
            { label: "EaseInOutCirc", value: GeometryCurveBlockTypes.EaseInOutCirc },
            { label: "EaseInBack", value: GeometryCurveBlockTypes.EaseInBack },
            { label: "EaseOutBack", value: GeometryCurveBlockTypes.EaseOutBack },
            { label: "EaseInOutBack", value: GeometryCurveBlockTypes.EaseInOutBack },
            { label: "EaseInElastic", value: GeometryCurveBlockTypes.EaseInElastic },
            { label: "EaseOutElastic", value: GeometryCurveBlockTypes.EaseOutElastic },
            { label: "EaseInOutElastic", value: GeometryCurveBlockTypes.EaseInOutElastic },
        ],
    })
    public type = GeometryCurveBlockTypes.EaseInOutSine;

    /**
     * Creates a new CurveBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];

        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Int);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometryCurveBlock";
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

    protected _buildBlock() {
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        let func: (v: float) => any;

        switch (this.type) {
            case GeometryCurveBlockTypes.EaseInSine:
                func = (v: float) => 1.0 - Math.cos((v * 3.1415) / 2.0);
                break;
            case GeometryCurveBlockTypes.EaseOutSine:
                func = (v: float) => Math.sin((v * 3.1415) / 2.0);
                break;
            case GeometryCurveBlockTypes.EaseInOutSine:
                func = (v: float) => -(Math.cos(v * 3.1415) - 1.0) / 2.0;
                break;
            case GeometryCurveBlockTypes.EaseInQuad:
                func = (v: float) => v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutQuad:
                func = (v: float) => (1.0 - v) * (1.0 - v);
                break;
            case GeometryCurveBlockTypes.EaseInOutQuad: {
                func = (v: float) => (v < 0.5 ? 2.0 * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 2.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInCubic:
                func = (v: float) => v * v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutCubic: {
                func = (v: float) => 1.0 - Math.pow(1.0 - v, 3.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutCubic: {
                func = (v: float) => (v < 0.5 ? 4.0 * v * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 3.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInQuart:
                func = (v: float) => v * v * v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutQuart: {
                func = (v: float) => 1.0 - Math.pow(1.0 - v, 4.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutQuart: {
                func = (v: float) => (v < 0.5 ? 8.0 * v * v * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 4.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInQuint:
                func = (v: float) => v * v * v * v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutQuint: {
                func = (v: float) => 1.0 - Math.pow(1.0 - v, 5.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutQuint: {
                func = (v: float) => (v < 0.5 ? 16.0 * v * v * v * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 5.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInExpo: {
                func = (v: float) => (v === 0.0 ? 0.0 : Math.pow(2.0, 10.0 * v - 10.0));
                break;
            }
            case GeometryCurveBlockTypes.EaseOutExpo: {
                func = (v: float) => (v === 1.0 ? 1.0 : 1.0 - Math.pow(2.0, -10.0 * v));
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutExpo: {
                func = (v: float) => (v === 0.0 ? 0.0 : v === 1.0 ? 1.0 : v < 0.5 ? Math.pow(2.0, 20.0 * v - 10.0) / 2.0 : (2.0 - Math.pow(2.0, -20.0 * v + 10.0)) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInCirc: {
                func = (v: float) => 1.0 - Math.sqrt(1.0 - Math.pow(v, 2.0));
                break;
            }
            case GeometryCurveBlockTypes.EaseOutCirc: {
                func = (v: float) => Math.sqrt(1.0 - Math.pow(v - 1.0, 2.0));
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutCirc: {
                func = (v: float) => (v < 0.5 ? (1.0 - Math.sqrt(1.0 - Math.pow(2.0 * v, 2.0))) / 2.0 : (Math.sqrt(1.0 - Math.pow(-2.0 * v + 2.0, 2.0)) + 1.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInBack: {
                func = (v: float) => 2.70158 * v * v * v - 1.70158 * v * v;
                break;
            }
            case GeometryCurveBlockTypes.EaseOutBack: {
                func = (v: float) => 2.70158 * Math.pow(v - 1.0, 3.0) + 1.70158 * Math.pow(v - 1.0, 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutBack: {
                func = (v: float) =>
                    v < 0.5
                        ? (Math.pow(2.0 * v, 2.0) * (3.5949095 * 2.0 * v - 2.5949095)) / 2.0
                        : (Math.pow(2.0 * v - 2.0, 2.0) * (3.5949095 * (v * 2.0 - 2.0) + 3.5949095) + 2.0) / 2.0;
                break;
            }
            case GeometryCurveBlockTypes.EaseInElastic: {
                func = (v: float) => (v === 0.0 ? 0.0 : v === 1.0 ? 1.0 : -Math.pow(2.0, 10.0 * v - 10.0) * Math.sin((v * 10.0 - 10.75) * ((2.0 * 3.1415) / 3.0)));
                break;
            }
            case GeometryCurveBlockTypes.EaseOutElastic: {
                func = (v: float) => (v === 0.0 ? 0.0 : v === 1.0 ? 1.0 : Math.pow(2.0, -10.0 * v) * Math.sin((v * 10.0 - 0.75) * ((2.0 * 3.1415) / 3.0)) + 1.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutElastic: {
                func = (v: float) =>
                    v === 0.0
                        ? 0.0
                        : v == 1.0
                          ? 1.0
                          : v < 0.5
                            ? -(Math.pow(2.0, 20.0 * v - 10.0) * Math.sin((20.0 * v - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0
                            : (Math.pow(2.0, -20.0 * v + 10.0) * Math.sin((20.0 * v - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0 + 1.0;
                break;
            }
        }

        this.output._storedFunction = (state) => {
            const input = this.input.getConnectedValue(state);

            switch (this.input.type) {
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func(input);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(input.x), func(input.y));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(input.x), func(input.y), func(input.z));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func(input.x), func(input.y), func(input.z), func(input.w));
                }
            }

            return 0;
        };

        return this;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.curveType = this.type;

        return serializationObject;
    }

    public _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.type = serializationObject.curveType;
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.type = BABYLON.GeometryCurveBlockTypes.${GeometryCurveBlockTypes[this.type]};\n`;
        return codeString;
    }
}

RegisterClass("BABYLON.GeometryCurveBlock", GeometryCurveBlock);
