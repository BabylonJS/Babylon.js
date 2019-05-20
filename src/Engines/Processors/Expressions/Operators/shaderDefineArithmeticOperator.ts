import { ShaderDefineExpression } from '../shaderDefineExpression';

/** @hidden */
export class ShaderDefineArithmeticOperator extends ShaderDefineExpression {
    public constructor(public define: string, public operand: string, public testValue: string) {
        super();
    }

    public isTrue(preprocessors: { [key: string]: string }) {
        let value = preprocessors[this.define];

        if (value === undefined) {
            return false;
        }

        let condition = false;
        switch (this.operand) {
            case ">":
                condition = parseInt(this.testValue) > parseInt(value);
                break;
            case "<":
                condition = parseInt(this.testValue) < parseInt(value);
                break;
        }

        return condition;
    }
}