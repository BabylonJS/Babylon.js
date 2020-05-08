/** @hidden */
export class ShaderDefineExpression {
    public isTrue(preprocessors: { [key: string]: string }): boolean {
        return true;
    }

    private static _OperatorPriority: { [name: string]: number } = {
        ")": 0,
        "(": 1,
        "||": 2,
        "&&": 3,
    };

    private static _Stack = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];

    public static postfixToInfix(postfix: string[]): string {
        const stack: string[] = [];

        for (let c of postfix) {
            if (ShaderDefineExpression._OperatorPriority[c] === undefined) {
                stack.push(c);
            } else {
                const v1 = stack[stack.length - 1],
                      v2 = stack[stack.length - 2];

                stack.length -= 2;
                stack.push(`(${v2}${c}${v1})`);
            }
        }

        return stack[stack.length - 1];
    }

    public static infixToPostfix(infix: string): string[] {
        const result: string[] = [];

        let stackIdx = -1;

        const pushOperand = () => {
            operand = operand.trim();
            if (operand !== '') {
                result.push(operand);
                operand = '';
            }
        };

        const push = (s: string) => {
            if (stackIdx < ShaderDefineExpression._Stack.length - 1) {
                ShaderDefineExpression._Stack[++stackIdx] = s;
            }
        };

        const peek = () => ShaderDefineExpression._Stack[stackIdx];

        const pop = () => stackIdx === -1 ? '!!INVALID EXPRESSION!!' : ShaderDefineExpression._Stack[stackIdx--];

        let idx = 0,
            operand = '';

        while (idx < infix.length) {
            const c = infix.charAt(idx),
                  token = idx < infix.length - 1 ? infix.substr(idx, 2) : '';

            if (c === '(') {
                operand = '';
                push(c);
            } else if (c === ')') {
                pushOperand();
                while (stackIdx !== -1 && peek() !== '(') {
                    result.push(pop());
                }
                pop();
            } else if (ShaderDefineExpression._OperatorPriority[token] > 1) {
                pushOperand();
                while (stackIdx !== -1 && ShaderDefineExpression._OperatorPriority[peek()] >= ShaderDefineExpression._OperatorPriority[token]) {
                    result.push(pop());
                }
                push(token);
                idx++;
            } else {
                operand += c;
            }
            idx++;
        }

        pushOperand();

        while (stackIdx !== -1) {
            if (peek() === '(') {
                pop();
            } else {
                result.push(pop());
            }
        }

        return result;
    }
}