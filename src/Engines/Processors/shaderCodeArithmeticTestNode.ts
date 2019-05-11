import { ShaderCodeNode } from './shaderCodeNode';

/** @hidden */
export class ShaderCodeArithmeticTestNode extends ShaderCodeNode {
    define: string;
    operand: string;
    testValue: string;
    child: ShaderCodeNode;

    getNextNode(preprocessors: {[key: string]: string}) {
        let value = preprocessors[this.define];

        if (value === undefined) {
            return this.next;
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

        if (condition) {
            return this.child;
        }

        return this.next;
    }
}