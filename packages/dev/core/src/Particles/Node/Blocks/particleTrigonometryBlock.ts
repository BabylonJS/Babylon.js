import type { Nullable } from "../../../types";
import { RegisterClass } from "../../../Misc/typeStore";
import { Vector2, Vector3 } from "../../../Maths/math.vector";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { Color4 } from "core/Maths/math.color";

/**
 * Operations supported by the Trigonometry block
 */
export enum ParticleTrigonometryBlockOperations {
    /** Cos */
    Cos,
    /** Sin */
    Sin,
    /** Abs */
    Abs,
    /** Exp */
    Exp,
    /** Exp2 */
    Exp2,
    /** Round */
    Round,
    /** Floor */
    Floor,
    /** Ceiling */
    Ceiling,
    /** Square root */
    Sqrt,
    /** Log */
    Log,
    /** Tangent */
    Tan,
    /** Arc tangent */
    ArcTan,
    /** Arc cosinus */
    ArcCos,
    /** Arc sinus */
    ArcSin,
    /** Sign */
    Sign,
    /** Negate */
    Negate,
    /** OneMinus */
    OneMinus,
    /** Reciprocal */
    Reciprocal,
    /** ToDegrees */
    ToDegrees,
    /** ToRadians */
    ToRadians,
    /** Fract */
    Fract,
}

/**
 * Block used to apply trigonometry operation to floats
 */
export class ParticleTrigonometryBlock extends NodeParticleBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
        options: [
            { label: "Cos", value: ParticleTrigonometryBlockOperations.Cos },
            { label: "Sin", value: ParticleTrigonometryBlockOperations.Sin },
            { label: "Abs", value: ParticleTrigonometryBlockOperations.Abs },
            { label: "Exp", value: ParticleTrigonometryBlockOperations.Exp },
            { label: "Exp2", value: ParticleTrigonometryBlockOperations.Exp2 },
            { label: "Round", value: ParticleTrigonometryBlockOperations.Round },
            { label: "Floor", value: ParticleTrigonometryBlockOperations.Floor },
            { label: "Ceiling", value: ParticleTrigonometryBlockOperations.Ceiling },
            { label: "Sqrt", value: ParticleTrigonometryBlockOperations.Sqrt },
            { label: "Log", value: ParticleTrigonometryBlockOperations.Log },
            { label: "Tan", value: ParticleTrigonometryBlockOperations.Tan },
            { label: "ArcTan", value: ParticleTrigonometryBlockOperations.ArcTan },
            { label: "ArcCos", value: ParticleTrigonometryBlockOperations.ArcCos },
            { label: "ArcSin", value: ParticleTrigonometryBlockOperations.ArcSin },
            { label: "Sign", value: ParticleTrigonometryBlockOperations.Sign },
            { label: "Negate", value: ParticleTrigonometryBlockOperations.Negate },
            { label: "OneMinus", value: ParticleTrigonometryBlockOperations.OneMinus },
            { label: "Reciprocal", value: ParticleTrigonometryBlockOperations.Reciprocal },
            { label: "ToDegrees", value: ParticleTrigonometryBlockOperations.ToDegrees },
            { label: "ToRadians", value: ParticleTrigonometryBlockOperations.ToRadians },
            { label: "Fract", value: ParticleTrigonometryBlockOperations.Fract },
        ],
    })
    public operation = ParticleTrigonometryBlockOperations.Cos;

    /**
     * Creates a new GeometryTrigonometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeParticleBlockConnectionPointTypes.Float |
                NodeParticleBlockConnectionPointTypes.Int |
                NodeParticleBlockConnectionPointTypes.Vector2 |
                NodeParticleBlockConnectionPointTypes.Vector3 |
                NodeParticleBlockConnectionPointTypes.Color4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleTrigonometryBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        super._build(state);
        let func: Nullable<(value: number) => number> = null;

        switch (this.operation) {
            case ParticleTrigonometryBlockOperations.Cos: {
                func = (value: number) => Math.cos(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Sin: {
                func = (value: number) => Math.sin(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Abs: {
                func = (value: number) => Math.abs(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Exp: {
                func = (value: number) => Math.exp(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Exp2: {
                func = (value: number) => Math.pow(2, value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Round: {
                func = (value: number) => Math.round(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Floor: {
                func = (value: number) => Math.floor(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Ceiling: {
                func = (value: number) => Math.ceil(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Sqrt: {
                func = (value: number) => Math.sqrt(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Log: {
                func = (value: number) => Math.log(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Tan: {
                func = (value: number) => Math.tan(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.ArcTan: {
                func = (value: number) => Math.atan(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.ArcCos: {
                func = (value: number) => Math.acos(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.ArcSin: {
                func = (value: number) => Math.asin(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Sign: {
                func = (value: number) => Math.sign(value);
                break;
            }
            case ParticleTrigonometryBlockOperations.Negate: {
                func = (value: number) => -value;
                break;
            }
            case ParticleTrigonometryBlockOperations.OneMinus: {
                func = (value: number) => 1 - value;
                break;
            }
            case ParticleTrigonometryBlockOperations.Reciprocal: {
                func = (value: number) => 1 / value;
                break;
            }
            case ParticleTrigonometryBlockOperations.ToRadians: {
                func = (value: number) => (value * Math.PI) / 180;
                break;
            }
            case ParticleTrigonometryBlockOperations.ToDegrees: {
                func = (value: number) => (value * 180) / Math.PI;
                break;
            }
            case ParticleTrigonometryBlockOperations.Fract: {
                func = (value: number) => {
                    if (value >= 0) {
                        return value - Math.floor(value);
                    } else {
                        return value - Math.ceil(value);
                    }
                };
                break;
            }
        }
        if (!func) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        switch (this.input.type) {
            case NodeParticleBlockConnectionPointTypes.Int:
            case NodeParticleBlockConnectionPointTypes.Float: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return func(source);
                };
                break;
            }
            case NodeParticleBlockConnectionPointTypes.Vector2: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector2(func(source.x), func(source.y));
                };
                break;
            }
            case NodeParticleBlockConnectionPointTypes.Vector3: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector3(func(source.x), func(source.y), func(source.z));
                };
                break;
            }
            case NodeParticleBlockConnectionPointTypes.Color4: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Color4(func(source.r), func(source.g), func(source.b), func(source.a));
                };
                break;
            }
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.operation = serializationObject.operation;
    }
}

RegisterClass("BABYLON.ParticleTrigonometryBlock", ParticleTrigonometryBlock);
