import { ShaderDefineExpression } from "../shaderDefineExpression";

/** @internal */
export class ShaderDefineArithmeticOperator extends ShaderDefineExpression {
    public constructor(
        public define: string,
        public operand: string,
        public testValue: string
    ) {
        super();
    }

    public override isTrue(preprocessors: { [key: string]: string }) {
        let condition = false;

        const left = parseInt(preprocessors[this.define] != undefined ? preprocessors[this.define] : this.define);
        const right = parseInt(preprocessors[this.testValue] != undefined ? preprocessors[this.testValue] : this.testValue);

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
            case "!=":
                condition = left !== right;
                break;
        }

        return condition;
    }
}
