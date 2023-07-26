import type { Nullable } from "../../../types";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";

/**
 * Operations supported by the Trigonometry block
 */
export enum GeometryTrigonometryBlockOperations {
    /** Cos */
    Cos,
    /** Sin */
    Sin,
    /** Abs */
    Abs,
    /** Exp */
    Exp,
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
}

/**
 * Block used to apply trigonometry operation to floats
 */
export class GeometryTrigonometryBlock extends NodeGeometryBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    public operation = GeometryTrigonometryBlockOperations.Cos;

    /**
     * Creates a new GeometryTrigonometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometryTrigonometryBlock";
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

    protected _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);
        let func: Nullable<(value: number) => number> = null;


        switch (this.operation) {
            case GeometryTrigonometryBlockOperations.Cos: {
                func = (value: number) => Math.cos(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Sin: {
                func = (value: number) => Math.sin(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Abs: {
                func = (value: number) => Math.abs(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Exp: {
                func = (value: number) => Math.exp(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Round: {
                func = (value: number) => Math.round(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Floor: {
                func = (value: number) => Math.floor(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Ceiling: {
                func = (value: number) => Math.ceil(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Sqrt: {
                func = (value: number) => Math.sqrt(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Log: {
                func = (value: number) => Math.log(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Tan: {
                func = (value: number) => Math.tan(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.ArcTan: {
                func = (value: number) => Math.atan(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.ArcCos: {
                func = (value: number) => Math.acos(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.ArcSin: {
                func = (value: number) => Math.asin(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Sign: {
                func = (value: number) => Math.sign(value);
                break;
            }
        }
        if (!func) {
            this.input._storedFunction = null;
            this.input._storedValue = null;
            return;
        }

        switch (this.input.type) {
            case NodeGeometryBlockConnectionPointTypes.Float: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return func!(source);
                }
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector2: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector2(func!(source.x), func!(source.y));
                }
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector3: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector3(func!(source.x), func!(source.y), func!(source.z));
                }
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector4: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector4(func!(source.x), func!(source.y), func!(source.z), func!(source.w));
                }
                break;
            }            
        }

        return this;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, rootUrl: string) {
        super._deserialize(serializationObject, rootUrl);

        this.operation = serializationObject.operation;
    }

    protected _dumpPropertiesCode() {
        const codeString =
            super._dumpPropertiesCode() + `${this._codeVariableName}.operation = BABYLON.GeometryTrigonometryBlockOperations.${GeometryTrigonometryBlockOperations[this.operation]};\r\n`;
        return codeString;
    }
}

RegisterClass("BABYLON.GeometryTrigonometryBlock", GeometryTrigonometryBlock);
