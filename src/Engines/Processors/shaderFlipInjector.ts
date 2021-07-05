import { CodeParserHelper } from "../../Misc/codeParserHelper";

/** @hidden */
export enum ModificationType {
    flipY,
    negateY,
    negate
}

/** @hidden */
export class ShaderFlipInjector extends CodeParserHelper {
    private _functionName: string;
    private _modificationType: ModificationType;
    private _paramPosition: number;

    constructor(sourceCode: string) {
        super(sourceCode);
    }

    public processCode(funcName: string = "", modificationType: ModificationType = ModificationType.flipY, paramPosition = 1) {
        this._functionName = funcName;
        this._modificationType = modificationType;
        this._paramPosition = paramPosition;
        super.processCode();
    }

    protected _internalProcess(): void {
        const name = this._functionName;
        let startIndex = 0;

        while (startIndex < this._sourceCode.length) {
            // Look for the function name in the source code
            const functionCallIndex = this._sourceCode.indexOf(name, startIndex);

            if (functionCallIndex < 0) {
                break;
            }

            // Make sure "name" is not part of a bigger string
            if (functionCallIndex === 0 || CodeParserHelper.IsIdentifierChar(this._sourceCode.charAt(functionCallIndex - 1))) {
                startIndex = functionCallIndex + name.length;
                continue;
            }

            // Find the opening parenthesis
            const callParamsStartIndex = CodeParserHelper.SkipWhitespaces(this._sourceCode, functionCallIndex + name.length);
            if (callParamsStartIndex === this._sourceCode.length || this._sourceCode.charAt(callParamsStartIndex) !== '(') {
                startIndex = functionCallIndex + name.length;
                continue;
            }

            // extract the parameters of the function call as a whole string (without the leading / trailing parenthesis)
            const callParamsEndIndex = CodeParserHelper.ExtractBetweenMarkers('(', ')', this._sourceCode, callParamsStartIndex);
            if (callParamsEndIndex < 0) {
                if (this.debug) {
                    console.warn(`Could not extract the parameters of the function call. Function '${name}'. callParamsStartIndex=${callParamsStartIndex}`);
                }
                startIndex = functionCallIndex + name.length;
                continue;
            }
            const callParams = this._sourceCode.substring(callParamsStartIndex + 1, callParamsEndIndex);

            // process the parameter call: extract each names

            const params = CodeParserHelper.SplitParameters(CodeParserHelper.RemoveComments(callParams));

            if (params === null) {
                if (this.debug) {
                    console.warn(`Invalid function call: can't extract the parameters of the function call. Function '${name}'. callParamsStartIndex=${callParamsStartIndex}, callParams=` + callParams);
                }
                startIndex = functionCallIndex + name.length;
                continue;
            }

            let newCallParams = "";

            for (let i = 0; i < params.length; ++i) {
                if (i > 0) {
                    newCallParams += ", ";
                }
                if (i === this._paramPosition) {
                    switch (this._modificationType) {
                        case ModificationType.flipY:
                            newCallParams += "_flipY(" + params[i] + ")";
                            break;
                        case ModificationType.negateY:
                            newCallParams += "_negateY(" + params[i] + ")";
                            break;
                        case ModificationType.negate:
                            newCallParams += "-(" + params[i] + ")";
                            break;
                    }
                } else {
                    newCallParams += params[i];
                }
            }

            this._sourceCode = this._sourceCode.substring(0, callParamsStartIndex + 1) + newCallParams + this._sourceCode.substring(callParamsEndIndex);

            startIndex = callParamsEndIndex + 1 + newCallParams.length - callParams.length;
        }
    }
}
