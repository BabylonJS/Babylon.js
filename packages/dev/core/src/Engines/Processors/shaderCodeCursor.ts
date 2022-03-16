/** @hidden */
export class ShaderCodeCursor {
    private _lines: string[];
    lineIndex: number;

    get currentLine(): string {
        return this._lines[this.lineIndex];
    }

    get canRead(): boolean {
        return this.lineIndex < this._lines.length - 1;
    }

    set lines(value: string[]) {
        this._lines = [];

        for (var line of value) {
            // Prevent removing line break in macros.
            if (line[0] === "#") {
                this._lines.push(line);
                continue;
            }

            const split = line.split(";");

            for (var index = 0; index < split.length; index++) {
                let subLine = split[index];
                subLine = subLine.trim();

                if (!subLine) {
                    continue;
                }

                this._lines.push(subLine + (index !== split.length - 1 ? ";" : ""));
            }
        }
    }
}