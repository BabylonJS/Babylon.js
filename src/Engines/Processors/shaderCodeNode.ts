
/** @hidden */
export class ShaderCodeNode {
    line: string;
    children: ShaderCodeNode[] = [];

    isValid(preprocessors: { [key: string]: string }): boolean {
        return true;
    }

    process(preprocessors: { [key: string]: string }): string {
        let result = "";
        if (this.isValid(preprocessors)) {
            result += this.line + "\r\n";
        }

        this.children.forEach(child => {
            result += child.process(preprocessors);
        });

        return result;
    }
}