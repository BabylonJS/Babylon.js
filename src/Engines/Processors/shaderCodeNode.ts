import { ProcessingOptions } from './shaderProcessingOptions';
import { StringTools } from '../../Misc/stringTools';

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
                if (processor.attributeProcessor && StringTools.StartsWith(this.line, "attribute")) {
                    value = processor.attributeProcessor(this.line);
                } else if (processor.varyingProcessor && StringTools.StartsWith(this.line, "varying")) {
                    value = processor.varyingProcessor(this.line, options.isFragment);
                } else if ((processor.uniformProcessor || processor.uniformBufferProcessor) && StringTools.StartsWith(this.line, "uniform")) {
                    let regex = /uniform (.+) (.+)/;

                    if (regex.test(this.line)) { // uniform
                        if (processor.uniformProcessor) {
                            value = processor.uniformProcessor(this.line, options.isFragment);
                        }
                    } else { // Uniform buffer
                        if (processor.uniformBufferProcessor) {
                            value = processor.uniformBufferProcessor(this.line, options.isFragment);
                            options.lookForClosingBracketForUniformBuffer = true;
                        }
                    }
                }

                if (processor.endOfUniformBufferProcessor) {
                    if (options.lookForClosingBracketForUniformBuffer && this.line.indexOf("}") !== -1) {
                        options.lookForClosingBracketForUniformBuffer = false;
                        value = processor.endOfUniformBufferProcessor(this.line, options.isFragment);
                    }
                }

                if (processor.lineProcessor) {
                    value = processor.lineProcessor(value, options.isFragment);
                }
            }

            result += value + "\r\n";
        }

        this.children.forEach((child) => {
            result += child.process(preprocessors, options);
        });

        if (this.additionalDefineKey) {
            preprocessors[this.additionalDefineKey] = this.additionalDefineValue || "true";
        }

        return result;
    }
}