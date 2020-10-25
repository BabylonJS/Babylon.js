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
                // This must be done before other replacements to avoid mistakenly changing something that was already changed.
                if (processor.lineProcessor) {
                    value = processor.lineProcessor(value, options.isFragment, options.processingContext);
                }

                if (processor.attributeProcessor && StringTools.StartsWith(this.line, "attribute")) {
                    value = processor.attributeProcessor(this.line, preprocessors, options.processingContext);
                } else if (processor.varyingProcessor && StringTools.StartsWith(this.line, "varying")) {
                    value = processor.varyingProcessor(this.line, options.isFragment, preprocessors, options.processingContext);
                } else if ((processor.uniformProcessor || processor.uniformBufferProcessor) && StringTools.StartsWith(this.line, "uniform") && !options.lookForClosingBracketForUniformBuffer) {
                    let regex = /uniform\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/;

                    if (regex.test(this.line)) { // uniform
                        if (processor.uniformProcessor) {
                            value = processor.uniformProcessor(this.line, options.isFragment, preprocessors, options.processingContext);
                        }
                    } else { // Uniform buffer
                        if (processor.uniformBufferProcessor) {
                            value = processor.uniformBufferProcessor(this.line, options.isFragment, options.processingContext);
                            options.lookForClosingBracketForUniformBuffer = true;
                        }
                    }
                }

                if (options.lookForClosingBracketForUniformBuffer && this.line.indexOf("}") !== -1) {
                    options.lookForClosingBracketForUniformBuffer = false;
                    if (processor.endOfUniformBufferProcessor) {
                        value = processor.endOfUniformBufferProcessor(this.line, options.isFragment, options.processingContext);
                    }
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