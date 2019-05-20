
/** @hidden */
export class ShaderCodeNode {
    line: string;
    children: ShaderCodeNode[] = [];

    isValid(preprocessors: { [key: string]: string }): boolean {
        return true;
    }

    process(preprocessors: { [key: string]: string }): string {
        if (!this.isValid(preprocessors)) {
            return "";
        }

        let result = "";
        if (this.line) {
            result += this.line + "\r\n";
        }

        this.children.forEach(child => {
            result += child.process(preprocessors);
        });

        return result;
    }
}