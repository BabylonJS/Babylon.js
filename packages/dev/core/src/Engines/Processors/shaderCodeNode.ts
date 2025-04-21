import type { ProcessingOptions } from "./shaderProcessingOptions";

const defaultAttributeKeywordName = "attribute";
const defaultVaryingKeywordName = "varying";

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

    process(preprocessors: { [key: string]: string }, options: ProcessingOptions, preProcessorsFromCode: { [key: string]: string }): string {
        let result = "";
        if (this.line) {
            let value: string = this.line;
            const processor = options.processor;
            if (processor) {
                // This must be done before other replacements to avoid mistakenly changing something that was already changed.
                if (processor.lineProcessor) {
                    value = processor.lineProcessor(value, options.isFragment, options.processingContext);
                }

                const attributeKeyword = options.processor?.attributeKeywordName ?? defaultAttributeKeywordName;
                const varyingKeyword =
                    options.isFragment && options.processor?.varyingFragmentKeywordName
                        ? options.processor?.varyingFragmentKeywordName
                        : !options.isFragment && options.processor?.varyingVertexKeywordName
                          ? options.processor?.varyingVertexKeywordName
                          : defaultVaryingKeywordName;

                if (!options.isFragment && processor.attributeProcessor && this.line.startsWith(attributeKeyword)) {
                    value = processor.attributeProcessor(this.line, preprocessors, options.processingContext);
                } else if (
                    processor.varyingProcessor &&
                    (processor.varyingCheck?.(this.line, options.isFragment) || (!processor.varyingCheck && this.line.startsWith(varyingKeyword)))
                ) {
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

            result += value + "\n";
        }

        for (const child of this.children) {
            result += child.process(preprocessors, options, preProcessorsFromCode);
        }

        if (this.additionalDefineKey) {
            preprocessors[this.additionalDefineKey] = this.additionalDefineValue || "true";
            preProcessorsFromCode[this.additionalDefineKey] = preprocessors[this.additionalDefineKey];
        }

        return result;
    }
}
