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

    public override toString() {
        return `${this.define} ${this.operand} ${this.testValue}`;
    }

    public override isTrue(preprocessors: { [key: string]: string }) {
        let condition = false;

        const left = parseInt(preprocessors[this.define] != undefined ? preprocessors[this.define] : this.define);
        const right = parseInt(preprocessors[this.testValue] != undefined ? preprocessors[this.testValue] : this.testValue);

        if (isNaN(left) || isNaN(right)) {
            // We can't evaluate the expression because we can't resolve the left and/or right side
            // We should not throw an error here because the code might be using a define that is not defined in the material/shader!
            return false;
        }

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
