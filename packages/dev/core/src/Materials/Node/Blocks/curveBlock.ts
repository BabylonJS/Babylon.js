import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Scene } from "../../../scene";

/**
 * Types of curves supported by the Curve block
 */
export enum CurveBlockTypes {
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
export class CurveBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the type of the curve applied by the block
     */
    public type = CurveBlockTypes.EaseInOutSine;

    /**
     * Creates a new CurveBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];

        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Object);
        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Int);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "CurveBlock";
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

    private _duplicateEntry(entry: string, component: string) {
        return `ret.${component} = ${entry.replace(/VAL/g, "v." + component)}`;
    }

    private _duplicateEntryDirect(entry: string) {
        return `return ${entry.replace(/VAL/g, "v")}`;
    }

    private _duplicateVector(entry: string, inputType: string) {
        if (inputType === "float") {
            return this._duplicateEntryDirect(entry);
        }

        const size = parseInt(inputType.replace("vec", ""));
        let code = `
            vec${size} ret = vec${size}(0.0);
        `;

        for (let i = 1; i <= size; i++) {
            code += this._duplicateEntry(entry, i === 1 ? "x" : i === 2 ? "y" : i === 3 ? "z" : "w") + ";\r\n";
        }

        code += "return ret;\r\n";
        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        let registeredFunction = "";
        let registeredFunctionName = "";

        let inputType = "";

        switch (this.input.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                inputType = "float";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                inputType = "vec2";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
                inputType = "vec3";
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                inputType = "vec4";
                break;
        }

        registeredFunctionName = CurveBlockTypes[this.type] + "_" + inputType;

        switch (this.type) {
            case CurveBlockTypes.EaseInSine:
                registeredFunction = `return 1.0 - cos((v * 3.1415) / 2.0)`;
                break;
            case CurveBlockTypes.EaseOutSine:
                registeredFunction = `return sin((v * 3.1415) / 2.0)`;
                break;
            case CurveBlockTypes.EaseInOutSine:
                registeredFunction = `return -(cos(v * 3.1415) - 1.0) / 2.0`;
                break;
            case CurveBlockTypes.EaseInQuad:
                registeredFunction = `return v * v`;
                break;
            case CurveBlockTypes.EaseOutQuad:
                registeredFunction = `return (1.0 - v) * (1.0 - v)`;
                break;
            case CurveBlockTypes.EaseInOutQuad: {
                const entry = "VAL < 0.5 ? 2.0 * VAL * VAL : 1.0 - pow(-2.0 * VAL + 2.0, 2.0) / 2.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInCubic:
                registeredFunction = `return v * v * v`;
                break;
            case CurveBlockTypes.EaseOutCubic: {
                const entry = "1.0 - pow(1.0 - VAL, 3.0)";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInOutCubic: {
                const entry = "VAL < 0.5 ? 4.0 * VAL * VAL * VAL : 1.0 - pow(-2.0 * VAL + 2.0, 3.0) / 2.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInQuart:
                registeredFunction = `return v * v * v * v`;
                break;
            case CurveBlockTypes.EaseOutQuart: {
                const entry = "1.0 - pow(1.0 - VAL, 4.0)";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInOutQuart: {
                const entry = "VAL < 0.5 ? 8.0 * VAL * VAL * VAL * VAL : 1.0 - pow(-2.0 * VAL + 2.0, 4.0) / 2.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInQuint:
                registeredFunction = `return v * v * v * v * v`;
                break;
            case CurveBlockTypes.EaseOutQuint: {
                const entry = "1.0 - pow(1.0 - VAL, 5.0)";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInOutQuint: {
                const entry = "VAL < 0.5 ? 16.0 * VAL * VAL * VAL * VAL * VAL : 1.0 - pow(-2.0 * VAL + 2.0, 5.0) / 2.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInExpo: {
                const entry = "VAL == 0.0 ? 0.0 : pow(2.0, 10.0 * VAL - 10.0)";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseOutExpo: {
                const entry = "VAL == 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * VAL)";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInOutExpo: {
                const entry = "VAL == 0.0 ? 0.0 : VAL == 1.0 ? 1.0 : VAL < 0.5 ? pow(2.0, 20.0 * VAL - 10.0) / 2.0 : (2.0 - pow(2.0, -20.0 * VAL + 10.0)) / 2.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInCirc: {
                const entry = "1.0 - sqrt(1.0 - pow(VAL, 2.0))";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseOutCirc: {
                const entry = "sqrt(1.0 - pow(VAL - 1.0, 2.0))";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInOutCirc: {
                const entry = "VAL < 0.5 ? (1.0 - sqrt(1.0 - pow(2.0 * VAL, 2.0))) / 2.0 : (sqrt(1.0 - pow(-2.0 * VAL + 2.0, 2.0)) + 1.0) / 2.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInBack: {
                registeredFunction = "return 2.70158 * v * v * v - 1.70158 * v * v";
                break;
            }
            case CurveBlockTypes.EaseOutBack: {
                const entry = "2.70158 * pow(VAL - 1.0, 3.0) + 1.70158 * pow(VAL - 1.0, 2.0)";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInOutBack: {
                const entry =
                    "VAL < 0.5 ? (pow(2.0 * VAL, 2.0) * ((3.5949095) * 2.0 * VAL - 2.5949095)) / 2.0 : (pow(2.0 * VAL - 2.0, 2.0) * (3.5949095 * (VAL * 2.0 - 2.0) + 3.5949095) + 2.0) / 2.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInElastic: {
                const entry = "VAL == 0.0 ? 0.0 : VAL == 1.0 ? 1.0 : -pow(2.0, 10.0 * VAL - 10.0) * sin((VAL * 10.0 - 10.75) * ((2.0 * 3.1415) / 3.0))";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseOutElastic: {
                const entry = "VAL == 0.0 ? 0.0 : VAL == 1.0 ? 1.0 : pow(2.0, -10.0 * VAL) * sin((VAL * 10.0 - 0.75) * ((2.0 * 3.1415) / 3.0)) + 1.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
            case CurveBlockTypes.EaseInOutElastic: {
                const entry =
                    "VAL == 0.0 ? 0.0 : VAL == 1.0 ? 1.0 : VAL < 0.5 ? -(pow(2.0, 20.0 * VAL - 10.0) * sin((20.0 * VAL - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0 : (pow(2.0, -20.0 * VAL + 10.0) * sin((20.0 * VAL - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0 + 1.0";
                registeredFunction = this._duplicateVector(entry, inputType);
                break;
            }
        }

        state._emitFunction(registeredFunctionName, `${inputType} ${registeredFunctionName}(${inputType} v) {${registeredFunction};}\r\n`, "");

        state.compilationString += this._declareOutput(output, state) + ` = ${registeredFunctionName}(${this.input.associatedVariableName});\r\n`;

        return this;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.curveType = this.type;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.type = serializationObject.curveType;
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.type = BABYLON.CurveBlockTypes.${CurveBlockTypes[this.type]};\r\n`;
        return codeString;
    }
}

RegisterClass("BABYLON.CurveBlock", CurveBlock);
