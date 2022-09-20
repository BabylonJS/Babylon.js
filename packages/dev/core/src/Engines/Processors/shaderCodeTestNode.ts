import { ShaderCodeNode } from "./shaderCodeNode";
import type { ShaderDefineExpression } from "./Expressions/shaderDefineExpression";

/** @internal */
export class ShaderCodeTestNode extends ShaderCodeNode {
    public testExpression: ShaderDefineExpression;

    public isValid(preprocessors: { [key: string]: string }) {
        return this.testExpression.isTrue(preprocessors);
    }
}
