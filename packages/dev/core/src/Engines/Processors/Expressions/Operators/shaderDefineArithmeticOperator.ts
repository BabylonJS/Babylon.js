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

        if (isNaN(left)) {
            throw new Error(
                `ShaderDefineArithmeticOperator: "${this.define}" could not be evaluated in expression "${this.toString()}". Make sure you have included all necessary files in your shader.`
            );
        }

        if (isNaN(right)) {
            throw new Error(
                `ShaderDefineArithmeticOperator: "${this.testValue}" could not be evaluated in expression "${this.toString()}". Make sure you have included all necessary files in your shader.`
            );
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
