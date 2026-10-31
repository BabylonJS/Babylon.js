import { Logger } from "core/Misc/logger";
import { EscapeRegExp, ExtractBetweenMarkers, FindBackward, IsIdentifierChar, RemoveComments, SkipWhitespaces } from "../../Misc/codeStringParsingTools";

interface IInlineFunctionDescr {
    name: string;
    type: string;
    parameters: string[];
    /** Declarations (type with precision qualifiers) of the by-value parameters the body writes to (indexed like parameters), which must be copied at each call site */
    copiedParameterTypes: (string | null)[];
    body: string;
    callIndex: number;
}

const PrecisionQualifiers = new Set(["highp", "mediump", "lowp", "precise"]);
const OpaqueTypeRegexp = /^(?:[iu]?(?:sampler|image|texture)(?:[123]D|Cube|2DRect|Buffer|ExternalOES)(?:MS)?(?:Array)?(?:Shadow)?|sampler(?:Shadow)?|atomic_uint)$/;
const BuiltinsWithOutputParameters = ["modf", "frexp", "uaddCarry", "usubBorrow", "umulExtended", "imulExtended"];
const FunctionHeaderRegexp = /(\w+)\s*\(([^()]*)\)\s*[{;]/g;
const AssignmentOperatorRegexp = /^(?:(?:[-+*/%&|^]|<<|>>)?=(?!=)|\+\+|--)/;

/**
 * Collects the names of the functions that have out or inout parameters, including the built-in ones
 * @param code code without comments
 * @returns the function names
 */
function FindFunctionsWithOutputParameters(code: string): Set<string> {
    const names = new Set(BuiltinsWithOutputParameters);
    FunctionHeaderRegexp.lastIndex = 0;
    let match;
    while ((match = FunctionHeaderRegexp.exec(code)) !== null) {
        if (/\b(?:out|inout)\b/.test(match[2])) {
            names.add(match[1]);
        }
    }
    return names;
}

function SkipWhitespacesBackward(s: string, index: number): number {
    while (index >= 0 && SkipWhitespaces(s, index) !== index) {
        index--;
    }
    return index;
}

/**
 * Checks whether the identifier at the given position is a member or swizzle name (preceded by ".", possibly with whitespaces and comments in between)
 * @param s code to parse (may contain comments)
 * @param index start position of the identifier
 * @returns true if the identifier follows a "."
 */
function IsMemberName(s: string, index: number): boolean {
    let i = SkipWhitespacesBackward(s, index - 1);
    while (i >= 0) {
        if (s.charAt(i) === "/" && s.charAt(i - 1) === "*") {
            const commentStart = s.lastIndexOf("/*", i - 2);
            if (commentStart < 0) {
                return false;
            }
            i = SkipWhitespacesBackward(s, commentStart - 1);
            continue;
        }
        const lineComment = s.indexOf("//", s.lastIndexOf("\n", i) + 1);
        if (lineComment >= 0 && lineComment < i) {
            i = SkipWhitespacesBackward(s, lineComment - 1);
            continue;
        }
        return s.charAt(i) === ".";
    }
    return false;
}

/**
 * Skips member accesses and (possibly nested) subscripts, e.g. ".xy" or "[indices[0]]"
 * @param s code to parse
 * @param index index just after a variable name
 * @returns the index of the first character after the accesses that is not a whitespace
 */
function SkipAccessors(s: string, index: number): number {
    index = SkipWhitespaces(s, index);
    for (;;) {
        if (s.charAt(index) === ".") {
            index = SkipWhitespaces(s, index + 1);
            while (index < s.length && IsIdentifierChar(s.charAt(index))) {
                index++;
            }
        } else if (s.charAt(index) === "[") {
            const closeIndex = ExtractBetweenMarkers("[", "]", s, index);
            if (closeIndex < 0) {
                return index;
            }
            index = closeIndex + 1;
        } else {
            return index;
        }
        index = SkipWhitespaces(s, index);
    }
}

/**
 * Finds the name of the function whose argument list contains the given position
 * @param s code to parse
 * @param index position of a "(" or "," in the argument list
 * @returns the function name, or null if the position is not inside a function call
 */
function FindEnclosingCallee(s: string, index: number): string | null {
    let depth = 0;
    for (let i = index; i >= 0; --i) {
        const c = s.charAt(i);
        if (c === ")" || c === "]") {
            depth++;
        } else if (c === "(" || c === "[") {
            if (depth === 0) {
                if (c === "[") {
                    return null;
                }
                const nameEnd = SkipWhitespacesBackward(s, i - 1) + 1;
                let nameStart = nameEnd;
                while (nameStart > 0 && IsIdentifierChar(s.charAt(nameStart - 1))) {
                    nameStart--;
                }
                return nameStart < nameEnd ? s.substring(nameStart, nameEnd) : null;
            }
            depth--;
        } else if (depth === 0 && (c === ";" || c === "{" || c === "}")) {
            return null;
        }
    }
    return null;
}

/**
 * Checks whether a function body may write to a variable: assignments ("name = ...", "name.x += ...", "name[i[0]]++", "--name")
 * and arguments of functions with out or inout parameters
 * @param body code of the function body, without comments
 * @param name name of the variable
 * @param functionsWithOutputParameters names of the functions that have out or inout parameters
 * @returns true if the variable may be written in the body
 */
function IsWrittenInBody(body: string, name: string, functionsWithOutputParameters: Set<string>): boolean {
    for (let index = body.indexOf(name); index >= 0; index = body.indexOf(name, index + name.length)) {
        const end = index + name.length;
        if ((index > 0 && IsIdentifierChar(body.charAt(index - 1))) || (end < body.length && IsIdentifierChar(body.charAt(end)))) {
            continue;
        }
        const previousIndex = SkipWhitespacesBackward(body, index - 1);
        const previous = body.charAt(previousIndex);
        if (previous === ".") {
            continue;
        }
        const previousTwo = body.substring(previousIndex - 1, previousIndex + 1);
        if (previousTwo === "++" || previousTwo === "--") {
            return true;
        }
        const nextIndex = SkipAccessors(body, end);
        if (AssignmentOperatorRegexp.test(body.substring(nextIndex, nextIndex + 3))) {
            return true;
        }
        const next = body.charAt(nextIndex);
        if ((previous === "(" || previous === ",") && (next === "," || next === ")")) {
            const callee = FindEnclosingCallee(body, previousIndex);
            if (callee !== null && functionsWithOutputParameters.has(callee)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Class used to inline functions in shader code
 */
export class ShaderCodeInliner {
    private static readonly _RegexpFindFunctionNameAndType = /((\s+?)(\w+)\s+(\w+)\s*?)$/;

    private _sourceCode: string;
    private _functionDescr: IInlineFunctionDescr[];
    private _numMaxIterations: number;
    private _copyIndex = 0;

    /** Gets or sets the token used to mark the functions to inline */
    public inlineToken: string;

    /** Gets or sets the debug mode */
    public debug: boolean = false;

    /** Gets the code after the inlining process */
    public get code(): string {
        return this._sourceCode;
    }

    /**
     * Initializes the inliner
     * @param sourceCode shader code source to inline
     * @param numMaxIterations maximum number of iterations (used to detect recursive calls)
     */
    constructor(sourceCode: string, numMaxIterations = 20) {
        this._sourceCode = sourceCode;
        this._numMaxIterations = numMaxIterations;
        this._functionDescr = [];
        this.inlineToken = "#define inline";
    }

    /**
     * Start the processing of the shader code
     */
    public processCode() {
        if (this.debug) {
            Logger.Log(`Start inlining process (code size=${this._sourceCode.length})...`);
        }
        this._collectFunctions();
        this._processInlining(this._numMaxIterations);
        if (this.debug) {
            Logger.Log("End of inlining process.");
        }
    }

    private _collectFunctions() {
        let startIndex = 0;
        const functionsWithOutputParameters = FindFunctionsWithOutputParameters(RemoveComments(this._sourceCode));

        while (startIndex < this._sourceCode.length) {
            // locate the function to inline and extract its name
            const inlineTokenIndex = this._sourceCode.indexOf(this.inlineToken, startIndex);
            if (inlineTokenIndex < 0) {
                break;
            }

            const funcParamsStartIndex = this._sourceCode.indexOf("(", inlineTokenIndex + this.inlineToken.length);
            if (funcParamsStartIndex < 0) {
                if (this.debug) {
                    Logger.Warn(`Could not find the opening parenthesis after the token. startIndex=${startIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }

            const funcNameMatch = ShaderCodeInliner._RegexpFindFunctionNameAndType.exec(
                this._sourceCode.substring(inlineTokenIndex + this.inlineToken.length, funcParamsStartIndex)
            );
            if (!funcNameMatch) {
                if (this.debug) {
                    Logger.Warn(
                        `Could not extract the name/type of the function from: ${this._sourceCode.substring(inlineTokenIndex + this.inlineToken.length, funcParamsStartIndex)}`
                    );
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }
            const [funcType, funcName] = [funcNameMatch[3], funcNameMatch[4]];

            // extract the parameters of the function as a whole string (without the leading / trailing parenthesis)
            const funcParamsEndIndex = ExtractBetweenMarkers("(", ")", this._sourceCode, funcParamsStartIndex);
            if (funcParamsEndIndex < 0) {
                if (this.debug) {
                    Logger.Warn(`Could not extract the parameters the function '${funcName}' (type=${funcType}). funcParamsStartIndex=${funcParamsStartIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }
            const funcParams = this._sourceCode.substring(funcParamsStartIndex + 1, funcParamsEndIndex);

            // extract the body of the function (with the curly brackets)
            const funcBodyStartIndex = SkipWhitespaces(this._sourceCode, funcParamsEndIndex + 1);
            if (funcBodyStartIndex === this._sourceCode.length) {
                if (this.debug) {
                    Logger.Warn(`Could not extract the body of the function '${funcName}' (type=${funcType}). funcParamsEndIndex=${funcParamsEndIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }

            const funcBodyEndIndex = ExtractBetweenMarkers("{", "}", this._sourceCode, funcBodyStartIndex);
            if (funcBodyEndIndex < 0) {
                if (this.debug) {
                    Logger.Warn(`Could not extract the body of the function '${funcName}' (type=${funcType}). funcBodyStartIndex=${funcBodyStartIndex}`);
                }
                startIndex = inlineTokenIndex + this.inlineToken.length;
                continue;
            }
            const funcBody = this._sourceCode.substring(funcBodyStartIndex, funcBodyEndIndex + 1);

            // process the parameters: extract each names
            const params = RemoveComments(funcParams).split(",");
            const paramNames = [];
            const copiedParameterTypes: (string | null)[] = [];
            const analyzedBody = RemoveComments(funcBody);

            for (let p = 0; p < params.length; ++p) {
                const param = params[p].trim();
                const idx = param.lastIndexOf(" ");

                if (idx >= 0) {
                    const paramName = param.substring(idx + 1);
                    paramNames.push(paramName);

                    // Inlining substitutes the call argument for the parameter name, so a by-value parameter the body
                    // writes to would modify the caller's variable. Such parameters get a local copy instead.
                    const tokens = param.substring(0, idx).trim().split(/\s+/);
                    const isByValue = !tokens.includes("out") && !tokens.includes("inout") && !tokens.includes("const");
                    const declarationTokens = tokens.filter((token) => token !== "in");
                    const typeTokens = declarationTokens.filter((token) => !PrecisionQualifiers.has(token));
                    const needsCopy =
                        isByValue &&
                        typeTokens.length === 1 &&
                        !OpaqueTypeRegexp.test(typeTokens[0]) &&
                        !paramName.includes("[") &&
                        IsWrittenInBody(analyzedBody, paramName, functionsWithOutputParameters);
                    copiedParameterTypes.push(needsCopy ? declarationTokens.join(" ") : null);
                }
            }

            if (funcType !== "void") {
                // for functions that return a value, we will replace "return" by "tempvarname = ", tempvarname being a unique generated name
                paramNames.push("return");
            }

            // collect the function
            this._functionDescr.push({
                name: funcName,
                type: funcType,
                parameters: paramNames,
                copiedParameterTypes,
                body: funcBody,
                callIndex: 0,
            });

            startIndex = funcBodyEndIndex + 1;

            // remove the function from the source code
            const partBefore = inlineTokenIndex > 0 ? this._sourceCode.substring(0, inlineTokenIndex) : "";
            const partAfter = funcBodyEndIndex + 1 < this._sourceCode.length - 1 ? this._sourceCode.substring(funcBodyEndIndex + 1) : "";

            this._sourceCode = partBefore + partAfter;

            startIndex -= funcBodyEndIndex + 1 - inlineTokenIndex;
        }

        if (this.debug) {
            Logger.Log(`Collect functions: ${this._functionDescr.length} functions found. functionDescr=${this._functionDescr}`);
        }
    }

    private _processInlining(numMaxIterations: number = 20): boolean {
        while (numMaxIterations-- >= 0) {
            if (!this._replaceFunctionCallsByCode()) {
                break;
            }
        }

        if (this.debug) {
            Logger.Log(`numMaxIterations is ${numMaxIterations} after inlining process`);
        }

        return numMaxIterations >= 0;
    }

    private _replaceFunctionCallsByCode(): boolean {
        let doAgain = false;

        for (const func of this._functionDescr) {
            const { name, type, parameters, copiedParameterTypes, body } = func;

            let startIndex = 0;

            while (startIndex < this._sourceCode.length) {
                // Look for the function name in the source code
                const functionCallIndex = this._sourceCode.indexOf(name, startIndex);

                if (functionCallIndex < 0) {
                    break;
                }

                // Make sure "name" is not part of a bigger string
                if (functionCallIndex === 0 || IsIdentifierChar(this._sourceCode.charAt(functionCallIndex - 1))) {
                    startIndex = functionCallIndex + name.length;
                    continue;
                }

                // Find the opening parenthesis
                const callParamsStartIndex = SkipWhitespaces(this._sourceCode, functionCallIndex + name.length);
                if (callParamsStartIndex === this._sourceCode.length || this._sourceCode.charAt(callParamsStartIndex) !== "(") {
                    startIndex = functionCallIndex + name.length;
                    continue;
                }

                // extract the parameters of the function call as a whole string (without the leading / trailing parenthesis)
                const callParamsEndIndex = ExtractBetweenMarkers("(", ")", this._sourceCode, callParamsStartIndex);
                if (callParamsEndIndex < 0) {
                    if (this.debug) {
                        Logger.Warn(`Could not extract the parameters of the function call. Function '${name}' (type=${type}). callParamsStartIndex=${callParamsStartIndex}`);
                    }
                    startIndex = functionCallIndex + name.length;
                    continue;
                }
                const callParams = this._sourceCode.substring(callParamsStartIndex + 1, callParamsEndIndex);

                // process the parameter call: extract each names

                // this function split the parameter list used in the function call at ',' boundaries by taking care of potential parenthesis like in:
                //      myfunc(a, vec2(1., 0.), 4.)
                const splitParameterCall = (s: string) => {
                    const parameters = [];
                    let curIdx = 0,
                        startParamIdx = 0;
                    while (curIdx < s.length) {
                        if (s.charAt(curIdx) === "(") {
                            const idx2 = ExtractBetweenMarkers("(", ")", s, curIdx);
                            if (idx2 < 0) {
                                return null;
                            }
                            curIdx = idx2;
                        } else if (s.charAt(curIdx) === ",") {
                            parameters.push(s.substring(startParamIdx, curIdx));
                            startParamIdx = curIdx + 1;
                        }
                        curIdx++;
                    }
                    if (startParamIdx < curIdx) {
                        parameters.push(s.substring(startParamIdx, curIdx));
                    }
                    return parameters;
                };

                const params = splitParameterCall(RemoveComments(callParams));

                if (params === null) {
                    if (this.debug) {
                        Logger.Warn(
                            `Invalid function call: can't extract the parameters of the function call. Function '${name}' (type=${type}). callParamsStartIndex=${callParamsStartIndex}, callParams=` +
                                callParams
                        );
                    }
                    startIndex = functionCallIndex + name.length;
                    continue;
                }

                const paramNames = [];

                for (let p = 0; p < params.length; ++p) {
                    const param = params[p].trim();
                    paramNames.push(param);
                }

                let retParamName: string | null = null;
                if (type !== "void") {
                    do {
                        retParamName = name + "_" + func.callIndex++;
                    } while (this._isIdentifierUsed(retParamName));
                }

                if (retParamName) {
                    paramNames.push(retParamName + " =");
                }

                if (paramNames.length !== parameters.length) {
                    if (this.debug) {
                        Logger.Warn(
                            `Invalid function call: not the same number of parameters for the call than the number expected by the function. Function '${name}' (type=${type}). function parameters=${parameters}, call parameters=${paramNames}`
                        );
                    }
                    startIndex = functionCallIndex + name.length;
                    continue;
                }

                startIndex = callParamsEndIndex + 1;

                const copies: string[] = [];
                for (let p = 0; p < copiedParameterTypes.length; ++p) {
                    const copiedType = copiedParameterTypes[p];
                    if (copiedType) {
                        // The "_c" suffix keeps copies distinct from return temporaries, which end with "_<number>"
                        let localName: string;
                        do {
                            localName = `${name}_${parameters[p]}_c${this._copyIndex++}`;
                        } while (this._isIdentifierUsed(localName));
                        copies.push(`${copiedType} ${localName} = ${paramNames[p]};`);
                        paramNames[p] = localName;
                    }
                }

                // replace the function call by the body function
                let funcBody = this._replaceNames(body, parameters, paramNames);
                if (copies.length > 0) {
                    funcBody = "{\n" + copies.join("\n") + "\n" + funcBody + "\n}";
                }

                let partBefore = functionCallIndex > 0 ? this._sourceCode.substring(0, functionCallIndex) : "";
                const partAfter = callParamsEndIndex + 1 < this._sourceCode.length - 1 ? this._sourceCode.substring(callParamsEndIndex + 1) : "";

                if (retParamName) {
                    // case where the function returns a value. We generate:
                    // FUNCTYPE retParamName;
                    // {function body}
                    // and replace the function call by retParamName
                    const injectDeclarationIndex = FindBackward(this._sourceCode, functionCallIndex - 1, "\n", "{");

                    partBefore = this._sourceCode.substring(0, injectDeclarationIndex + 1);
                    const partBetween = this._sourceCode.substring(injectDeclarationIndex + 1, functionCallIndex);

                    this._sourceCode = partBefore + type + " " + retParamName + ";\n" + funcBody + "\n" + partBetween + retParamName + partAfter;

                    if (this.debug) {
                        Logger.Log(
                            `Replace function call by code. Function '${name}' (type=${type}). injectDeclarationIndex=${injectDeclarationIndex}, call parameters=${paramNames}`
                        );
                    }
                } else {
                    // simple case where the return value of the function is "void"
                    this._sourceCode = partBefore + funcBody + partAfter;

                    startIndex += funcBody.length - (callParamsEndIndex + 1 - functionCallIndex);

                    if (this.debug) {
                        Logger.Log(`Replace function call by code. Function '${name}' (type=${type}). functionCallIndex=${functionCallIndex}, call parameters=${paramNames}`);
                    }
                }

                doAgain = true;
            }
        }

        return doAgain;
    }

    private _isIdentifierUsed(identifier: string): boolean {
        const regexp = new RegExp(`(?<!\\w)${identifier}(?!\\w)`);
        return regexp.test(this._sourceCode) || this._functionDescr.some((func) => regexp.test(func.body));
    }

    private _replaceNames(code: string, sources: string[], destinations: string[]): string {
        for (let i = 0; i < sources.length; ++i) {
            const source = new RegExp(EscapeRegExp(sources[i]), "g"),
                sourceLen = sources[i].length,
                destination = destinations[i];

            code = code.replace(source, (match, ...args) => {
                const offset: number = args[0];
                // Make sure "source" is not part of a bigger identifier (for eg, if source=view and we matched it with viewDirection)
                if (IsIdentifierChar(code.charAt(offset - 1)) || IsIdentifierChar(code.charAt(offset + sourceLen)) || IsMemberName(code, offset)) {
                    return sources[i];
                }
                return destination;
            });
        }

        return code;
    }
}
