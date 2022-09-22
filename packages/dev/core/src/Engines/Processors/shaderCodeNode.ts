import type { ProcessingOptions } from "./shaderProcessingOptions";

/** @internal */
export class ShaderCodeNode {
    line: string;
    children: ShaderCodeNode[] = [];
    additionalDefineKey?: string;
    additionalDefineValue?: string;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isValid(preprocessors: { [key: string]: string }): boolean {
        return true;
    }

    process(preprocessors: { [key: string]: string }, options: ProcessingOptions): string {
        let result = "";
        if (this.line) {
            let value: string = this.line;
            const processor = options.processor;
            if (processor) {
                // This must be done before other replacements to avoid mistakenly changing something that was already changed.
                if (processor.lineProcessor) {
                    value = processor.lineProcessor(value, options.isFragment, options.processingContext);
                }

                if (processor.attributeProcessor && this.line.startsWith("attribute")) {
                    value = processor.attributeProcessor(this.line, preprocessors, options.processingContext);
                } else if (processor.varyingProcessor && this.line.startsWith("varying")) {
                    value = processor.varyingProcessor(this.line, options.isFragment, preprocessors, options.processingContext);
                } else if (processor.uniformProcessor && processor.uniformRegexp && processor.uniformRegexp.test(this.line)) {
                    if (!options.lookForClosingBracketForUniformBuffer) {
                        value = processor.uniformProcessor(this.line, options.isFragment, preprocessors, options.processingContext);
                    }
                } else if (processor.uniformBufferProcessor && processor.uniformBufferRegexp && processor.uniformBufferRegexp.test(this.line)) {
                    if (!options.lookForClosingBracketForUniformBuffer) {
                        value = processor.uniformBufferProcessor(this.line, options.isFragment, options.processingContext);
                        options.lookForClosingBracketForUniformBuffer = true;
                    }
                } else if (processor.textureProcessor && processor.textureRegexp && processor.textureRegexp.test(this.line)) {
                    value = processor.textureProcessor(this.line, options.isFragment, preprocessors, options.processingContext);
                } else if ((processor.uniformProcessor || processor.uniformBufferProcessor) && this.line.startsWith("uniform") && !options.lookForClosingBracketForUniformBuffer) {
                    const regex = /uniform\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/;

                    if (regex.test(this.line)) {
                        // uniform
                        if (processor.uniformProcessor) {
                            value = processor.uniformProcessor(this.line, options.isFragment, preprocessors, options.processingContext);
                        }
                    } else {
                        // Uniform buffer
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
