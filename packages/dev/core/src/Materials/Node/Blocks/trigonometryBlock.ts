import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Scene } from "../../../scene";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";

/**
 * Operations supported by the Trigonometry block
 */
export enum TrigonometryBlockOperations {
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
    /** Fraction */
    Fract,
    /** Sign */
    Sign,
    /** To radians (from degrees) */
    Radians,
    /** To degrees (from radians) */
    Degrees,
    /** To Set a = b */
    Set,
}

/**
 * Block used to apply trigonometry operation to floats
 */
export class TrigonometryBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    @editableInPropertyPage("Operation", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Cos", value: TrigonometryBlockOperations.Cos },
            { label: "Sin", value: TrigonometryBlockOperations.Sin },
            { label: "Abs", value: TrigonometryBlockOperations.Abs },
            { label: "Exp", value: TrigonometryBlockOperations.Exp },
            { label: "Exp2", value: TrigonometryBlockOperations.Exp2 },
            { label: "Round", value: TrigonometryBlockOperations.Round },
            { label: "Floor", value: TrigonometryBlockOperations.Floor },
            { label: "Ceiling", value: TrigonometryBlockOperations.Ceiling },
            { label: "Sqrt", value: TrigonometryBlockOperations.Sqrt },
            { label: "Log", value: TrigonometryBlockOperations.Log },
            { label: "Tan", value: TrigonometryBlockOperations.Tan },
            { label: "ArcTan", value: TrigonometryBlockOperations.ArcTan },
            { label: "ArcCos", value: TrigonometryBlockOperations.ArcCos },
            { label: "ArcSin", value: TrigonometryBlockOperations.ArcSin },
            { label: "Fract", value: TrigonometryBlockOperations.Fract },
            { label: "Sign", value: TrigonometryBlockOperations.Sign },
            { label: "Radians", value: TrigonometryBlockOperations.Radians },
            { label: "Degrees", value: TrigonometryBlockOperations.Degrees },
            { label: "Set", value: TrigonometryBlockOperations.Set },
        ],
    })
    public operation = TrigonometryBlockOperations.Cos;

    /**
     * Creates a new TrigonometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "TrigonometryBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        let operation = "";

        switch (this.operation) {
            case TrigonometryBlockOperations.Cos: {
                operation = "cos";
                break;
            }
            case TrigonometryBlockOperations.Sin: {
                operation = "sin";
                break;
            }
            case TrigonometryBlockOperations.Abs: {
                operation = "abs";
                break;
            }
            case TrigonometryBlockOperations.Exp: {
                operation = "exp";
                break;
            }
            case TrigonometryBlockOperations.Exp2: {
                operation = "exp2";
                break;
            }
            case TrigonometryBlockOperations.Round: {
                operation = "round";
                break;
            }
            case TrigonometryBlockOperations.Floor: {
                operation = "floor";
                break;
            }
            case TrigonometryBlockOperations.Ceiling: {
                operation = "ceil";
                break;
            }
            case TrigonometryBlockOperations.Sqrt: {
                operation = "sqrt";
                break;
            }
            case TrigonometryBlockOperations.Log: {
                operation = "log";
                break;
            }
            case TrigonometryBlockOperations.Tan: {
                operation = "tan";
                break;
            }
            case TrigonometryBlockOperations.ArcTan: {
                operation = "atan";
                break;
            }
            case TrigonometryBlockOperations.ArcCos: {
                operation = "acos";
                break;
            }
            case TrigonometryBlockOperations.ArcSin: {
                operation = "asin";
                break;
            }
            case TrigonometryBlockOperations.Fract: {
                operation = "fract";
                break;
            }
            case TrigonometryBlockOperations.Sign: {
                operation = "sign";
                break;
            }
            case TrigonometryBlockOperations.Radians: {
                operation = "radians";
                break;
            }
            case TrigonometryBlockOperations.Degrees: {
                operation = "degrees";
                break;
            }
            case TrigonometryBlockOperations.Set: {
                operation = "";
                break;
            }
        }

        state.compilationString += state._declareOutput(output) + ` = ${operation}(${this.input.associatedVariableName});\n`;

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.operation = this.operation;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.operation = serializationObject.operation;
    }

    protected override _dumpPropertiesCode() {
        const codeString =
            super._dumpPropertiesCode() + `${this._codeVariableName}.operation = BABYLON.TrigonometryBlockOperations.${TrigonometryBlockOperations[this.operation]};\n`;
        return codeString;
    }
}

RegisterClass("BABYLON.TrigonometryBlock", TrigonometryBlock);
