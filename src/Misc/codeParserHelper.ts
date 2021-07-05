import { Nullable } from "../types";

/**
 * Helper class used to parse code
*/
export abstract class CodeParserHelper {

    protected _sourceCode: string;

    /** Gets or sets the debug mode */
    public debug: boolean = false;

    /** Gets the current code */
    public get code(): string {
        return this._sourceCode;
    }

    /**
     * Initializes the parser
     * @param sourceCode source code
     */
    constructor(sourceCode: string) {
        this._sourceCode = sourceCode;
    }

    /**
     * Starts the processing of the code
     */
    public processCode() {
        if (this.debug) {
            console.log(`Start code processing (code size=${this._sourceCode.length})...`);
        }
        this._internalProcess();
        if (this.debug) {
            console.log("End of code processing");
        }
    }

    protected abstract _internalProcess(): void;

    /**
     * Extracts some code between two markers. Note that you should call this method with the markerOpen in the first position of "block" and a corresponding markerClose somewhere in the block (not necessarily at the end)!
     * For eg, you can call it with "(a+3*(4-c))+23" with markerOpen="(" and markerClose=")". It will return "a+3*(4-c)"
     * @param markerOpen open marker
     * @param markerClose close marker
     * @param block block of code to parse
     * @param startIndex starting index in "block"
     * @returns the extracted code
     */
    public static ExtractBetweenMarkers(markerOpen: string, markerClose: string, block: string, startIndex: number): number {
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

    /**
     * Skips all whitespaces in a string and return the index of the first non-whitespace character
     * @param s string to parse
     * @param index starting index in "s"
     * @returns the index of the first non-whitespace character in s. If not found, returns s.length
     */
    public static SkipWhitespaces(s: string, index: number): number {
        while (index < s.length) {
            const c = s[index];
            if (c !== ' ' && c !== '\n' && c !== '\r' && c !== '\t' && c !== '\u000a' && c !== '\u00a0') {
                break;
            }
            index++;
        }

        return index;
    }

    /**
     * Checks if a string can be an identifier name (meaning, it contains only 0-9, A-Z, a-z and _ characters)
     * @param c string to check
     * @returns true if the string can be an identifier name, else false
     */
    public static IsIdentifierChar(c: string): boolean {
        const v = c.charCodeAt(0);
        return (v >= 48 && v <= 57) || // 0-9
            (v >= 65 && v <= 90) || // A-Z
            (v >= 97 && v <= 122) || // a-z
            (v == 95); // _
    }

    /**
     * Removes the comments from a block of code. The comments are either \/* ... *\/ or \/\/ ...
     * @param block code to parse
     * @returns the code without the comments
     */
    public static RemoveComments(block: string): string {
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

    /**
     * Splits a list of parameters separated by a comma.
     * This function can split the parameter list used in a function call at ',' boundaries by taking care of potential parenthesis like in:
     *      myfunc(a, vec2(1., 0.), 4.)
     * The extracted parameters will be ["a", "vec2(1., 0.)", "4."]
     * @param s the string to parse
     * @returns An array with the extracted parameters
     */
    public static SplitParameters(s: string): Nullable<string[]> {
        const parameters = [];
        let curIdx = 0, startParamIdx = 0;

        while (curIdx < s.length) {
            if (s.charAt(curIdx) === '(') {
                const idx2 = this.ExtractBetweenMarkers('(', ')', s, curIdx);
                if (idx2 < 0) {
                    return null;
                }
                curIdx = idx2;
            } else if (s.charAt(curIdx) === ',') {
                parameters.push(s.substring(startParamIdx, curIdx));
                startParamIdx = curIdx + 1;
            }
            curIdx++;
        }

        if (startParamIdx < curIdx) {
            parameters.push(s.substring(startParamIdx, curIdx));
        }

        return parameters;
    }

    /**
     * Scans a string backward until a specific character is found
     * @param s string to scan
     * @param index starting index in "s" to look for the character
     * @param c character to look for
     * @returns the index in "s" where "c" has been found. Returns -1 if the character could not be found
     */
    public static FindBackward(s: string, index: number, c: string): number {
        while (index >= 0 && s.charAt(index) !== c) {
            index--;
        }

        return index;
    }

    /**
     * Escapes a string so that it can be used as a regular expression
     * @param s string to escape
     * @returns escaped string
     */
    public static EscapeRegExp(s: string): string {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

}
