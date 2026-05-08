import { ShaderDefineExpression } from "../shaderDefineExpression";

/** @internal */
export class ShaderDefineAndOperator extends ShaderDefineExpression {
    public leftOperand: ShaderDefineExpression;
    public rightOperand: ShaderDefineExpression;

    public override isTrue(preprocessors: { [key: string]: string }): boolean {
        return this.leftOperand.isTrue(preprocessors) && this.rightOperand.isTrue(preprocessors);
    }
}
