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

        // Open parentheses are carried across lines, so an empty clause keeps its semicolon even when a for loop
        // header is split over several lines. Block comments are tracked across lines too, so their content is not counted.
        const scan = { parenthesisDepth: 0, inBlockComment: false };

        for (const line of value) {
            // Skip empty lines
            if (!line || line === "\r") {
                continue;
            }

            // Prevent removing line break in macros.
            if (line[0] === "#") {
                this._lines.push(line);
                // A "#" inside a block comment is comment text, so keep the comment state in sync, and code after the
                // comment closes counts as usual. A directive's own parentheses are not part of a for loop header, so
                // on a line that starts outside a comment the depth is left as it was.
                const isDirective = !scan.inBlockComment;
                const parenthesisDepth = scan.parenthesisDepth;
                ShaderCodeCursor._ScanCode(scan, line);
                if (isDirective) {
                    scan.parenthesisDepth = parenthesisDepth;
                }
                continue;
            }

            // Do not split single line comments
            const trimmedLine = line.trim();

            if (!trimmedLine) {
                continue;
            }

            if (trimmedLine.startsWith("//")) {
                this._lines.push(line);
                ShaderCodeCursor._ScanCode(scan, trimmedLine);
                continue;
            }

            // Work with semicolon in the line
            const semicolonIndex = trimmedLine.indexOf(";");

            if (semicolonIndex === -1) {
                // No semicolon in the line
                this._lines.push(trimmedLine);
                ShaderCodeCursor._ScanCode(scan, trimmedLine);
            } else if (semicolonIndex === trimmedLine.length - 1) {
                // Single semicolon at the end of the line
                // If trimmedLine == ";", we must not push, to be backward compatible with the old code!
                if (trimmedLine.length > 1) {
                    this._lines.push(trimmedLine);
                    ShaderCodeCursor._ScanCode(scan, trimmedLine);
                } else if (scan.parenthesisDepth > 0 && this._lines.length > 0) {
                    // Except inside a for loop header, where it is an empty clause
                    this._lines[this._lines.length - 1] += ";";
                }
            } else {
                // Semicolon in the middle of the line
                const split = line.split(";");
                let inComment = false;

                for (let index = 0; index < split.length; index++) {
                    let subLine = split[index];
                    if (!inComment) {
                        inComment = ShaderCodeCursor._ScanCode(scan, subLine);
                    }

                    subLine = subLine.trim();

                    if (!subLine) {
                        // An empty statement inside parentheses belongs to a for loop header, as in "for (;;)":
                        // keep its semicolon on the previous line, or the header loses one.
                        if (scan.parenthesisDepth > 0 && index !== split.length - 1 && this._lines.length > 0) {
                            this._lines[this._lines.length - 1] += ";";
                        }
                        continue;
                    }

                    this._lines.push(subLine + (index !== split.length - 1 ? ";" : ""));
                }
            }
        }
    }

    // Updates the parenthesis depth with the code of a line, skipping comments. Returns true if the code ends in a line comment.
    private static _ScanCode(scan: { parenthesisDepth: number; inBlockComment: boolean }, code: string): boolean {
        let depth = scan.parenthesisDepth;
        let lineComment = false;
        for (let i = 0; i < code.length; i++) {
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
                lineComment = true;
                break;
            } else if (char === "{" || char === "}") {
                // A for loop header cannot contain a brace, so a brace ends any header and bounds a miscount to the current block.
                depth = 0;
            } else if (char === "(") {
                depth++;
            } else if (char === ")") {
                depth--;
            }
        }
        scan.parenthesisDepth = Math.max(0, depth);
        return lineComment;
    }
}
