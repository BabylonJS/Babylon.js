import { ShaderDefineExpression } from "../shaderDefineExpression";

/** @internal */
export class ShaderDefineArithmeticOperator extends ShaderDefineExpression {
    public constructor(public define: string, public operand: string, public testValue: string) {
        super();
    }

    public isTrue(preprocessors: { [key: string]: string }) {
        let value = preprocessors[this.define];

        if (value === undefined) {
            value = this.define;
        }

        let condition = false;
        const left = parseInt(value);
        const right = parseInt(this.testValue);

        switch (this.operand) {
            case ">":
                condition = left > right;
                break;
            case "<":
                condition = left < right;
                break;
            case "<=":
                condition = left <= right;
                break;
            case ">=":
                condition = left >= right;
                break;
            case "==":
                condition = left === right;
                break;
        }

        return condition;
    }
}
