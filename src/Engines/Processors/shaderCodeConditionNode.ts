import { ShaderCodeNode } from './shaderCodeNode';

/** @hidden */
export class ShaderCodeConditionNode extends ShaderCodeNode {
    process(preprocessors: { [key: string]: string }) {
        for (var index = 0; index < this.children.length; index++) {
            let node = this.children[index];

            if (node.isValid(preprocessors)) {
                return node.process(preprocessors);
            }
        }

        return "";
    }
}