import { IShaderProcessor } from './iShaderProcessor';

/** @hidden */
export class ShaderCodeNode {
    line: string;
    children: ShaderCodeNode[] = [];
    additionalDefineKey?: string;
    additionalDefineValue?: string;

    isValid(preprocessors: { [key: string]: string }): boolean {
        return true;
    }

    process(preprocessors: { [key: string]: string }, processor?: IShaderProcessor): string {
        let result = "";
        if (this.line) {
            let value: string = this.line;
            if (processor) {
                if (processor.attributeProcessor && this._lineStartsWith("attribute")) {
                    value = processor.attributeProcessor(this.line);
                }
            }

            result += value + "\r\n";
        }

        this.children.forEach(child => {
            result += child.process(preprocessors, processor);
        });

        if (this.additionalDefineKey) {
            preprocessors[this.additionalDefineKey] = this.additionalDefineValue || "true";
        }

        return result;
    }

    private _lineStartsWith(prefix: string) {
        return (this.line.indexOf(prefix) === 0);
    }
}