interface IInlineFunctionDescr {
    name: string;
    type: string;
    parameters: string[];
    body: string;
    callIndex: number;
}

/** @hidden */
export class ShaderCodeInliner {

    static readonly InlineToken = "#define inline";
    static readonly RegexpFindFunctionNameAndType = /(?<=\s+?(\w+)\s+(\w+)\s*?)$/;

    private _sourceCode: string;
    private _functionDescr: IInlineFunctionDescr[];
    private _numMaxIterations: number;

    public debug: boolean = false;

    public get code(): string {
        return this._sourceCode;
    }

    constructor(sourceCode: string, numMaxIterations = 20) {
        this._sourceCode = sourceCode;
        this._numMaxIterations = numMaxIterations;
        this._functionDescr = [];
    }

    public processCode() {
        if (this.debug) {
            console.log(`Start inlining process (code size=${this._sourceCode.length})...`);
        }
        this._collectFunctions();
        this._processInlining(this._numMaxIterations);
        if (this.debug) {
            console.log("End of inlining process.");
        }
    }

    private _collectFunctions() {
        let startIndex = 0;

        while (startIndex < this._sourceCode.length) {
            // locate the function to inline and extract its name
            const inlineTokenIndex = this._sourceCode.indexOf(ShaderCodeInliner.InlineToken, startIndex);
            if (inlineTokenIndex < 0) {
                break;
            }

            const funcParamsStartIndex = this._sourceCode.indexOf("(", inlineTokenIndex + ShaderCodeInliner.InlineToken.length);
            if (funcParamsStartIndex < 0) {
                if (this.debug) {
                    console.warn(`Could not find the opening parenthesis after the token. startIndex=${startIndex}`);
                }
                startIndex = inlineTokenIndex + ShaderCodeInliner.InlineToken.length;
                continue;
            }

            const funcNameMatch = ShaderCodeInliner.RegexpFindFunctionNameAndType.exec(this._sourceCode.substring(inlineTokenIndex + ShaderCodeInliner.InlineToken.length, funcParamsStartIndex));
            if (!funcNameMatch) {
                if (this.debug) {
                    console.warn(`Could not extract the name/type of the function from: ${this._sourceCode.substring(inlineTokenIndex + ShaderCodeInliner.InlineToken.length, funcParamsStartIndex)}`);
                }
                startIndex = inlineTokenIndex + ShaderCodeInliner.InlineToken.length;
                continue;
            }
            const [funcType, funcName] = [funcNameMatch[1], funcNameMatch[2]];

            // extract the parameters of the function as a whole string (without the leading / trailing parenthesis)
            const funcParamsEndIndex = this._extractBetweenMarkers('(', ')', this._sourceCode, funcParamsStartIndex);
            if (funcParamsEndIndex < 0) {
                if (this.debug) {
                    console.warn(`Could not extract the parameters the function '${funcName}' (type=${funcType}). funcParamsStartIndex=${funcParamsStartIndex}`);
                }
                startIndex = inlineTokenIndex + ShaderCodeInliner.InlineToken.length;
                continue;
            }
            const funcParams = this._sourceCode.substring(funcParamsStartIndex + 1, funcParamsEndIndex);

            // extract the body of the function (with the curly brackets)
            const funcBodyStartIndex = this._skipWhitespaces(this._sourceCode, funcParamsEndIndex + 1);
            if (funcBodyStartIndex === this._sourceCode.length) {
                if (this.debug) {
                    console.warn(`Could not extract the body of the function '${funcName}' (type=${funcType}). funcParamsEndIndex=${funcParamsEndIndex}`);
                }
                startIndex = inlineTokenIndex + ShaderCodeInliner.InlineToken.length;
                continue;
            }

            const funcBodyEndIndex = this._extractBetweenMarkers('{', '}', this._sourceCode, funcBodyStartIndex);
            if (funcBodyEndIndex < 0) {
                if (this.debug) {
                    console.warn(`Could not extract the body of the function '${funcName}' (type=${funcType}). funcBodyStartIndex=${funcBodyStartIndex}`);
                }
                startIndex = inlineTokenIndex + ShaderCodeInliner.InlineToken.length;
                continue;
            }
            const funcBody = this._sourceCode.substring(funcBodyStartIndex, funcBodyEndIndex + 1);

            // process the parameters: extract each names
            const params = this._removeComments(funcParams).split(",");
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

    private _extractBetweenMarkers(markerOpen: string, markerClose: string, block: string, startIndex: number): number {
        let currPos = startIndex,
            openMarkers = 0,
            waitForChar = '';

        while (currPos < block.length) {
            let currChar = block.charAt(currPos);

            if (!waitForChar) {
                switch (currChar) {
                    case markerOpen:
                        openMarkers++;
                        break;
                    case markerClose:
                        openMarkers--;
                        break;
                    case '"':
                    case "'":
                    case "`":
                        waitForChar = currChar;
                        break;
                    case '/':
                        if (currPos + 1 < block.length) {
                            const nextChar = block.charAt(currPos + 1);
                            if (nextChar === '/') {
                                waitForChar = '\n';
                            } else if (nextChar === '*') {
                                waitForChar = '*/';
                            }
                        }
                        break;
                }
            } else {
                if (currChar === waitForChar) {
                    if (waitForChar === '"' || waitForChar === "'") {
                        block.charAt(currPos - 1) !== '\\' && (waitForChar = '');
                    } else {
                        waitForChar = '';
                    }
                } else if (waitForChar === '*/' && currChar === '*' && currPos + 1 < block.length) {
                    block.charAt(currPos + 1) === '/' && (waitForChar = '');
                    if (waitForChar === '') {
                        currPos++;
                    }
                }
            }

            currPos++ ;
            if (openMarkers === 0) {
                break;
            }
        }

        return openMarkers === 0 ? currPos - 1 : -1;
    }

    private _skipWhitespaces(s: string, index: number): number {
        while (index < s.length) {
            const c = s[index];
            if (c !== ' ' && c !== '\n' && c !== '\r' && c !== '\t' && c !== '\u000a' && c !== '\u00a0') {
                break;
            }
            index++;
        }

        return index;
    }

    private _removeComments(block: string): string {
        let currPos = 0,
            waitForChar = '',
            inComments = false,
            s = [];

        while (currPos < block.length) {
            let currChar = block.charAt(currPos);

            if (!waitForChar) {
                switch (currChar) {
                    case '"':
                    case "'":
                    case "`":
                        waitForChar = currChar;
                        break;
                    case '/':
                        if (currPos + 1 < block.length) {
                            const nextChar = block.charAt(currPos + 1);
                            if (nextChar === '/') {
                                waitForChar = '\n';
                                inComments = true;
                            } else if (nextChar === '*') {
                                waitForChar = '*/';
                                inComments = true;
                            }
                        }
                        break;
                }
                if (!inComments) {
                    s.push(currChar);
                }
            } else {
                if (currChar === waitForChar) {
                    if (waitForChar === '"' || waitForChar === "'") {
                        block.charAt(currPos - 1) !== '\\' && (waitForChar = '');
                        s.push(currChar);
                    } else {
                        waitForChar = '';
                        inComments = false;
                    }
                } else if (waitForChar === '*/' && currChar === '*' && currPos + 1 < block.length) {
                    block.charAt(currPos + 1) === '/' && (waitForChar = '');
                    if (waitForChar === '') {
                        inComments = false;
                        currPos++;
                    }
                } else {
                    if (!inComments) {
                        s.push(currChar);
                    }
                }
            }

            currPos++ ;
        }

        return s.join('');
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

                // Find the opening parenthesis
                const callParamsStartIndex = this._skipWhitespaces(this._sourceCode, functionCallIndex + name.length);
                if (callParamsStartIndex === this._sourceCode.length || this._sourceCode.charAt(callParamsStartIndex) !== '(') {
                    startIndex = functionCallIndex + name.length;
                    continue;
                }

                // extract the parameters of the function call as a whole string (without the leading / trailing parenthesis)
                const callParamsEndIndex = this._extractBetweenMarkers('(', ')', this._sourceCode, callParamsStartIndex);
                if (callParamsEndIndex < 0) {
                    if (this.debug) {
                        console.warn(`Could not extract the parameters of the function call. Function '${name}' (type=${type}). callParamsStartIndex=${callParamsStartIndex}`);
                    }
                    startIndex = functionCallIndex + name.length;
                    continue;
                }
                const callParams = this._sourceCode.substring(callParamsStartIndex + 1, callParamsEndIndex);

                // process the parameter call: extract each names
                const params = this._removeComments(callParams).split(",");
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
                    const injectDeclarationIndex = this._findBackward(this._sourceCode, functionCallIndex - 1, '\n');

                    partBefore = this._sourceCode.substring(0, injectDeclarationIndex + 1);
                    let partBetween = this._sourceCode.substring(injectDeclarationIndex + 1, functionCallIndex);

                    this._sourceCode = partBefore + type + " " + retParamName + ";\n" + funcBody + "\n" + partBetween + retParamName + partAfter;

                    if (this.debug) {
                        console.log(`Replace function call by code. Function '${name}' (type=${type}). injectDeclarationIndex=${injectDeclarationIndex}`);
                    }
                } else {
                    // simple case where the return value of the function is "void"
                    this._sourceCode = partBefore + funcBody + partAfter;

                    startIndex += funcBody.length - (callParamsEndIndex + 1 - functionCallIndex);

                    if (this.debug) {
                        console.log(`Replace function call by code. Function '${name}' (type=${type}). functionCallIndex=${functionCallIndex}`);
                    }
                }

                doAgain = true;
            }
        }

        return doAgain;
    }

    private _findBackward(s: string, index: number, c: string): number {
        while (index >= 0 && s.charAt(index) !== c) {
            index--;
        }

        return index;
    }

    private _escapeRegExp(s: string): string {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private _replaceNames(code: string, sources: string[], destinations: string[]): string {

        for (let i = 0; i < sources.length; ++i) {
            const source = new RegExp(this._escapeRegExp(sources[i]), 'g'),
                  destination = destinations[i];

            code = code.replace(source, destination);
        }

        return code;
    }
}
