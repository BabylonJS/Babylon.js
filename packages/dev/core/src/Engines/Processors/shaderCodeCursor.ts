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
            } else if (semicolonIndex === trimmedLine.length - 1) {
                // Single semicolon at the end of the line
                // If trimmedLine == ";", we must not push, to be backward compatible with the old code!
                if (trimmedLine.length > 1) {
                    this._lines.push(trimmedLine);
                }
            } else {
                // Semicolon in the middle of the line
                const lineCommentIndex = line.indexOf("//");
                const codePart = lineCommentIndex === -1 ? line : line.substring(0, lineCommentIndex);
                const lineCommentPart = lineCommentIndex === -1 ? "" : line.substring(lineCommentIndex);
                const firstLineIndex = this._lines.length;
                const split = codePart.split(";");

                for (let index = 0; index < split.length; index++) {
                    const subLine = split[index].trim();

                    if (subLine) {
                        this._lines.push(subLine + (index !== split.length - 1 ? ";" : ""));
                    } else if (index !== split.length - 1) {
                        // Preserve intermediate empty statements because their semicolon can be syntactically significant, as in `for (;;)`.
                        this._lines.push(";");
                    }
                }

                if (lineCommentPart !== "") {
                    if (this._lines.length > firstLineIndex) {
                        this._lines[this._lines.length - 1] += " " + lineCommentPart;
                    } else {
                        this._lines.push(lineCommentPart);
                    }
                }
            }
        }
    }
}
