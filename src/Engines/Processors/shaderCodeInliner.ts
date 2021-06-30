import { CodeParserHelper } from "../../Misc/codeParserHelper";

interface IInlineFunctionDescr {
    name: string;
    type: string;
    parameters: string[];
    body: string;
    callIndex: number;
}

/**
 * Class used to inline functions in shader code
*/
export class ShaderCodeInliner extends CodeParserHelper {

    private static readonly _RegexpFindFunctionNameAndType = /((\s+?)(\w+)\s+(\w+)\s*?)$/;

    private _functionDescr: IInlineFunctionDescr[];
    private _numMaxIterations: number;

    /** Gets or sets the token used to mark the functions to inline */
    public inlineToken: string;

    /**
     * Initializes the inliner
     * @param sourceCode shader code source to inline
     * @param numMaxIterations maximum number of iterations (used to detect recursive calls)
     */
    constructor(sourceCode: string, numMaxIterations = 20) {
        super(sourceCode);
        this._numMaxIterations = numMaxIterations;
        this._functionDescr = [];
        this.inlineToken = "#define inline";
    }

    protected _internalProcess() {
        this._collectFunctions();
        this._processInlining(this._numMaxIterations);
    }

    private _collectFunctions() {
        let startIndex = 0;

        while (startIndex < this._sourceCode.length) {
            // locate the function to inline and extract its name
            const inlineTokenIndex = this._sourceCode.indexOf(this.inlineToken, startIndex);
            if (inlineTokenIndex < 0) {
                break;
            }

            const funcParamsStartIndex = this._sourceCode.indexOf("(", inlineTokenIndex + this.inlineToken.length);
            if (funcParamsStartIndex < 0) {
                if (this.debug) {
                    console.warn(`Could not find the opening parenthesis after the token. startIndex=${startIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }

            const funcNameMatch = ShaderCodeInliner._RegexpFindFunctionNameAndType.exec(this._sourceCode.substring(inlineTokenIndex + this.inlineToken.length, funcParamsStartIndex));
            if (!funcNameMatch) {
                if (this.debug) {
                    console.warn(`Could not extract the name/type of the function from: ${this._sourceCode.substring(inlineTokenIndex + this.inlineToken.length, funcParamsStartIndex)}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }
            const [funcType, funcName] = [funcNameMatch[3], funcNameMatch[4]];

            // extract the parameters of the function as a whole string (without the leading / trailing parenthesis)
            const funcParamsEndIndex = CodeParserHelper.ExtractBetweenMarkers('(', ')', this._sourceCode, funcParamsStartIndex);
            if (funcParamsEndIndex < 0) {
                if (this.debug) {
                    console.warn(`Could not extract the parameters the function '${funcName}' (type=${funcType}). funcParamsStartIndex=${funcParamsStartIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }
            const funcParams = this._sourceCode.substring(funcParamsStartIndex + 1, funcParamsEndIndex);

            // extract the body of the function (with the curly brackets)
            const funcBodyStartIndex = CodeParserHelper.SkipWhitespaces(this._sourceCode, funcParamsEndIndex + 1);
            if (funcBodyStartIndex === this._sourceCode.length) {
                if (this.debug) {
                    console.warn(`Could not extract the body of the function '${funcName}' (type=${funcType}). funcParamsEndIndex=${funcParamsEndIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }

            const funcBodyEndIndex = CodeParserHelper.ExtractBetweenMarkers('{', '}', this._sourceCode, funcBodyStartIndex);
            if (funcBodyEndIndex < 0) {
                if (this.debug) {
                    console.warn(`Could not extract the body of the function '${funcName}' (type=${funcType}). funcBodyStartIndex=${funcBodyStartIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }
            const funcBody = this._sourceCode.substring(funcBodyStartIndex, funcBodyEndIndex + 1);

            // process the parameters: extract each names
            const params = CodeParserHelper.RemoveComments(funcParams).split(",");
            const paramNames = [];

            for (let p = 0; p < params.length; ++p) {
                const param = params[p].trim();
                const idx = param.lastIndexOf(" ");

                if (idx >= 0) {
                    paramNames.push(param.substring(idx + 1));
                }
            }

            if (funcType !== 'void') {
                // for functions that return a value, we will replace "return" by "tempvarname = ", tempvarname being a unique generated name
                paramNames.push('return');
            }

            // collect the function
            this._functionDescr.push({
                "name": funcName,
                "type": funcType,
                "parameters": paramNames,
                "body": funcBody,
                "callIndex": 0,
            });

            startIndex = funcBodyEndIndex + 1;

            // remove the function from the source code
            const partBefore = inlineTokenIndex > 0 ? this._sourceCode.substring(0, inlineTokenIndex) : "";
            const partAfter = funcBodyEndIndex + 1 < this._sourceCode.length - 1 ? this._sourceCode.substring(funcBodyEndIndex + 1) : "";

            this._sourceCode = partBefore + partAfter;

            startIndex -= funcBodyEndIndex + 1 - inlineTokenIndex;
        }

        if (this.debug) {
            console.log(`Collect functions: ${this._functionDescr.length} functions found. functionDescr=`, this._functionDescr);
        }
    }

    private _processInlining(numMaxIterations: number = 20): boolean {
        while (numMaxIterations-- >= 0) {
            if (!this._replaceFunctionCallsByCode()) {
                break;
            }
        }

        if (this.debug) {
            console.log(`numMaxIterations is ${numMaxIterations} after inlining process`);
        }

        return numMaxIterations >= 0;
    }

    private _replaceFunctionCallsByCode(): boolean {
        let doAgain = false;

        for (const func of this._functionDescr) {
            const { name, type, parameters, body } = func;

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
                        console.warn(`Could not extract the parameters of the function call. Function '${name}' (type=${type}). callParamsStartIndex=${callParamsStartIndex}`);
                    }
                    startIndex = functionCallIndex + name.length;
                    continue;
                }
                const callParams = this._sourceCode.substring(callParamsStartIndex + 1, callParamsEndIndex);

                const params = CodeParserHelper.SplitParameters(CodeParserHelper.RemoveComments(callParams));

                if (params === null) {
                    if (this.debug) {
                        console.warn(`Invalid function call: can't extract the parameters of the function call. Function '${name}' (type=${type}). callParamsStartIndex=${callParamsStartIndex}, callParams=` + callParams);
                    }
                    startIndex = functionCallIndex + name.length;
                    continue;
                }

                const paramNames = [];

                for (let p = 0; p < params.length; ++p) {
                    const param = params[p].trim();
                    paramNames.push(param);
                }

                const retParamName = type !== 'void' ? name + '_' + (func.callIndex++) : null;

                if (retParamName) {
                    paramNames.push(retParamName + ' =');
                }

                if (paramNames.length !== parameters.length) {
                    if (this.debug) {
                        console.warn(`Invalid function call: not the same number of parameters for the call than the number expected by the function. Function '${name}' (type=${type}). function parameters=${parameters}, call parameters=${paramNames}`);
                    }
                    startIndex = functionCallIndex + name.length;
                    continue;
                }

                startIndex = callParamsEndIndex + 1;

                // replace the function call by the body function
                const funcBody = this._replaceNames(body, parameters, paramNames);

                let partBefore = functionCallIndex > 0 ? this._sourceCode.substring(0, functionCallIndex) : "";
                let partAfter = callParamsEndIndex + 1 < this._sourceCode.length - 1 ? this._sourceCode.substring(callParamsEndIndex + 1) : "";

                if (retParamName) {
                    // case where the function returns a value. We generate:
                    // FUNCTYPE retParamName;
                    // {function body}
                    // and replace the function call by retParamName
                    const injectDeclarationIndex = CodeParserHelper.FindBackward(this._sourceCode, functionCallIndex - 1, '\n');

                    partBefore = this._sourceCode.substring(0, injectDeclarationIndex + 1);
                    let partBetween = this._sourceCode.substring(injectDeclarationIndex + 1, functionCallIndex);

                    this._sourceCode = partBefore + type + " " + retParamName + ";\n" + funcBody + "\n" + partBetween + retParamName + partAfter;

                    if (this.debug) {
                        console.log(`Replace function call by code. Function '${name}' (type=${type}). injectDeclarationIndex=${injectDeclarationIndex}, call parameters=${paramNames}`);
                    }
                } else {
                    // simple case where the return value of the function is "void"
                    this._sourceCode = partBefore + funcBody + partAfter;

                    startIndex += funcBody.length - (callParamsEndIndex + 1 - functionCallIndex);

                    if (this.debug) {
                        console.log(`Replace function call by code. Function '${name}' (type=${type}). functionCallIndex=${functionCallIndex}, call parameters=${paramNames}`);
                    }
                }

                doAgain = true;
            }
        }

        return doAgain;
    }

    private _replaceNames(code: string, sources: string[], destinations: string[]): string {
        for (let i = 0; i < sources.length; ++i) {
            const source = new RegExp(CodeParserHelper.EscapeRegExp(sources[i]), 'g'),
                  sourceLen = sources[i].length,
                  destination = destinations[i];

            code = code.replace(source, (match, ...args) => {
                const offset: number = args[0];
                // Make sure "source" is not part of a bigger identifier (for eg, if source=view and we matched it with viewDirection)
                if (CodeParserHelper.IsIdentifierChar(code.charAt(offset - 1)) || CodeParserHelper.IsIdentifierChar(code.charAt(offset + sourceLen))) {
                    return sources[i];
                }
                return destination;
            });
        }

        return code;
    }
}
