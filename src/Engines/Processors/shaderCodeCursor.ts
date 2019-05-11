import { ShaderCodeNode } from './shaderCodeNode';

/** @hidden */
export class ShaderCodeCursor {
    lines: string[];
    lineIndex: number;
    currentNode?: ShaderCodeNode;
    parentNode?: ShaderCodeNode;

    get currentLine(): string {
        return this.lines[this.lineIndex].trim();
    }

    get eof(): boolean {
        return this.lineIndex >= this.lines.length;
    }
}