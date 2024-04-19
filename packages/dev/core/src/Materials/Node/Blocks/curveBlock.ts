import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Scene } from "../../../scene";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

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
    public override getClassName() {
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

    private _duplicateVector(entry: string, inputType: string, isWGSL: boolean) {
        if (inputType === "float" || inputType === "f32") {
            return this._duplicateEntryDirect(entry);
        }

        const size = parseInt(inputType.replace("vec", ""));
        let code = isWGSL
            ? `
            var ret: vec${size}f = vec${size}f(0.0);
        `
            : `
            vec${size} ret = vec${size}(0.0);
        `;

        for (let i = 1; i <= size; i++) {
            code += this._duplicateEntry(entry, i === 1 ? "x" : i === 2 ? "y" : i === 3 ? "z" : "w") + ";\n";
        }

        code += "return ret;\n";
        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        let registeredFunction = "";
        let registeredFunctionName = "";

        const inputType = state._getShaderType(this.input.type);
        const isWGSL = state.shaderLanguage === ShaderLanguage.WGSL;

        registeredFunctionName = CurveBlockTypes[this.type] + "_" + inputType.replace("<", "").replace(">", "");

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
                const entry = state._generateTertiary("2.0 * VAL * VAL", "1.0 - pow(-2.0 * VAL + 2.0, 2.0) / 2.0", "VAL < 0.5");
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInCubic:
                registeredFunction = `return v * v * v`;
                break;
            case CurveBlockTypes.EaseOutCubic: {
                const entry = "1.0 - pow(1.0 - VAL, 3.0)";
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInOutCubic: {
                const entry = state._generateTertiary("4.0 * VAL * VAL * VAL", "1.0 - pow(-2.0 * VAL + 2.0, 3.0) / 2.0", "VAL < 0.5");
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInQuart:
                registeredFunction = `return v * v * v * v`;
                break;
            case CurveBlockTypes.EaseOutQuart: {
                const entry = "1.0 - pow(1.0 - VAL, 4.0)";
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInOutQuart: {
                const entry = state._generateTertiary("8.0 * VAL * VAL * VAL * VAL", "1.0 - pow(-2.0 * VAL + 2.0, 4.0) / 2.0", "VAL < 0.5");
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInQuint:
                registeredFunction = `return v * v * v * v * v`;
                break;
            case CurveBlockTypes.EaseOutQuint: {
                const entry = "1.0 - pow(1.0 - VAL, 5.0)";
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInOutQuint: {
                const entry = state._generateTertiary("16.0 * VAL * VAL * VAL * VAL * VAL", "1.0 - pow(-2.0 * VAL + 2.0, 5.0) / 2.0", "VAL < 0.5");
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInExpo: {
                const entry = state._generateTertiary("0.0", "pow(2.0, 10.0 * VAL - 10.0)", "VAL == 0.0");
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseOutExpo: {
                const entry = state._generateTertiary("1.0", "1.0 - pow(2.0, -10.0 * VAL)", "VAL == 1.0");
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInOutExpo: {
                const entry = state._generateTertiary(
                    "0.0",
                    state._generateTertiary(
                        "1.0",
                        state._generateTertiary("pow(2.0, 20.0 * VAL - 10.0) / 2.0", "(2.0 - pow(2.0, -20.0 * VAL + 10.0)) / 2.0", "VAL < 0.5"),
                        "VAL == 1.0"
                    ),
                    "VAL == 0.0"
                );
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInCirc: {
                const entry = "1.0 - sqrt(1.0 - pow(VAL, 2.0))";
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseOutCirc: {
                const entry = "sqrt(1.0 - pow(VAL - 1.0, 2.0))";
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInOutCirc: {
                const entry = state._generateTertiary("(1.0 - sqrt(1.0 - pow(2.0 * VAL, 2.0))) / 2.0", "(sqrt(1.0 - pow(-2.0 * VAL + 2.0, 2.0)) + 1.0) / 2.0", "VAL < 0.5");
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInBack: {
                registeredFunction = "return 2.70158 * v * v * v - 1.70158 * v * v";
                break;
            }
            case CurveBlockTypes.EaseOutBack: {
                const entry = "2.70158 * pow(VAL - 1.0, 3.0) + 1.70158 * pow(VAL - 1.0, 2.0)";
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInOutBack: {
                const entry = state._generateTertiary(
                    "(pow(2.0 * VAL, 2.0) * ((3.5949095) * 2.0 * VAL - 2.5949095)) / 2.0",
                    "(pow(2.0 * VAL - 2.0, 2.0) * (3.5949095 * (VAL * 2.0 - 2.0) + 3.5949095) + 2.0) / 2.0",
                    "VAL < 0.5"
                );
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInElastic: {
                const entry = state._generateTertiary(
                    "0.0",
                    state._generateTertiary("1.0", "-pow(2.0, 10.0 * VAL - 10.0) * sin((VAL * 10.0 - 10.75) * ((2.0 * 3.1415) / 3.0))", "VAL == 1.0"),
                    "VAL == 0.0"
                );

                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseOutElastic: {
                const entry = state._generateTertiary(
                    "0.0",
                    state._generateTertiary("1.0", "pow(2.0, -10.0 * VAL) * sin((VAL * 10.0 - 0.75) * ((2.0 * 3.1415) / 3.0)) + 1.0", "VAL == 1.0"),
                    "VAL == 0.0"
                );
                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
            case CurveBlockTypes.EaseInOutElastic: {
                const entry = state._generateTertiary(
                    "0.0",
                    state._generateTertiary(
                        "1.0",
                        state._generateTertiary(
                            "-(pow(2.0, 20.0 * VAL - 10.0) * sin((20.0 * VAL - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0",
                            "(pow(2.0, -20.0 * VAL + 10.0) * sin((20.0 * VAL - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0 + 1.0",
                            "VAL < 0.5"
                        ),
                        "VAL == 1.0"
                    ),
                    "VAL == 0.0"
                );

                registeredFunction = this._duplicateVector(entry, inputType, isWGSL);
                break;
            }
        }

        if (isWGSL) {
            state._emitFunction(registeredFunctionName, `fn ${registeredFunctionName}(v: ${inputType}) -> ${inputType}  {${registeredFunction};}\n`, "");
        } else {
            state._emitFunction(registeredFunctionName, `${inputType} ${registeredFunctionName}(${inputType} v) {${registeredFunction};}\n`, "");
        }

        state.compilationString += state._declareOutput(output) + ` = ${registeredFunctionName}(${this.input.associatedVariableName});\n`;

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.curveType = this.type;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.type = serializationObject.curveType;
    }

    protected override _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.type = BABYLON.CurveBlockTypes.${CurveBlockTypes[this.type]};\n`;
        return codeString;
    }
}

RegisterClass("BABYLON.CurveBlock", CurveBlock);
