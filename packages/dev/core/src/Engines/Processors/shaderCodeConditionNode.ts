import { ShaderCodeNode } from "./shaderCodeNode";
import type { _IProcessingOptions } from "./shaderProcessingOptions";

/** @internal */
export class ShaderCodeConditionNode extends ShaderCodeNode {
    override process(preprocessors: { [key: string]: string }, options: _IProcessingOptions, preProcessorsFromCode: { [key: string]: string }) {
        for (let index = 0; index < this.children.length; index++) {
            const node = this.children[index];

            if (node.isValid(preprocessors)) {
                return node.process(preprocessors, options, preProcessorsFromCode);
            }
        }

        return "";
    }
}
