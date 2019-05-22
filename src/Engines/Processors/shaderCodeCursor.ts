/** @hidden */
export class ShaderCodeCursor {
    lines: string[];
    lineIndex: number;

    get currentLine(): string {
        return this.lines[this.lineIndex].trim();
    }

    get canRead(): boolean {
        return this.lineIndex < this.lines.length - 1;
    }
}