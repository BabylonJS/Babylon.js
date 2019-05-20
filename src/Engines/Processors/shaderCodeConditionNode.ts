import { ShaderCodeNode } from './shaderCodeNode';

/** @hidden */
export class ShaderCodeConditionNode extends ShaderCodeNode {
    if: ShaderCodeNode;
    else: ShaderCodeNode;

    process(preprocessors: { [key: string]: string }) {
        if (this.if.isValid(preprocessors)) {
            return this.if.process(preprocessors);
        }

        return this.else.process(preprocessors);
    }
}