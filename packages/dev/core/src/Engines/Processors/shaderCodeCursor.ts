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
        // header is split over several lines.
        let parenthesisDepth = 0;

        for (const line of value) {
            // Skip empty lines
            if (!line || line === "\r") {
                continue;
            }

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
                parenthesisDepth = ShaderCodeCursor._UpdateParenthesisDepth(parenthesisDepth, trimmedLine);
            } else if (semicolonIndex === trimmedLine.length - 1) {
                // Single semicolon at the end of the line
                // If trimmedLine == ";", we must not push, to be backward compatible with the old code!
                if (trimmedLine.length > 1) {
                    this._lines.push(trimmedLine);
                    parenthesisDepth = ShaderCodeCursor._UpdateParenthesisDepth(parenthesisDepth, trimmedLine);
                } else if (parenthesisDepth > 0 && this._lines.length > 0) {
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
                        parenthesisDepth = ShaderCodeCursor._UpdateParenthesisDepth(parenthesisDepth, subLine);
                        inComment = subLine.includes("//");
                    }

                    subLine = subLine.trim();

                    if (!subLine) {
                        // An empty statement inside parentheses belongs to a for loop header, as in "for (;;)":
                        // keep its semicolon on the previous line, or the header loses one.
                        if (parenthesisDepth > 0 && index !== split.length - 1 && this._lines.length > 0) {
                            this._lines[this._lines.length - 1] += ";";
                        }
                        continue;
                    }

                    this._lines.push(subLine + (index !== split.length - 1 ? ";" : ""));
                }
            }
        }
    }

    private static _UpdateParenthesisDepth(depth: number, code: string): number {
        const commentIndex = code.indexOf("//");
        if (commentIndex !== -1) {
            code = code.substring(0, commentIndex);
        }
        // A for loop header cannot contain a brace, so a brace ends any header and bounds a miscount
        // (for example a parenthesis in a block comment) to the current block.
        const braceIndex = Math.max(code.lastIndexOf("{"), code.lastIndexOf("}"));
        if (braceIndex !== -1) {
            depth = 0;
            code = code.substring(braceIndex + 1);
        }
        return Math.max(0, depth + code.split("(").length - code.split(")").length);
    }
}
