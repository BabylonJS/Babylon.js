declare module BABYLON.Internals {
    class AndOrNotEvaluator {
        static Eval(query: string, evaluateCallback: (val: any) => boolean): boolean;
        private static _HandleParenthesisContent(parenthesisContent, evaluateCallback);
        private static _SimplifyNegation(booleanString);
    }
}
