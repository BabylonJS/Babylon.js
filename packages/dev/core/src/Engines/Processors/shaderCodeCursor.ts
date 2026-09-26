interface IShaderCodeScan {
    parenthesisDepth: number;
    inBlockComment: boolean;
    inLineComment: boolean;
}

/** @internal */
export class ShaderCodeCursor {
    private _lines: string[] = [];
    lineIndex: number;

    get currentLine(): string {
        return this._lines[this.lineIndex];
    }

    get canRead(): boolean {
        return this.lineIndex < this._lines.length - 1;
    }

    set lines(value: string[]) {
        this._lines.length = 0;
        let inBlockComment = false;

        for (const line of value) {
            // Skip empty lines
            if (!line || line === "\r") {
                continue;
            }

            // Block comments can span lines, so track them across every line
            const startsInBlockComment = inBlockComment;
            const lineScan: IShaderCodeScan = { parenthesisDepth: 0, inBlockComment: startsInBlockComment, inLineComment: false };
            ShaderCodeCursor._ScanCode(lineScan, line);
            inBlockComment = lineScan.inBlockComment;

            // Prevent removing line break in macros.
            if (line[0] === "#") {
                this._lines.push(line);
                continue;
            }

            // Do not split single line comments
            const trimmedLine = line.trim();

            if (!trimmedLine) {
                continue;
            }

            if (trimmedLine.startsWith("//")) {
                this._lines.push(line);
                continue;
            }

            // Work with semicolon in the line
            const semicolonIndex = trimmedLine.indexOf(";");

            if (semicolonIndex === -1) {
                // No semicolon in the line
                this._lines.push(trimmedLine);
            } else if (semicolonIndex === trimmedLine.length - 1) {
                // Single semicolon at the end of the line
                // If trimmedLine == ";", we must not push, to be backward compatible with the old code!
                if (trimmedLine.length > 1) {
                    this._lines.push(trimmedLine);
                }
            } else {
                // Semicolon in the middle of the line
                const split = line.split(";");
                // Parentheses are only counted in this line, so a kept semicolon always goes back right after the fragment it followed in the source.
                const scan = { parenthesisDepth: 0, inBlockComment: startsInBlockComment, inLineComment: false };

                for (let index = 0; index < split.length; index++) {
                    let subLine = split[index];
                    ShaderCodeCursor._ScanCode(scan, subLine);

                    subLine = subLine.trim();

                    if (!subLine) {
                        // An empty statement inside parentheses belongs to a for loop header, as in "for (;;)":
                        // keep its semicolon on the previous fragment of this line, or the header loses one.
                        if (scan.parenthesisDepth > 0 && !scan.inLineComment && index !== split.length - 1) {
                            this._lines[this._lines.length - 1] += ";";
                        }
                        continue;
                    }

                    this._lines.push(subLine + (index !== split.length - 1 ? ";" : ""));
                }
            }
        }
    }

    // Updates the parenthesis depth with a fragment of a line, skipping comments.
    private static _ScanCode(scan: IShaderCodeScan, code: string): void {
        for (let i = 0; i < code.length && !scan.inLineComment; i++) {
            const char = code[i];
            if (scan.inBlockComment) {
                if (char === "*" && code[i + 1] === "/") {
                    scan.inBlockComment = false;
                    i++;
                }
            } else if (char === "/" && code[i + 1] === "*") {
                scan.inBlockComment = true;
                i++;
            } else if (char === "/" && code[i + 1] === "/") {
                scan.inLineComment = true;
            } else if (char === "(") {
                scan.parenthesisDepth++;
            } else if (char === ")") {
                // A ")" closing a parenthesis opened on an earlier line ends that statement: start again from 0
                scan.parenthesisDepth = Math.max(0, scan.parenthesisDepth - 1);
            }
        }
    }
}
