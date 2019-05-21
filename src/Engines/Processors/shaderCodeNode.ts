import { ProcessingOptions } from './shaderProcessingOptions';

/** @hidden */
export class ShaderCodeNode {
    line: string;
    children: ShaderCodeNode[] = [];
    additionalDefineKey?: string;
    additionalDefineValue?: string;

    isValid(preprocessors: { [key: string]: string }): boolean {
        return true;
    }

    process(preprocessors: { [key: string]: string }, options: ProcessingOptions): string {
        let result = "";
        if (this.line) {
            let value: string = this.line;
            let processor = options.processor;
            if (processor) {
                if (processor.attributeProcessor && this._lineStartsWith("attribute")) {
                    value = processor.attributeProcessor(this.line);
                } else if (processor.varyingProcessor && this._lineStartsWith("varying")) {
                    value = processor.varyingProcessor(this.line, options.isFragment);
                }
            }

            result += value + "\r\n";
        }

        this.children.forEach(child => {
            result += child.process(preprocessors, options);
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