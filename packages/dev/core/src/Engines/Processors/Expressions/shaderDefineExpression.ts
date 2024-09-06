/* eslint-disable @typescript-eslint/naming-convention */
/** @internal */
export class ShaderDefineExpression {
    /**
     * Cache items count limit for the InfixToPostfix cache.
     * It uses to improve the performance of the shader compilation.
     * For details see PR: https://github.com/BabylonJS/Babylon.js/pull/13936
     */
    static InfixToPostfixCacheLimitSize = 50000;

    /**
     * When the cache size is exceeded, a cache cleanup will be triggered
     * and the cache will be reduced by the size specified
     * in the InfixToPostfixCacheCleanupSize variable, removing entries
     * that have not been accessed the longest.
     */
    static InfixToPostfixCacheCleanupSize = 25000;

    protected static _InfixToPostfixCache: Map<
        string,
        {
            accessTime: number;
            result: string[];
        }
    > = new Map();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public isTrue(preprocessors: { [key: string]: string }): boolean {
        return true;
    }

    private static _OperatorPriority: { [name: string]: number } = {
        ")": 0,
        "(": 1,
        "||": 2,
        "&&": 3,
    };

    private static _Stack = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];

    public static postfixToInfix(postfix: string[]): string {
        const stack: string[] = [];

        for (const c of postfix) {
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

    /**
     * Converts an infix expression to a postfix expression.
     *
     * This method is used to transform infix expressions, which are more human-readable,
     * into postfix expressions, also known as Reverse Polish Notation (RPN), that can be
     * evaluated more efficiently by a computer. The conversion is based on the operator
     * priority defined in _OperatorPriority.
     *
     * The function employs a stack-based algorithm for the conversion and caches the result
     * to improve performance. The cache keeps track of each converted expression's access time
     * to manage the cache size and optimize memory usage. When the cache size exceeds a specified
     * limit, the least recently accessed items in the cache are deleted.
     *
     * The cache mechanism is particularly helpful for shader compilation, where the same infix
     * expressions might be encountered repeatedly, hence the caching can speed up the process.
     *
     * @param infix - The infix expression to be converted.
     * @returns The postfix expression as an array of strings.
     */
    public static infixToPostfix(infix: string): string[] {
        // Is infix already in cache
        const cacheItem = ShaderDefineExpression._InfixToPostfixCache.get(infix);
        if (cacheItem) {
            cacheItem.accessTime = Date.now();
            return cacheItem.result;
        }

        // Is infix contain any operator
        if (!infix.includes("&&") && !infix.includes("||") && !infix.includes(")") && !infix.includes("(")) {
            return [infix];
        }

        const result: string[] = [];

        let stackIdx = -1;

        const pushOperand = () => {
            operand = operand.trim();
            if (operand !== "") {
                result.push(operand);
                operand = "";
            }
        };

        const push = (s: string) => {
            if (stackIdx < ShaderDefineExpression._Stack.length - 1) {
                ShaderDefineExpression._Stack[++stackIdx] = s;
            }
        };

        const peek = () => ShaderDefineExpression._Stack[stackIdx];

        const pop = () => (stackIdx === -1 ? "!!INVALID EXPRESSION!!" : ShaderDefineExpression._Stack[stackIdx--]);

        let idx = 0,
            operand = "";

        while (idx < infix.length) {
            const c = infix.charAt(idx),
                token = idx < infix.length - 1 ? infix.substring(idx, 2 + idx) : "";

            if (c === "(") {
                operand = "";
                push(c);
            } else if (c === ")") {
                pushOperand();
                while (stackIdx !== -1 && peek() !== "(") {
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
            if (peek() === "(") {
                pop();
            } else {
                result.push(pop());
            }
        }

        // If the cache is at capacity, clear it before adding a new item
        if (ShaderDefineExpression._InfixToPostfixCache.size >= ShaderDefineExpression.InfixToPostfixCacheLimitSize) {
            ShaderDefineExpression.ClearCache();
        }

        // Add the new item to the cache, including the current time as the last access time
        ShaderDefineExpression._InfixToPostfixCache.set(infix, { result, accessTime: Date.now() });

        return result;
    }

    private static ClearCache(): void {
        // Convert the cache to an array and sort by last access time
        const sortedCache = Array.from(ShaderDefineExpression._InfixToPostfixCache.entries()).sort((a, b) => a[1].accessTime - b[1].accessTime);

        // Remove the least recently accessed half of the cache
        for (let i = 0; i < ShaderDefineExpression.InfixToPostfixCacheCleanupSize; i++) {
            ShaderDefineExpression._InfixToPostfixCache.delete(sortedCache[i][0]);
        }
    }
}
